/**
 * Image Upscaler Service
 * 이미지 업스케일링 API 서비스
 */

import { API_BASE_URL, USE_MOCK_MODE as MOCK_MODE } from '../config/api';
import { formatFileSize, validateImageFile, estimateUpscaledSize, downloadFile } from '../utils/file';

/**
 * Simulates image upload and validation
 * @param {File} file - Image file to upload
 * @returns {Promise<Object>} Upload result with image data
 */
export const uploadImage = async (file) => {
  return new Promise((resolve, reject) => {
    // Validate file using utility
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      reject(new Error(validation.errors.join('\n')));
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
 * 이미지 업스케일링 처리
 * @param {Object} options - Upscaling options
 * @param {File} options.file - 원본 이미지 파일
 * @param {string} options.imageId - Image ID (Mock용)
 * @param {number} options.scale - Scale factor (2 or 4)
 * @param {string} options.format - Output format (png, jpg, webp)
 * @param {string} options.quality - Quality mode (fast or high)
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Object>} Upscaled image data
 */
export const upscaleImage = async ({ file, imageId, scale, format, quality, onProgress }) => {
  if (MOCK_MODE) {
    return mockUpscaleImage({ imageId, scale, format, quality, onProgress });
  }

  // 실제 API 호출
  try {
    if (onProgress) onProgress({ progress: 10, step: 1, total: 10 });

    const formData = new FormData();
    formData.append('image', file);
    formData.append('scale', scale);
    formData.append('enhanceDetails', quality === 'high');

    const response = await fetch(`${API_BASE_URL}/api/ai/upscale`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '업스케일링 요청에 실패했습니다.');
    }

    const data = await response.json();

    if (onProgress) onProgress({ progress: 30, step: 3, total: 10 });

    // 작업 상태 폴링
    const result = await pollUpscaleStatus(data.jobId, onProgress);
    return result;

  } catch (error) {
    console.error('Upscale error:', error);
    throw error;
  }
};

/**
 * 업스케일링 작업 상태 폴링
 */
const pollUpscaleStatus = async (jobId, onProgress, maxAttempts = 30) => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/job/${jobId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('작업 상태 조회 실패');
      }

      const { job } = await response.json();

      if (job.status === 'completed') {
        if (onProgress) onProgress({ progress: 100, step: 10, total: 10 });
        return {
          id: jobId,
          originalImageId: job.inputFile,
          scale: job.parameters?.scale,
          format: 'png',
          quality: job.parameters?.enhanceDetails ? 'high' : 'fast',
          processedAt: job.completedAt,
          downloadUrl: job.outputFile ? `${API_BASE_URL}/api/ai/job/${jobId}/download` : null,
          dataUrl: null,
          message: job.outputFile ? '업스케일링이 완료되었습니다.' : 'AI 모델 연동 대기 중입니다.',
        };
      }

      if (job.status === 'failed') {
        throw new Error(job.error || '업스케일링에 실패했습니다.');
      }

      // 진행 중
      const progress = Math.min(30 + (attempts * 3), 90);
      if (onProgress) onProgress({ progress, step: Math.floor(progress / 10), total: 10 });

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;

    } catch (error) {
      console.error('Poll error:', error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('작업 시간이 초과되었습니다.');
};

/**
 * Mock 업스케일링 (개발/테스트용)
 */
const mockUpscaleImage = ({ imageId, scale, format, quality, onProgress }) => {
  return new Promise((resolve, reject) => {
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

        setTimeout(() => {
          resolve({
            id: `upscaled_${imageId}_${Date.now()}`,
            originalImageId: imageId,
            scale,
            format,
            quality,
            processedAt: new Date().toISOString(),
            dataUrl: null,
            message: 'Mock 모드: 실제 API 연동 시 업스케일된 이미지가 표시됩니다.',
          });
        }, stepTime);
      }
    }, stepTime);
  });
};

/**
 * Downloads the upscaled image
 * @param {string} dataUrl - Image data URL
 * @param {string} filename - Download filename
 */
export const downloadImage = (dataUrl, filename) => {
  downloadFile(dataUrl, filename);
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

// formatFileSize and estimateUpscaledSize are now imported from utils/file.js
// Re-export for backward compatibility
export { formatFileSize, estimateUpscaledSize };
