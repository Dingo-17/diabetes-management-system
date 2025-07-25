#!/usr/bin/env python3
# filepath: server.py

import http.server
import socketserver

PORT = 8000  # you can change this to any available port

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()