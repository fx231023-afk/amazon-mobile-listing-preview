const SHARE_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
export const SHARE_TTL_MS = 24 * 60 * 60 * 1000;

export function createShareId(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => SHARE_ID_ALPHABET[byte % SHARE_ID_ALPHABET.length]).join('');
}

export function getShareExpiry(createdAtMs: number): string {
  return new Date(createdAtMs + SHARE_TTL_MS).toISOString();
}

export function isShareExpired(expiresAt: string, nowMs = Date.now()): boolean {
  return new Date(expiresAt).getTime() <= nowMs;
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('图片转换失败'));
    reader.readAsDataURL(blob);
  });
}
