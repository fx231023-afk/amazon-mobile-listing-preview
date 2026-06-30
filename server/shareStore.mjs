import crypto from 'node:crypto';
import path from 'node:path';

export const SHARE_TTL_MS = 24 * 60 * 60 * 1000;
const SHARE_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const shares = new Map();

function createShareId(length = 8) {
  let id = '';
  const bytes = crypto.randomBytes(length);
  for (const byte of bytes) {
    id += SHARE_ID_ALPHABET[byte % SHARE_ID_ALPHABET.length];
  }
  return id;
}

export function sanitizePathPart(value) {
  return path.basename(String(value || '')).replace(/[^a-zA-Z0-9._-]/g, '');
}

function normalizeImages(images = []) {
  return images.map((image) => {
    if (!image.dataUrl?.startsWith('data:image/')) {
      throw new Error('Invalid image data');
    }

    return {
      id: image.id,
      name: image.name,
      width: image.width,
      height: image.height,
      size: image.size,
      url: image.dataUrl
    };
  });
}

export async function cleanupExpiredShares(_sharesDir, nowMs = Date.now()) {
  for (const [id, record] of shares.entries()) {
    if (!record.expiresAt || new Date(record.expiresAt).getTime() <= nowMs) {
      shares.delete(id);
    }
  }
}

export async function createShareRecord({ payload, nowMs = Date.now() }) {
  await cleanupExpiredShares(null, nowMs);

  const id = createShareId();
  const createdAt = new Date(nowMs);
  const expiresAt = new Date(nowMs + SHARE_TTL_MS);
  const record = {
    id,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    listing: payload.listing,
    settings: payload.settings,
    galleryImages: normalizeImages(payload.galleryImages ?? []),
    aplusImages: normalizeImages(payload.aplusImages ?? [])
  };

  shares.set(id, record);
  return record;
}

export async function readShareRecord(_sharesDir, shareId, nowMs = Date.now()) {
  const safeShareId = sanitizePathPart(shareId);
  if (!safeShareId) {
    throw new Error('Share not found');
  }

  const record = shares.get(safeShareId);
  if (!record) {
    throw new Error('Share not found');
  }

  if (record.expiresAt && new Date(record.expiresAt).getTime() <= nowMs) {
    shares.delete(safeShareId);
    throw new Error('Share expired');
  }

  return record;
}
