import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import html2canvas from 'html2canvas';
import { CheckPanel } from './components/CheckPanel';
import { ControlPanel } from './components/ControlPanel';
import { PreviewPhone } from './components/PreviewPhone';
import { SharePreviewPage } from './components/SharePreviewPage';
import { DEFAULT_LISTING_INFO, DEFAULT_SETTINGS } from './data/defaultListing';
import { fileToUploadedImage } from './lib/fileImages';
import { createLivePeer, type LiveDataConnection, type LivePeer } from './lib/liveShare';
import { clampActiveIndex, moveItem } from './lib/listingUtils';
import { blobToDataUrl, createShareId, getShareExpiry } from './lib/shareUtils';
import type { ListingInfo, PreviewSettings, SharedImage, ShareRecord, UploadedImage } from './types';
import './App.css';

const STORAGE_KEY = 'amazon-mobile-listing-preview-config';
const MAX_GALLERY_IMAGES = 9;
const MAX_APLUS_IMAGES = 10;

interface StoredConfig {
  listing: ListingInfo;
  settings: PreviewSettings;
}

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeType = header.match(/data:(.*);base64/)?.[1] ?? 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function readStoredConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { listing: DEFAULT_LISTING_INFO, settings: DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw) as Partial<StoredConfig>;
    return {
      listing: {
        ...DEFAULT_LISTING_INFO,
        ...parsed.listing,
        bullets: parsed.listing?.bullets?.length === 5 ? parsed.listing.bullets : DEFAULT_LISTING_INFO.bullets
      },
      settings: {
        ...DEFAULT_SETTINGS,
        ...parsed.settings
      }
    };
  } catch {
    return { listing: DEFAULT_LISTING_INFO, settings: DEFAULT_SETTINGS };
  }
}

export default function App() {
  const [route, setRoute] = useState(() => ({
    pathname: window.location.pathname,
    hash: window.location.hash
  }));

  useEffect(() => {
    const updateRoute = () => {
      setRoute({
        pathname: window.location.pathname,
        hash: window.location.hash
      });
    };

    window.addEventListener('hashchange', updateRoute);
    window.addEventListener('popstate', updateRoute);
    return () => {
      window.removeEventListener('hashchange', updateRoute);
      window.removeEventListener('popstate', updateRoute);
    };
  }, []);

  const liveMatch = route.hash.match(/^#\/live\/([^/]+)$/);
  if (liveMatch) {
    return <SharePreviewPage shareId={liveMatch[1]} mode="live" />;
  }

  const shareMatch = route.pathname.match(/^\/p\/([^/]+)$/);
  if (shareMatch) {
    return <SharePreviewPage shareId={shareMatch[1]} />;
  }

  return <EditorApp />;
}

function EditorApp() {
  const stored = useMemo(readStoredConfig, []);
  const [listing, setListing] = useState<ListingInfo>(stored.listing);
  const [settings, setSettings] = useState<PreviewSettings>(stored.settings);
  const [galleryImages, setGalleryImages] = useState<UploadedImage[]>([]);
  const [aplusImages, setAplusImages] = useState<UploadedImage[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [exportPreviewUrl, setExportPreviewUrl] = useState('');
  const [exportFileName, setExportFileName] = useState('');
  const [exportProjectPath, setExportProjectPath] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [shareExpiresAt, setShareExpiresAt] = useState('');
  const imagesRef = useRef({ galleryImages, aplusImages });
  const livePeerRef = useRef<LivePeer | null>(null);
  const liveConnectionsRef = useRef<LiveDataConnection[]>([]);
  const liveRecordRef = useRef<ShareRecord | null>(null);

  useEffect(() => {
    const config: StoredConfig = { listing, settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [listing, settings]);

  useEffect(() => {
    setActiveIndex((current) => clampActiveIndex(current, galleryImages.length));
  }, [galleryImages.length]);

  useEffect(() => {
    imagesRef.current = { galleryImages, aplusImages };
  }, [galleryImages, aplusImages]);

  useEffect(() => {
    return () => {
      const currentImages = imagesRef.current;
      [...currentImages.galleryImages, ...currentImages.aplusImages].forEach((image) =>
        URL.revokeObjectURL(image.url)
      );
      liveConnectionsRef.current.forEach((connection) => connection.close());
      livePeerRef.current?.destroy();
    };
  }, []);

  const addImages = async (
    files: File[],
    currentImages: UploadedImage[],
    maxImages: number,
    setImages: Dispatch<SetStateAction<UploadedImage[]>>
  ) => {
    const remainingSlots = maxImages - currentImages.length;
    if (remainingSlots <= 0) {
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    const uploadedImages = await Promise.all(selectedFiles.map(fileToUploadedImage));
    setImages((images) => [...images, ...uploadedImages].slice(0, maxImages));
  };

  const deleteImage = (
    id: string,
    setImages: Dispatch<SetStateAction<UploadedImage[]>>
  ) => {
    setImages((images) => {
      const target = images.find((image) => image.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return images.filter((image) => image.id !== id);
    });
  };

  const clearImages = () => {
    [...galleryImages, ...aplusImages].forEach((image) => URL.revokeObjectURL(image.url));
    setGalleryImages([]);
    setAplusImages([]);
    setActiveIndex(0);
  };

  const imageToShareImage = async (image: UploadedImage): Promise<SharedImage> => {
    const response = await fetch(image.url);
    const blob = await response.blob();
    return {
      ...image,
      dataUrl: await blobToDataUrl(blob)
    };
  };

  const createShareRecordForLivePreview = async (): Promise<ShareRecord> => {
    const [sharedGalleryImages, sharedAplusImages] = await Promise.all([
      Promise.all(galleryImages.map(imageToShareImage)),
      Promise.all(aplusImages.map(imageToShareImage))
    ]);
    const createdAtMs = Date.now();

    return {
      id: createShareId(8),
      createdAt: new Date(createdAtMs).toISOString(),
      expiresAt: getShareExpiry(createdAtMs),
      listing,
      settings,
      galleryImages: sharedGalleryImages.map((image) => ({
        ...image,
        url: image.dataUrl ?? image.url
      })),
      aplusImages: sharedAplusImages.map((image) => ({
        ...image,
        url: image.dataUrl ?? image.url
      }))
    };
  };

  const sendLiveRecord = (connection: LiveDataConnection) => {
    const currentRecord = liveRecordRef.current;
    if (!currentRecord || !connection.open) {
      return;
    }
    connection.send({ type: 'share-record', share: currentRecord });
  };

  const createTemporaryShare = async () => {
    setShareStatus('正在生成实时分享链接...');
    setShareUrl('');
    setShareExpiresAt('');

    try {
      const record = await createShareRecordForLivePreview();
      const peerId = `amp-${record.id}`;
      const peer = await createLivePeer(peerId);

      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error('Live preview connection timed out')), 12000);
        peer.on('open', () => {
          window.clearTimeout(timer);
          resolve();
        });
        peer.on('error', (error) => {
          window.clearTimeout(timer);
          reject(error instanceof Error ? error : new Error('Live preview failed'));
        });
      });

      liveConnectionsRef.current.forEach((connection) => connection.close());
      liveConnectionsRef.current = [];
      livePeerRef.current?.destroy();
      livePeerRef.current = peer;
      liveRecordRef.current = record;

      peer.on('connection', (connection: LiveDataConnection) => {
        liveConnectionsRef.current = [...liveConnectionsRef.current, connection];
        connection.on('open', () => sendLiveRecord(connection));
        connection.on('data', () => sendLiveRecord(connection));
        connection.on('close', () => {
          liveConnectionsRef.current = liveConnectionsRef.current.filter((item) => item !== connection);
        });
      });

      const fullUrl = `${window.location.origin}${window.location.pathname}#/live/${peerId}`;
      setShareUrl(fullUrl);
      setShareExpiresAt(record.expiresAt);
      setShareStatus('实时分享链接已生成；请保持这个电脑页面打开，手机可立即查看');
      void navigator.clipboard?.writeText(fullUrl);
    } catch {
      setShareStatus('实时分享生成失败，请检查网络后刷新页面重试');
    }
  };

  const exportPhoneScreenshot = async () => {
    const target = document.getElementById('phone-capture-target');
    if (!target) {
      setExportStatus('没有找到手机预览区域');
      return;
    }

    setExportStatus('正在生成截图...');
    try {
      const canvas = await html2canvas(target, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        windowWidth: 390,
        windowHeight: target.scrollHeight,
        height: target.scrollHeight,
        width: target.scrollWidth
      });

      const dataUrl = canvas.toDataURL('image/png');
      const fileName = `amazon-mobile-preview-${Date.now()}.png`;
      setExportPreviewUrl(dataUrl);
      setExportFileName(fileName);
      setExportProjectPath('');
      setExportStatus('截图已生成，已尝试在浏览器下载');

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch {
      setExportStatus('截图导出失败，请先尝试刷新页面后重新生成');
    }
  };

  const saveExportToProject = async () => {
    setExportStatus('线上版不保存服务器备份，请使用下载或选择位置保存');
  };

  const saveExportToFile = async () => {
    if (!exportPreviewUrl) {
      setExportStatus('请先生成截图');
      return;
    }

    const savePicker = (window as SavePickerWindow).showSaveFilePicker;
    if (!savePicker) {
      setExportStatus('当前浏览器不支持选择保存位置，请右键预览图另存为');
      return;
    }

    try {
      setExportStatus('正在打开保存窗口...');
      const fileHandle = await savePicker({
        suggestedName: exportFileName || `amazon-mobile-preview-${Date.now()}.png`,
        types: [
          {
            description: 'PNG Image',
            accept: {
              'image/png': ['.png']
            }
          }
        ]
      });
      const writable = await fileHandle.createWritable();
      await writable.write(dataUrlToBlob(exportPreviewUrl));
      await writable.close();
      setExportStatus('截图已保存到你选择的位置');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setExportStatus('已取消保存');
        return;
      }
      setExportStatus('保存失败，请右键预览图另存为');
    }
  };

  return (
    <div className="app-shell">
      <ControlPanel
        listing={listing}
        settings={settings}
        galleryCount={galleryImages.length}
        aplusCount={aplusImages.length}
        onListingChange={setListing}
        onSettingsChange={setSettings}
        onGalleryFiles={(files) => addImages(files, galleryImages, MAX_GALLERY_IMAGES, setGalleryImages)}
        onAplusFiles={(files) => addImages(files, aplusImages, MAX_APLUS_IMAGES, setAplusImages)}
      />

      <PreviewPhone
        listing={listing}
        settings={settings}
        galleryImages={galleryImages}
        aplusImages={aplusImages}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
      />

      <CheckPanel
        listing={listing}
        settings={settings}
        galleryImages={galleryImages}
        aplusImages={aplusImages}
        activeGalleryId={galleryImages[activeIndex]?.id}
        exportStatus={exportStatus}
        exportPreviewUrl={exportPreviewUrl}
        exportFileName={exportFileName}
        exportProjectPath={exportProjectPath}
        shareStatus={shareStatus}
        shareUrl={shareUrl}
        shareExpiresAt={shareExpiresAt}
        onCreateShare={createTemporaryShare}
        onSaveExport={saveExportToFile}
        onSaveExportToProject={saveExportToProject}
        onMoveGallery={(index, direction) => setGalleryImages((images) => moveItem(images, index, direction))}
        onMoveAplus={(index, direction) => setAplusImages((images) => moveItem(images, index, direction))}
        onDeleteGallery={(id) => deleteImage(id, setGalleryImages)}
        onDeleteAplus={(id) => deleteImage(id, setAplusImages)}
        onSelectGallery={setActiveIndex}
        onClearImages={clearImages}
        onResetInfo={() => {
          setListing(DEFAULT_LISTING_INFO);
          setSettings(DEFAULT_SETTINGS);
        }}
        onExport={exportPhoneScreenshot}
      />
    </div>
  );
}
