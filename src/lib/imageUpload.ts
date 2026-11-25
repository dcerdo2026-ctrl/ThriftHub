import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase';
import { LIMITS } from '../types';

async function compressImageToBlob(
  file: File,
  maxWidth = 1000,
  quality = 0.82
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Unsupported or corrupted image file.'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetWidth = Math.round(img.width * scale);
        const targetHeight = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image compression failed.'));
              return;
            }
            resolve({ blob, dataUrl });
          },
          'image/jpeg',
          quality
        );
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

async function compressToSafeDataUrl(file: File): Promise<string> {
  let quality = 0.78;
  let width = 880;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { dataUrl } = await compressImageToBlob(file, width, quality);
    if (dataUrl.length <= LIMITS.MAX_IMAGE_URL - 10000) {
      return dataUrl;
    }
    quality -= 0.14;
    width = Math.round(width * 0.78);
  }
  throw new Error('Image is too large even after compression. Please choose a smaller photo.');
}

export async function uploadProductImage(
  file: File,
  userId: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; source: 'storage' | 'embedded' }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload a valid image file (JPG, PNG, or WebP).');
  }

  const { blob } = await compressImageToBlob(file, 1080, 0.84);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
  const storageRef = ref(storage, `products/${userId}/${Date.now()}_${safeName}.jpg`);

  try {
    const downloadUrl = await new Promise<string>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: 'image/jpeg',
      });

      const timeout = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error('Firebase Storage upload timed out.'));
      }, 15000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.(pct);
        },
        (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        async () => {
          clearTimeout(timeout);
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        }
      );
    });

    return { url: downloadUrl, source: 'storage' };
  } catch (storageError) {
    console.warn('Firebase Storage unavailable or blocked; falling back to compressed image encoding:', storageError);
    onProgress?.(100);
    const fallbackUrl = await compressToSafeDataUrl(file);
    return { url: fallbackUrl, source: 'embedded' };
  }
}
