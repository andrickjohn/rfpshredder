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
  let cachedTotalPages = 0; // Detached memory cache for telemetry
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
      .select('subscription_status, subscription_tier, trial_shreds_used, email, preferred_llm_model')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: { code: 'PROFILE_NOT_FOUND', message: 'Account profile not found. Please contact support.' } },
        { status: 404 }
      );
    }

    const { preferred_llm_model: preferredModel = 'claude-3-haiku-20240307' } = profile;

    const isSuperAdmin = profile.email === 'admin@automatemomentum.com';
    const isTrial = profile.subscription_status === 'trial';
    const isActive = profile.subscription_status === 'active';
    const tier = profile.subscription_tier; // 'free', 'solo', 'team', 'enterprise', 'super'

    // Super Admin bypasses all checks
    if (!isSuperAdmin) {
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

      if (isActive && tier === 'solo') {
        // Enforce 10 shreds per month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count, error: countErr } = await supabase
          .from('shred_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString());

        if (!countErr && count !== null && count >= 10) {
          return NextResponse.json(
            { error: { code: 'MONTHLY_LIMIT_EXCEEDED', message: 'You have reached your limit of 10 shreds per month on the Solo plan.' } },
            { status: 403 }
          );
        }
      }
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

    // PAGE LIMIT ENFORCEMENT
    cachedTotalPages = parseResult.totalPages;
    if (isSuperAdmin) {
      if (cachedTotalPages > 3000) {
        parseResult = null;
        return NextResponse.json(
          { error: { code: 'PAGE_LIMIT_EXCEEDED', message: `Even as an Admin, documents are capped at 3000 pages. This document is ${cachedTotalPages} pages. Please split it.` } },
          { status: 400 }
        );
      }
    } else {
      if (tier === 'solo' && cachedTotalPages > 300) {
        parseResult = null;
        return NextResponse.json(
          { error: { code: 'PAGE_LIMIT_EXCEEDED', message: `The Solo plan allows up to 300 pages per document. This document is ${cachedTotalPages} pages. Please upgrade to process larger files.` } },
          { status: 400 }
        );
      }
      // Assuming free/trial could also be capped, but let's stick to user requirement: 300 pages for level 2.
    }

    // 7. Detect sections
    const sections = detectSections(parseResult.pages);

    if (!sections.sectionL && !sections.sectionM) {
      // UX Fallback: If strict headers were completely missed in a document solely named for the section,
      // fallback to scanning the entire document context.
      sections.sectionL = {
        type: 'L',
        title: 'Full Document Fallback',
        reference: 'Entire Document',
        startPage: 1,
        endPage: cachedTotalPages,
        text: parseResult.fullText
      };
      if (!sections.warnings) sections.warnings = [];
      sections.warnings.push("Explicit Section L & M headers could not be found. Defaulting to a full-document contextual scan.");
    }

    // Stream Processing
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
          } catch (e) {
            console.error('Failed to enqueue stream event:', e);
          }
        };

        // Heartbeat to prevent edge timeouts during long synchronous blocks like Excel generation
        const heartbeatInterval = setInterval(() => {
          sendEvent({ type: 'ping' });
        }, 5000);

        try {
          // 8. Chunk text
          sendEvent({ type: 'progress', step: 2, message: `Parsing document structure (${cachedTotalPages} pages)...` });

          if (sections.warnings && sections.warnings.length > 0) {
            sections.warnings.forEach(msg => {
              sendEvent({ type: 'progress', step: 2, message: `Warning: ${msg}` });
            });
          }

          const chunks = chunkText(parseResult!.pages);

          // 9. Extract requirements via LLM
          sendEvent({ type: 'progress', step: 3, message: `Extracting Section L & M requirements (0/${chunks.length} chunks)...`, current: 0, total: chunks.length, runningCost: 0, modelName: preferredModel });
          const { requirements, totalCost } = await extractRequirements(
            chunks,
            sections.sectionL,
            sections.sectionM,
            (currentChunk, totalChunks, accumulatedCost) => {
              sendEvent({
                type: 'progress',
                step: 3,
                message: `Extracting Section L & M requirements (${currentChunk}/${totalChunks} chunks)...`,
                current: currentChunk,
                total: totalChunks,
                runningCost: accumulatedCost,
                modelName: preferredModel
              });
            },
            preferredModel
          );

          // 10. Cross-reference L to M
          sendEvent({ type: 'progress', step: 5, message: 'Generating cross-references...', runningCost: totalCost, modelName: preferredModel });
          const { requirements: crossRefReqs, crossRefs } = generateCrossReferences(requirements);

          // 11. Generate Excel
          sendEvent({ type: 'progress', step: 6, message: 'Building Excel compliance matrix...', runningCost: totalCost, modelName: preferredModel });
          const excelBuffer = await generateExcel(crossRefReqs, crossRefs, {
            totalPages: cachedTotalPages,
            processingTimeMs: Date.now() - startTime,
          });

          // 12. Log metadata to shred_log
          const obligationCounts = countObligations(crossRefReqs);
          const processingTimeMs = Date.now() - startTime;

          await supabase.from('shred_log').insert({
            user_id: user.id,
            page_count: cachedTotalPages,
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

            // Send trial completion email with stats
            const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'there';
            sendEmailAsync({
              to: user.email!,
              type: 'trial_completion',
              data: {
                first_name: firstName,
                requirement_count: crossRefReqs.length,
                shall_count: (obligationCounts.shall || 0) + (obligationCounts.must || 0),
                page_count: cachedTotalPages,
                processing_time_seconds: Math.round(processingTimeMs / 1000),
              },
            });
          }

          // ZERO RETENTION: purge all document content
          parseResult = null;

          // Encode excel and send complete event
          const excelBase64 = Buffer.from(excelBuffer).toString('base64');
          sendEvent({ type: 'complete', excelBase64 });
          clearInterval(heartbeatInterval);
          controller.close();

        } catch (streamError: unknown) {
          console.error("Stream processing error:", streamError);
          const errorCode = streamError instanceof Error && 'code' in (streamError as { code?: string })
            ? (streamError as { code?: string }).code || 'INTERNAL_ERROR'
            : 'INTERNAL_ERROR';
          const errorMessage = streamError instanceof Error
            ? streamError.message
            : 'An unexpected error occurred during processing';

          sendEvent({ type: 'error', error: { code: errorCode, message: errorMessage } });
          clearInterval(heartbeatInterval);
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-store, no-transform',
        'Connection': 'keep-alive',
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
          page_count: cachedTotalPages, // Safely rely on the disconnected memory cache
          requirement_count: 0,
          obligation_breakdown: {},
          processing_time_ms: processingTimeMs,
          status: 'error',
          error_message: errorMessage,
        });
      }
    } catch (logError) {
      console.error("Failed to log shredding error to Supabase:", logError);
    }

    return NextResponse.json(
      { error: { code: errorCode, message: errorMessage } },
      { status: 500 }
    );
  } finally {
    // ZERO RETENTION: ensure all document content is purged
    fileBuffer = null;
    parseResult = null;
  }
}
