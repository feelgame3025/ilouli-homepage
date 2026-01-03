import React, { useState } from 'react';
import './AudioAnalysis.css';

const AudioAnalysis = () => {
  const [file, setFile] = useState(null);
  const [provider, setProvider] = useState('whisper');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const ACCEPTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/ogg'];
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (!ACCEPTED_FORMATS.includes(selectedFile.type)) {
      setError('지원하지 않는 파일 형식입니다. mp3, wav, m4a, webm, ogg 파일만 업로드 가능합니다.');
      setFile(null);
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResults(null);
  };

  const handleProviderChange = (e) => {
    setProvider(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('provider', provider);

    try {
      const xhr = new XMLHttpRequest();

      // Upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      // Response handling
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            setResults(response.data);
            setUploadProgress(100);
          } else {
            setError(response.error || '분석 중 오류가 발생했습니다.');
          }
        } else {
          const response = JSON.parse(xhr.responseText);
          setError(response.error || `서버 오류: ${xhr.status}`);
        }
        setIsLoading(false);
      });

      xhr.addEventListener('error', () => {
        setError('네트워크 오류가 발생했습니다.');
        setIsLoading(false);
      });

      xhr.open('POST', 'https://api.ilouli.com/api/audio/analyze');

      // Get auth token if available
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    } catch (err) {
      console.error('Audio analysis error:', err);
      setError('분석 요청 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const formatTimestamp = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="audio-analysis">
      <header className="page-header">
        <h1>음성 파일 분석</h1>
        <p>음성 파일을 업로드하여 텍스트로 변환하고 요약을 생성합니다</p>
      </header>

      <div className="analysis-container">
        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-section">
            <label className="form-label">음성 파일 업로드</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept=".mp3,.wav,.m4a,.webm,.ogg,audio/*"
                onChange={handleFileChange}
                disabled={isLoading}
                className="file-input"
                id="audioFile"
              />
              <label htmlFor="audioFile" className="file-input-label">
                <span className="file-icon">📁</span>
                <span className="file-text">
                  {file ? file.name : '파일 선택 (mp3, wav, m4a, webm, ogg)'}
                </span>
              </label>
            </div>
            {file && (
              <div className="file-info">
                <span className="file-size">{formatFileSize(file.size)}</span>
              </div>
            )}
          </div>

          <div className="form-section">
            <label className="form-label">STT 제공자 선택</label>
            <div className="provider-selection">
              <label className={`provider-option ${provider === 'whisper' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="provider"
                  value="whisper"
                  checked={provider === 'whisper'}
                  onChange={handleProviderChange}
                  disabled={isLoading}
                />
                <div className="provider-info">
                  <span className="provider-name">OpenAI Whisper</span>
                  <span className="provider-desc">고품질 음성 인식, 다국어 지원</span>
                </div>
              </label>

              <label className={`provider-option ${provider === 'clova' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="provider"
                  value="clova"
                  checked={provider === 'clova'}
                  onChange={handleProviderChange}
                  disabled={isLoading}
                />
                <div className="provider-info">
                  <span className="provider-name">Naver Clova</span>
                  <span className="provider-desc">한국어 특화, 화자 분리 지원</span>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {isLoading && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="progress-section">
              <div className="progress-label">업로드 중... {uploadProgress}%</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}

          {isLoading && uploadProgress === 100 && (
            <div className="loading-message">
              <span className="loading-spinner"></span>
              <span>음성 파일 분석 중...</span>
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={!file || isLoading}
          >
            {isLoading ? '분석 중...' : '분석 시작'}
          </button>
        </form>

        {/* Results */}
        {results && (
          <div className="results-container">
            <h2 className="results-title">분석 결과</h2>

            {/* Transcript Section */}
            <section className="result-section">
              <h3 className="section-title">
                <span className="section-icon">💬</span>
                전사 텍스트
              </h3>
              <div className="transcript-content">
                {results.transcript && results.transcript.length > 0 ? (
                  results.transcript.map((item, index) => (
                    <div key={index} className="transcript-item">
                      <div className="transcript-meta">
                        {item.speaker && (
                          <span className="speaker-label">화자 {item.speaker}</span>
                        )}
                        {item.timestamp && (
                          <span className="timestamp-label">
                            {formatTimestamp(item.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className="transcript-text">{item.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="transcript-text">{results.transcript}</p>
                )}
              </div>
            </section>

            {/* Key Points Section */}
            {results.keyPoints && results.keyPoints.length > 0 && (
              <section className="result-section">
                <h3 className="section-title">
                  <span className="section-icon">🎯</span>
                  핵심 포인트
                </h3>
                <ul className="key-points-list">
                  {results.keyPoints.map((point, index) => (
                    <li key={index} className="key-point-item">{point}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Keywords Section */}
            {results.keywords && results.keywords.length > 0 && (
              <section className="result-section">
                <h3 className="section-title">
                  <span className="section-icon">🏷️</span>
                  주요 키워드
                </h3>
                <div className="keywords-list">
                  {results.keywords.map((keyword, index) => (
                    <span key={index} className="keyword-tag">{keyword}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Summary Section */}
            {results.summary && (
              <section className="result-section">
                <h3 className="section-title">
                  <span className="section-icon">📝</span>
                  요약
                </h3>
                <p className="summary-text">{results.summary}</p>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioAnalysis;
