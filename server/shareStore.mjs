import crypto from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const SHARE_TTL_MS = 24 * 60 * 60 * 1000;
const SHARE_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function createShareId(length = 8) {
  let id = '';
  const bytes = crypto.randomBytes(length);
  for (const byte of bytes) {
    id += SHARE_ID_ALPHABET[byte % SHARE_ID_ALPHABET.length];
  }
  return id;
}

function getImageExtension(dataUrl) {
  if (dataUrl.startsWith('data:image/jpeg;base64,')) {
    return 'jpg';
  }
  if (dataUrl.startsWith('data:image/webp;base64,')) {
    return 'webp';
  }
  return 'png';
}

export function getImageContentType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === '.jpg' || extension === '.jpeg') {
    return 'image/jpeg';
  }
  if (extension === '.webp') {
    return 'image/webp';
  }
  return 'image/png';
}

export function sanitizePathPart(value) {
  return path.basename(String(value || '')).replace(/[^a-zA-Z0-9._-]/g, '');
}

async function saveShareImages(shareDir, shareId, kind, images = []) {
  const assetDir = path.join(shareDir, 'assets');
  await mkdir(assetDir, { recursive: true });

  return Promise.all(
    images.map(async (image, index) => {
      if (!image.dataUrl?.startsWith('data:image/')) {
        throw new Error('Invalid image data');
      }

      const extension = getImageExtension(image.dataUrl);
      const fileName = `${kind}-${String(index + 1).padStart(2, '0')}.${extension}`;
      const base64 = image.dataUrl.split(',')[1];
      await writeFile(path.join(assetDir, fileName), Buffer.from(base64, 'base64'));

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

export async function cleanupExpiredShares(sharesDir, nowMs = Date.now()) {
  try {
    const entries = await readdir(sharesDir, { withFileTypes: true });
    await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const shareDir = path.join(sharesDir, entry.name);
          const recordPath = path.join(shareDir, 'share.json');
          try {
            const record = JSON.parse(await readFile(recordPath, 'utf8'));
            if (!record.expiresAt || new Date(record.expiresAt).getTime() <= nowMs) {
              await rm(shareDir, { recursive: true, force: true });
            }
          } catch {
            await rm(shareDir, { recursive: true, force: true });
          }
        })
    );
  } catch {
    await mkdir(sharesDir, { recursive: true });
  }
}

export async function createShareRecord({ sharesDir, payload, nowMs = Date.now() }) {
  await cleanupExpiredShares(sharesDir, nowMs);

  const id = createShareId();
  const createdAt = new Date(nowMs);
  const expiresAt = new Date(nowMs + SHARE_TTL_MS);
  const shareDir = path.join(sharesDir, id);
  await mkdir(shareDir, { recursive: true });

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

  await writeFile(path.join(shareDir, 'share.json'), JSON.stringify(record, null, 2), 'utf8');
  return record;
}

export async function readShareRecord(sharesDir, shareId, nowMs = Date.now()) {
  const safeShareId = sanitizePathPart(shareId);
  if (!safeShareId) {
    throw new Error('Share not found');
  }

  const shareDir = path.join(sharesDir, safeShareId);
  const recordPath = path.join(shareDir, 'share.json');

  try {
    const record = JSON.parse(await readFile(recordPath, 'utf8'));
    if (record.expiresAt && new Date(record.expiresAt).getTime() <= nowMs) {
      await rm(shareDir, { recursive: true, force: true });
      throw new Error('Share expired');
    }
    return record;
  } catch (error) {
    if (error instanceof Error && error.message === 'Share expired') {
      throw error;
    }
    throw new Error('Share not found');
  }
}

export function getShareAssetPath(sharesDir, shareId, fileName) {
  const safeShareId = sanitizePathPart(shareId);
  const safeFileName = sanitizePathPart(fileName);
  if (!safeShareId || !safeFileName) {
    throw new Error('Asset not found');
  }
  return path.join(sharesDir, safeShareId, 'assets', safeFileName);
}
