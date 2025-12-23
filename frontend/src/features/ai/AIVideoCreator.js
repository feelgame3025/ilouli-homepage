import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './AIVideoCreator.css';

const AIVideoCreator = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return ['shortform', 'upscale', 'img2video'].includes(tabParam) ? tabParam : 'shortform';
  });
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // URL 파라미터 변경 시 탭 업데이트
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (['shortform', 'upscale', 'img2video'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 탭 변경 핸들러
  const handleTabChange = (tabId, disabled) => {
    if (disabled) return;
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // 탭별 설정
  const tabs = [
    { id: 'shortform', name: '숏폼 영상', icon: '🎬', description: '짧은 영상 콘텐츠 제작' },
    { id: 'upscale', name: '이미지 업스케일', icon: '🔍', description: '저해상도 → 고해상도', disabled: true },
    { id: 'img2video', name: '이미지 → 영상', icon: '🎞️', description: '정적 이미지를 영상으로', disabled: true },
  ];

  const steps = [
    { id: 1, name: '콘텐츠 생성', icon: '📝', description: 'AI가 스크립트 작성' },
    { id: 2, name: '영상 생성', icon: '🎬', description: 'AI 애니메이션 생성' },
    { id: 3, name: '음성 생성', icon: '🔊', description: 'TTS 나레이션 생성' },
    { id: 4, name: '최종 편집', icon: '✂️', description: '자막 및 오디오 합성' },
  ];

  const exampleTopics = [
    { label: '영어 학습', topics: ['동물원에서', '아침 식사', '비 오는 날'] },
    { label: '비즈니스', topics: ['회사 소개', '제품 홍보', '서비스 안내'] },
    { label: '라이프스타일', topics: ['오늘의 요리', '여행 브이로그', '운동 루틴'] },
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('주제를 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    setCurrentStep(1);
    setError(null);
    setResult(null);

    try {
      // Mock 시뮬레이션
      for (let step = 1; step <= 4; step++) {
        setCurrentStep(step);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Mock 결과
      setResult({
        title: `${topic} - AI 생성 영상`,
        description: `${topic}에 대한 AI 생성 숏폼 영상입니다.`,
        english: 'I see a big elephant at the zoo!',
        korean: '나는 동물원에서 큰 코끼리를 봐요!',
        videoUrl: null,
        duration: 10,
        resolution: '1080x1920',
        format: 'MP4',
      });

    } catch (err) {
      setError('영상 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
      setCurrentStep(0);
    }
  };

  const handleTopicClick = (selectedTopic) => {
    setTopic(selectedTopic);
  };

  return (
    <div className="ai-video-creator">
      <header className="page-header">
        <h1>AI 영상 제작</h1>
        <p>AI가 전문적인 영상 콘텐츠를 자동으로 제작해 드립니다.</p>
      </header>

      {/* 탭 메뉴 */}
      <div className="tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
            onClick={() => handleTabChange(tab.id, tab.disabled)}
            disabled={tab.disabled}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-name">{tab.name}</span>
            {tab.disabled && <span className="coming-soon-badge">준비중</span>}
          </button>
        ))}
      </div>

      {/* 숏폼 영상 탭 */}
      {activeTab === 'shortform' && (
        <>
          {/* 입력 섹션 */}
          <section className="input-section">
            <div className="section-header">
              <h2>영상 주제</h2>
              <p>만들고 싶은 영상의 주제를 입력하세요.</p>
            </div>

            <div className="topic-input-container">
              <div className="input-with-button">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="예: 카페 소개, 제품 리뷰, 여행 브이로그..."
                  disabled={isGenerating}
                />
                <button
                  className="generate-btn"
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic.trim()}
                >
                  {isGenerating ? '생성 중...' : '영상 생성'}
                </button>
              </div>
            </div>

            {/* 예시 주제 */}
            <div className="example-topics">
              {exampleTopics.map((category) => (
                <div key={category.label} className="topic-category">
                  <span className="category-label">{category.label}</span>
                  <div className="topic-chips">
                    {category.topics.map((t) => (
                      <button
                        key={t}
                        className={`topic-chip ${topic === t ? 'active' : ''}`}
                        onClick={() => handleTopicClick(t)}
                        disabled={isGenerating}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
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
                          <span className="content-label">🇺🇸 English:</span>
                          <span className="content-text">{result.english}</span>
                        </div>
                        <div className="content-item">
                          <span className="content-label">🇰🇷 한국어:</span>
                          <span className="content-text">{result.korean}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="result-meta">
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
                    <button className="action-btn primary" disabled>
                      📥 다운로드
                    </button>
                    <button className="action-btn youtube" disabled>
                      ▶️ YouTube 업로드
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* 기능 소개 */}
      <section className="features-section">
        <h2>주요 기능</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎬</div>
            <h3>숏폼 영상</h3>
            <p>몇 번의 클릭으로 전문적인 짧은 영상을 제작합니다.</p>
            <ul>
              <li>AI 스크립트 생성</li>
              <li>자동 영상 합성</li>
              <li>자막 및 음성 추가</li>
            </ul>
          </div>
          <div className="feature-card disabled">
            <div className="feature-icon">🔍</div>
            <h3>이미지 업스케일</h3>
            <p>저해상도 이미지를 고품질로 변환합니다.</p>
            <span className="feature-badge">준비중</span>
          </div>
          <div className="feature-card disabled">
            <div className="feature-icon">🎞️</div>
            <h3>이미지 → 영상</h3>
            <p>정적인 이미지를 자연스러운 영상으로 변환합니다.</p>
            <span className="feature-badge">준비중</span>
          </div>
        </div>
      </section>

      {/* 활용 사례 */}
      <section className="usecases-section">
        <h2>활용 사례</h2>
        <div className="usecases-grid">
          <div className="usecase-card">
            <span className="usecase-icon">🏥</span>
            <h4>의료/헬스케어</h4>
            <p>병원 소개, 의료진 프로필 영상</p>
          </div>
          <div className="usecase-card">
            <span className="usecase-icon">🍽️</span>
            <h4>식음료</h4>
            <p>맛집 홍보, 메뉴 소개 영상</p>
          </div>
          <div className="usecase-card">
            <span className="usecase-icon">✈️</span>
            <h4>여행</h4>
            <p>여행지 홍보, 브이로그 영상</p>
          </div>
          <div className="usecase-card">
            <span className="usecase-icon">📚</span>
            <h4>교육</h4>
            <p>영어 학습, 교육 콘텐츠 영상</p>
          </div>
          <div className="usecase-card">
            <span className="usecase-icon">🛒</span>
            <h4>이커머스</h4>
            <p>제품 리뷰, 언박싱 영상</p>
          </div>
          <div className="usecase-card">
            <span className="usecase-icon">🏢</span>
            <h4>기업</h4>
            <p>회사 소개, 채용 홍보 영상</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AIVideoCreator;
