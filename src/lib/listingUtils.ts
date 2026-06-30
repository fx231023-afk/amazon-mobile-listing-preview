import type { UploadedImage } from '../types';

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const targetIndex = index + direction;
  if (index < 0 || index >= items.length || targetIndex < 0 || targetIndex >= items.length) {
    return [...items];
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(index, 1);
  nextItems.splice(targetIndex, 0, item);
  return nextItems;
}

export function getCharacterCount(value: string): number {
  return value.trim().length;
}

export function normalizeRating(value: string): number {
  const numeric = Number.parseFloat(value);
  if (Number.isNaN(numeric)) {
    return 0;
  }
  return Math.min(5, Math.max(0, Math.round(numeric * 10) / 10));
}

export function calculateScaledAplusSize(
  sourceWidth: number,
  sourceHeight: number,
  displayWidth: number
): { width: number; height: number } {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { width: displayWidth, height: 0 };
  }

  return {
    width: displayWidth,
    height: Math.round((sourceHeight / sourceWidth) * displayWidth)
  };
}

export function getAplusRiskMessage(
  sourceWidth: number,
  sourceHeight: number,
  displayWidth: number
): string | null {
  const scaled = calculateScaledAplusSize(sourceWidth, sourceHeight, displayWidth);
  const isStandardWideModule = Math.abs(sourceWidth - 1464) <= 8 && Math.abs(sourceHeight - 600) <= 8;
  const isCompressedOnMobile = scaled.width <= 420 && sourceWidth >= 1200;

  if (isStandardWideModule && isCompressedOnMobile) {
    return '请检查图中文字是否过小';
  }
  return null;
}

export function getImageMetaLabel(image: UploadedImage): string {
  const kb = Math.max(1, Math.round(image.size / 1024));
  return `${image.width}x${image.height}px / ${kb}KB`;
}

export function createImageId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function clampActiveIndex(index: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(Math.max(index, 0), total - 1);
}
