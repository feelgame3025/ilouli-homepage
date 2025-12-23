import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AIYoutubeShorts.css';

const AIYoutubeShorts = () => {
  const { t } = useTranslation();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const steps = [
    { id: 1, name: '콘텐츠 생성', icon: '📝', description: 'GPT로 영어 문장 생성' },
    { id: 2, name: '비디오 생성', icon: '🎬', description: 'AI 애니메이션 생성' },
    { id: 3, name: '음성 생성', icon: '🔊', description: 'TTS 나레이션 생성' },
    { id: 4, name: '영상 편집', icon: '✂️', description: '자막 및 오디오 합성' },
  ];

  const exampleTopics = [
    '동물원에서',
    '아침 식사',
    '비 오는 날',
    '학교 가는 길',
    '생일 파티',
    '바다에서',
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
      // 실제 API 연동 시 사용할 코드
      // const response = await fetch('/api/shorts/generate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ topic })
      // });
      // const data = await response.json();

      // Mock 시뮬레이션
      for (let step = 1; step <= 4; step++) {
        setCurrentStep(step);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Mock 결과
      setResult({
        english: 'I see a big elephant at the zoo!',
        korean: '나는 동물원에서 큰 코끼리를 봐요!',
        videoUrl: null, // 실제로는 생성된 비디오 URL
        duration: 10,
        costEstimate: 282,
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
    <div className="ai-youtube-shorts">
      <header className="page-header">
        <h1>🎬 YouTube Shorts 자동 생성</h1>
        <p>주제를 입력하면 AI가 아동용 영어 학습 쇼츠를 자동으로 만들어 드립니다.</p>
      </header>

      {/* 입력 섹션 */}
      <section className="input-section">
        <div className="topic-input-container">
          <label htmlFor="topic-input">영상 주제</label>
          <div className="input-with-button">
            <input
              id="topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: 동물원에서, 아침 식사, 비 오는 날..."
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
          <span className="example-label">추천 주제:</span>
          <div className="topic-chips">
            {exampleTopics.map((t) => (
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
      </section>

      {/* 진행 상태 */}
      {isGenerating && (
        <section className="progress-section">
          <h2>생성 진행 중...</h2>
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
          <h2>🎉 생성 완료!</h2>
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
                  <p>미리보기 준비 중...</p>
                  <p className="placeholder-note">
                    (백엔드 API 연동 후 실제 영상이 표시됩니다)
                  </p>
                </div>
              )}
            </div>
            <div className="result-info">
              <div className="result-content">
                <h3>생성된 콘텐츠</h3>
                <div className="content-item">
                  <span className="content-label">🇺🇸 English:</span>
                  <span className="content-text english">{result.english}</span>
                </div>
                <div className="content-item">
                  <span className="content-label">🇰🇷 한국어:</span>
                  <span className="content-text korean">{result.korean}</span>
                </div>
              </div>
              <div className="result-meta">
                <div className="meta-item">
                  <span className="meta-label">영상 길이</span>
                  <span className="meta-value">{result.duration}초</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">예상 비용</span>
                  <span className="meta-value">₩{result.costEstimate}</span>
                </div>
              </div>
              <div className="result-actions">
                <button className="action-btn primary" disabled>
                  📥 다운로드
                </button>
                <button className="action-btn secondary" disabled>
                  📤 YouTube 업로드
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 정보 카드 */}
      <section className="info-section">
        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">💰</div>
            <h3>비용</h3>
            <p>영상당 약 ₩282</p>
            <span className="info-detail">GPT + Kling AI + TTS</span>
          </div>
          <div className="info-card">
            <div className="info-icon">⏱️</div>
            <h3>소요 시간</h3>
            <p>약 3-5분</p>
            <span className="info-detail">비디오 생성이 가장 오래 걸림</span>
          </div>
          <div className="info-card">
            <div className="info-icon">🎯</div>
            <h3>타겟</h3>
            <p>8-10세 아동</p>
            <span className="info-detail">초등 저학년 영어 학습</span>
          </div>
        </div>
      </section>

      {/* 사용법 안내 */}
      <section className="guide-section">
        <h2>사용 방법</h2>
        <div className="guide-steps">
          <div className="guide-step">
            <span className="guide-number">1</span>
            <p>영상 주제를 한국어로 입력하세요</p>
          </div>
          <div className="guide-step">
            <span className="guide-number">2</span>
            <p>'영상 생성' 버튼을 클릭하세요</p>
          </div>
          <div className="guide-step">
            <span className="guide-number">3</span>
            <p>AI가 자동으로 영상을 만들어 드립니다</p>
          </div>
          <div className="guide-step">
            <span className="guide-number">4</span>
            <p>완성된 영상을 다운로드하거나 업로드하세요</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AIYoutubeShorts;
