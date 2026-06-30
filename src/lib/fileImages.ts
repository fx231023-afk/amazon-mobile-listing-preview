import type { UploadedImage } from '../types';
import { createImageId } from './listingUtils';

export async function fileToUploadedImage(file: File): Promise<UploadedImage> {
  const url = URL.createObjectURL(file);

  try {
    const dimensions = await readImageDimensions(url);
    return {
      id: createImageId(),
      name: file.name,
      url,
      width: dimensions.width,
      height: dimensions.height,
      size: file.size
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function readImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    };
    image.onerror = () => reject(new Error('图片读取失败'));
    image.src = url;
  });
}
