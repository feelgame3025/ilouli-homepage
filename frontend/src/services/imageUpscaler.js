/**
 * Image Upscaler Service
 * Mock implementation for image upscaling functionality
 */

/**
 * Simulates image upload and validation
 * @param {File} file - Image file to upload
 * @returns {Promise<Object>} Upload result with image data
 */
export const uploadImage = async (file) => {
  return new Promise((resolve, reject) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      reject(new Error('지원하지 않는 파일 형식입니다. JPG, PNG, WebP 파일만 가능합니다.'));
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      reject(new Error('파일 크기는 10MB 이하여야 합니다.'));
      return;
    }

    // Create FileReader to get image data
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Simulate network delay
        setTimeout(() => {
          resolve({
            id: `img_${Date.now()}`,
            name: file.name,
            size: file.size,
            type: file.type,
            width: img.width,
            height: img.height,
            dataUrl: e.target.result,
            uploadedAt: new Date().toISOString(),
          });
        }, 500);
      };
      img.onerror = () => {
        reject(new Error('이미지를 읽을 수 없습니다.'));
      };
      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Simulates image upscaling process
 * @param {Object} options - Upscaling options
 * @param {string} options.imageId - Image ID
 * @param {number} options.scale - Scale factor (2 or 4)
 * @param {string} options.format - Output format (png, jpg, webp)
 * @param {string} options.quality - Quality mode (fast or high)
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Object>} Upscaled image data
 */
export const upscaleImage = async ({ imageId, scale, format, quality, onProgress }) => {
  return new Promise((resolve, reject) => {
    // Simulate processing time based on scale and quality
    const baseTime = quality === 'high' ? 3000 : 1500;
    const scaleFactor = scale === 4 ? 1.5 : 1;
    const totalTime = baseTime * scaleFactor;
    const steps = 10;
    const stepTime = totalTime / steps;

    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      const progress = (currentStep / steps) * 100;

      if (onProgress) {
        onProgress({
          progress: Math.min(progress, 99),
          step: currentStep,
          total: steps,
        });
      }

      if (currentStep >= steps) {
        clearInterval(progressInterval);

        // Simulate successful upscaling
        setTimeout(() => {
          resolve({
            id: `upscaled_${imageId}_${Date.now()}`,
            originalImageId: imageId,
            scale,
            format,
            quality,
            processedAt: new Date().toISOString(),
            // Mock data - in real implementation, this would be the actual upscaled image
            dataUrl: null, // Will use canvas to simulate upscaling in component
            message: 'Mock 모드: 실제 API 연동 시 업스케일된 이미지가 표시됩니다.',
          });
        }, stepTime);
      }
    }, stepTime);

    // Simulate potential errors
    const errorRate = 0; // 0% error rate for demo
    if (Math.random() < errorRate) {
      clearInterval(progressInterval);
      reject(new Error('업스케일링 처리 중 오류가 발생했습니다.'));
    }
  });
};

/**
 * Downloads the upscaled image
 * @param {string} dataUrl - Image data URL
 * @param {string} filename - Download filename
 */
export const downloadImage = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Creates a canvas-based upscaled version of an image (for demo purposes)
 * @param {string} originalDataUrl - Original image data URL
 * @param {number} scale - Scale factor
 * @param {string} format - Output format
 * @returns {Promise<string>} Upscaled image data URL
 */
export const createMockUpscaledImage = (originalDataUrl, scale, format) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set new dimensions
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Use high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw upscaled image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to desired format
      const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
      const quality = format === 'jpg' ? 0.95 : 1;

      const upscaledDataUrl = canvas.toDataURL(mimeType, quality);
      resolve(upscaledDataUrl);
    };

    img.onerror = () => {
      reject(new Error('이미지 처리 중 오류가 발생했습니다.'));
    };

    img.src = originalDataUrl;
  });
};

/**
 * Formats file size to human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Calculates estimated upscaled file size
 * @param {number} originalSize - Original file size in bytes
 * @param {number} scale - Scale factor
 * @returns {number} Estimated new size in bytes
 */
export const estimateUpscaledSize = (originalSize, scale) => {
  // Rough estimation: size increases proportionally to pixel count
  return originalSize * (scale * scale);
};
