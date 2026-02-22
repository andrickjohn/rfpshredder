# api/parse-pdf/index.py
# Purpose: Vercel Python serverless function for PDF parsing with pdfplumber
# Dependencies: pdfplumber (see requirements.txt)
# Test spec: qa/test-specs/core-product.md
#
# This function provides higher-quality PDF parsing than the Node.js fallback.
# Used in production (Vercel). Local dev uses pdf-parse (Node.js) directly.

import json
import tempfile
import os
from http.server import BaseHTTPRequestHandler

import pdfplumber


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length == 0:
                self._send_error(400, "PDF_EMPTY", "No file data received.")
                return

            body = self.rfile.read(content_length)

            # Write to ephemeral /tmp — auto-cleaned on function termination
            tmp_path = os.path.join(tempfile.gettempdir(), "upload.pdf")
            try:
                with open(tmp_path, "wb") as f:
                    f.write(body)

                pages = []
                with pdfplumber.open(tmp_path) as pdf:
                    total_pages = len(pdf.pages)

                    if total_pages == 0:
                        self._send_error(400, "PDF_EMPTY", "The PDF has no pages.")
                        return

                    if total_pages > 300:
                        self._send_error(
                            400,
                            "PAGE_LIMIT_EXCEEDED",
                            f"PDF exceeds 300-page limit ({total_pages} pages).",
                        )
                        return

                    for page in pdf.pages:
                        text = page.extract_text() or ""
                        pages.append(
                            {"pageNumber": page.page_number, "text": text.strip()}
                        )

                # Check for scanned PDF
                total_text = " ".join(p["text"] for p in pages).strip()
                if len(total_text) < 50:
                    self._send_error(
                        422,
                        "SCANNED_PDF",
                        "Scanned PDF not supported. Please use a digital (text-based) PDF.",
                    )
                    return

                # Build full text with page markers
                full_text = "\n\n".join(
                    f"[PAGE {p['pageNumber']}]\n{p['text']}" for p in pages
                )

                result = {
                    "pages": pages,
                    "totalPages": total_pages,
                    "fullText": full_text,
                }

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(result).encode("utf-8"))

            finally:
                # ZERO RETENTION: always clean up /tmp
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        except Exception as e:
            self._send_error(500, "PARSE_FAILED", f"PDF parsing failed: {str(e)}")

    def _send_error(self, status, code, message):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        error = {"error": {"code": code, "message": message}}
        self.wfile.write(json.dumps(error).encode("utf-8"))
