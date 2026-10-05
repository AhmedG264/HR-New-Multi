/**
 * Utility functions for client-side file compression and validation
 * to prevent Firestore 1MB document size limit errors.
 */

const MAX_FILE_SIZE = 700 * 1024; // 700 KB

/**
 * Validates file size and handles compression if it's an image.
 */
export function processAttachedFile(
  file: File,
  onSuccess: (base64: string) => void,
  onError: (errorMessage: string) => void
) {
  // If the file is an image, try to compress it first
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onerror = () => {
      onError('حدث خطأ أثناء قراءة ملف الصورة.');
    };
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        // If image loading fails, check if original file size is fine
        if (file.size > MAX_FILE_SIZE) {
          onError(`حجم الصورة (${(file.size / 1024).toFixed(0)} كيلوبايت) يتجاوز الحد المسموح به (700 كيلوبايت). يرجى تقليل الدقة أو اختيار صورة أصغر.`);
        } else {
          onSuccess(e.target?.result as string);
        }
      };
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Target max width/height for HR system documents
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress with JPEG 0.65 quality (extremely small fingerprint, e.g. 50-90 KB)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
            onSuccess(compressedBase64);
          } else {
            if (file.size > MAX_FILE_SIZE) {
              onError(`حجم الصورة (${(file.size / 1024).toFixed(0)} كيلوبايت) يتجاوز الحد المسموح به (700 كيلوبايت).`);
            } else {
              onSuccess(e.target?.result as string);
            }
          }
        } catch (err) {
          if (file.size > MAX_FILE_SIZE) {
            onError(`حجم الصورة (${(file.size / 1024).toFixed(0)} كيلوبايت) يتجاوز الحد المسموح به (700 كيلوبايت).`);
          } else {
            onSuccess(e.target?.result as string);
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  } else {
    // Non-image files (e.g. PDF, Word Document)
    if (file.size > MAX_FILE_SIZE) {
      onError(`حجم الملف المرفق (${(file.size / 1024).toFixed(0)} كيلوبايت) يتجاوز الحد المسموح به (700 كيلوبايت). يرجى تقليل حجم الملف أو اختيار ملف مضغوط.`);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      onError('حدث خطأ أثناء قراءة الملف المرفق.');
    };
    reader.onload = (e) => {
      if (e.target?.result) {
        onSuccess(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }
}
