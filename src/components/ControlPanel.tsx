import type { ListingInfo, PreviewSettings, SiteLocale } from '../types';
import { UploadDropzone } from './UploadDropzone';
import { getCharacterCount } from '../lib/listingUtils';

interface ControlPanelProps {
  listing: ListingInfo;
  settings: PreviewSettings;
  galleryCount: number;
  aplusCount: number;
  onListingChange: (listing: ListingInfo) => void;
  onSettingsChange: (settings: PreviewSettings) => void;
  onGalleryFiles: (files: File[]) => void;
  onAplusFiles: (files: File[]) => void;
}

const sites: SiteLocale[] = ['US', 'DE', 'JP', 'FR'];

export function ControlPanel({
  listing,
  settings,
  galleryCount,
  aplusCount,
  onListingChange,
  onSettingsChange,
  onGalleryFiles,
  onAplusFiles
}: ControlPanelProps) {
  const updateField = <K extends keyof ListingInfo>(key: K, value: ListingInfo[K]) => {
    onListingChange({ ...listing, [key]: value });
  };

  const updateBullet = (index: number, value: string) => {
    const bullets = [...listing.bullets];
    bullets[index] = value;
    onListingChange({ ...listing, bullets });
  };

  return (
    <aside className="panel panel-left">
      <div className="panel-title">
        <h1>Listing Preview</h1>
        <p>上传商品图与 A+，模拟手机端展示效果</p>
      </div>

      <section className="panel-card">
        <div className="section-heading">
          <h2>图片上传</h2>
          <span>{galleryCount}/9 · {aplusCount}/10</span>
        </div>
        <UploadDropzone
          label="上传主图 / 副图"
          helper="最多 9 张，支持拖拽或点击"
          onFiles={onGalleryFiles}
        />
        <UploadDropzone
          label="上传 A+ 横图"
          helper="建议 1464x600，手机端等比缩放"
          onFiles={onAplusFiles}
        />
      </section>

      <section className="panel-card">
        <div className="section-heading">
          <h2>商品信息</h2>
          <span>{listing.site}</span>
        </div>

        <label className="field">
          <span>站点语言</span>
          <select value={listing.site} onChange={(event) => updateField('site', event.target.value as SiteLocale)}>
            {sites.map((site) => (
              <option value={site} key={site}>{site}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>商品标题</span>
          <textarea
            rows={3}
            value={listing.title}
            onChange={(event) => updateField('title', event.target.value)}
          />
          <small>标题字数：{getCharacterCount(listing.title)}</small>
        </label>

        <div className="field-grid">
          <label className="field">
            <span>品牌名</span>
            <input value={listing.brand} onChange={(event) => updateField('brand', event.target.value)} />
          </label>
          <label className="field">
            <span>价格</span>
            <input value={listing.price} onChange={(event) => updateField('price', event.target.value)} />
          </label>
          <label className="field">
            <span>原价</span>
            <input value={listing.originalPrice} onChange={(event) => updateField('originalPrice', event.target.value)} />
          </label>
          <label className="field">
            <span>星级评分</span>
            <input value={listing.rating} onChange={(event) => updateField('rating', event.target.value)} />
          </label>
        </div>

        <label className="field">
          <span>评论数量</span>
          <input value={listing.reviewCount} onChange={(event) => updateField('reviewCount', event.target.value)} />
        </label>
        <label className="field">
          <span>优惠券文案</span>
          <input value={listing.coupon} onChange={(event) => updateField('coupon', event.target.value)} />
        </label>
        <label className="field">
          <span>配送信息</span>
          <input value={listing.delivery} onChange={(event) => updateField('delivery', event.target.value)} />
        </label>
      </section>

      <section className="panel-card">
        <div className="section-heading">
          <h2>五点描述</h2>
        </div>
        {listing.bullets.map((bullet, index) => (
          <label className="field" key={index}>
            <span>Bullet {index + 1}</span>
            <textarea rows={2} value={bullet} onChange={(event) => updateBullet(index, event.target.value)} />
            <small>字数：{getCharacterCount(bullet)}</small>
          </label>
        ))}
      </section>

      <section className="panel-card">
        <div className="section-heading">
          <h2>辅助线</h2>
        </div>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={settings.showAplusSafeArea}
            onChange={(event) => onSettingsChange({ ...settings, showAplusSafeArea: event.target.checked })}
          />
          <span>显示 600x450 APP 重点区域参考框</span>
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={settings.showFirstFoldLine}
            onChange={(event) => onSettingsChange({ ...settings, showFirstFoldLine: event.target.checked })}
          />
          <span>显示首屏线</span>
        </label>
      </section>
    </aside>
  );
}
