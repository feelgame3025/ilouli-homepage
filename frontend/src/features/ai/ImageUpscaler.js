import React, { useState, useRef } from 'react';
import {
  uploadImage,
  upscaleImage,
  downloadImage,
  createMockUpscaledImage,
  formatFileSize,
  estimateUpscaledSize,
} from '../../services/imageUpscaler';
import './ImageUpscaler.css';

const ImageUpscaler = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [upscaleOptions, setUpscaleOptions] = useState({
    scale: 2,
    format: 'png',
    quality: 'high',
  });
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaleProgress, setUpscaleProgress] = useState(0);
  const [upscaledResult, setUpscaledResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [compareSliderPosition, setCompareSliderPosition] = useState(50);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const compareContainerRef = useRef(null);

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleImageUpload(files[0]);
    }
  };

  const handleFileInputChange = async (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      await handleImageUpload(files[0]);
    }
  };

  const handleImageUpload = async (file) => {
    setError(null);
    try {
      const imageData = await uploadImage(file);
      setUploadedImage(imageData);
      setUpscaledResult(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpscaleClick = async () => {
    if (!uploadedImage) return;

    setIsUpscaling(true);
    setError(null);
    setUpscaleProgress(0);

    try {
      const result = await upscaleImage({
        imageId: uploadedImage.id,
        scale: upscaleOptions.scale,
        format: upscaleOptions.format,
        quality: upscaleOptions.quality,
        onProgress: (progress) => {
          setUpscaleProgress(progress.progress);
        },
      });

      // Create mock upscaled image using canvas
      const upscaledDataUrl = await createMockUpscaledImage(
        uploadedImage.dataUrl,
        upscaleOptions.scale,
        upscaleOptions.format
      );

      setUpscaledResult({
        ...result,
        dataUrl: upscaledDataUrl,
        width: uploadedImage.width * upscaleOptions.scale,
        height: uploadedImage.height * upscaleOptions.scale,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpscaling(false);
      setUpscaleProgress(0);
    }
  };

  const handleDownloadUpscaled = () => {
    if (!upscaledResult) return;

    const filename = `upscaled_${upscaleOptions.scale}x_${uploadedImage.name.split('.')[0]}.${upscaleOptions.format}`;
    downloadImage(upscaledResult.dataUrl, filename);
  };

  const handleNewUpload = () => {
    setUploadedImage(null);
    setUpscaledResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCompareSlider = (e) => {
    if (!compareContainerRef.current) return;

    const rect = compareContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setCompareSliderPosition(percentage);
  };

  const handleCompareSliderTouch = (e) => {
    if (!compareContainerRef.current) return;

    const touch = e.touches[0];
    const rect = compareContainerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setCompareSliderPosition(percentage);
  };

  return (
    <div className="image-upscaler">
      {!uploadedImage ? (
        // Upload section
        <section className="upload-section">
          <div
            className={`upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">📁</div>
            <h3>이미지를 업로드하세요</h3>
            <p>이미지를 드래그하거나 클릭하여 선택하세요</p>
            <div className="upload-formats">
              <span>지원 형식: JPG, PNG, WebP</span>
              <span>최대 크기: 10MB</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Options and preview section */}
          <section className="upscale-options-section">
            <div className="options-panel">
              <h3>업스케일 옵션</h3>

              <div className="option-group">
                <label>확대 배율</label>
                <div className="option-buttons">
                  <button
                    className={`option-btn ${upscaleOptions.scale === 2 ? 'active' : ''}`}
                    onClick={() => setUpscaleOptions({ ...upscaleOptions, scale: 2 })}
                    disabled={isUpscaling}
                  >
                    2x
                  </button>
                  <button
                    className={`option-btn ${upscaleOptions.scale === 4 ? 'active' : ''}`}
                    onClick={() => setUpscaleOptions({ ...upscaleOptions, scale: 4 })}
                    disabled={isUpscaling}
                  >
                    4x
                  </button>
                </div>
              </div>

              <div className="option-group">
                <label>출력 포맷</label>
                <div className="option-buttons">
                  <button
                    className={`option-btn ${upscaleOptions.format === 'png' ? 'active' : ''}`}
                    onClick={() => setUpscaleOptions({ ...upscaleOptions, format: 'png' })}
                    disabled={isUpscaling}
                  >
                    PNG
                  </button>
                  <button
                    className={`option-btn ${upscaleOptions.format === 'jpg' ? 'active' : ''}`}
                    onClick={() => setUpscaleOptions({ ...upscaleOptions, format: 'jpg' })}
                    disabled={isUpscaling}
                  >
                    JPG
                  </button>
                  <button
                    className={`option-btn ${upscaleOptions.format === 'webp' ? 'active' : ''}`}
                    onClick={() => setUpscaleOptions({ ...upscaleOptions, format: 'webp' })}
                    disabled={isUpscaling}
                  >
                    WebP
                  </button>
                </div>
              </div>

              <div className="option-group">
                <label>처리 품질</label>
                <div className="option-buttons">
                  <button
                    className={`option-btn ${upscaleOptions.quality === 'fast' ? 'active' : ''}`}
                    onClick={() => setUpscaleOptions({ ...upscaleOptions, quality: 'fast' })}
                    disabled={isUpscaling}
                  >
                    빠른 처리
                  </button>
                  <button
                    className={`option-btn ${upscaleOptions.quality === 'high' ? 'active' : ''}`}
                    onClick={() => setUpscaleOptions({ ...upscaleOptions, quality: 'high' })}
                    disabled={isUpscaling}
                  >
                    고품질
                  </button>
                </div>
              </div>

              <div className="image-info">
                <div className="info-row">
                  <span className="info-label">원본 크기:</span>
                  <span className="info-value">{uploadedImage.width} x {uploadedImage.height}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">출력 크기:</span>
                  <span className="info-value">
                    {uploadedImage.width * upscaleOptions.scale} x {uploadedImage.height * upscaleOptions.scale}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">파일 크기:</span>
                  <span className="info-value">{formatFileSize(uploadedImage.size)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">예상 크기:</span>
                  <span className="info-value">
                    {formatFileSize(estimateUpscaledSize(uploadedImage.size, upscaleOptions.scale))}
                  </span>
                </div>
              </div>

              <div className="upscale-actions">
                <button
                  className="action-btn primary"
                  onClick={handleUpscaleClick}
                  disabled={isUpscaling}
                >
                  {isUpscaling ? '처리 중...' : '업스케일 시작'}
                </button>
                <button
                  className="action-btn secondary"
                  onClick={handleNewUpload}
                  disabled={isUpscaling}
                >
                  새 이미지
                </button>
              </div>
            </div>

            <div className="preview-panel">
              <h3>미리보기</h3>
              <div className="preview-container">
                <img
                  src={uploadedImage.dataUrl}
                  alt="Original"
                  className="preview-image"
                />
                <div className="preview-label">원본 이미지</div>
              </div>
            </div>
          </section>

          {/* Progress section */}
          {isUpscaling && (
            <section className="upscale-progress-section">
              <h3>이미지 업스케일링 중...</h3>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${upscaleProgress}%` }}
                ></div>
              </div>
              <p className="progress-text">{Math.round(upscaleProgress)}%</p>
            </section>
          )}

          {/* Error message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Result section */}
          {upscaledResult && (
            <section className="upscale-result-section">
              <h2>업스케일 완료!</h2>

              {/* Before/After comparison slider */}
              <div
                className="compare-container"
                ref={compareContainerRef}
                onMouseMove={handleCompareSlider}
                onTouchMove={handleCompareSliderTouch}
              >
                <div className="compare-image-wrapper">
                  <img
                    src={upscaledResult.dataUrl}
                    alt="Upscaled"
                    className="compare-image compare-after"
                  />
                  <div
                    className="compare-overlay"
                    style={{ width: `${compareSliderPosition}%` }}
                  >
                    <img
                      src={uploadedImage.dataUrl}
                      alt="Original"
                      className="compare-image compare-before"
                    />
                  </div>
                  <div
                    className="compare-slider"
                    style={{ left: `${compareSliderPosition}%` }}
                  >
                    <div className="slider-button">
                      <span>⟷</span>
                    </div>
                  </div>
                  <div className="compare-labels">
                    <span className="label-before">원본</span>
                    <span className="label-after">업스케일</span>
                  </div>
                </div>
                <p className="compare-instruction">
                  슬라이더를 좌우로 드래그하여 비교하세요
                </p>
              </div>

              {/* Result info */}
              <div className="result-info-panel">
                <div className="result-meta-grid">
                  <div className="meta-item">
                    <span className="meta-label">확대 배율</span>
                    <span className="meta-value">{upscaledResult.scale}x</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">원본 크기</span>
                    <span className="meta-value">{uploadedImage.width} x {uploadedImage.height}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">출력 크기</span>
                    <span className="meta-value">{upscaledResult.width} x {upscaledResult.height}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">출력 포맷</span>
                    <span className="meta-value">{upscaledResult.format.toUpperCase()}</span>
                  </div>
                </div>

                <div className="result-actions">
                  <button
                    className="action-btn primary"
                    onClick={handleDownloadUpscaled}
                  >
                    다운로드
                  </button>
                  <button
                    className="action-btn secondary"
                    onClick={handleNewUpload}
                  >
                    새 이미지 처리
                  </button>
                </div>

                {upscaledResult.message && (
                  <div className="mock-notice">
                    ℹ️ {upscaledResult.message}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Feature info */}
          {!upscaledResult && !isUpscaling && (
            <section className="feature-info">
              <h3>업스케일링 기능</h3>
              <div className="feature-steps">
                <div className="feature-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h4>AI 분석</h4>
                    <p>이미지의 패턴과 디테일을 분석합니다.</p>
                  </div>
                </div>
                <div className="feature-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h4>해상도 향상</h4>
                    <p>AI가 누락된 픽셀을 지능적으로 생성합니다.</p>
                  </div>
                </div>
                <div className="feature-step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h4>품질 최적화</h4>
                    <p>선명도와 노이즈를 최적화하여 완성합니다.</p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default ImageUpscaler;
