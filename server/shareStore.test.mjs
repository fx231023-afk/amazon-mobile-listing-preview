import { describe, expect, it } from 'vitest';
import {
  cleanupExpiredShares,
  createShareRecord,
  readShareRecord
} from './shareStore.mjs';

const ONE_PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

describe('production share store', () => {
  it('keeps uploaded image data in process memory without writing asset urls', async () => {
    const record = await createShareRecord({
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
      url: ONE_PIXEL_PNG
    });

    const loaded = await readShareRecord(null, record.id, Date.UTC(2026, 5, 30, 9, 0, 0));
    expect(loaded.id).toBe(record.id);
    expect(loaded.galleryImages[0].url).toBe(ONE_PIXEL_PNG);
  });

  it('removes expired in-memory shares after 24 hours', async () => {
    const createdAt = Date.UTC(2026, 5, 30, 8, 0, 0);
    const record = await createShareRecord({
      payload: {
        listing: {},
        settings: {},
        galleryImages: [],
        aplusImages: []
      },
      nowMs: createdAt
    });

    await cleanupExpiredShares(null, createdAt + 24 * 60 * 60 * 1000);

    await expect(readShareRecord(null, record.id, createdAt + 24 * 60 * 60 * 1000)).rejects.toThrow(
      'Share not found'
    );
  });
});
