import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './AIVideoCreator.css';
import videoCreatorService from '../../services/videoCreator';
import {
  convertImageToVideo,
  downloadVideo,
  validateImageFile,
  MOTION_STYLES,
  DURATION_OPTIONS,
  RESOLUTION_OPTIONS,
} from '../../services/imageToVideo';
import ImageUpscaler from './ImageUpscaler';
import { PROMPT_CATEGORIES, DEFAULT_PROMPT, PROMPT_GUIDE } from './promptExamples';

const AIVideoCreator = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return ['shortform', 'upscale', 'img2video'].includes(tabParam) ? tabParam : 'shortform';
  });
  const [promptText, setPromptText] = useState(DEFAULT_PROMPT);
  const [showGuide, setShowGuide] = useState(false);
  const [referenceImage, setReferenceImage] = useState(null);
  const [referencePreview, setReferencePreview] = useState(null);
  const referenceInputRef = useRef(null);
  const [videoStyle, setVideoStyle] = useState('educational');
  const [videoDuration, setVideoDuration] = useState(30);
  const [videoResolution, setVideoResolution] = useState('1080p');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

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

  // URL 파라미터 변경 시 탭 업데이트
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (['shortform', 'upscale', 'img2video'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 히스토리 로드
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await videoCreatorService.getShortFormHistory(10);
      setHistory(data);
    } catch (err) {
      console.error('히스토리 로드 실패:', err);
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (tabId, disabled) => {
    if (disabled) return;
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // 탭별 설정
  const tabs = [
    { id: 'shortform', name: '숏폼', icon: '🎬', description: 'AI 숏폼 영상 제작' },
    { id: 'upscale', name: '이미지 업스케일링', icon: '🔍', description: '저해상도 → 고해상도' },
    { id: 'img2video', name: '이미지 영상', icon: '🎞️', description: '정적 이미지를 영상으로' },
  ];

  // 탭별 페이지 정보
  const tabInfo = {
    shortform: {
      title: '숏폼 영상 제작',
      subtitle: 'AI가 전문적인 숏폼 영상을 자동으로 제작합니다.'
    },
    upscale: {
      title: '이미지 업스케일링',
      subtitle: '저해상도 이미지를 고품질 고해상도로 변환합니다.'
    },
    img2video: {
      title: '이미지 영상 변환',
      subtitle: '정적인 이미지를 자연스러운 영상으로 변환합니다.'
    }
  };

  const steps = [
    { id: 1, name: '콘텐츠 생성', icon: '📝', description: 'AI가 스크립트 작성' },
    { id: 2, name: '영상 생성', icon: '🎬', description: 'AI 애니메이션 생성' },
    { id: 3, name: '음성 생성', icon: '🔊', description: 'TTS 나레이션 생성' },
    { id: 4, name: '최종 편집', icon: '✂️', description: '자막 및 오디오 합성' },
  ];


  const videoStyles = [
    { value: 'educational', label: '교육용', icon: '📚', description: '학습 중심의 설명형 영상' },
    { value: 'promotional', label: '홍보용', icon: '📢', description: '제품/서비스 홍보 영상' },
    { value: 'vlog', label: '브이로그', icon: '🎥', description: '일상/경험 공유 영상' },
    { value: 'entertainment', label: '엔터테인먼트', icon: '🎪', description: '재미 중심의 콘텐츠' },
    { value: 'news', label: '뉴스/정보', icon: '📰', description: '정보 전달 중심 영상' },
  ];

  const durations = [
    { value: 10, label: '10초', description: '짧고 임팩트있게' },
    { value: 30, label: '30초', description: '표준 숏폼 길이' },
    { value: 60, label: '60초', description: '상세한 내용 전달' },
  ];

  const resolutions = [
    { value: '720p', label: '720p', description: 'HD 화질 (빠른 생성)' },
    { value: '1080p', label: '1080p', description: 'Full HD (권장)' },
  ];

  const [currentJobId, setCurrentJobId] = useState(null);

  const handleGenerate = async () => {
    if (!promptText.trim()) {
      setError('영상 아이디어를 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    setCurrentStep(1);
    setError(null);
    setResult(null);
    setCurrentJobId(null);

    try {
      // 1단계: 생성 요청
      const createResponse = await videoCreatorService.createShortForm({
        prompt: promptText,
        style: videoStyle,
        duration: videoDuration,
        resolution: videoResolution,
        referenceImage: referenceImage,
        useMock: true  // Mock 모드 (API 비용 절약, 실제 연동 시 false로 변경)
      });

      if (!createResponse.success) {
        throw new Error(createResponse.error || '생성 요청 실패');
      }

      const { jobId } = createResponse;
      setCurrentJobId(jobId);

      // 2단계: 상태 폴링
      const completedJob = await videoCreatorService.pollJobStatus(jobId, {
        onProgress: ({ currentStep: step }) => {
          if (step > 0) {
            setCurrentStep(step);
          }
        },
        onComplete: (job) => {
          console.log('생성 완료:', job);
        },
        onError: (err) => {
          console.error('생성 오류:', err);
        },
        interval: 2000,
        maxAttempts: 60  // 2분 (Mock 모드에서는 빠르게 완료)
      });

      // 결과 설정
      const params = completedJob.parameters || {};
      const videoResult = {
        jobId: completedJob.jobId,
        title: `AI 생성 영상`,
        description: params.prompt?.substring(0, 100) || '',
        english: params.english || 'Generated content',
        korean: params.korean || '생성된 콘텐츠',
        videoUrl: completedJob.videoUrl,
        downloadUrl: completedJob.downloadUrl,
        duration: params.duration || videoDuration,
        resolution: `${videoResolution === '1080p' ? '1080x1920' : '720x1280'}`,
        format: 'MP4',
        style: videoStyles.find(s => s.value === videoStyle)?.label || '교육용',
        createdAt: completedJob.completedAt || new Date().toISOString(),
      };

      setResult(videoResult);

      // 히스토리 새로고침
      loadHistory();

    } catch (err) {
      console.error('handleGenerate error:', err);
      setError(err.message || '영상 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
      setCurrentStep(0);
    }
  };

  const handleDownload = async () => {
    if (!result?.jobId) {
      alert('다운로드할 영상이 없습니다.');
      return;
    }

    try {
      const filename = `shorts_${promptText.substring(0, 20).replace(/[^a-zA-Z0-9가-힣]/g, '_')}.mp4`;
      await videoCreatorService.downloadShortForm(result.jobId, filename);
    } catch (err) {
      alert('다운로드 실패: ' + err.message);
    }
  };

  const handleNewVideo = () => {
    setResult(null);
    setError(null);
    setPromptText(DEFAULT_PROMPT);
    setCurrentStep(0);
  };

  const handleClearHistory = () => {
    if (window.confirm('모든 히스토리를 삭제하시겠습니까?')) {
      videoCreatorService.clearHistory();
      setHistory([]);
    }
  };

  const handleInspirationClick = (category) => {
    // 해당 카테고리에서 랜덤 예시 선택
    const randomIndex = Math.floor(Math.random() * category.examples.length);
    const example = category.examples[randomIndex];
    setPromptText(example.prompt);
  };

  // 레퍼런스 이미지 핸들러
  const handleReferenceUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB 제한
      setError('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }

    setReferenceImage(file);
    setError(null);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setReferencePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReference = () => {
    setReferenceImage(null);
    setReferencePreview(null);
    if (referenceInputRef.current) {
      referenceInputRef.current.value = '';
    }
  };

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
      {/* 탭 네비게이션 */}
      <div className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-nav-btn ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
            onClick={() => handleTabChange(tab.id, tab.disabled)}
            disabled={tab.disabled}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-name">{tab.name}</span>
            {tab.disabled && <span className="coming-soon-badge">준비중</span>}
          </button>
        ))}
      </div>

      {/* 페이지 헤더 */}
      <header className="page-header">
        <h1>{tabInfo[activeTab].title}</h1>
        <p>{tabInfo[activeTab].subtitle}</p>
      </header>

      {/* 숏폼 영상 탭 */}
      {activeTab === 'shortform' && (
        <div className="tab-content">
          {/* 프롬프트 입력 섹션 */}
          <section className="prompt-section">
            <div className="section-header">
              <h2>✨ 영상 아이디어</h2>
              <p>만들고 싶은 영상을 자유롭게 설명해주세요</p>
            </div>

            {/* 프롬프트 Textarea + 생성 버튼 */}
            <div className="prompt-input-row">
              <div className="prompt-input-wrapper">
                <textarea
                  className="prompt-textarea"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onFocus={(e) => {
                    // 기본 예시 프롬프트일 때 전체 선택 (setTimeout으로 비동기 처리)
                    if (promptText === DEFAULT_PROMPT) {
                      setTimeout(() => e.target.select(), 0);
                    }
                  }}
                  placeholder="영상 아이디어를 입력하세요..."
                  rows={4}
                  maxLength={500}
                  disabled={isGenerating}
                />
                <div className="prompt-counter">
                  <span className={promptText.length > 400 ? 'warning' : ''}>
                    {promptText.length}/500자
                  </span>
                </div>
              </div>

              {/* 생성 버튼 - 오른쪽 배치 */}
              <button
                className="generate-btn-side"
                onClick={handleGenerate}
                disabled={isGenerating || !promptText.trim()}
              >
                {isGenerating ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>생성 중...</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon-main">🎬</span>
                    <span>영상 생성</span>
                  </>
                )}
              </button>
            </div>

            {/* 영감 버튼들 */}
            <div className="inspiration-section">
              <div className="inspiration-header">
                <span className="inspiration-icon">💡</span>
                <span>영감 얻기</span>
              </div>
              <div className="inspiration-buttons">
                {Object.values(PROMPT_CATEGORIES).map((category) => (
                  <button
                    key={category.id}
                    className="inspiration-btn"
                    onClick={() => handleInspirationClick(category)}
                    disabled={isGenerating}
                  >
                    <span className="btn-icon">{category.icon}</span>
                    <span className="btn-name">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 프롬프트 작성 가이드 (접이식) */}
            <div className="prompt-guide-section">
              <button
                className="guide-toggle"
                onClick={() => setShowGuide(!showGuide)}
              >
                <span>{showGuide ? '▼' : '▶'}</span>
                <span>좋은 프롬프트 작성 팁</span>
              </button>
              {showGuide && (
                <div className="guide-content">
                  <ul>
                    {PROMPT_GUIDE.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 레퍼런스 이미지 섹션 */}
            <div className="reference-section">
              <div className="reference-header">
                <span className="reference-icon">🖼️</span>
                <span>캐릭터/스타일 고정</span>
                <span className="reference-optional">(선택사항)</span>
              </div>
              <p className="reference-desc">
                특정 캐릭터나 스타일을 유지하고 싶다면 참고 이미지를 업로드하세요.
              </p>

              <input
                type="file"
                ref={referenceInputRef}
                accept="image/*"
                onChange={handleReferenceUpload}
                style={{ display: 'none' }}
                disabled={isGenerating}
              />

              {referencePreview ? (
                <div className="reference-preview-wrapper">
                  <img
                    src={referencePreview}
                    alt="레퍼런스 이미지"
                    className="reference-preview-img"
                  />
                  <div className="reference-preview-overlay">
                    <button
                      className="reference-change-btn"
                      onClick={() => referenceInputRef.current?.click()}
                      disabled={isGenerating}
                    >
                      변경
                    </button>
                    <button
                      className="reference-remove-btn"
                      onClick={handleRemoveReference}
                      disabled={isGenerating}
                    >
                      삭제
                    </button>
                  </div>
                  <span className="reference-filename">{referenceImage?.name}</span>
                </div>
              ) : (
                <button
                  className="reference-upload-btn"
                  onClick={() => referenceInputRef.current?.click()}
                  disabled={isGenerating}
                >
                  <span className="upload-icon">+</span>
                  <span className="upload-text">이미지 업로드</span>
                  <span className="upload-hint">PNG, JPG (최대 10MB)</span>
                </button>
              )}
            </div>
          </section>

          {/* 영상 옵션 섹션 */}
          <section className="options-section">
            <div className="section-header">
              <h2>영상 옵션</h2>
              <p>원하는 영상 스타일과 설정을 선택하세요.</p>
            </div>

            {/* 영상 스타일 */}
            <div className="option-group">
              <label className="option-label">영상 스타일</label>
              <div className="style-cards">
                {videoStyles.map((style) => (
                  <button
                    key={style.value}
                    className={`style-card ${videoStyle === style.value ? 'active' : ''}`}
                    onClick={() => setVideoStyle(style.value)}
                    disabled={isGenerating}
                  >
                    <span className="style-icon">{style.icon}</span>
                    <span className="style-label">{style.label}</span>
                    <span className="style-desc">{style.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 영상 길이 & 해상도 */}
            <div className="option-row">
              <div className="option-group">
                <label className="option-label">영상 길이</label>
                <div className="duration-buttons">
                  {durations.map((d) => (
                    <button
                      key={d.value}
                      className={`duration-btn ${videoDuration === d.value ? 'active' : ''}`}
                      onClick={() => setVideoDuration(d.value)}
                      disabled={isGenerating}
                    >
                      <span className="duration-value">{d.label}</span>
                      <span className="duration-desc">{d.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="option-group">
                <label className="option-label">출력 해상도</label>
                <div className="resolution-buttons">
                  {resolutions.map((r) => (
                    <button
                      key={r.value}
                      className={`resolution-btn ${videoResolution === r.value ? 'active' : ''}`}
                      onClick={() => setVideoResolution(r.value)}
                      disabled={isGenerating}
                    >
                      <span className="resolution-value">{r.label}</span>
                      <span className="resolution-desc">{r.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 진행 상태 */}
          {isGenerating && (
            <section className="progress-section">
              <h2>영상 생성 중...</h2>
              <div className="steps-container">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`step-item ${
                      currentStep > step.id
                        ? 'completed'
                        : currentStep === step.id
                        ? 'active'
                        : ''
                    }`}
                  >
                    <div className="step-icon">
                      {currentStep > step.id ? '✅' : step.icon}
                    </div>
                    <div className="step-info">
                      <span className="step-name">{step.name}</span>
                      <span className="step-desc">{step.description}</span>
                    </div>
                    {currentStep === step.id && (
                      <div className="step-spinner"></div>
                    )}
                  </div>
                ))}
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
          {result && (
            <section className="result-section">
              <h2>영상 생성 완료!</h2>
              <div className="result-card">
                <div className="result-preview">
                  {result.videoUrl ? (
                    <video
                      src={result.videoUrl}
                      controls
                      className="result-video"
                    />
                  ) : (
                    <div className="preview-placeholder">
                      <span className="placeholder-icon">🎬</span>
                      <p>미리보기</p>
                      <p className="placeholder-note">
                        (API 연동 후 실제 영상이 표시됩니다)
                      </p>
                    </div>
                  )}
                </div>
                <div className="result-info">
                  <div className="result-content">
                    <h3>{result.title}</h3>
                    <p className="result-description">{result.description}</p>

                    {result.english && (
                      <div className="content-preview">
                        <div className="content-item">
                          <span className="content-label">English:</span>
                          <span className="content-text">{result.english}</span>
                        </div>
                        <div className="content-item">
                          <span className="content-label">한국어:</span>
                          <span className="content-text">{result.korean}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="result-meta">
                    <div className="meta-item">
                      <span className="meta-label">스타일</span>
                      <span className="meta-value">{result.style}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">길이</span>
                      <span className="meta-value">{result.duration}초</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">해상도</span>
                      <span className="meta-value">{result.resolution}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">포맷</span>
                      <span className="meta-value">{result.format}</span>
                    </div>
                  </div>

                  <div className="result-actions">
                    <button
                      className="action-btn primary"
                      onClick={handleDownload}
                    >
                      다운로드
                    </button>
                    <button
                      className="action-btn secondary"
                      onClick={handleNewVideo}
                    >
                      새로 생성하기
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 히스토리 섹션 */}
          {!isGenerating && history.length > 0 && (
            <section className="history-section">
              <div className="history-header">
                <h2>생성 히스토리</h2>
                <button className="clear-history-btn" onClick={handleClearHistory}>
                  전체 삭제
                </button>
              </div>
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-info">
                      <span className="history-topic">{item.topic}</span>
                      <div className="history-meta">
                        <span className="history-badge">{videoStyles.find(s => s.value === item.style)?.label || item.style}</span>
                        <span className="history-detail">{item.duration}초</span>
                        <span className="history-detail">{item.resolution}</span>
                      </div>
                    </div>
                    <div className="history-date">
                      {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 기능 안내 */}
          <section className="feature-info">
            <h3>숏폼 영상 제작 과정</h3>
            <div className="feature-steps">
              <div className="feature-step">
                <span className="step-number">1</span>
                <div className="step-content">
                  <h4>주제 입력</h4>
                  <p>원하는 영상 주제를 입력합니다.</p>
                </div>
              </div>
              <div className="feature-step">
                <span className="step-number">2</span>
                <div className="step-content">
                  <h4>AI 콘텐츠 생성</h4>
                  <p>AI가 스크립트와 이미지를 자동 생성합니다.</p>
                </div>
              </div>
              <div className="feature-step">
                <span className="step-number">3</span>
                <div className="step-content">
                  <h4>영상 합성</h4>
                  <p>음성, 자막과 함께 최종 영상이 완성됩니다.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 이미지 업스케일링 탭 */}
      {activeTab === 'upscale' && (
        <div className="tab-content">
          <ImageUpscaler />
        </div>
      )}

      {/* 이미지 영상 탭 */}
      {activeTab === 'img2video' && (
        <div className="tab-content">
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
          {isGenerating && activeTab === 'img2video' && (
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
          {error && activeTab === 'img2video' && (
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
      )}
    </div>
  );
};

export default AIVideoCreator;
