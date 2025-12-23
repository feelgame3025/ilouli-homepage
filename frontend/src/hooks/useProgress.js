import { useState, useCallback } from 'react';

/**
 * 진행률 상태를 관리하는 훅
 * @param {number} initialProgress - 초기 진행률 (0-100)
 */
export const useProgress = (initialProgress = 0) => {
  const [progress, setProgress] = useState(initialProgress);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const start = useCallback(() => {
    setProgress(0);
    setStatus('loading');
  }, []);

  const update = useCallback((value) => {
    setProgress(Math.min(100, Math.max(0, value)));
  }, []);

  const increment = useCallback((amount = 10) => {
    setProgress(prev => Math.min(100, prev + amount));
  }, []);

  const complete = useCallback(() => {
    setProgress(100);
    setStatus('success');
  }, []);

  const fail = useCallback((errorMessage) => {
    setStatus('error');
    return errorMessage;
  }, []);

  const reset = useCallback(() => {
    setProgress(initialProgress);
    setStatus('idle');
  }, [initialProgress]);

  return {
    progress,
    status,
    isLoading: status === 'loading',
    isComplete: status === 'success',
    isError: status === 'error',
    start,
    update,
    increment,
    complete,
    fail,
    reset
  };
};

export default useProgress;
