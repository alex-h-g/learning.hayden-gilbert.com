"""Static server for public_html that mimics the site's .htaccess fallbacks:
unknown paths under /geometry-2/ (and /basic-geometry/) serve that app's index.html,
like Apache's RewriteRule on SiteGround. Usage: python3 tests/serve_site.py 8765"""
import http.server, os, sys
from urllib.parse import urlsplit

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public_html')
APPS = ['/geometry-2/', '/basic-geometry/']

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)
    def send_head(self):
        path = urlsplit(self.path).path
        fs = self.translate_path(path)
        if not os.path.exists(fs):
            for app in APPS:
                if path.startswith(app):
                    self.path = app + 'index.html'
                    break
        return super().send_head()
    def log_message(self, *a):
        pass

http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 8765), H).serve_forever()
