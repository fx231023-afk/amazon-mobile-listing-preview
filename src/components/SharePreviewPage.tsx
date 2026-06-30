import { useEffect, useState } from 'react';
import { DEFAULT_LISTING_INFO, DEFAULT_SETTINGS } from '../data/defaultListing';
import type { ShareRecord } from '../types';
import { PreviewPhone } from './PreviewPhone';

interface SharePreviewPageProps {
  shareId: string;
}

function normalizeShareRecord(share: ShareRecord): ShareRecord {
  return {
    ...share,
    listing: {
      ...DEFAULT_LISTING_INFO,
      ...share.listing,
      bullets:
        share.listing?.bullets?.length === 5
          ? share.listing.bullets
          : DEFAULT_LISTING_INFO.bullets
    },
    settings: {
      ...DEFAULT_SETTINGS,
      ...share.settings
    },
    galleryImages: share.galleryImages ?? [],
    aplusImages: share.aplusImages ?? []
  };
}

export function SharePreviewPage({ shareId }: SharePreviewPageProps) {
  const [share, setShare] = useState<ShareRecord | null>(null);
  const [status, setStatus] = useState('正在加载预览...');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    document.body.classList.add('share-preview-body');

    return () => {
      document.body.classList.remove('share-preview-body');
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadShare() {
      try {
        const response = await fetch(`/api/shares/${shareId}`);
        const result = (await response.json()) as {
          ok: boolean;
          share?: ShareRecord;
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok || !result.ok || !result.share) {
          setStatus(response.status === 410 ? '这个预览链接已超过 24 小时，已自动失效。' : '没有找到这个预览链接。');
          return;
        }

        setShare(normalizeShareRecord(result.share));
        setStatus('');
      } catch {
        if (!cancelled) {
          setStatus('预览加载失败，请检查链接是否正确，或刷新页面后重试。');
        }
      }
    }

    void loadShare();

    return () => {
      cancelled = true;
    };
  }, [shareId]);

  if (!share) {
    return (
      <div className="share-message">
        <strong>Amazon Mobile Preview</strong>
        <span>{status}</span>
      </div>
    );
  }

  return (
    <PreviewPhone
      listing={share.listing ?? DEFAULT_LISTING_INFO}
      settings={share.settings ?? DEFAULT_SETTINGS}
      galleryImages={share.galleryImages ?? []}
      aplusImages={share.aplusImages ?? []}
      activeIndex={activeIndex}
      onActiveIndexChange={setActiveIndex}
      displayMode="direct"
    />
  );
}
