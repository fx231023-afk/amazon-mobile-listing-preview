import { describe, expect, it, vi } from 'vitest';
import { createShareId, getShareExpiry, isShareExpired, SHARE_TTL_MS } from './shareUtils';

describe('share utilities', () => {
  it('creates short URL-safe share ids', () => {
    const spy = vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint8Array).fill(1);
      return array;
    });

    expect(createShareId(8)).toHaveLength(8);
    expect(createShareId(8)).toMatch(/^[A-Za-z0-9]+$/);

    spy.mockRestore();
  });

  it('expires temporary shares after 24 hours', () => {
    const createdAt = Date.UTC(2026, 5, 30, 8, 0, 0);
    const expiresAt = getShareExpiry(createdAt);

    expect(new Date(expiresAt).getTime() - createdAt).toBe(SHARE_TTL_MS);
    expect(isShareExpired(expiresAt, createdAt + SHARE_TTL_MS - 1)).toBe(false);
    expect(isShareExpired(expiresAt, createdAt + SHARE_TTL_MS)).toBe(true);
  });
});
