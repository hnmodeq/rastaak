import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

// Simple storage for form submissions
const submissions = {
  crewRequests: [],
  jobApplications: []
};

// Helper to parse multipart/form-data simple boundaries
function parseMultipart(bodyBuffer, boundary) {
  const boundaryStr = '--' + boundary;
  const parts = [];
  const bodyStr = bodyBuffer.toString('binary');
  const rawParts = bodyStr.split(boundaryStr);

  for (const rawPart of rawParts) {
    if (!rawPart || rawPart === '--\r\n' || rawPart === '--') continue;
    const headerEnd = rawPart.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const headers = rawPart.substring(0, headerEnd);
    let content = rawPart.substring(headerEnd + 4);
    if (content.endsWith('\r\n')) {
      content = content.substring(0, content.length - 2);
    }

    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);

    if (nameMatch) {
      const name = nameMatch[1];
      if (filenameMatch) {
        parts.push({
          name,
          filename: filenameMatch[1],
          data: Buffer.from(content, 'binary')
        });
      } else {
        parts.push({
          name,
          value: Buffer.from(content, 'binary').toString('utf-8')
        });
      }
    }
  }
  return parts;
}

const server = http.createServer(async (req, res) => {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // API Endpoints
  if (pathname === '/api/request-crew' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        submissions.crewRequests.push({
          timestamp: new Date().toISOString(),
          ...data
        });
        console.log('[API] New crew request received:', data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Request received successfully' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  if (pathname === '/api/apply' && req.method === 'POST') {
    const contentType = req.headers['content-type'] || '';
    const chunks = [];
    req.on('data', chunk => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const totalBuffer = Buffer.concat(chunks);
        let fields = {};
        if (contentType.includes('multipart/form-data')) {
          const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
          if (boundaryMatch) {
            const boundary = boundaryMatch[1] || boundaryMatch[2];
            const parts = parseMultipart(totalBuffer, boundary);
            for (const part of parts) {
              if (part.filename) {
                fields[part.name] = {
                  filename: part.filename,
                  size: part.data.length
                };
              } else {
                fields[part.name] = part.value;
              }
            }
          }
        } else if (contentType.includes('application/json')) {
          fields = JSON.parse(totalBuffer.toString('utf-8'));
        } else {
          // urlencoded fallback
          const str = totalBuffer.toString('utf-8');
          const params = new URLSearchParams(str);
          for (const [key, val] of params.entries()) {
            fields[key] = val;
          }
        }

        submissions.jobApplications.push({
          timestamp: new Date().toISOString(),
          ...fields
        });
        console.log('[API] New job application received:', fields);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Application submitted successfully' }));
      } catch (err) {
        console.error('[API] Error processing application:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Error processing submission' }));
      }
    });
    return;
  }

  if (pathname === '/api/submissions' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(submissions, null, 2));
    return;
  }

  // Static file resolution
  let filePath = path.join(PUBLIC_DIR, pathname);

  // Check if direct file exists
  let stat = null;
  try {
    stat = fs.statSync(filePath);
  } catch (e) {}

  if (stat && stat.isDirectory()) {
    // Look for index.html in the directory
    const indexHtml = path.join(filePath, 'index.html');
    if (fs.existsSync(indexHtml)) {
      filePath = indexHtml;
    }
  } else if (!stat) {
    // Try appending .html
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    } else {
      // If still not found, check clean routes
      const cleanRoute = pathname.replace(/^\/+|\/+$/g, '');
      const possibleIndex = path.join(PUBLIC_DIR, cleanRoute, 'index.html');
      if (fs.existsSync(possibleIndex)) {
        filePath = possibleIndex;
      } else {
        // Fallback to 404 / root
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1>');
        return;
      }
    }
  }

  // Serve file
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }

    // Set cache headers (cache static assets for speed)
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Vectr website clone server running on http://${HOST}:${PORT}`);
});
