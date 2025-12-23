/**
 * Image to Video Service
 * 이미지를 영상으로 변환하는 API 서비스
 */

// API 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.ilouli.com';

// Mock 모드 설정 (false = 실제 API 사용)
const MOCK_MODE = false;
const MOCK_PROCESSING_TIME = 3000; // 3초

/**
 * 모션 스타일 옵션
 */
export const MOTION_STYLES = {
  ZOOM_IN: { id: 'zoom_in', name: '줌인 (Zoom In)', description: '중심으로 확대' },
  ZOOM_OUT: { id: 'zoom_out', name: '줌아웃 (Zoom Out)', description: '중심에서 축소' },
  PAN_LEFT_TO_RIGHT: { id: 'pan_lr', name: '패닝 (좌→우)', description: '왼쪽에서 오른쪽으로' },
  PAN_RIGHT_TO_LEFT: { id: 'pan_rl', name: '패닝 (우→좌)', description: '오른쪽에서 왼쪽으로' },
  TILT_UP: { id: 'tilt_up', name: '틸팅 (하→상)', description: '아래에서 위로' },
  TILT_DOWN: { id: 'tilt_down', name: '틸팅 (상→하)', description: '위에서 아래로' },
  SMOOTH_AUTO: { id: 'smooth_auto', name: '자연스러운 움직임', description: 'AI가 최적의 움직임 선택' },
};

/**
 * 영상 길이 옵션 (초)
 */
export const DURATION_OPTIONS = [3, 5, 10];

/**
 * 해상도 옵션
 */
export const RESOLUTION_OPTIONS = {
  HD: { id: '720p', name: '720p HD', width: 1280, height: 720 },
  FHD: { id: '1080p', name: '1080p Full HD', width: 1920, height: 1080 },
};

/**
 * 이미지 파일 유효성 검증
 */
export const validateImageFile = (file) => {
  const errors = [];

  // 파일 타입 검증
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    errors.push('지원되는 이미지 형식: JPG, PNG, WEBP');
  }

  // 파일 크기 검증 (최대 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push('이미지 크기는 최대 10MB까지 지원됩니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 이미지를 영상으로 변환
 */
export const convertImageToVideo = async (options) => {
  const {
    imageFile,
    motionStyle,
    duration,
    resolution,
    onProgress,
  } = options;

  // 파일 유효성 검증
  const validation = validateImageFile(imageFile);
  if (!validation.isValid) {
    throw new Error(validation.errors.join('\n'));
  }

  if (MOCK_MODE) {
    // Mock 처리
    return await mockConvertImageToVideo(options);
  }

  // 실제 API 호출
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('motionStyle', motionStyle);
  formData.append('duration', duration);
  formData.append('resolution', resolution);

  try {
    // 진행 상태 업데이트
    if (onProgress) onProgress(10, '서버에 업로드 중...');

    const response = await fetch(`${API_BASE_URL}/api/ai/image-to-video`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '영상 변환에 실패했습니다.');
    }

    const data = await response.json();

    if (onProgress) onProgress(30, '작업이 시작되었습니다...');

    // 작업 상태 폴링 (완료될 때까지)
    const result = await pollJobStatus(data.jobId, onProgress);
    return result;

  } catch (error) {
    console.error('Image to video conversion error:', error);
    throw error;
  }
};

/**
 * 작업 상태 폴링
 */
const pollJobStatus = async (jobId, onProgress, maxAttempts = 60) => {
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
        if (onProgress) onProgress(100, '완료!');
        return {
          success: true,
          videoId: jobId,
          videoUrl: job.outputFile ? `${API_BASE_URL}/api/ai/job/${jobId}/download` : null,
          thumbnailUrl: null,
          metadata: {
            originalImage: job.inputFile,
            motionStyle: job.parameters?.motionStyle,
            duration: `${job.parameters?.duration}초`,
            resolution: job.parameters?.resolution,
            createdAt: job.completedAt,
          },
        };
      }

      if (job.status === 'failed') {
        throw new Error(job.error || '영상 변환에 실패했습니다.');
      }

      // 진행 중
      const progress = Math.min(30 + (attempts * 2), 90);
      if (onProgress) onProgress(progress, '처리 중...');

      // 2초 대기 후 재시도
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;

    } catch (error) {
      console.error('Poll error:', error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('작업 시간이 초과되었습니다.');
}

/**
 * Mock 영상 변환 (개발/테스트용)
 */
const mockConvertImageToVideo = async (options) => {
  const { imageFile, motionStyle, duration, resolution, onProgress } = options;

  // 진행률 시뮬레이션
  const steps = [
    { progress: 10, message: '이미지 분석 중...' },
    { progress: 30, message: '모션 경로 계산 중...' },
    { progress: 50, message: '키프레임 생성 중...' },
    { progress: 70, message: '영상 렌더링 중...' },
    { progress: 90, message: '인코딩 중...' },
    { progress: 100, message: '완료!' },
  ];

  for (const step of steps) {
    if (onProgress) {
      onProgress(step.progress, step.message);
    }
    await new Promise(resolve => setTimeout(resolve, MOCK_PROCESSING_TIME / steps.length));
  }

  // 업로드된 이미지를 Data URL로 변환
  const imageDataUrl = await readFileAsDataURL(imageFile);

  // Mock 결과 반환
  return {
    success: true,
    videoId: `vid_${Date.now()}`,
    videoUrl: null, // 실제 API에서는 영상 URL 반환
    thumbnailUrl: imageDataUrl,
    metadata: {
      originalImage: imageFile.name,
      motionStyle: MOTION_STYLES[Object.keys(MOTION_STYLES).find(k => MOTION_STYLES[k].id === motionStyle)]?.name,
      duration: `${duration}초`,
      resolution: RESOLUTION_OPTIONS[Object.keys(RESOLUTION_OPTIONS).find(k => RESOLUTION_OPTIONS[k].id === resolution)]?.name,
      fileSize: `${(imageFile.size / 1024 / 1024).toFixed(2)}MB`,
      createdAt: new Date().toISOString(),
    },
  };
};

/**
 * 파일을 Data URL로 읽기
 */
const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

/**
 * 영상 다운로드
 */
export const downloadVideo = async (videoUrl, filename = 'video.mp4') => {
  if (MOCK_MODE) {
    // Mock 모드에서는 다운로드 알림만 표시
    alert('실제 API 연동 후 영상을 다운로드할 수 있습니다.');
    return;
  }

  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Video download error:', error);
    throw new Error('영상 다운로드에 실패했습니다.');
  }
};
