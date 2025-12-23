/**
 * Image to Video Service
 * 이미지를 영상으로 변환하는 API 서비스
 */

// Mock 모드 설정 (실제 API 연동 전까지 사용)
const MOCK_MODE = true;
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

  // 실제 API 호출 (향후 구현)
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('motion_style', motionStyle);
  formData.append('duration', duration);
  formData.append('resolution', resolution);

  try {
    const response = await fetch('/api/ai/image-to-video', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('영상 변환에 실패했습니다.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Image to video conversion error:', error);
    throw error;
  }
};

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
