// Video Creator API Service
import api from './api';
import { API_BASE_URL } from '../config/api';
import { downloadFile } from '../utils/file';
import { STORAGE_KEYS } from '../constants/storageKeys';

// 숏폼 생성 요청
export const createShortForm = async (params) => {
  const {
    prompt,
    style = 'educational',
    duration = 10,
    resolution = '1080p',
    referenceImage = null,
    useMock = false  // Mock 모드 (API 비용 절약)
  } = params;

  try {
    // FormData 생성 (레퍼런스 이미지 포함 가능)
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('style', style);
    formData.append('duration', duration.toString());
    formData.append('resolution', resolution);
    formData.append('useMock', useMock.toString());

    if (referenceImage) {
      formData.append('referenceImage', referenceImage);
    }

    const response = await api.post('/api/ai/shortform/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    console.error('createShortForm error:', error);
    throw new Error(error.response?.data?.error || error.message || '영상 생성 요청에 실패했습니다.');
  }
};

// 작업 상태 조회 (폴링용)
export const getJobStatus = async (jobId) => {
  try {
    const response = await api.get(`/api/ai/job/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('getJobStatus error:', error);
    throw new Error(error.response?.data?.error || error.message || '상태 조회에 실패했습니다.');
  }
};

// 작업 상태 폴링 (완료까지 대기)
export const pollJobStatus = async (jobId, {
  onProgress = () => {},
  onComplete = () => {},
  onError = () => {},
  interval = 2000,
  maxAttempts = 120  // 최대 4분 (2초 × 120)
}) => {
  let attempts = 0;

  const poll = async () => {
    try {
      const result = await getJobStatus(jobId);
      const { job } = result;

      // 진행 상태 콜백
      onProgress({
        status: job.status,
        currentStep: job.currentStep || 0,
        jobId: job.jobId
      });

      if (job.status === 'completed') {
        onComplete(job);
        return job;
      }

      if (job.status === 'failed') {
        const error = new Error(job.error || '생성 실패');
        onError(error);
        throw error;
      }

      // 아직 진행 중이면 계속 폴링
      attempts++;
      if (attempts >= maxAttempts) {
        const error = new Error('작업 시간 초과');
        onError(error);
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
      return poll();

    } catch (error) {
      onError(error);
      throw error;
    }
  };

  return poll();
};

// 영상 다운로드
export const downloadShortForm = async (jobId, filename = 'shortform.mp4') => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const response = await fetch(`${API_BASE_URL}/api/ai/shortform/${jobId}/download`, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '다운로드에 실패했습니다.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    downloadFile(url, filename);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(error.message || '다운로드에 실패했습니다.');
  }
};

// 영상 URL 생성
export const getVideoUrl = (jobId) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  return `${API_BASE_URL}/api/ai/shortform/${jobId}/video?token=${token}`;
};

// 생성 히스토리 조회
export const getShortFormHistory = async (limit = 10) => {
  try {
    const response = await api.get(`/api/ai/history?limit=${limit}`);
    // shortform 타입만 필터링
    const shortformJobs = (response.data.jobs || []).filter(job => job.type === 'shortform');
    return shortformJobs;
  } catch (error) {
    // API 실패 시 로컬 스토리지에서 조회
    console.warn('히스토리 API 실패, 로컬 스토리지 사용:', error.message);
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.VIDEO_HISTORY) || '[]');
    return history.slice(0, limit);
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

const videoCreatorService = {
  createShortForm,
  getJobStatus,
  pollJobStatus,
  downloadShortForm,
  getVideoUrl,
  getShortFormHistory,
  addToHistory,
  clearHistory
};

export default videoCreatorService;
