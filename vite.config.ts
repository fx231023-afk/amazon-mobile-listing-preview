import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

const SHARE_TTL_MS = 24 * 60 * 60 * 1000;
const SHARE_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

type ShareImageInput = {
  id: string;
  name: string;
  dataUrl?: string;
  width: number;
  height: number;
  size: number;
};

type SharePayloadInput = {
  listing: unknown;
  settings: unknown;
  galleryImages: ShareImageInput[];
  aplusImages: ShareImageInput[];
};

function createServerShareId(length = 8): string {
  let id = '';
  for (let index = 0; index < length; index += 1) {
    id += SHARE_ID_ALPHABET[Math.floor(Math.random() * SHARE_ID_ALPHABET.length)];
  }
  return id;
}

function sendJson(response: ServerResponse, statusCode: number, data: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(data));
}

function readRequestBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function getImageExtension(dataUrl: string): string {
  if (dataUrl.startsWith('data:image/jpeg;base64,')) {
    return 'jpg';
  }
  if (dataUrl.startsWith('data:image/webp;base64,')) {
    return 'webp';
  }
  return 'png';
}

async function cleanupExpiredShares(sharesDir: string): Promise<void> {
  try {
    const entries = await fs.readdir(sharesDir, { withFileTypes: true });
    await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const recordPath = path.join(sharesDir, entry.name, 'share.json');
          try {
            const record = JSON.parse(await fs.readFile(recordPath, 'utf8')) as { expiresAt?: string };
            if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) {
              await fs.rm(path.join(sharesDir, entry.name), { recursive: true, force: true });
            }
          } catch {
            await fs.rm(path.join(sharesDir, entry.name), { recursive: true, force: true });
          }
        })
    );
  } catch {
    await fs.mkdir(sharesDir, { recursive: true });
  }
}

async function saveShareImages(
  shareDir: string,
  shareId: string,
  kind: 'gallery' | 'aplus',
  images: ShareImageInput[]
) {
  const assetDir = path.join(shareDir, 'assets');
  await fs.mkdir(assetDir, { recursive: true });

  return Promise.all(
    images.map(async (image, index) => {
      if (!image.dataUrl?.startsWith('data:image/')) {
        throw new Error('Invalid image data');
      }

      const extension = getImageExtension(image.dataUrl);
      const fileName = `${kind}-${String(index + 1).padStart(2, '0')}.${extension}`;
      const outputPath = path.join(assetDir, fileName);
      const base64 = image.dataUrl.split(',')[1];
      await fs.writeFile(outputPath, Buffer.from(base64, 'base64'));

      return {
        id: image.id,
        name: image.name,
        width: image.width,
        height: image.height,
        size: image.size,
        url: `/share-assets/${shareId}/${fileName}`
      };
    })
  );
}

function localScreenshotSaver(): Plugin {
  return {
    name: 'local-preview-services',
    configureServer(server) {
      const sharesDir = path.resolve(process.cwd(), 'temp-shares');

      server.middlewares.use('/api/shares', async (request, response, next) => {
        const requestUrl = request.url || '';
        const shareIdMatch = requestUrl.match(/^\/([^/?#]+)/);

        if (request.method === 'POST' && (requestUrl === '/' || requestUrl === '')) {
          try {
            await cleanupExpiredShares(sharesDir);
            const payload = JSON.parse(await readRequestBody(request)) as SharePayloadInput;
            const id = createServerShareId();
            const createdAt = new Date();
            const expiresAt = new Date(createdAt.getTime() + SHARE_TTL_MS);
            const shareDir = path.join(sharesDir, id);
            await fs.mkdir(shareDir, { recursive: true });

            const galleryImages = await saveShareImages(shareDir, id, 'gallery', payload.galleryImages ?? []);
            const aplusImages = await saveShareImages(shareDir, id, 'aplus', payload.aplusImages ?? []);
            const record = {
              id,
              createdAt: createdAt.toISOString(),
              expiresAt: expiresAt.toISOString(),
              listing: payload.listing,
              settings: payload.settings,
              galleryImages,
              aplusImages
            };

            await fs.writeFile(path.join(shareDir, 'share.json'), JSON.stringify(record, null, 2), 'utf8');
            sendJson(response, 200, { ok: true, id, url: `/p/${id}`, expiresAt: record.expiresAt });
          } catch (error) {
            sendJson(response, 500, {
              ok: false,
              error: error instanceof Error ? error.message : 'Create share failed'
            });
          }
          return;
        }

        if (request.method === 'GET' && shareIdMatch?.[1]) {
          try {
            await cleanupExpiredShares(sharesDir);
            const id = path.basename(shareIdMatch[1]);
            const recordPath = path.join(sharesDir, id, 'share.json');
            const record = JSON.parse(await fs.readFile(recordPath, 'utf8')) as { expiresAt?: string };
            if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) {
              await fs.rm(path.join(sharesDir, id), { recursive: true, force: true });
              sendJson(response, 410, { ok: false, error: 'Share expired' });
              return;
            }
            sendJson(response, 200, { ok: true, share: record });
          } catch {
            sendJson(response, 404, { ok: false, error: 'Share not found' });
          }
          return;
        }

        next();
      });

      server.middlewares.use('/share-assets', async (request, response, next) => {
        if (request.method !== 'GET') {
          next();
          return;
        }

        try {
          await cleanupExpiredShares(sharesDir);
          const parts = (request.url || '').split('/').filter(Boolean);
          const [shareId, fileName] = parts;
          if (!shareId || !fileName) {
            next();
            return;
          }

          const safeShareId = path.basename(shareId);
          const safeFileName = path.basename(fileName);
          const filePath = path.join(sharesDir, safeShareId, 'assets', safeFileName);
          const file = await fs.readFile(filePath);
          const extension = path.extname(safeFileName).toLowerCase();
          const contentType = extension === '.jpg' || extension === '.jpeg'
            ? 'image/jpeg'
            : extension === '.webp'
              ? 'image/webp'
              : 'image/png';
          response.setHeader('Content-Type', contentType);
          response.end(file);
        } catch {
          response.statusCode = 404;
          response.end('Not found');
        }
      });

      server.middlewares.use('/api/save-screenshot', (request, response, next) => {
        if (request.method !== 'POST') {
          next();
          return;
        }

        let body = '';
        request.setEncoding('utf8');
        request.on('data', (chunk) => {
          body += chunk;
        });
        request.on('end', async () => {
          try {
            const payload = JSON.parse(body) as { fileName?: string; dataUrl?: string };
            if (!payload.dataUrl?.startsWith('data:image/png;base64,')) {
              response.statusCode = 400;
              response.end(JSON.stringify({ ok: false, error: 'Invalid PNG data' }));
              return;
            }

            const safeFileName = path
              .basename(payload.fileName || `amazon-mobile-preview-${Date.now()}.png`)
              .replace(/[^a-zA-Z0-9._-]/g, '_');
            const outputDir = path.resolve(process.cwd(), 'exports');
            const outputPath = path.join(outputDir, safeFileName);
            const base64 = payload.dataUrl.split(',')[1];

            await fs.mkdir(outputDir, { recursive: true });
            await fs.writeFile(outputPath, Buffer.from(base64, 'base64'));

            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify({ ok: true, path: outputPath.replace(/\\/g, '/') }));
          } catch (error) {
            response.statusCode = 500;
            response.end(
              JSON.stringify({
                ok: false,
                error: error instanceof Error ? error.message : 'Save failed'
              })
            );
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), localScreenshotSaver()]
});
