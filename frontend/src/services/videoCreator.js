// Video Creator API Service
import api from './api';
import { API_BASE_URL, USE_MOCK_MODE } from '../config/api';
import { downloadFile } from '../utils/file';
import { STORAGE_KEYS } from '../constants/storageKeys';

// 숏폼 생성 요청
export const createShortForm = async (params) => {
  const {
    topic,
    style = 'educational',
    duration = 30,
    resolution = '1080p',
    language = 'ko'
  } = params;

  if (USE_MOCK_MODE) {
    // Mock 시뮬레이션
    return {
      jobId: `job_${Date.now()}`,
      status: 'processing',
      message: '영상 생성이 시작되었습니다.'
    };
  }

  try {
    const response = await api.post('/api/ai/shortform/create', {
      topic,
      style,
      duration,
      resolution,
      language
    });

    return response.data;
  } catch (error) {
    throw new Error(error.message || '영상 생성 요청에 실패했습니다.');
  }
};

// 생성 진행률 조회
export const getShortFormProgress = async (jobId) => {
  if (USE_MOCK_MODE) {
    // Mock 진행률 시뮬레이션
    const mockSteps = [
      { step: 1, status: 'completed', message: '콘텐츠 생성 완료' },
      { step: 2, status: 'completed', message: '영상 생성 완료' },
      { step: 3, status: 'processing', message: '음성 생성 중...' },
      { step: 4, status: 'pending', message: '대기 중' }
    ];

    return {
      jobId,
      status: 'processing',
      currentStep: 3,
      totalSteps: 4,
      steps: mockSteps,
      progress: 75
    };
  }

  try {
    const response = await api.get(`/api/ai/shortform/progress/${jobId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.message || '진행률 조회에 실패했습니다.');
  }
};

// 생성 결과 조회
export const getShortFormResult = async (jobId) => {
  if (USE_MOCK_MODE) {
    // Mock 결과 반환
    return {
      jobId,
      status: 'completed',
      result: {
        title: 'AI 생성 숏폼 영상',
        description: '자동 생성된 숏폼 영상입니다.',
        videoUrl: null, // 실제 API 연동 후 제공
        thumbnailUrl: null,
        script: {
          english: 'This is an amazing AI-generated short video!',
          korean: '놀라운 AI 생성 숏폼 영상입니다!'
        },
        metadata: {
          duration: 30,
          resolution: '1080p',
          format: 'MP4',
          fileSize: '12.5 MB',
          createdAt: new Date().toISOString()
        }
      }
    };
  }

  try {
    const response = await api.get(`/api/ai/shortform/result/${jobId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.message || '결과 조회에 실패했습니다.');
  }
};

// 영상 다운로드
export const downloadShortForm = async (jobId, filename = 'shortform.mp4') => {
  if (USE_MOCK_MODE) {
    console.log('Mock 모드: 다운로드 시뮬레이션', jobId);
    alert('Mock 모드: 실제 API 연동 후 다운로드가 가능합니다.');
    return;
  }

  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const response = await fetch(`${API_BASE_URL}/api/ai/shortform/download/${jobId}`, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      throw new Error('다운로드에 실패했습니다.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    downloadFile(url, filename);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(error.message || '다운로드에 실패했습니다.');
  }
};

// 생성 히스토리 조회
export const getShortFormHistory = async (limit = 10) => {
  if (USE_MOCK_MODE) {
    // 로컬 스토리지에서 히스토리 조회
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.VIDEO_HISTORY) || '[]');
    return history.slice(0, limit);
  }

  try {
    const response = await api.get(`/api/ai/shortform/history?limit=${limit}`);
    return response.data.history;
  } catch (error) {
    throw new Error(error.message || '히스토리 조회에 실패했습니다.');
  }
};

// 히스토리에 항목 추가 (로컬)
export const addToHistory = (item) => {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.VIDEO_HISTORY) || '[]');
  const newHistory = [item, ...history].slice(0, 20); // 최대 20개 유지
  localStorage.setItem(STORAGE_KEYS.VIDEO_HISTORY, JSON.stringify(newHistory));
};

// 히스토리 초기화
export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEYS.VIDEO_HISTORY);
};

export default {
  createShortForm,
  getShortFormProgress,
  getShortFormResult,
  downloadShortForm,
  getShortFormHistory,
  addToHistory,
  clearHistory
};
