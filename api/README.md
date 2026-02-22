# Python Serverless Functions
# Path: api/README.md
# PDF parser uses pdfplumber (Python) for best extraction quality.
# Vercel auto-deploys Python files in api/ as serverless functions.
# Endpoint: POST /api/parse-pdf
# Requirements: pdfplumber>=0.10.0, python-multipart>=0.0.6
# vercel.json must set runtime: python3.11, maxDuration: 300
