import { Camera, RotateCcw, Trash2 } from 'lucide-react';
import type { ListingInfo, PreviewSettings, UploadedImage } from '../types';
import {
  calculateScaledAplusSize,
  getAplusRiskMessage,
  getCharacterCount
} from '../lib/listingUtils';
import { ImageSortableList } from './ImageSortableList';

interface CheckPanelProps {
  listing: ListingInfo;
  settings: PreviewSettings;
  galleryImages: UploadedImage[];
  aplusImages: UploadedImage[];
  activeGalleryId?: string;
  exportStatus: string;
  exportPreviewUrl: string;
  exportFileName: string;
  exportProjectPath: string;
  shareStatus: string;
  shareUrl: string;
  shareExpiresAt: string;
  onCreateShare: () => void;
  onSaveExport: () => void;
  onSaveExportToProject: () => void;
  onMoveGallery: (index: number, direction: -1 | 1) => void;
  onMoveAplus: (index: number, direction: -1 | 1) => void;
  onDeleteGallery: (id: string) => void;
  onDeleteAplus: (id: string) => void;
  onSelectGallery: (index: number) => void;
  onClearImages: () => void;
  onResetInfo: () => void;
  onExport: () => void;
}

export function CheckPanel({
  listing,
  galleryImages,
  aplusImages,
  activeGalleryId,
  exportStatus,
  exportPreviewUrl,
  exportFileName,
  exportProjectPath,
  shareStatus,
  shareUrl,
  shareExpiresAt,
  onCreateShare,
  onSaveExport,
  onSaveExportToProject,
  onMoveGallery,
  onMoveAplus,
  onDeleteGallery,
  onDeleteAplus,
  onSelectGallery,
  onClearImages,
  onResetInfo,
  onExport
}: CheckPanelProps) {
  const titleCount = getCharacterCount(listing.title);
  const titleTone = titleCount > 180 ? 'warn' : titleCount < 80 ? 'soft' : 'ok';
  const aplusRisks = aplusImages
    .map((image, index) => ({
      index,
      image,
      risk: getAplusRiskMessage(image.width, image.height, 390),
      scaled: calculateScaledAplusSize(image.width, image.height, 390)
    }))
    .filter((item) => item.risk);

  return (
    <aside className="panel panel-right">
      <section className="panel-card">
        <div className="section-heading">
          <h2>检查结果</h2>
          <span>390px</span>
        </div>

        <div className={`check-item ${titleTone}`}>
          <strong>标题字数</strong>
          <span>{titleCount} 字</span>
        </div>

        {listing.bullets.map((bullet, index) => (
          <div className="check-item" key={index}>
            <strong>Bullet {index + 1}</strong>
            <span>{getCharacterCount(bullet)} 字</span>
          </div>
        ))}

        <div className="check-note">
          A+ 图片手机端显示宽度：390px。1464x600 横图缩小后高度约 160px。
        </div>

        {aplusRisks.length > 0 ? (
          <div className="risk-list">
            {aplusRisks.map(({ image, index, risk, scaled }) => (
              <div className="risk-card" key={image.id}>
                <strong>A+ #{index + 1}</strong>
                <span>{risk}</span>
                <small>手机显示约 {scaled.width}x{scaled.height}px</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="check-note">暂无 A+ 小字风险提示。</div>
        )}
      </section>

      <section className="panel-card actions-card">
        <button className="tool-button primary" type="button" onClick={onCreateShare}>
          <Camera size={17} />
          生成实时手机预览链接
        </button>
        {shareStatus && <div className="export-status">{shareStatus}</div>}
        {shareUrl && (
          <div className="share-box">
            <a href={shareUrl} target="_blank" rel="noreferrer">
              {shareUrl}
            </a>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(shareUrl);
              }}
            >
              复制链接
            </button>
            {shareExpiresAt && <small>电脑页面关闭后失效，最晚失效：{new Date(shareExpiresAt).toLocaleString()}</small>}
          </div>
        )}
        <button className="tool-button primary" type="button" onClick={onExport}>
          <Camera size={17} />
          导出当前手机端长截图
        </button>
        <button className="tool-button" type="button" onClick={onClearImages}>
          <Trash2 size={17} />
          清空全部图片
        </button>
        <button className="tool-button" type="button" onClick={onResetInfo}>
          <RotateCcw size={17} />
          恢复默认商品信息
        </button>
        {exportStatus && <div className="export-status">{exportStatus}</div>}
        {exportPreviewUrl && (
          <div className="export-preview">
            <img src={exportPreviewUrl} alt="Exported phone screenshot preview" />
            <div className="export-preview-actions">
              <button type="button" onClick={onSaveExport}>
                选择位置保存截图
              </button>
              <a href={exportPreviewUrl} download={exportFileName}>
                下载这张截图
              </a>
              <a href={exportPreviewUrl} target="_blank" rel="noreferrer">
                打开截图
              </a>
            </div>
            {exportProjectPath && <code className="export-path">{exportProjectPath}</code>}
            <small>如果浏览器没有自动下载，可以在这里右键预览图另存为。</small>
          </div>
        )}
      </section>

      <ImageSortableList
        title="主图 / 副图排序"
        images={galleryImages}
        activeId={activeGalleryId}
        onSelect={onSelectGallery}
        onMove={onMoveGallery}
        onDelete={onDeleteGallery}
      />

      <ImageSortableList
        title="A+ 图片排序"
        images={aplusImages}
        onMove={onMoveAplus}
        onDelete={onDeleteAplus}
      />
    </aside>
  );
}
