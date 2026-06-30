import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createShareRecord,
  cleanupExpiredShares,
  readShareRecord
} from './shareStore.mjs';

const ONE_PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

async function withTempDir(callback) {
  const dir = await mkdtemp(path.join(tmpdir(), 'amazon-share-store-'));
  try {
    await callback(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe('production share store', () => {
  it('writes uploaded image data as temporary share assets and returns public asset urls', async () => {
    await withTempDir(async (sharesDir) => {
      const record = await createShareRecord({
        sharesDir,
        payload: {
          listing: { title: 'Test listing' },
          settings: { showFirstFoldLine: true },
          galleryImages: [
            {
              id: 'gallery-1',
              name: 'main.png',
              dataUrl: ONE_PIXEL_PNG,
              width: 1,
              height: 1,
              size: 68
            }
          ],
          aplusImages: []
        },
        nowMs: Date.UTC(2026, 5, 30, 8, 0, 0)
      });

      expect(record.id).toMatch(/^[A-Za-z0-9]{8}$/);
      expect(record.galleryImages[0]).toMatchObject({
        id: 'gallery-1',
        name: 'main.png',
        width: 1,
        height: 1,
        size: 68,
        url: `/share-assets/${record.id}/gallery-01.png`
      });
      expect(record.galleryImages[0].dataUrl).toBeUndefined();

      const stored = JSON.parse(await readFile(path.join(sharesDir, record.id, 'share.json'), 'utf8'));
      expect(stored.galleryImages[0].url).toBe(`/share-assets/${record.id}/gallery-01.png`);

      const loaded = await readShareRecord(sharesDir, record.id, Date.UTC(2026, 5, 30, 9, 0, 0));
      expect(loaded.id).toBe(record.id);
    });
  });

  it('removes expired shares after 24 hours', async () => {
    await withTempDir(async (sharesDir) => {
      const createdAt = Date.UTC(2026, 5, 30, 8, 0, 0);
      const record = await createShareRecord({
        sharesDir,
        payload: {
          listing: {},
          settings: {},
          galleryImages: [],
          aplusImages: []
        },
        nowMs: createdAt
      });

      await cleanupExpiredShares(sharesDir, createdAt + 24 * 60 * 60 * 1000);

      await expect(readShareRecord(sharesDir, record.id, createdAt + 24 * 60 * 60 * 1000)).rejects.toThrow(
        'Share not found'
      );
    });
  });
});
