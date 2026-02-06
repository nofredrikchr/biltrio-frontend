#!/usr/bin/env python3
"""
Simple CORS proxy server for Billink API
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request
import urllib.parse
import json
from urllib.error import HTTPError, URLError

class CORSProxyHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Check if this is a proxy request
        if self.path.startswith('/proxy?url='):
            self.handle_proxy_request()
        else:
            # Serve static files normally
            super().do_GET()

    def handle_proxy_request(self):
        try:
            # Extract URL from query parameter
            query = self.path.split('?', 1)[1]
            params = urllib.parse.parse_qs(query)
            target_url = params.get('url', [''])[0]

            if not target_url:
                self.send_error(400, "Missing url parameter")
                return

            # Fetch the target URL
            req = urllib.request.Request(
                target_url,
                headers={'User-Agent': 'Mozilla/5.0'}
            )

            with urllib.request.urlopen(req, timeout=30) as response:
                content = response.read()

                # Send CORS-enabled response
                self.send_response(200)
                self.send_header('Content-Type', 'text/xml; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                self.wfile.write(content)

        except HTTPError as e:
            self.send_error(e.code, str(e))
        except URLError as e:
            self.send_error(502, f"Failed to fetch: {str(e)}")
        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")

    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def end_headers(self):
        # Add CORS headers to all responses
        if not self.path.startswith('/proxy'):
            self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == '__main__':
    PORT = 8000
    print(f"Starting CORS-enabled server on http://localhost:{PORT}")
    print(f"Proxy endpoint: http://localhost:{PORT}/proxy?url=<target_url>")

    server = HTTPServer(('localhost', PORT), CORSProxyHandler)
    server.serve_forever()
