import { ChevronLeft, ChevronRight, Search, ShoppingCart } from 'lucide-react';
import type { ListingInfo, PreviewSettings, UploadedImage } from '../types';
import { SITE_LABELS } from '../data/defaultListing';
import {
  calculateScaledAplusSize,
  getAplusRiskMessage,
  normalizeRating
} from '../lib/listingUtils';

interface PreviewPhoneProps {
  listing: ListingInfo;
  settings: PreviewSettings;
  galleryImages: UploadedImage[];
  aplusImages: UploadedImage[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  displayMode?: 'framed' | 'direct';
}

export function PreviewPhone({
  listing,
  settings,
  galleryImages,
  aplusImages,
  activeIndex,
  onActiveIndexChange,
  displayMode = 'framed'
}: PreviewPhoneProps) {
  const copy = SITE_LABELS[listing.site];
  const activeImage = galleryImages[activeIndex];
  const rating = normalizeRating(listing.rating);

  const changeSlide = (direction: -1 | 1) => {
    if (galleryImages.length === 0) {
      return;
    }
    const nextIndex = (activeIndex + direction + galleryImages.length) % galleryImages.length;
    onActiveIndexChange(nextIndex);
  };

  return (
    <main className={`phone-stage ${displayMode === 'direct' ? 'share-stage' : ''}`}>
      <div className={`phone-shell ${displayMode === 'direct' ? 'share-shell' : ''}`}>
        <div className="phone-speaker" />
        <div className="phone-screen">
          <div className="phone-page" id="phone-capture-target">
            <header className="amazon-topbar">
              <div className="mobile-search">
                <Search size={16} />
                <span>{copy.search}</span>
              </div>
              <ShoppingCart size={19} />
            </header>

            <section className="product-gallery">
              <div className="sponsored-row">{copy.sponsored}</div>
              <div className="hero-image-wrap">
                {activeImage ? (
                  <img className="hero-image" src={activeImage.url} alt={activeImage.name} />
                ) : (
                  <div className="hero-placeholder">1:1 主图预览</div>
                )}
                <button className="gallery-nav prev" type="button" onClick={() => changeSlide(-1)} aria-label="上一张">
                  <ChevronLeft size={18} />
                </button>
                <button className="gallery-nav next" type="button" onClick={() => changeSlide(1)} aria-label="下一张">
                  <ChevronRight size={18} />
                </button>
                <div className="image-counter">
                  {galleryImages.length > 0 ? `${activeIndex + 1} / ${galleryImages.length}` : '0 / 0'}
                </div>
              </div>

              <div className="thumb-strip">
                {galleryImages.length === 0
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <button className="thumb is-placeholder" type="button" key={index} aria-label="占位缩略图" />
                    ))
                  : galleryImages.map((image, index) => (
                      <button
                        className={`thumb ${index === activeIndex ? 'is-active' : ''}`}
                        type="button"
                        key={image.id}
                        onClick={() => onActiveIndexChange(index)}
                        aria-label={`切换到第 ${index + 1} 张图`}
                      >
                        <img src={image.url} alt={image.name} />
                      </button>
                    ))}
              </div>
            </section>

            <section className="product-info">
              <div className="brand-line">{copy.brand}: {listing.brand}</div>
              <h2>{listing.title}</h2>
              <div className="rating-row">
                <span>{rating.toFixed(1)}</span>
                <span className="stars" aria-label={`${rating} stars`}>
                  {'★★★★★'}
                  <span style={{ width: `${(rating / 5) * 100}%` }}>{'★★★★★'}</span>
                </span>
                <a>{listing.reviewCount} {copy.ratings}</a>
              </div>
              <div className="price-row">
                <span className="price">{listing.price}</span>
                <span className="original-price">{listing.originalPrice}</span>
              </div>
              <div className="deal-line">{copy.deal}</div>
              <div className="coupon-box">{listing.coupon}</div>
              <div className="delivery-box">
                <strong>{copy.delivery}</strong>
                <span>{listing.delivery}</span>
              </div>
              <button className="amazon-button add" type="button">{copy.addToCart}</button>
              <button className="amazon-button buy" type="button">{copy.buyNow}</button>
            </section>

            <section className="bullet-section">
              <h3>{copy.bulletsTitle}</h3>
              <ul>
                {listing.bullets.map((bullet, index) => (
                  <li key={index}>{bullet}</li>
                ))}
              </ul>
            </section>

            <section className="aplus-section">
              <h3>{copy.aplusTitle}</h3>
              {aplusImages.length === 0 ? (
                <div className="aplus-placeholder">
                  <span>A+ Content 1464x600 横图预览</span>
                </div>
              ) : (
                aplusImages.map((image, index) => {
                  const scaled = calculateScaledAplusSize(image.width, image.height, 390);
                  const risk = getAplusRiskMessage(image.width, image.height, 390);
                  return (
                    <article className="aplus-module" key={image.id}>
                      <div className="aplus-image-wrap">
                        <img src={image.url} alt={image.name} />
                        {settings.showAplusSafeArea && (
                          <div
                            className="aplus-safe-area"
                            style={{
                              width: `${Math.min(100, (600 / image.width) * 100)}%`,
                              height: `${Math.min(100, (450 / image.height) * 100)}%`
                            }}
                          >
                            <span>600x450 APP</span>
                          </div>
                        )}
                      </div>
                      <div className="aplus-meta">
                        <span>#{index + 1} 原图 {image.width}x{image.height}px</span>
                        <span>手机显示约 {scaled.width}x{scaled.height}px</span>
                      </div>
                      {risk && <div className="mobile-risk">{risk}</div>}
                    </article>
                  );
                })
              )}
            </section>

            <div className="preview-bottom-space" />
          </div>

          {settings.showFirstFoldLine && (
            <div className="first-fold-line">
              <span>首屏线</span>
            </div>
          )}

          <div className="sticky-buy-bar">
            <span>{listing.price}</span>
            <button type="button">{copy.bottomCta}</button>
          </div>
        </div>
      </div>
    </main>
  );
}
