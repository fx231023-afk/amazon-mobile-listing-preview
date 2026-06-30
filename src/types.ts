export type SiteLocale = 'US' | 'DE' | 'JP' | 'FR';

export type ImageRole = 'gallery' | 'aplus';

export interface UploadedImage {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface ListingInfo {
  title: string;
  brand: string;
  price: string;
  originalPrice: string;
  coupon: string;
  rating: string;
  reviewCount: string;
  delivery: string;
  bullets: string[];
  site: SiteLocale;
}

export interface PreviewSettings {
  showAplusSafeArea: boolean;
  showFirstFoldLine: boolean;
}

export interface SharedImage extends UploadedImage {
  dataUrl?: string;
}

export interface SharePayload {
  listing: ListingInfo;
  settings: PreviewSettings;
  galleryImages: SharedImage[];
  aplusImages: SharedImage[];
}

export interface ShareRecord extends SharePayload {
  id: string;
  createdAt: string;
  expiresAt: string;
}
