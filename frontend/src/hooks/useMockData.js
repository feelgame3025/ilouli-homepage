import { useState, useCallback } from 'react';
import { USE_MOCK_MODE } from '../config/api';

/**
 * Mock 모드와 실제 API를 전환하는 훅
 * @param {Function} mockFn - Mock 데이터 반환 함수
 * @param {Function} apiFn - 실제 API 호출 함수
 */
export const useMockData = (mockFn, apiFn) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      if (USE_MOCK_MODE) {
        // Mock 모드: 지연 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 500));
        return await mockFn(...args);
      } else {
        // 실제 API 호출
        return await apiFn(...args);
      }
    } catch (err) {
      setError(err.message || '오류 발생');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mockFn, apiFn]);

  return { execute, loading, error, isMockMode: USE_MOCK_MODE };
};

export default useMockData;
