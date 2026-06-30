import type { ListingInfo, PreviewSettings, SiteLocale } from '../types';

export const DEFAULT_LISTING_INFO: ListingInfo = {
  title:
    'VILLAPOOL Coffee Machine Descaler, Powerful Descaling Solution for Fully Automatic Coffee Machines',
  brand: 'VILLAPOOL',
  price: '€16.99',
  originalPrice: '€19.99',
  coupon: 'Save 10% with coupon',
  rating: '4.5',
  reviewCount: '1,284',
  delivery: 'FREE delivery Tomorrow, July 1',
  site: 'DE',
  bullets: [
    'Powerful descaling for coffee machines',
    'Helps remove limescale deposits',
    'Supports smooth water flow',
    'Suitable for regular machine maintenance',
    'Easy to use at home'
  ]
};

export const DEFAULT_SETTINGS: PreviewSettings = {
  showAplusSafeArea: true,
  showFirstFoldLine: true
};

export const SITE_LABELS: Record<
  SiteLocale,
  {
    search: string;
    sponsored: string;
    brand: string;
    ratings: string;
    deal: string;
    addToCart: string;
    buyNow: string;
    bulletsTitle: string;
    aplusTitle: string;
    delivery: string;
    bottomCta: string;
  }
> = {
  US: {
    search: 'Search Amazon',
    sponsored: 'Sponsored',
    brand: 'Visit the brand store',
    ratings: 'ratings',
    deal: 'Limited time deal',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    bulletsTitle: 'About this item',
    aplusTitle: 'From the brand',
    delivery: 'Delivery',
    bottomCta: 'Add to Cart',
  },
  DE: {
    search: 'Amazon.de durchsuchen',
    sponsored: 'Gesponsert',
    brand: 'Besuchen Sie den Markenshop',
    ratings: 'Bewertungen',
    deal: 'Zeitlich begrenztes Angebot',
    addToCart: 'In den Einkaufswagen',
    buyNow: 'Jetzt kaufen',
    bulletsTitle: 'Info zu diesem Artikel',
    aplusTitle: 'Produktinformationen',
    delivery: 'Lieferung',
    bottomCta: 'In den Einkaufswagen',
  },
  JP: {
    search: 'Amazon.co.jp を検索',
    sponsored: 'スポンサー',
    brand: 'ブランドストアを見る',
    ratings: '評価',
    deal: 'タイムセール',
    addToCart: 'カートに入れる',
    buyNow: '今すぐ買う',
    bulletsTitle: 'この商品について',
    aplusTitle: '商品の説明',
    delivery: '配送',
    bottomCta: 'カートに入れる',
  },
  FR: {
    search: 'Rechercher sur Amazon',
    sponsored: 'Sponsorise',
    brand: 'Visiter la boutique',
    ratings: 'evaluations',
    deal: 'Offre limitee',
    addToCart: 'Ajouter au panier',
    buyNow: 'Acheter maintenant',
    bulletsTitle: 'A propos de cet article',
    aplusTitle: 'Informations produit',
    delivery: 'Livraison',
    bottomCta: 'Ajouter au panier',
  },
};
