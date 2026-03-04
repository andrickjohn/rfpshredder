# SAM.gov RFP Search & Retrieval Heuristics

This document captures the most successful strategies and learnings for identifying and extracting Section L (Instructions to Offerors) and Section M (Evaluation Factors) documents from SAM.gov. 

These learnings have been proven to bypass automated scraper limitations and yield high-quality compliance matrix targets.

## 1. High-Probability Targeting (The "Where")
Not all solicitations follow the uniform UCF (Uniform Contract Format) structure. To reliably find distinct L & M sections, target complex, high-value procurements—specifically from the DoD (Air Force, Navy, Army) or complex IT/Engineering agencies.

**Best NAICS Codes to Filter By:**
- `541511` - Custom Computer Programming Services
- `541512` - Computer Systems Design Services
- `541519` - Other Computer Related Services
- `541330` - Engineering Services
- `541611` - Administrative Management and General Management Consulting Services

## 2. Search & Filter Parameters (The "How")
When using the SAM.gov search interface:
- **Notice Type:** MUST filter explicitly by **"Solicitation"**. (Skip "Presolicitation", "Sources Sought", "Award Notice" as they rarely contain the finalized L&M instructions).
- **Keywords:** 
  - `"Section L"` OR `"Section M"`
  - `"Instructions to Offerors"` OR `"Evaluation Factors"`
  - `"52.212-1"` OR `"52.212-2"` (For commercial items, these FAR clauses replace Sections L & M).

## 3. UI Navigation & Extraction (The "What")
Automated DOM scrapers often fail on SAM.gov because the actual file links are hidden behind a multi-page React application.

**The Reliable Manual/Subagent Workflow:**
1. Click into the Solicitation details page.
2. Locate the left-hand navigation sidebar.
3. Click specifically on the **"Attachments/Links"** tab (this is where the PDFs live).
4. Look for specific naming conventions:
   - Explicit files: `Section L...pdf`, `Section M...pdf`, `Evaluation Criteria.pdf`.
   - Embedded files: Very often, L & M are appended to the very end of the main `Solicitation.pdf` or `Combined_Synopsis.pdf`. If standalone files aren't present, download the largest primary solicitation document.
   - ZIP Archives: Sometimes they are bundled in a `Bid_Pack.zip`.

## How the AI Retains This (Future Sessions)
1. **Locally:** This document `docs/sam_gov_scraping_learnings.md` lives in your codebase repository forever.
2. **System Memory (Knowledge Items):** At the end of our conversation, the background "Knowledge Subagent" reads our chat history, identifies that we solved a complex workflow (bypassing SAM.gov UI limits to find specific data), and distill this into a persistent **Knowledge Item (KI)**. 
3. **Retrieval:** The next time you start a fresh chat and ask me to "Go find more RFPs on SAM", the system will instantly retrieve the `SAM.gov Scraping` KI, read these exact instructions, and know exactly which NAICS codes and UI buttons to click without you having to re-explain it.
