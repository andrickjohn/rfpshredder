// src/app/api/shred/route.ts
// Purpose: Main shredder pipeline — upload, parse, extract, generate Excel
// Dependencies: All shredder modules, supabase/server, rate-limit
// Test spec: qa/test-specs/core-product.md
// SECURITY: Zero document retention — all content purged after Excel generation

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateFile } from '@/lib/shredder/file-validator';
import { parsePDF } from '@/lib/shredder/pdf-parser';
import { parseDOCX } from '@/lib/shredder/docx-parser';
import { detectSections } from '@/lib/shredder/section-detector';
import { chunkText } from '@/lib/shredder/chunker';
import { extractRequirements } from '@/lib/shredder/extractor';
import { generateCrossReferences } from '@/lib/shredder/crossref';
import { generateExcel } from '@/lib/shredder/excel-generator';
import { countObligations } from '@/lib/shredder/obligation-classifier';
import { sendEmailAsync } from '@/lib/email/send';
import type { ParseResult } from '@/lib/shredder/types';

/** Maximum trial shreds before requiring subscription */
const MAX_TRIAL_SHREDS = 1;

export async function POST(request: Request) {
  const startTime = Date.now();

  // Mutable references for zero-retention cleanup
  let fileBuffer: Buffer | null = null;
  let parseResult: ParseResult | null = null;

  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Please sign in to use RFP Shredder.' } },
        { status: 401 }
      );
    }

    // 2. Rate limit (per user)
    const rateResult = checkRateLimit(user.id, RATE_LIMITS.shred);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'You have reached the maximum of 10 shreds per hour. Please try again later.' } },
        { status: 429 }
      );
    }

    // 3. Check subscription / trial status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_tier, trial_shreds_used')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: { code: 'PROFILE_NOT_FOUND', message: 'Account profile not found. Please contact support.' } },
        { status: 404 }
      );
    }

    const isTrial = profile.subscription_status === 'trial';
    const isActive = profile.subscription_status === 'active';

    if (isTrial && profile.trial_shreds_used >= MAX_TRIAL_SHREDS) {
      return NextResponse.json(
        { error: { code: 'TRIAL_EXHAUSTED', message: 'Your free trial shred has been used. Subscribe to continue shredding RFPs.' } },
        { status: 403 }
      );
    }

    if (!isTrial && !isActive) {
      return NextResponse.json(
        { error: { code: 'SUBSCRIPTION_REQUIRED', message: 'An active subscription is required. Please subscribe to continue.' } },
        { status: 403 }
      );
    }

    // 4. Read uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: 'NO_FILE', message: 'Please upload a PDF or DOCX file.' } },
        { status: 400 }
      );
    }

    fileBuffer = Buffer.from(await file.arrayBuffer());

    // 5. Validate file (extension + MIME + magic bytes + size)
    const validation = validateFile(fileBuffer, file.name, file.type);
    if (!validation.valid) {
      fileBuffer = null; // Zero retention
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // 6. Parse document
    if (validation.fileType === 'pdf') {
      parseResult = await parsePDF(fileBuffer);
    } else {
      parseResult = await parseDOCX(fileBuffer);
    }

    // ZERO RETENTION: release file buffer immediately after parsing
    fileBuffer = null;

    // 7. Detect sections
    const sections = detectSections(parseResult.pages);

    if (!sections.sectionL && !sections.sectionM) {
      // Purge parse result
      const totalPages = parseResult.totalPages;
      parseResult = null;
      return NextResponse.json(
        {
          error: {
            code: 'SECTIONS_NOT_FOUND',
            message: 'Could not find Section L (Instructions) or Section M (Evaluation Criteria) in this document. Please ensure this is a standard federal RFP.',
          },
          warnings: sections.warnings,
          metadata: { totalPages },
        },
        { status: 422 }
      );
    }

    // 8. Chunk text
    const chunks = chunkText(parseResult.pages);

    // 9. Extract requirements via Claude API
    const requirements = await extractRequirements(
      chunks,
      sections.sectionL,
      sections.sectionM
    );

    // 10. Cross-reference L to M
    const { requirements: crossRefReqs, crossRefs } = generateCrossReferences(requirements);

    // 11. Generate Excel
    const excelBuffer = await generateExcel(crossRefReqs, crossRefs, {
      totalPages: parseResult.totalPages,
      processingTimeMs: Date.now() - startTime,
    });

    // 12. Log metadata to shred_log (NEVER log document content)
    const obligationCounts = countObligations(crossRefReqs);
    const processingTimeMs = Date.now() - startTime;

    await supabase.from('shred_log').insert({
      user_id: user.id,
      page_count: parseResult.totalPages,
      requirement_count: crossRefReqs.length,
      obligation_breakdown: obligationCounts,
      processing_time_ms: processingTimeMs,
      status: 'success',
    });

    // Increment trial usage if applicable
    if (isTrial) {
      await supabase
        .from('profiles')
        .update({ trial_shreds_used: profile.trial_shreds_used + 1 })
        .eq('id', user.id);

      // Send trial completion email with stats (fire-and-forget)
      const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'there';
      sendEmailAsync({
        to: user.email!,
        type: 'trial_completion',
        data: {
          first_name: firstName,
          requirement_count: crossRefReqs.length,
          shall_count: (obligationCounts.shall || 0) + (obligationCounts.must || 0),
          page_count: parseResult?.totalPages ?? 0,
          processing_time_seconds: Math.round(processingTimeMs / 1000),
        },
      });
    }

    // ZERO RETENTION: purge all document content
    parseResult = null;

    // 13. Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="compliance-matrix.xlsx"',
        'Content-Length': String(excelBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    // Log error metadata only — NEVER log document content
    const processingTimeMs = Date.now() - startTime;
    const errorCode = error instanceof Error && 'code' in error
      ? (error as Error & { code: string }).code
      : 'INTERNAL_ERROR';
    const errorMessage = error instanceof Error
      ? error.message
      : 'An unexpected error occurred';

    // Try to log the failure
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('shred_log').insert({
          user_id: user.id,
          page_count: parseResult?.totalPages ?? 0,
          requirement_count: 0,
          obligation_breakdown: {},
          processing_time_ms: processingTimeMs,
          status: 'failed',
        });
      }
    } catch {
      // Failure logging itself failed — swallow silently
    }

    return NextResponse.json(
      { error: { code: errorCode, message: errorMessage } },
      { status: errorCode === 'SECTIONS_NOT_FOUND' ? 422 : 500 }
    );
  } finally {
    // ZERO RETENTION: ensure all document content is purged
    fileBuffer = null;
    parseResult = null;
  }
}
