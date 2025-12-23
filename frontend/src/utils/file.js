/**
 * 파일 처리 유틸리티
 */

/**
 * 바이트를 읽기 쉬운 형식으로 변환
 * @param {number} bytes - 바이트 수
 * @returns {string} 포맷된 문자열 (예: "1.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * 파일을 Data URL로 읽기
 * @param {File} file - 파일 객체
 * @returns {Promise<string>} Data URL
 */
export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

/**
 * 이미지 파일 검증
 * @param {File} file - 파일 객체
 * @param {Object} options - 옵션
 * @param {number} options.maxSize - 최대 크기 (bytes)
 * @param {string[]} options.allowedTypes - 허용 MIME 타입
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
  } = options;

  const errors = [];

  if (!file) {
    errors.push('파일이 선택되지 않았습니다.');
    return { isValid: false, errors };
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`지원하지 않는 형식입니다. (${allowedTypes.join(', ')})`);
  }

  if (file.size > maxSize) {
    errors.push(`파일 크기가 너무 큽니다. (최대 ${formatFileSize(maxSize)})`);
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * 비디오 파일 검증
 * @param {File} file - 파일 객체
 * @param {Object} options - 옵션
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export const validateVideoFile = (file, options = {}) => {
  const {
    maxSize = 100 * 1024 * 1024, // 100MB
    allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime']
  } = options;

  const errors = [];

  if (!file) {
    errors.push('파일이 선택되지 않았습니다.');
    return { isValid: false, errors };
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`지원하지 않는 형식입니다. (${allowedTypes.join(', ')})`);
  }

  if (file.size > maxSize) {
    errors.push(`파일 크기가 너무 큽니다. (최대 ${formatFileSize(maxSize)})`);
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * 파일 크기 추정 (업스케일링)
 * @param {number} originalSize - 원본 파일 크기 (bytes)
 * @param {number} scale - 스케일 팩터
 * @returns {number} 추정 크기 (bytes)
 */
export const estimateUpscaledSize = (originalSize, scale) => {
  // 픽셀 수에 비례하여 크기 증가
  return originalSize * (scale * scale);
};

/**
 * 파일 다운로드
 * @param {string} dataUrl - Data URL 또는 Blob URL
 * @param {string} filename - 다운로드 파일명
 */
export const downloadFile = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
