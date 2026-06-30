import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SharePreviewPage } from './SharePreviewPage';

describe('SharePreviewPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fills missing listing and settings fields from defaults before rendering the phone preview', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        share: {
          id: 'abc123',
          createdAt: '2026-06-30T08:00:00.000Z',
          expiresAt: '2026-07-01T08:00:00.000Z',
          listing: {
            title: 'Partial shared listing'
          },
          settings: {},
          galleryImages: [],
          aplusImages: []
        }
      })
    } as Response);

    render(<SharePreviewPage shareId="abc123" />);

    expect(await screen.findByText('Partial shared listing')).toBeInTheDocument();
    expect(screen.getByText(/VILLAPOOL/)).toBeInTheDocument();
    expect(document.body).toHaveClass('share-preview-body');
  });
});
