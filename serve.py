#!/usr/bin/env python3
"""
serve.py — Development server for the RPGX Translation Tool.

Replaces `python3 -m http.server 8000`:
  * Serves the static files exactly like the stdlib http.server (so the app,
    presets, and index.html all work unchanged).
  * Adds ONE write endpoint, POST /__write_log, used by js/logger.js to persist
    captured AI prompt/response logs directly to docs/logs/<folder>/<preset>.md.

Run:
    python3 serve.py            # serves on http://localhost:8000
    python3 serve.py 9000       # custom port

The write endpoint is restricted: it only writes inside docs/logs/, rejects path
traversal (../), and only writes .md files. If you run a plain static server
instead (python3 -m http.server), the app still works; logging just can't write
to disk and the in-memory buffer is unaffected.
"""

import http.server
import json
import os
import re
import socketserver
from urllib.parse import urlparse

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
LOG_ROOT = os.path.join(REPO_ROOT, "docs", "logs")

# Safe characters for folder and preset names: letters, digits, dash, underscore.
SAFE_NAME = re.compile(r"^[A-Za-z0-9_-]+$")


class RPGXRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Static file handler + the /__write_log write endpoint."""

    # Serve from the repo root (where index.html lives).
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=REPO_ROOT, **kwargs)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/__write_log":
            self.send_error(404, "Not Found")
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length) if length > 0 else b"{}"
            payload = json.loads(raw.decode("utf-8"))
        except (ValueError, json.JSONDecodeError) as e:
            self._json_response(400, {"error": f"Invalid JSON body: {e}"})
            return

        folder = str(payload.get("folder", ""))
        preset = str(payload.get("preset", ""))
        content = str(payload.get("content", ""))

        # Validate names to prevent path traversal / writing outside docs/logs.
        if not folder or not SAFE_NAME.match(folder):
            self._json_response(400, {"error": "Invalid folder name."})
            return
        if not preset or not SAFE_NAME.match(preset):
            self._json_response(400, {"error": "Invalid preset name."})
            return

        # Build the target path defensively and confirm it stays inside LOG_ROOT.
        target_dir = os.path.join(LOG_ROOT, folder)
        target_file = os.path.join(target_dir, f"{preset}.md")
        # Realpath comparison guards against symlinks / traversal on the joined path.
        if not os.path.abspath(target_file).startswith(os.path.abspath(LOG_ROOT) + os.sep):
            self._json_response(400, {"error": "Path escapes logs directory."})
            return

        try:
            os.makedirs(target_dir, exist_ok=True)
            with open(target_file, "w", encoding="utf-8") as f:
                f.write(content)
        except OSError as e:
            self._json_response(500, {"error": f"Write failed: {e}"})
            return

        self._json_response(200, {
            "ok": True,
            "path": os.path.relpath(target_file, REPO_ROOT)
        })

    def _json_response(self, code, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        # CORS: allow the page (same origin) to POST.
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        # Preflight for the POST write endpoint.
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def end_headers(self):
        # Disable caching for the app shell so edits reload cleanly during dev.
        super().end_headers()


def main():
    port = 8000
    if len(os.sys.argv) > 1:
        try:
            port = int(os.sys.argv[1])
        except ValueError:
            print(f"Invalid port: {os.sys.argv[1]}; defaulting to 8000")

    os.makedirs(LOG_ROOT, exist_ok=True)
    handler = RPGXRequestHandler
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"RPGX Translation Tool dev server")
        print(f"  App:     http://localhost:{port}/index.html")
        print(f"  Log dir: {os.path.relpath(LOG_ROOT, REPO_ROOT)}/")
        print(f"  Write:   POST /__write_log -> docs/logs/<folder>/<preset>.md")
        print(f"  (Ctrl+C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()
