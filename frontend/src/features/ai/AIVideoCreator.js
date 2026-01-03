import React, { useState, useRef } from 'react';
import './AIVideoCreator.css';
import {
  convertImageToVideo,
  downloadVideo,
  validateImageFile,
  MOTION_STYLES,
  DURATION_OPTIONS,
  RESOLUTION_OPTIONS,
} from '../../services/imageToVideo';
import ImageUpscaler from './ImageUpscaler';

const AIVideoCreator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Image to Video 상태
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [motionStyle, setMotionStyle] = useState('zoom_in');
  const [img2videoDuration, setImg2videoDuration] = useState(5);
  const [img2videoResolution, setImg2videoResolution] = useState('1080p');
  const [convertProgress, setConvertProgress] = useState(0);
  const [convertMessage, setConvertMessage] = useState('');
  const [videoResult, setVideoResult] = useState(null);
  const fileInputRef = useRef(null);

  // Image to Video 핸들러
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }

    setImageFile(file);
    setError(null);
    setVideoResult(null);

    // 이미지 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const fakeEvent = { target: { files: [file] } };
      handleImageUpload(fakeEvent);
    }
  };

  const handleConvertToVideo = async () => {
    if (!imageFile) {
      setError('이미지를 업로드해주세요.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setConvertProgress(0);
    setConvertMessage('');

    try {
      const result = await convertImageToVideo({
        imageFile,
        motionStyle,
        duration: img2videoDuration,
        resolution: img2videoResolution,
        onProgress: (progress, message) => {
          setConvertProgress(progress);
          setConvertMessage(message);
        },
      });

      setVideoResult(result);
    } catch (err) {
      setError(err.message || '영상 변환 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
      setConvertProgress(0);
      setConvertMessage('');
    }
  };

  const handleDownloadVideo = () => {
    if (videoResult?.videoUrl) {
      downloadVideo(videoResult.videoUrl, `${imageFile?.name.replace(/\.[^/.]+$/, '')}_video.mp4`);
    } else {
      downloadVideo(null);
    }
  };

  const handleResetImg2Video = () => {
    setImageFile(null);
    setImagePreview(null);
    setVideoResult(null);
    setError(null);
    setConvertProgress(0);
    setConvertMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="ai-video-creator">
      {/* 이미지 업스케일링 */}
      <div className="tool-section">
        <ImageUpscaler />
      </div>

      {/* 이미지 영상 변환 */}
      <div className="tool-section img2video-section">
        <header className="section-header">
          <h2>🎞️ 이미지 영상 변환</h2>
          <p>정적인 이미지를 자연스러운 영상으로 변환합니다.</p>
        </header>
        <div className="img2video-content">
          {/* 이미지 업로드 섹션 */}
          {!videoResult && (
            <section className="input-section">
              <div className="section-header">
                <h2>이미지 업로드</h2>
                <p>정적 이미지를 영상으로 변환합니다. (JPG, PNG, WEBP / 최대 10MB)</p>
              </div>

              <div
                className="image-upload-area"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="image-preview">
                    <img src={imagePreview} alt="업로드된 이미지" />
                    <div className="image-overlay">
                      <button
                        className="change-image-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetImg2Video();
                        }}
                      >
                        다른 이미지 선택
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">📷</span>
                    <p className="upload-text">이미지를 드래그하거나 클릭하여 업로드</p>
                    <p className="upload-hint">JPG, PNG, WEBP 지원 (최대 10MB)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </section>
          )}

          {/* 설정 섹션 */}
          {imageFile && !videoResult && (
            <section className="settings-section">
              {/* 모션 스타일 선택 */}
              <div className="setting-group">
                <h3>모션 스타일</h3>
                <div className="motion-styles-grid">
                  {Object.values(MOTION_STYLES).map((style) => (
                    <button
                      key={style.id}
                      className={`motion-style-btn ${motionStyle === style.id ? 'active' : ''}`}
                      onClick={() => setMotionStyle(style.id)}
                      disabled={isGenerating}
                    >
                      <span className="motion-name">{style.name}</span>
                      <span className="motion-desc">{style.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 영상 길이 선택 */}
              <div className="setting-group">
                <h3>영상 길이</h3>
                <div className="duration-options">
                  {DURATION_OPTIONS.map((duration) => (
                    <button
                      key={duration}
                      className={`duration-btn ${img2videoDuration === duration ? 'active' : ''}`}
                      onClick={() => setImg2videoDuration(duration)}
                      disabled={isGenerating}
                    >
                      {duration}초
                    </button>
                  ))}
                </div>
              </div>

              {/* 해상도 선택 */}
              <div className="setting-group">
                <h3>출력 해상도</h3>
                <div className="resolution-options">
                  {Object.values(RESOLUTION_OPTIONS).map((res) => (
                    <button
                      key={res.id}
                      className={`resolution-btn ${img2videoResolution === res.id ? 'active' : ''}`}
                      onClick={() => setImg2videoResolution(res.id)}
                      disabled={isGenerating}
                    >
                      <span className="res-name">{res.name}</span>
                      <span className="res-size">{res.width} x {res.height}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 변환 버튼 */}
              <button
                className="generate-btn convert-btn"
                onClick={handleConvertToVideo}
                disabled={isGenerating}
              >
                {isGenerating ? '변환 중...' : '영상 변환 시작'}
              </button>
            </section>
          )}

          {/* 변환 진행 상태 */}
          {isGenerating && (
            <section className="progress-section convert-progress">
              <h2>영상 변환 중...</h2>
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${convertProgress}%` }}
                  ></div>
                </div>
                <div className="progress-info">
                  <span className="progress-percent">{convertProgress}%</span>
                  <span className="progress-message">{convertMessage}</span>
                </div>
              </div>
            </section>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* 결과 섹션 */}
          {videoResult && (
            <section className="result-section">
              <h2>영상 변환 완료!</h2>
              <div className="result-card img2video-result">
                <div className="result-preview">
                  {videoResult.videoUrl ? (
                    <video
                      src={videoResult.videoUrl}
                      controls
                      className="result-video"
                      poster={videoResult.thumbnailUrl}
                    />
                  ) : (
                    <div className="preview-placeholder">
                      <img
                        src={videoResult.thumbnailUrl}
                        alt="영상 썸네일"
                        className="thumbnail-image"
                      />
                      <div className="video-placeholder-overlay">
                        <span className="placeholder-icon">🎬</span>
                        <p>미리보기</p>
                        <p className="placeholder-note">
                          (API 연동 후 실제 영상이 재생됩니다)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="result-info">
                  <div className="result-content">
                    <h3>변환 완료</h3>
                    <p className="result-description">
                      {videoResult.metadata.originalImage}을(를) 영상으로 변환했습니다.
                    </p>
                  </div>

                  <div className="result-meta">
                    <div className="meta-item">
                      <span className="meta-label">모션</span>
                      <span className="meta-value">{videoResult.metadata.motionStyle}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">길이</span>
                      <span className="meta-value">{videoResult.metadata.duration}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">해상도</span>
                      <span className="meta-value">{videoResult.metadata.resolution}</span>
                    </div>
                  </div>

                  <div className="result-actions">
                    <button
                      className="action-btn primary"
                      onClick={handleDownloadVideo}
                    >
                      다운로드
                    </button>
                    <button
                      className="action-btn secondary"
                      onClick={handleResetImg2Video}
                    >
                      새 영상 만들기
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 기능 안내 */}
          {!imageFile && !videoResult && (
            <section className="feature-info">
              <h3>이미지 영상 변환 과정</h3>
              <div className="feature-steps">
                <div className="feature-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h4>이미지 업로드</h4>
                    <p>정적인 이미지를 업로드합니다.</p>
                  </div>
                </div>
                <div className="feature-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h4>모션 설정</h4>
                    <p>원하는 카메라 움직임과 영상 설정을 선택합니다.</p>
                  </div>
                </div>
                <div className="feature-step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h4>영상 생성</h4>
                    <p>AI가 자연스러운 움직임의 영상을 생성합니다.</p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIVideoCreator;
