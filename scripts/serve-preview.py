"""Local-only preview server without stale browser resource caching."""
import argparse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
parser=argparse.ArgumentParser();parser.add_argument('directory');parser.add_argument('--port',type=int,default=4187)
args=parser.parse_args()
class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        super().end_headers()
    def send_head(self):
        if 'If-Modified-Since' in self.headers: del self.headers['If-Modified-Since']
        return super().send_head()
ThreadingHTTPServer(('127.0.0.1',args.port),partial(Handler,directory=args.directory)).serve_forever()
