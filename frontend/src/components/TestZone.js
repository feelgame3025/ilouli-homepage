import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AssetLibrary from './AssetLibrary';
import './TestZone.css';

// ===== 테스트 존 페이지 관리 =====
const TEST_PAGES = [
  { id: 'gostop-cards', name: '🎴 고스톱 카드', icon: '🎴' },
  { id: 'gostop-rules', name: '📜 고스톱 룰', icon: '📜' },
  { id: 'assets', name: '📁 에셋 라이브러리', icon: '📁' },
];

// 화투 이미지 매핑
const HWATU_IMAGE_MAP = {
  '1-1': '1766365648113-246585907.png',
  '1-2': '1766365648040-398829771.png',
  '1-3': '1766365647990-957864677.png',
  '1-4': '1766365647901-991381946.png',
  '2-1': '1766365648299-896721373.png',
  '2-2': '1766365648264-567946987.png',
  '2-3': '1766365648281-422771943.png',
  '2-4': '1766365648146-136778318.png',
  '3-1': '1766365648007-26931206.png',
  '3-2': '1766365648061-457781584.png',
  '3-3': '1766365648096-895991008.png',
  '3-4': '1766365647920-205705528.png',
  '4-1': '1766365648213-442459374.png',
  '4-2': '1766365648129-211245955.png',
  '4-3': '1766365648162-58848333.png',
  '4-4': '1766365648246-955995828.png',
  '5-1': '1766365647802-768277004.png',
  '5-2': '1766365647936-615083179.png',
  '5-3': '1766365647975-673220710.png',
  '5-4': '1766365648079-717804224.png',
  '6-1': '1766365648179-819603995.png',
  '6-2': '1766365648229-284854545.png',
  '6-3': '1766365648195-217754773.png',
  '6-4': '1766365648315-903974657.png',
  '7-1': '1766365647954-486907208.png',
  '7-2': '1766365647885-332796171.png',
  '7-3': '1766365647859-981807374.png',
  '7-4': '1766365648024-379925920.png',
  '8-1': '1766365648470-903551197.png',
  '8-2': '1766365648518-775832240.png',
  '8-3': '1766365648485-208944818.png',
  '8-4': '1766365648437-74352903.png',
  '9-1': '1766365648656-182981457.png',
  '9-2': '1766365648622-253389898.png',
  '9-3': '1766365648605-469820217.png',
  '9-4': '1766365648553-51756069.png',
  '10-1': '1766365648367-911477294.png',
  '10-2': '1766365648422-610609444.png',
  '10-3': '1766365648386-728581906.png',
  '10-4': '1766365648502-932841805.png',
  '11-1': '1766365648588-806626211.png',
  '11-2': '1766365648570-323944655.png',
  '11-3': '1766365648536-891418201.png',
  '11-4': '1766365648639-790562712.png',
  '12-1': '1766365648403-709711113.png',
  '12-2': '1766365648334-202283624.png',
  '12-3': '1766365648349-721958801.png',
  '12-4': '1766365648454-752753178.png',
};

// 화투 48장 정의 (수정 가능)
const HWATU_DECK = [
  // 1월 (송학) - 소나무와 학
  { month: 1, imageIndex: 1, name: '송학', type: '광', subtype: null, desc: '학+태양', piCount: 0 },
  { month: 1, imageIndex: 2, name: '송학', type: '띠', subtype: '홍단', desc: '홍단', piCount: 0 },
  { month: 1, imageIndex: 3, name: '송학', type: '피', subtype: null, desc: '소나무', piCount: 1 },
  { month: 1, imageIndex: 4, name: '송학', type: '피', subtype: null, desc: '소나무', piCount: 1 },
  // 2월 (매조) - 매화와 꾀꼬리
  { month: 2, imageIndex: 1, name: '매조', type: '열끗', subtype: '고도리', desc: '꾀꼬리', piCount: 0 },
  { month: 2, imageIndex: 2, name: '매조', type: '띠', subtype: '홍단', desc: '홍단', piCount: 0 },
  { month: 2, imageIndex: 3, name: '매조', type: '피', subtype: null, desc: '매화', piCount: 1 },
  { month: 2, imageIndex: 4, name: '매조', type: '피', subtype: null, desc: '매화', piCount: 1 },
  // 3월 (벚꽃) - 벚꽃과 장막
  { month: 3, imageIndex: 1, name: '벚꽃', type: '광', subtype: null, desc: '장막', piCount: 0 },
  { month: 3, imageIndex: 2, name: '벚꽃', type: '띠', subtype: '홍단', desc: '홍단', piCount: 0 },
  { month: 3, imageIndex: 3, name: '벚꽃', type: '피', subtype: null, desc: '벚꽃', piCount: 1 },
  { month: 3, imageIndex: 4, name: '벚꽃', type: '피', subtype: null, desc: '벚꽃', piCount: 1 },
  // 4월 (흑싸리) - 등나무와 두견새
  { month: 4, imageIndex: 1, name: '흑싸리', type: '열끗', subtype: '고도리', desc: '두견새', piCount: 0 },
  { month: 4, imageIndex: 2, name: '흑싸리', type: '띠', subtype: '초단', desc: '초단', piCount: 0 },
  { month: 4, imageIndex: 3, name: '흑싸리', type: '피', subtype: null, desc: '등나무', piCount: 1 },
  { month: 4, imageIndex: 4, name: '흑싸리', type: '피', subtype: null, desc: '등나무', piCount: 1 },
  // 5월 (난초) - 창포와 팔교
  { month: 5, imageIndex: 1, name: '난초', type: '열끗', subtype: null, desc: '팔교', piCount: 0 },
  { month: 5, imageIndex: 2, name: '난초', type: '띠', subtype: '초단', desc: '초단', piCount: 0 },
  { month: 5, imageIndex: 3, name: '난초', type: '피', subtype: null, desc: '창포', piCount: 1 },
  { month: 5, imageIndex: 4, name: '난초', type: '피', subtype: null, desc: '창포', piCount: 1 },
  // 6월 (모란) - 모란과 나비
  { month: 6, imageIndex: 1, name: '모란', type: '열끗', subtype: null, desc: '나비', piCount: 0 },
  { month: 6, imageIndex: 2, name: '모란', type: '띠', subtype: '청단', desc: '청단', piCount: 0 },
  { month: 6, imageIndex: 3, name: '모란', type: '피', subtype: null, desc: '모란', piCount: 1 },
  { month: 6, imageIndex: 4, name: '모란', type: '피', subtype: null, desc: '모란', piCount: 1 },
  // 7월 (홍싸리) - 싸리와 멧돼지
  { month: 7, imageIndex: 1, name: '홍싸리', type: '열끗', subtype: null, desc: '멧돼지', piCount: 0 },
  { month: 7, imageIndex: 2, name: '홍싸리', type: '띠', subtype: '초단', desc: '초단', piCount: 0 },
  { month: 7, imageIndex: 3, name: '홍싸리', type: '피', subtype: null, desc: '싸리', piCount: 1 },
  { month: 7, imageIndex: 4, name: '홍싸리', type: '피', subtype: null, desc: '싸리', piCount: 1 },
  // 8월 (공산) - 억새와 보름달, 기러기
  { month: 8, imageIndex: 1, name: '공산', type: '광', subtype: null, desc: '보름달', piCount: 0 },
  { month: 8, imageIndex: 2, name: '공산', type: '열끗', subtype: '고도리', desc: '기러기', piCount: 0 },
  { month: 8, imageIndex: 3, name: '공산', type: '피', subtype: null, desc: '억새', piCount: 1 },
  { month: 8, imageIndex: 4, name: '공산', type: '피', subtype: null, desc: '억새', piCount: 1 },
  // 9월 (국화) - 국화와 술잔
  { month: 9, imageIndex: 1, name: '국화', type: '열끗', subtype: null, desc: '술잔', piCount: 0 },
  { month: 9, imageIndex: 2, name: '국화', type: '띠', subtype: '청단', desc: '청단', piCount: 0 },
  { month: 9, imageIndex: 3, name: '국화', type: '피', subtype: null, desc: '국화', piCount: 1 },
  { month: 9, imageIndex: 4, name: '국화', type: '피', subtype: null, desc: '국화', piCount: 1 },
  // 10월 (단풍) - 단풍과 사슴
  { month: 10, imageIndex: 1, name: '단풍', type: '열끗', subtype: null, desc: '사슴', piCount: 0 },
  { month: 10, imageIndex: 2, name: '단풍', type: '띠', subtype: '청단', desc: '청단', piCount: 0 },
  { month: 10, imageIndex: 3, name: '단풍', type: '피', subtype: null, desc: '단풍', piCount: 1 },
  { month: 10, imageIndex: 4, name: '단풍', type: '피', subtype: null, desc: '단풍', piCount: 1 },
  // 11월 (오동) - 오동과 봉황
  { month: 11, imageIndex: 1, name: '오동', type: '광', subtype: '비광', desc: '봉황', piCount: 0 },
  { month: 11, imageIndex: 2, name: '오동', type: '피', subtype: null, desc: '오동', piCount: 1 },
  { month: 11, imageIndex: 3, name: '오동', type: '피', subtype: null, desc: '오동', piCount: 1 },
  { month: 11, imageIndex: 4, name: '오동', type: '피', subtype: '쌍피', desc: '쌍피', piCount: 2 },
  // 12월 (비) - 버드나무와 비
  { month: 12, imageIndex: 1, name: '비', type: '광', subtype: '비광', desc: '비광', piCount: 0 },
  { month: 12, imageIndex: 2, name: '비', type: '열끗', subtype: null, desc: '제비', piCount: 0 },
  { month: 12, imageIndex: 3, name: '비', type: '띠', subtype: null, desc: '띠', piCount: 0 },
  { month: 12, imageIndex: 4, name: '비', type: '피', subtype: '쌍피', desc: '쌍피', piCount: 2 },
];

// 고스톱 카드 테스트 컴포넌트
const GoStopCardTest = () => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [viewMode, setViewMode] = useState('byMonth'); // 'byMonth' | 'byType'
  const [editingCard, setEditingCard] = useState(null);
  const [cardDeck, setCardDeck] = useState(HWATU_DECK);
  const [imageMap, setImageMap] = useState(HWATU_IMAGE_MAP);
  const [dragOverCard, setDragOverCard] = useState(null);
  const [notes, setNotes] = useState(''); // 메모/텍스트 입력

  // 카드 선택/해제
  const toggleCardSelection = (card) => {
    setSelectedCards(prev => {
      const exists = prev.find(c => c.month === card.month && c.imageIndex === card.imageIndex);
      if (exists) {
        return prev.filter(c => !(c.month === card.month && c.imageIndex === card.imageIndex));
      }
      return [...prev, card];
    });
  };

  // 월별 그룹
  const cardsByMonth = cardDeck.reduce((acc, card) => {
    if (!acc[card.month]) acc[card.month] = [];
    acc[card.month].push(card);
    return acc;
  }, {});

  // 타입별 그룹
  const cardsByType = cardDeck.reduce((acc, card) => {
    if (!acc[card.type]) acc[card.type] = [];
    acc[card.type].push(card);
    return acc;
  }, {});

  // 선택된 카드 매칭 체크
  const getMatchInfo = () => {
    if (selectedCards.length < 2) return null;

    const months = [...new Set(selectedCards.map(c => c.month))];
    if (months.length === 1) {
      const month = months[0];
      const allCardsOfMonth = cardDeck.filter(c => c.month === month);
      return {
        isMatch: true,
        month,
        matchedCards: selectedCards,
        allMonthCards: allCardsOfMonth,
        totalPi: selectedCards.reduce((sum, c) => sum + c.piCount, 0)
      };
    }
    return { isMatch: false };
  };

  // 카드 수정
  const updateCard = (month, imageIndex, field, value) => {
    setCardDeck(prev => prev.map(card => {
      if (card.month === month && card.imageIndex === imageIndex) {
        return { ...card, [field]: value };
      }
      return card;
    }));
  };

  // 이미지 URL 가져오기 (동적 imageMap 사용)
  const getCardImageUrl = (month, index) => {
    const key = `${month}-${index}`;
    const filename = imageMap[key];
    return filename ? `https://api.ilouli.com/api/files/view/${filename}` : null;
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e, card) => {
    e.preventDefault();
    setDragOverCard(`${card.month}-${card.imageIndex}`);
  };

  const handleDragLeave = () => {
    setDragOverCard(null);
  };

  const handleDrop = (e, card) => {
    e.preventDefault();
    setDragOverCard(null);

    // 파일 드롭
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // 파일 업로드 후 이미지 변경
        uploadAndChangeImage(card, file);
      }
      return;
    }

    // URL 드롭 (예: 파일 업로드 페이지에서 드래그)
    const url = e.dataTransfer.getData('text/plain');
    if (url && url.includes('/api/files/view/')) {
      const filename = url.split('/api/files/view/')[1];
      if (filename) {
        const key = `${card.month}-${card.imageIndex}`;
        setImageMap(prev => ({ ...prev, [key]: filename }));
      }
    }
  };

  // 이미지 업로드 및 변경
  const uploadAndChangeImage = async (card, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', '화투');

    try {
      const response = await fetch('https://api.ilouli.com/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const key = `${card.month}-${card.imageIndex}`;
        setImageMap(prev => ({ ...prev, [key]: data.file.filename }));
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
    }
  };

  // 카드 컴포넌트 (드래그 앤 드롭 지원)
  const CardDisplay = ({ card, isSelected, onClick, enableDrop = false }) => {
    const imageUrl = getCardImageUrl(card.month, card.imageIndex);
    const isDragOver = dragOverCard === `${card.month}-${card.imageIndex}`;

    return (
      <div
        className={`test-hwatu-card ${isSelected ? 'selected' : ''} ${card.type} ${isDragOver ? 'drag-over' : ''}`}
        onClick={onClick}
        onDragOver={enableDrop ? (e) => handleDragOver(e, card) : undefined}
        onDragLeave={enableDrop ? handleDragLeave : undefined}
        onDrop={enableDrop ? (e) => handleDrop(e, card) : undefined}
      >
        <div className="card-image-wrapper">
          {imageUrl ? (
            <img src={imageUrl} alt={`${card.month}월 ${card.name}`} draggable={false} />
          ) : (
            <span className="card-fallback">{card.month}월</span>
          )}
          {isDragOver && <div className="drop-indicator">이미지 변경</div>}
        </div>
        <div className="card-info">
          <span className="card-month">{card.month}월</span>
          <span className={`card-type-badge ${card.type}`}>{card.type}</span>
          {card.subtype && <span className="card-subtype">{card.subtype}</span>}
          {card.piCount > 1 && <span className="card-pi-count">×{card.piCount}</span>}
        </div>
        <div className="card-desc">{card.desc}</div>
      </div>
    );
  };

  const matchInfo = getMatchInfo();

  return (
    <div className="gostop-card-test">
      <div className="test-header">
        <h3>🎴 고스톱 카드 테스트</h3>
        <div className="view-toggle">
          <button
            className={viewMode === 'byMonth' ? 'active' : ''}
            onClick={() => setViewMode('byMonth')}
          >
            월별 보기
          </button>
          <button
            className={viewMode === 'byType' ? 'active' : ''}
            onClick={() => setViewMode('byType')}
          >
            타입별 보기
          </button>
        </div>
      </div>

      {/* 선택된 카드 & 매칭 정보 */}
      <div className="selection-panel">
        <h4>선택된 카드 ({selectedCards.length}장)</h4>
        <div className="selected-cards-row">
          {selectedCards.length === 0 ? (
            <p className="hint">카드를 클릭하여 선택하세요</p>
          ) : (
            selectedCards.map((card, idx) => (
              <CardDisplay
                key={`${card.month}-${card.imageIndex}-${idx}`}
                card={card}
                isSelected={true}
                onClick={() => toggleCardSelection(card)}
              />
            ))
          )}
        </div>
        {matchInfo && (
          <div className={`match-result ${matchInfo.isMatch ? 'matched' : 'not-matched'}`}>
            {matchInfo.isMatch ? (
              <>
                <span className="match-icon">✅</span>
                <span>매칭! {matchInfo.month}월 카드 {matchInfo.matchedCards.length}장</span>
                <span className="pi-total">총 피: {matchInfo.totalPi}장</span>
              </>
            ) : (
              <>
                <span className="match-icon">❌</span>
                <span>매칭 안됨 (다른 월 카드)</span>
              </>
            )}
          </div>
        )}
        <button className="clear-btn" onClick={() => setSelectedCards([])}>선택 초기화</button>
      </div>

      {/* 카드 목록 */}
      {viewMode === 'byMonth' ? (
        <div className="cards-by-month">
          {Object.entries(cardsByMonth).map(([month, cards]) => (
            <div key={month} className="month-group">
              <div className="month-header">
                <span className="month-number">{month}월</span>
                <span className="month-name">{cards[0]?.name}</span>
              </div>
              <div className="month-cards">
                {cards.map(card => (
                  <div key={`${card.month}-${card.imageIndex}`} className="card-with-edit">
                    <CardDisplay
                      card={card}
                      isSelected={selectedCards.some(c => c.month === card.month && c.imageIndex === card.imageIndex)}
                      onClick={() => toggleCardSelection(card)}
                      enableDrop={true}
                    />
                    <button
                      className="edit-btn"
                      onClick={() => setEditingCard(editingCard === `${card.month}-${card.imageIndex}` ? null : `${card.month}-${card.imageIndex}`)}
                    >
                      ✏️
                    </button>
                    {editingCard === `${card.month}-${card.imageIndex}` && (
                      <div className="edit-panel" onClick={(e) => e.stopPropagation()}>
                        <label>
                          타입:
                          <select
                            value={card.type}
                            onChange={(e) => updateCard(card.month, card.imageIndex, 'type', e.target.value)}
                          >
                            <option value="광">광</option>
                            <option value="열끗">열끗</option>
                            <option value="띠">띠</option>
                            <option value="피">피</option>
                          </select>
                        </label>
                        <label>
                          서브타입:
                          <select
                            value={card.subtype || ''}
                            onChange={(e) => updateCard(card.month, card.imageIndex, 'subtype', e.target.value || null)}
                          >
                            <option value="">없음</option>
                            <option value="홍단">홍단</option>
                            <option value="청단">청단</option>
                            <option value="초단">초단</option>
                            <option value="고도리">고도리</option>
                            <option value="비광">비광</option>
                            <option value="쌍피">쌍피</option>
                          </select>
                        </label>
                        <label>
                          피 개수:
                          <input
                            type="number"
                            min="0"
                            max="2"
                            value={card.piCount}
                            onChange={(e) => updateCard(card.month, card.imageIndex, 'piCount', parseInt(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </label>
                        <label>
                          설명:
                          <input
                            type="text"
                            value={card.desc}
                            onChange={(e) => updateCard(card.month, card.imageIndex, 'desc', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cards-by-type">
          {['광', '열끗', '띠', '피'].map(type => (
            <div key={type} className="type-group">
              <div className={`type-header ${type}`}>
                <span className="type-name">{type}</span>
                <span className="type-count">{cardsByType[type]?.length || 0}장</span>
              </div>
              <div className="type-cards">
                {(cardsByType[type] || []).map(card => (
                  <CardDisplay
                    key={`${card.month}-${card.imageIndex}`}
                    card={card}
                    isSelected={selectedCards.some(c => c.month === card.month && c.imageIndex === card.imageIndex)}
                    onClick={() => toggleCardSelection(card)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 점수 규칙 안내 */}
      <div className="scoring-rules">
        <h4>점수 규칙</h4>
        <div className="rules-grid">
          <div className="rule-item">
            <span className="rule-name">오광</span>
            <span className="rule-desc">광 5장</span>
            <span className="rule-score">15점</span>
          </div>
          <div className="rule-item">
            <span className="rule-name">사광</span>
            <span className="rule-desc">광 4장 (비광 포함)</span>
            <span className="rule-score">4점</span>
          </div>
          <div className="rule-item">
            <span className="rule-name">삼광</span>
            <span className="rule-desc">광 3장 (비광 제외)</span>
            <span className="rule-score">3점</span>
          </div>
          <div className="rule-item">
            <span className="rule-name">비삼광</span>
            <span className="rule-desc">광 3장 (비광 포함)</span>
            <span className="rule-score">2점</span>
          </div>
          <div className="rule-item">
            <span className="rule-name">고도리</span>
            <span className="rule-desc">2,4,8월 새 3장</span>
            <span className="rule-score">5점</span>
          </div>
          <div className="rule-item">
            <span className="rule-name">홍단</span>
            <span className="rule-desc">1,2,3월 홍단 3장</span>
            <span className="rule-score">3점</span>
          </div>
          <div className="rule-item">
            <span className="rule-name">청단</span>
            <span className="rule-desc">6,9,10월 청단 3장</span>
            <span className="rule-score">3점</span>
          </div>
          <div className="rule-item">
            <span className="rule-name">초단</span>
            <span className="rule-desc">4,5,7월 초단 3장</span>
            <span className="rule-score">3점</span>
          </div>
          <div className="rule-item">
            <span className="rule-name">열끗</span>
            <span className="rule-desc">5장 이상</span>
            <span className="rule-score">장수-4점</span>
          </div>
          <div className="rule-item">
            <span className="rule-name">띠</span>
            <span className="rule-desc">5장 이상</span>
            <span className="rule-score">장수-4점</span>
          </div>
          <div className="rule-item">
            <span className="rule-name">피</span>
            <span className="rule-desc">10장 이상</span>
            <span className="rule-score">장수-9점</span>
          </div>
        </div>
      </div>

      {/* 메모/노트 */}
      <div className="notes-section">
        <h4>📝 메모 및 노트</h4>
        <textarea
          className="notes-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="카드 관련 메모, 수정 사항, 아이디어 등을 자유롭게 작성하세요..."
          rows={5}
        />
      </div>

      {/* JSON 출력 */}
      <div className="json-output">
        <h4>현재 설정 (복사하여 Games.js에 적용)</h4>
        <div className="json-buttons">
          <button onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(cardDeck, null, 2));
            alert('덱 설정이 클립보드에 복사되었습니다!');
          }}>
            📋 덱 JSON 복사
          </button>
          <button onClick={() => {
            navigator.clipboard.writeText(`const HWATU_IMAGE_MAP = ${JSON.stringify(imageMap, null, 2)};`);
            alert('이미지 맵이 클립보드에 복사되었습니다!');
          }}>
            🖼️ 이미지맵 복사
          </button>
          <button onClick={() => {
            const fullConfig = {
              HWATU_IMAGE_MAP: imageMap,
              HWATU_DECK: cardDeck,
              notes: notes
            };
            navigator.clipboard.writeText(JSON.stringify(fullConfig, null, 2));
            alert('전체 설정이 클립보드에 복사되었습니다!');
          }}>
            📦 전체 설정 복사
          </button>
        </div>
        <div className="json-tabs">
          <details>
            <summary>덱 설정 JSON</summary>
            <pre>{JSON.stringify(cardDeck, null, 2)}</pre>
          </details>
          <details>
            <summary>이미지맵 JSON</summary>
            <pre>{`const HWATU_IMAGE_MAP = ${JSON.stringify(imageMap, null, 2)};`}</pre>
          </details>
        </div>
      </div>
    </div>
  );
};

// ===== 고스톱 룰 문서 컴포넌트 =====
const GoStopRules = () => {
  const [activeSection, setActiveSection] = useState('basic');

  const sections = [
    { id: 'basic', name: '기본 규칙' },
    { id: 'cards', name: '패 구성' },
    { id: 'scoring', name: '점수 계산' },
    { id: 'special', name: '특수 규칙' },
    { id: 'tips', name: '전략 팁' },
  ];

  return (
    <div className="gostop-rules">
      <div className="rules-nav">
        {sections.map(section => (
          <button
            key={section.id}
            className={activeSection === section.id ? 'active' : ''}
            onClick={() => setActiveSection(section.id)}
          >
            {section.name}
          </button>
        ))}
      </div>

      <div className="rules-content">
        {activeSection === 'basic' && (
          <div className="rules-section">
            <h3>🎴 기본 규칙</h3>
            <div className="rule-block">
              <h4>게임 목표</h4>
              <p>먼저 정해진 점수(보통 3점 또는 7점)에 도달하여 "고" 또는 "스톱"을 선언하는 것이 목표입니다.</p>
            </div>
            <div className="rule-block">
              <h4>게임 진행</h4>
              <ol>
                <li><strong>패 돌리기:</strong> 2인 플레이 시 각자 10장씩, 바닥에 8장</li>
                <li><strong>선 결정:</strong> 먼저 치는 사람이 "선"</li>
                <li><strong>패 내기:</strong> 손에서 1장을 내고, 덱에서 1장을 뒤집음</li>
                <li><strong>패 먹기:</strong> 같은 월의 패끼리 매칭하여 획득</li>
                <li><strong>고/스톱:</strong> 점수가 나면 계속할지(고) 그만할지(스톱) 선택</li>
              </ol>
            </div>
            <div className="rule-block">
              <h4>매칭 규칙</h4>
              <ul>
                <li>같은 월의 패 2장이 바닥에 있을 때: 선택하여 1장 가져감</li>
                <li>같은 월의 패 3장이 바닥에 있을 때: 3장 모두 가져감 ("싹쓸이")</li>
                <li>바닥에 매칭되는 패가 없으면: 내 패를 바닥에 내려놓음</li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'cards' && (
          <div className="rules-section">
            <h3>🃏 패 구성 (총 48장)</h3>
            <div className="card-types-grid">
              <div className="card-type-info 광">
                <h4>광 (5장)</h4>
                <p>1월(송학), 3월(벚꽃), 8월(공산), 11월(오동), 12월(비)</p>
                <ul>
                  <li>가장 높은 가치의 패</li>
                  <li>광 조합으로 높은 점수 획득</li>
                  <li>11월, 12월은 "비광"으로 별도 취급</li>
                </ul>
              </div>
              <div className="card-type-info 열끗">
                <h4>열끗/10끗 (9장)</h4>
                <p>각 월의 동물/사물 그림이 있는 패</p>
                <ul>
                  <li>2, 4, 8월: 새 그림 (고도리)</li>
                  <li>5월: 팔교, 6월: 나비</li>
                  <li>7월: 멧돼지, 9월: 술잔</li>
                  <li>10월: 사슴, 12월: 제비</li>
                </ul>
              </div>
              <div className="card-type-info 띠">
                <h4>띠 (10장)</h4>
                <ul>
                  <li><span className="badge hongdan">홍단</span> 1, 2, 3월 - 글씨 있는 빨간 띠</li>
                  <li><span className="badge chungdan">청단</span> 6, 9, 10월 - 파란 띠</li>
                  <li><span className="badge chodan">초단</span> 4, 5, 7월 - 글씨 없는 빨간 띠</li>
                  <li>12월 띠: 특수 (조합 불가)</li>
                </ul>
              </div>
              <div className="card-type-info 피">
                <h4>피 (24장)</h4>
                <ul>
                  <li>일반 피: 각 월에 2장씩 (1점)</li>
                  <li><span className="badge ssangpi">쌍피</span> 11월, 12월에 각 1장 (2점)</li>
                  <li>10장 이상 모으면 점수 획득</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'scoring' && (
          <div className="rules-section">
            <h3>💰 점수 계산</h3>
            <div className="scoring-table">
              <h4>광 조합</h4>
              <table>
                <thead>
                  <tr><th>조합</th><th>조건</th><th>점수</th></tr>
                </thead>
                <tbody>
                  <tr><td>오광</td><td>광 5장 모두</td><td className="score">15점</td></tr>
                  <tr><td>사광</td><td>비광 제외 광 4장</td><td className="score">4점</td></tr>
                  <tr><td>비사광</td><td>비광 포함 광 4장</td><td className="score">4점</td></tr>
                  <tr><td>삼광</td><td>비광 제외 광 3장</td><td className="score">3점</td></tr>
                  <tr><td>비삼광</td><td>비광 포함 광 3장</td><td className="score">2점</td></tr>
                </tbody>
              </table>

              <h4>열끗/띠 조합</h4>
              <table>
                <thead>
                  <tr><th>조합</th><th>조건</th><th>점수</th></tr>
                </thead>
                <tbody>
                  <tr><td>고도리</td><td>2, 4, 8월 새 3장</td><td className="score">5점</td></tr>
                  <tr><td>홍단</td><td>1, 2, 3월 홍단 3장</td><td className="score">3점</td></tr>
                  <tr><td>청단</td><td>6, 9, 10월 청단 3장</td><td className="score">3점</td></tr>
                  <tr><td>초단</td><td>4, 5, 7월 초단 3장</td><td className="score">3점</td></tr>
                  <tr><td>열끗</td><td>5장 이상</td><td className="score">(장수-4)점</td></tr>
                  <tr><td>띠</td><td>5장 이상</td><td className="score">(장수-4)점</td></tr>
                </tbody>
              </table>

              <h4>피 점수</h4>
              <table>
                <thead>
                  <tr><th>조합</th><th>조건</th><th>점수</th></tr>
                </thead>
                <tbody>
                  <tr><td>피</td><td>10장 이상</td><td className="score">(장수-9)점</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'special' && (
          <div className="rules-section">
            <h3>⚡ 특수 규칙</h3>
            <div className="rule-block">
              <h4>고 (Go)</h4>
              <p>점수가 나면 "고"를 외쳐 게임을 계속할 수 있습니다.</p>
              <ul>
                <li>1번 고: 다음 점수 2배</li>
                <li>2번 고: 다음 점수 4배</li>
                <li>3번 고 이상: 계속 2배씩 증가</li>
              </ul>
            </div>
            <div className="rule-block">
              <h4>뻑 (Ppuk)</h4>
              <p>같은 월 패가 바닥에 있을 때 낸 패도 같은 월이면 "뻑"</p>
              <ul>
                <li>3뻑: 상대방에게 벌칙</li>
              </ul>
            </div>
            <div className="rule-block">
              <h4>쪽 / 싹쓸이</h4>
              <ul>
                <li><strong>쪽:</strong> 바닥의 패 2장과 내 패 1장이 매칭 → 피 1장 보너스</li>
                <li><strong>싹쓸이:</strong> 내 패로 바닥 패 모두 가져감 → 피 1장 보너스</li>
              </ul>
            </div>
            <div className="rule-block">
              <h4>폭탄</h4>
              <p>같은 월 패 4장이 한 손에 있으면 → 무조건 승리 또는 보너스</p>
            </div>
            <div className="rule-block">
              <h4>흔들기 / 나가리</h4>
              <ul>
                <li><strong>흔들기:</strong> 같은 월 3장을 가지고 시작 시 선택적 공개 → 점수 2배</li>
                <li><strong>나가리:</strong> 덱이 다 떨어질 때까지 아무도 점수 못 냄 → 무승부</li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'tips' && (
          <div className="rules-section">
            <h3>💡 전략 팁</h3>
            <div className="rule-block">
              <h4>기본 전략</h4>
              <ul>
                <li>광을 우선적으로 모으세요 - 가장 높은 점수</li>
                <li>고도리(2,4,8월 새)는 5점으로 가치가 높습니다</li>
                <li>피를 많이 모으면 안정적인 점수 획득 가능</li>
                <li>상대방이 모으는 패를 파악하고 방해하세요</li>
              </ul>
            </div>
            <div className="rule-block">
              <h4>고 타이밍</h4>
              <ul>
                <li>이미 높은 점수가 확보됐을 때 고</li>
                <li>상대방 패가 거의 없을 때 안전하게 고</li>
                <li>덱에 남은 패가 적을 때는 리스크 고려</li>
              </ul>
            </div>
            <div className="rule-block">
              <h4>주의사항</h4>
              <ul>
                <li>비광(11월, 12월 광)만으로는 삼광 안 됨</li>
                <li>12월 띠는 단 조합에 포함 안 됨</li>
                <li>쌍피는 피 2장으로 계산</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TestZone = () => {
  const { t } = useTranslation();
  const [activePage, setActivePage] = useState('gostop-cards');

  return (
    <div className="test-zone-container">
      <header className="test-zone-header">
        <h1>{t('testZone.title')}</h1>
        <p>{t('testZone.subtitle')}</p>
      </header>

      {/* 페이지 탭 네비게이션 */}
      <nav className="test-zone-nav">
        {TEST_PAGES.map(page => (
          <button
            key={page.id}
            className={`nav-tab ${activePage === page.id ? 'active' : ''}`}
            onClick={() => setActivePage(page.id)}
          >
            <span className="tab-icon">{page.icon}</span>
            <span className="tab-name">{page.name}</span>
          </button>
        ))}
      </nav>

      <div className="test-zone-content">
        {/* 고스톱 카드 테스트 */}
        {activePage === 'gostop-cards' && (
          <section className="test-section">
            <GoStopCardTest />
          </section>
        )}

        {/* 고스톱 룰 문서 */}
        {activePage === 'gostop-rules' && (
          <section className="test-section">
            <GoStopRules />
          </section>
        )}

        {/* 에셋 라이브러리 */}
        {activePage === 'assets' && (
          <section className="test-section">
            <h2>📁 Asset Library</h2>
            <AssetLibrary />
          </section>
        )}
      </div>
    </div>
  );
};

export default TestZone;
