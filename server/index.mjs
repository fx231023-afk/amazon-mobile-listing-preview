import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cleanupExpiredShares,
  createShareRecord,
  readShareRecord
} from './shareStore.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const port = Number(process.env.PORT || 4173);
const maxBodyBytes = Number(process.env.MAX_BODY_MB || 80) * 1024 * 1024;

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(data));
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(text);
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.html') return 'text/html; charset=utf-8';
  if (extension === '.js') return 'text/javascript; charset=utf-8';
  if (extension === '.css') return 'text/css; charset=utf-8';
  if (extension === '.svg') return 'image/svg+xml';
  if (extension === '.png') return 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.ico') return 'image/x-icon';
  return 'application/octet-stream';
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > maxBodyBytes) {
        const error = new Error('Request body too large');
        error.statusCode = 413;
        reject(error);
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

async function readJson(request) {
  return JSON.parse(await readRequestBody(request));
}

async function handleCreateShare(request, response) {
  try {
    const payload = await readJson(request);
    const record = await createShareRecord({ payload });
    sendJson(response, 200, {
      ok: true,
      id: record.id,
      url: `/p/${record.id}`,
      expiresAt: record.expiresAt
    });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    sendJson(response, statusCode, {
      ok: false,
      error: error instanceof Error ? error.message : 'Create share failed'
    });
  }
}

async function handleReadShare(shareId, response) {
  try {
    await cleanupExpiredShares();
    const record = await readShareRecord(null, shareId);
    sendJson(response, 200, { ok: true, share: record });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Share not found';
    sendJson(response, message === 'Share expired' ? 410 : 404, { ok: false, error: message });
  }
}

async function handleSaveScreenshot(request, response) {
  request.resume();
  sendJson(response, 410, {
    ok: false,
    error: 'Server screenshot storage is disabled. Please download in the browser.'
  });
}

async function serveStatic(url, response) {
  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const decodedPath = decodeURIComponent(requestedPath);
  const normalizedPath = path.normalize(decodedPath).replace(/^([/\\])+/, '');
  const resolvedFile = path.resolve(distDir, normalizedPath);
  const resolvedDist = path.resolve(distDir);

  if (!resolvedFile.startsWith(resolvedDist)) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  try {
    const file = await readFile(resolvedFile);
    response.writeHead(200, {
      'Content-Type': getContentType(resolvedFile),
      'Cache-Control': resolvedFile.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable'
    });
    response.end(file);
  } catch {
    const indexFile = await readFile(path.join(distDir, 'index.html'));
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    response.end(indexFile);
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/shares') {
    await handleCreateShare(request, response);
    return;
  }

  if (request.method === 'GET' && url.pathname.startsWith('/api/shares/')) {
    await handleReadShare(url.pathname.split('/').filter(Boolean)[2], response);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/save-screenshot') {
    await handleSaveScreenshot(request, response);
    return;
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    await serveStatic(url, response);
    return;
  }

  sendText(response, 405, 'Method not allowed');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Amazon mobile listing preview is running on port ${port}`);
});
