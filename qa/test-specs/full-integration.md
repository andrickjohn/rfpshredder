# Test Specification: Full Integration Tests
# Path: qa/test-specs/full-integration.md
# Purpose: End-to-end user journeys that test the complete system

## Journey 1: New User Trial Experience
1. Visit landing page -> read content -> click "Shred Your First RFP Free"
2. Sign up with email and password
3. Redirected to dashboard
4. Click "Shred an RFP"
5. Upload a 100-page PDF
6. See processing progress indicators
7. Download formatted Excel compliance matrix
8. Verify: Excel has correct columns, formatting, requirements
9. Try to shred again -> see "Subscribe to continue" message
Expected: Complete flow works end-to-end in under 5 minutes

## Journey 2: Subscriber Ongoing Usage
1. Log in as existing subscriber
2. Shred a 200-page PDF -> download matrix
3. Shred a 150-page DOCX -> download matrix
4. View shred history on dashboard (shows metadata, not content)
5. Click "Manage Subscription" -> Stripe portal opens
Expected: All actions complete, shred history shows correct metadata

## Journey 3: Billing Lifecycle
1. Sign up -> complete trial shred
2. Click Subscribe -> Stripe Checkout -> complete with test card
3. Dashboard shows "Solo Plan - Active"
4. Shred an RFP (confirms paid access works)
5. Go to Stripe portal -> cancel subscription
6. Dashboard shows "Cancels at period end"
7. After period end: shred attempt blocked
Expected: Full subscription lifecycle works correctly

## Journey 4: Error Handling
1. Upload a .exe file renamed to .pdf -> see clear error
2. Upload a 60MB file -> see "File too large" error
3. Upload a scanned PDF -> see "Scanned PDFs not yet supported" message
4. Upload a PDF with no Section L/M -> see helpful error message
5. All errors: user can try again without refreshing
Expected: Every error produces a clear, helpful message

## Journey 5: Security Verification
1. Try accessing /dashboard without login -> redirected to /login
2. Try accessing /api/shred without JWT -> 401 response
3. Check all security headers on every page (curl -I)
4. Verify no document content in database (query shred_log)
5. Verify no console errors or warnings on any page
Expected: All security measures verified and working

## Lighthouse Requirements (Run on Production)
- Landing page: Performance 80+, Accessibility 90+, SEO 80+, BP 80+
- Dashboard: Performance 80+, Accessibility 90+
- Login/Signup: Performance 80+, Accessibility 90+

## What "Done" Looks Like
All 5 journeys complete successfully. A real person could use this product right now — sign up, try it free, subscribe, shred RFPs, manage their billing, and handle every error gracefully.
