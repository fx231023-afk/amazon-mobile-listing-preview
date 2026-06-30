import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_LISTING_INFO, DEFAULT_SETTINGS } from '../data/defaultListing';
import { CheckPanel } from './CheckPanel';

const noop = vi.fn();

describe('CheckPanel export preview', () => {
  it('shows the generated screenshot preview and download link when export data is available', () => {
    render(
      <CheckPanel
        listing={DEFAULT_LISTING_INFO}
        settings={DEFAULT_SETTINGS}
        galleryImages={[]}
        aplusImages={[]}
        exportStatus="Screenshot ready"
        exportPreviewUrl="data:image/png;base64,preview"
        exportFileName="amazon-mobile-preview-test.png"
        exportProjectPath="D:/codex/amazon-mobile-listing-preview/exports/amazon-mobile-preview-test.png"
        shareStatus=""
        shareUrl=""
        shareExpiresAt=""
        onCreateShare={noop}
        onSaveExport={noop}
        onSaveExportToProject={noop}
        onMoveGallery={noop}
        onMoveAplus={noop}
        onDeleteGallery={noop}
        onDeleteAplus={noop}
        onSelectGallery={noop}
        onClearImages={noop}
        onResetInfo={noop}
        onExport={noop}
      />
    );

    const preview = screen.getByAltText('Exported phone screenshot preview');
    expect(preview).toHaveAttribute('src', 'data:image/png;base64,preview');

    const downloadLink = screen.getByRole('link', { name: '下载这张截图' });
    expect(downloadLink).toHaveAttribute('href', 'data:image/png;base64,preview');
    expect(downloadLink).toHaveAttribute('download', 'amazon-mobile-preview-test.png');

    expect(screen.getByRole('button', { name: '选择位置保存截图' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存到服务器备份' })).toBeInTheDocument();
    expect(
      screen.getByText('D:/codex/amazon-mobile-listing-preview/exports/amazon-mobile-preview-test.png')
    ).toBeInTheDocument();
  });
});
