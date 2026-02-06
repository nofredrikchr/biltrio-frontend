#!/usr/bin/env node
/**
 * Lokal utviklingsserver for Biltrio
 * Kjører en enkel HTTP-server med proxy-funksjonalitet
 * Alternativ til Vercel CLI for lokal testing
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Proxy handler (samme som Vercel serverless function)
async function handleProxy(req, res, targetUrl) {
  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing url parameter' }));
    return;
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();

    res.writeHead(200, {
      'Content-Type': 'text/xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Failed to fetch data',
      message: error.message
    }));
  }
}

// Static file server
function serveStaticFile(req, res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
}

// Main request handler
const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle API proxy requests
  if (pathname === '/api/proxy') {
    const targetUrl = parsedUrl.query.url;
    await handleProxy(req, res, targetUrl);
    return;
  }

  // Serve static files
  let filePath = '.' + pathname;
  if (filePath === './') {
    filePath = './index.html';
  }

  serveStaticFile(req, res, filePath);
});

server.listen(PORT, () => {
  console.log('');
  console.log('🚀 Biltrio utviklingsserver kjører!');
  console.log('');
  console.log(`   Lokal:    http://localhost:${PORT}`);
  console.log(`   API:      http://localhost:${PORT}/api/proxy`);
  console.log('');
  console.log('📝 Tips:');
  console.log('   - Åpne http://localhost:3000 i nettleseren');
  console.log('   - Trykk Ctrl+C for å stoppe serveren');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Stopping server...');
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});
