/**
 * ===================================================================
 * 고스톱 게임 스펙 (GoStop Game Specification)
 * ===================================================================
 *
 * 이 파일은 고스톱 게임의 모든 규칙과 카드 정의를 담고 있습니다.
 * 새로운 룰을 추가하거나 수정할 때 이 파일만 편집하면 됩니다.
 *
 * 구조:
 * 1. HWATU_IMAGE_MAP - 화투 이미지 매핑
 * 2. CARD_TYPES - 카드 종류 정의
 * 3. CARD_SUBTYPES - 카드 서브타입 정의
 * 4. HWATU_DECK - 48장 카드 데이터
 * 5. SCORING_RULES - 점수 계산 규칙
 * 6. SPECIAL_RULES - 특수 규칙
 * 7. MATCHING_RULES - 매칭 규칙
 */

// ===================================================================
// 0. 화투 이미지 매핑 (Hwatu Image Map)
// ===================================================================
export const HWATU_IMAGE_MAP = {
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

// 이미지 URL 생성 함수
export const getHwatuImageUrl = (month, index) => {
  const key = `${month}-${index}`;
  const filename = HWATU_IMAGE_MAP[key];
  return filename ? `https://api.ilouli.com/api/files/view/${filename}` : null;
};

// ===================================================================
// 1. 카드 종류 (Card Types)
// ===================================================================
export const CARD_TYPES = {
  광: {
    id: '광',
    name: '광',
    nameEn: 'Bright',
    color: '#fbbf24',
    bgGradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    description: '가장 높은 가치의 패. 광 조합으로 높은 점수 획득',
    totalCount: 5,
  },
  열끗: {
    id: '열끗',
    name: '열끗',
    nameEn: 'Animal',
    color: '#ef4444',
    bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    description: '동물/사물 그림이 있는 패',
    totalCount: 9,
  },
  띠: {
    id: '띠',
    name: '띠',
    nameEn: 'Ribbon',
    color: '#3b82f6',
    bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    description: '띠가 그려진 패',
    totalCount: 10,
  },
  피: {
    id: '피',
    name: '피',
    nameEn: 'Junk',
    color: '#9ca3af',
    bgGradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
    description: '가장 낮은 가치. 10장 이상 모으면 점수',
    totalCount: 24,
  },
};

// ===================================================================
// 2. 카드 서브타입 (Card Subtypes)
// ===================================================================
export const CARD_SUBTYPES = {
  // 띠 서브타입
  홍단: {
    id: '홍단',
    name: '홍단',
    nameEn: 'Red Poetry Ribbon',
    color: '#ef4444',
    months: [1, 2, 3],
    description: '글씨가 있는 빨간 띠 (1, 2, 3월)',
  },
  청단: {
    id: '청단',
    name: '청단',
    nameEn: 'Blue Ribbon',
    color: '#3b82f6',
    months: [6, 9, 10],
    description: '파란 띠 (6, 9, 10월)',
  },
  초단: {
    id: '초단',
    name: '초단',
    nameEn: 'Red Plain Ribbon',
    color: '#f97316',
    months: [4, 5, 7],
    description: '글씨 없는 빨간 띠 (4, 5, 7월)',
  },
  // 열끗 서브타입
  고도리: {
    id: '고도리',
    name: '고도리',
    nameEn: 'Five Birds',
    color: '#8b5cf6',
    months: [2, 4, 8],
    description: '새 그림 (2, 4, 8월)',
  },
  // 광 서브타입
  비광: {
    id: '비광',
    name: '비광',
    nameEn: 'Rain Bright',
    color: '#6366f1',
    months: [11, 12],
    description: '비 오는 날의 광 (11, 12월)',
  },
  // 피 서브타입
  쌍피: {
    id: '쌍피',
    name: '쌍피',
    nameEn: 'Double Junk',
    color: '#a855f7',
    months: [11, 12],
    description: '2점짜리 피 (11, 12월)',
  },
};

// ===================================================================
// 3. 월별 정보 (Month Info)
// ===================================================================
export const MONTH_INFO = {
  1: { name: '송학', flower: '소나무', description: '소나무와 학' },
  2: { name: '매조', flower: '매화', description: '매화와 꾀꼬리' },
  3: { name: '벚꽃', flower: '벚꽃', description: '벚꽃과 장막' },
  4: { name: '흑싸리', flower: '등나무', description: '등나무와 두견새' },
  5: { name: '난초', flower: '창포', description: '창포와 팔교' },
  6: { name: '모란', flower: '모란', description: '모란과 나비' },
  7: { name: '홍싸리', flower: '싸리', description: '싸리와 멧돼지' },
  8: { name: '공산', flower: '억새', description: '억새와 보름달, 기러기' },
  9: { name: '국화', flower: '국화', description: '국화와 술잔' },
  10: { name: '단풍', flower: '단풍', description: '단풍과 사슴' },
  11: { name: '오동', flower: '오동', description: '오동과 봉황' },
  12: { name: '비', flower: '버드나무', description: '버드나무와 비' },
};

// ===================================================================
// 4. 화투 48장 데이터 (Hwatu Deck - 48 Cards)
// ===================================================================
export const HWATU_DECK = [
  // 1월 (송학)
  { month: 1, imageIndex: 1, name: '송학', type: '광', subtype: null, desc: '학+태양', piCount: 0 },
  { month: 1, imageIndex: 2, name: '송학', type: '띠', subtype: '홍단', desc: '홍단', piCount: 0 },
  { month: 1, imageIndex: 3, name: '송학', type: '피', subtype: null, desc: '소나무', piCount: 1 },
  { month: 1, imageIndex: 4, name: '송학', type: '피', subtype: null, desc: '소나무', piCount: 1 },
  // 2월 (매조)
  { month: 2, imageIndex: 1, name: '매조', type: '열끗', subtype: '고도리', desc: '꾀꼬리', piCount: 0 },
  { month: 2, imageIndex: 2, name: '매조', type: '띠', subtype: '홍단', desc: '홍단', piCount: 0 },
  { month: 2, imageIndex: 3, name: '매조', type: '피', subtype: null, desc: '매화', piCount: 1 },
  { month: 2, imageIndex: 4, name: '매조', type: '피', subtype: null, desc: '매화', piCount: 1 },
  // 3월 (벚꽃)
  { month: 3, imageIndex: 1, name: '벚꽃', type: '광', subtype: null, desc: '장막', piCount: 0 },
  { month: 3, imageIndex: 2, name: '벚꽃', type: '띠', subtype: '홍단', desc: '홍단', piCount: 0 },
  { month: 3, imageIndex: 3, name: '벚꽃', type: '피', subtype: null, desc: '벚꽃', piCount: 1 },
  { month: 3, imageIndex: 4, name: '벚꽃', type: '피', subtype: null, desc: '벚꽃', piCount: 1 },
  // 4월 (흑싸리)
  { month: 4, imageIndex: 1, name: '흑싸리', type: '열끗', subtype: '고도리', desc: '두견새', piCount: 0 },
  { month: 4, imageIndex: 2, name: '흑싸리', type: '띠', subtype: '초단', desc: '초단', piCount: 0 },
  { month: 4, imageIndex: 3, name: '흑싸리', type: '피', subtype: null, desc: '등나무', piCount: 1 },
  { month: 4, imageIndex: 4, name: '흑싸리', type: '피', subtype: null, desc: '등나무', piCount: 1 },
  // 5월 (난초)
  { month: 5, imageIndex: 1, name: '난초', type: '열끗', subtype: null, desc: '팔교', piCount: 0 },
  { month: 5, imageIndex: 2, name: '난초', type: '띠', subtype: '초단', desc: '초단', piCount: 0 },
  { month: 5, imageIndex: 3, name: '난초', type: '피', subtype: null, desc: '창포', piCount: 1 },
  { month: 5, imageIndex: 4, name: '난초', type: '피', subtype: null, desc: '창포', piCount: 1 },
  // 6월 (모란)
  { month: 6, imageIndex: 1, name: '모란', type: '열끗', subtype: null, desc: '나비', piCount: 0 },
  { month: 6, imageIndex: 2, name: '모란', type: '띠', subtype: '청단', desc: '청단', piCount: 0 },
  { month: 6, imageIndex: 3, name: '모란', type: '피', subtype: null, desc: '모란', piCount: 1 },
  { month: 6, imageIndex: 4, name: '모란', type: '피', subtype: null, desc: '모란', piCount: 1 },
  // 7월 (홍싸리)
  { month: 7, imageIndex: 1, name: '홍싸리', type: '열끗', subtype: null, desc: '멧돼지', piCount: 0 },
  { month: 7, imageIndex: 2, name: '홍싸리', type: '띠', subtype: '초단', desc: '초단', piCount: 0 },
  { month: 7, imageIndex: 3, name: '홍싸리', type: '피', subtype: null, desc: '싸리', piCount: 1 },
  { month: 7, imageIndex: 4, name: '홍싸리', type: '피', subtype: null, desc: '싸리', piCount: 1 },
  // 8월 (공산)
  { month: 8, imageIndex: 1, name: '공산', type: '광', subtype: null, desc: '보름달', piCount: 0 },
  { month: 8, imageIndex: 2, name: '공산', type: '열끗', subtype: '고도리', desc: '기러기', piCount: 0 },
  { month: 8, imageIndex: 3, name: '공산', type: '피', subtype: null, desc: '억새', piCount: 1 },
  { month: 8, imageIndex: 4, name: '공산', type: '피', subtype: null, desc: '억새', piCount: 1 },
  // 9월 (국화)
  { month: 9, imageIndex: 1, name: '국화', type: '열끗', subtype: null, desc: '술잔', piCount: 0 },
  { month: 9, imageIndex: 2, name: '국화', type: '띠', subtype: '청단', desc: '청단', piCount: 0 },
  { month: 9, imageIndex: 3, name: '국화', type: '피', subtype: null, desc: '국화', piCount: 1 },
  { month: 9, imageIndex: 4, name: '국화', type: '피', subtype: null, desc: '국화', piCount: 1 },
  // 10월 (단풍)
  { month: 10, imageIndex: 1, name: '단풍', type: '열끗', subtype: null, desc: '사슴', piCount: 0 },
  { month: 10, imageIndex: 2, name: '단풍', type: '띠', subtype: '청단', desc: '청단', piCount: 0 },
  { month: 10, imageIndex: 3, name: '단풍', type: '피', subtype: null, desc: '단풍', piCount: 1 },
  { month: 10, imageIndex: 4, name: '단풍', type: '피', subtype: null, desc: '단풍', piCount: 1 },
  // 11월 (오동)
  { month: 11, imageIndex: 1, name: '오동', type: '광', subtype: '비광', desc: '봉황', piCount: 0 },
  { month: 11, imageIndex: 2, name: '오동', type: '피', subtype: null, desc: '오동', piCount: 1 },
  { month: 11, imageIndex: 3, name: '오동', type: '피', subtype: null, desc: '오동', piCount: 1 },
  { month: 11, imageIndex: 4, name: '오동', type: '피', subtype: '쌍피', desc: '쌍피', piCount: 2 },
  // 12월 (비)
  { month: 12, imageIndex: 1, name: '비', type: '광', subtype: '비광', desc: '비광', piCount: 0 },
  { month: 12, imageIndex: 2, name: '비', type: '열끗', subtype: null, desc: '제비', piCount: 0 },
  { month: 12, imageIndex: 3, name: '비', type: '띠', subtype: null, desc: '띠', piCount: 0 },
  { month: 12, imageIndex: 4, name: '비', type: '피', subtype: '쌍피', desc: '쌍피', piCount: 2 },
];

// ===================================================================
// 5. 점수 규칙 (Scoring Rules)
// ===================================================================
/**
 * 점수 규칙 추가 방법:
 * 1. SCORING_RULES 배열에 새 객체 추가
 * 2. 필수 필드: id, name, category, score, condition
 * 3. checkFn: (capturedCards) => boolean 함수로 조건 체크
 */
export const SCORING_RULES = [
  // === 광 조합 ===
  {
    id: 'ogwang',
    name: '오광',
    nameEn: 'Five Brights',
    category: '광',
    score: 15,
    condition: '광 5장 모두',
    description: '모든 광패 5장을 모으면 획득',
    checkFn: (cards) => {
      const gwang = cards.filter(c => c.type === '광');
      return gwang.length === 5;
    },
  },
  {
    id: 'sagwang',
    name: '사광',
    nameEn: 'Four Brights',
    category: '광',
    score: 4,
    condition: '비광 제외 광 4장',
    description: '비광(11월, 12월)을 제외한 광 4장',
    checkFn: (cards) => {
      const gwang = cards.filter(c => c.type === '광');
      const biGwang = gwang.filter(c => c.subtype === '비광');
      return gwang.length === 4 && biGwang.length === 0;
    },
  },
  {
    id: 'bisagwang',
    name: '비사광',
    nameEn: 'Rainy Four Brights',
    category: '광',
    score: 4,
    condition: '비광 포함 광 4장',
    description: '비광을 포함한 광 4장',
    checkFn: (cards) => {
      const gwang = cards.filter(c => c.type === '광');
      const biGwang = gwang.filter(c => c.subtype === '비광');
      return gwang.length === 4 && biGwang.length >= 1;
    },
  },
  {
    id: 'samgwang',
    name: '삼광',
    nameEn: 'Three Brights',
    category: '광',
    score: 3,
    condition: '비광 제외 광 3장',
    description: '비광을 제외한 광 3장',
    checkFn: (cards) => {
      const gwang = cards.filter(c => c.type === '광');
      const biGwang = gwang.filter(c => c.subtype === '비광');
      return gwang.length === 3 && biGwang.length === 0;
    },
  },
  {
    id: 'bisamgwang',
    name: '비삼광',
    nameEn: 'Rainy Three Brights',
    category: '광',
    score: 2,
    condition: '비광 포함 광 3장',
    description: '비광을 포함한 광 3장',
    checkFn: (cards) => {
      const gwang = cards.filter(c => c.type === '광');
      const biGwang = gwang.filter(c => c.subtype === '비광');
      return gwang.length === 3 && biGwang.length >= 1;
    },
  },

  // === 열끗/띠 조합 ===
  {
    id: 'godori',
    name: '고도리',
    nameEn: 'Go-Dori (Five Birds)',
    category: '열끗',
    score: 5,
    condition: '2, 4, 8월 새 3장',
    description: '꾀꼬리(2월), 두견새(4월), 기러기(8월) 3장',
    checkFn: (cards) => {
      const godori = cards.filter(c => c.subtype === '고도리');
      return godori.length === 3;
    },
  },
  {
    id: 'hongdan',
    name: '홍단',
    nameEn: 'Red Poetry Ribbons',
    category: '띠',
    score: 3,
    condition: '1, 2, 3월 홍단 3장',
    description: '글씨가 있는 빨간 띠 3장',
    checkFn: (cards) => {
      const hongdan = cards.filter(c => c.subtype === '홍단');
      return hongdan.length === 3;
    },
  },
  {
    id: 'cheongdan',
    name: '청단',
    nameEn: 'Blue Ribbons',
    category: '띠',
    score: 3,
    condition: '6, 9, 10월 청단 3장',
    description: '파란 띠 3장',
    checkFn: (cards) => {
      const cheongdan = cards.filter(c => c.subtype === '청단');
      return cheongdan.length === 3;
    },
  },
  {
    id: 'chodan',
    name: '초단',
    nameEn: 'Red Plain Ribbons',
    category: '띠',
    score: 3,
    condition: '4, 5, 7월 초단 3장',
    description: '글씨 없는 빨간 띠 3장',
    checkFn: (cards) => {
      const chodan = cards.filter(c => c.subtype === '초단');
      return chodan.length === 3;
    },
  },

  // === 개수 기반 점수 ===
  {
    id: 'yeolkkeut',
    name: '열끗',
    nameEn: 'Animals',
    category: '열끗',
    score: null, // 동적 계산
    condition: '5장 이상',
    description: '열끗 5장 이상 모으면 (장수-4)점',
    scoreFn: (cards) => {
      const yeol = cards.filter(c => c.type === '열끗');
      return yeol.length >= 5 ? yeol.length - 4 : 0;
    },
    checkFn: (cards) => {
      const yeol = cards.filter(c => c.type === '열끗');
      return yeol.length >= 5;
    },
  },
  {
    id: 'ddi',
    name: '띠',
    nameEn: 'Ribbons',
    category: '띠',
    score: null,
    condition: '5장 이상',
    description: '띠 5장 이상 모으면 (장수-4)점',
    scoreFn: (cards) => {
      const ddi = cards.filter(c => c.type === '띠');
      return ddi.length >= 5 ? ddi.length - 4 : 0;
    },
    checkFn: (cards) => {
      const ddi = cards.filter(c => c.type === '띠');
      return ddi.length >= 5;
    },
  },
  {
    id: 'pi',
    name: '피',
    nameEn: 'Junk',
    category: '피',
    score: null,
    condition: '10장 이상 (쌍피=2장)',
    description: '피 10장 이상 모으면 (장수-9)점. 쌍피는 2장으로 계산',
    scoreFn: (cards) => {
      const piCount = cards.reduce((sum, c) => sum + c.piCount, 0);
      return piCount >= 10 ? piCount - 9 : 0;
    },
    checkFn: (cards) => {
      const piCount = cards.reduce((sum, c) => sum + c.piCount, 0);
      return piCount >= 10;
    },
  },
];

// ===================================================================
// 6. 매칭 규칙 (Matching Rules)
// ===================================================================
/**
 * 카드 매칭은 같은 월끼리만 가능합니다.
 *
 * 매칭 시나리오:
 * 1. 바닥에 0장: 내 패를 바닥에 내려놓음
 * 2. 바닥에 1장: 내 패와 바닥 패 매칭, 2장 가져감
 * 3. 바닥에 2장: 바닥 패 중 1장 선택하여 매칭
 * 4. 바닥에 3장: 내 패 포함 4장 모두 가져감 (폭탄/싹쓸이)
 */
export const MATCHING_RULES = {
  // 기본 매칭
  basic: {
    id: 'basic',
    name: '기본 매칭',
    description: '같은 월의 패끼리만 매칭 가능',
    check: (card1, card2) => card1.month === card2.month,
  },

  // 매칭 시나리오별 동작
  scenarios: [
    {
      floorCount: 0,
      action: 'place',
      description: '바닥에 내려놓기',
      detail: '같은 월 패가 없으면 바닥에 내려놓음',
    },
    {
      floorCount: 1,
      action: 'take',
      description: '2장 가져가기',
      detail: '내 패 + 바닥 패 = 2장 획득',
      bonus: null,
    },
    {
      floorCount: 2,
      action: 'select',
      description: '1장 선택 후 가져가기',
      detail: '바닥의 2장 중 1장 선택. 선택한 카드 + 내 카드 = 2장 획득',
      bonus: null,
    },
    {
      floorCount: 3,
      action: 'takeAll',
      description: '싹쓸이 (4장 모두)',
      detail: '같은 월 4장 모두 획득',
      bonus: { type: 'pi', count: 1, name: '쪽' },
    },
  ],
};

// ===================================================================
// 7. 특수 규칙 (Special Rules)
// ===================================================================
export const SPECIAL_RULES = [
  {
    id: 'go',
    name: '고 (Go)',
    description: '점수가 나면 "고"를 외쳐 게임을 계속할 수 있음',
    effects: [
      { goCount: 1, multiplier: 2, description: '1번 고: 점수 2배' },
      { goCount: 2, multiplier: 4, description: '2번 고: 점수 4배' },
      { goCount: 3, multiplier: 8, description: '3번 고 이상: 계속 2배씩' },
    ],
  },
  {
    id: 'ppuk',
    name: '뻑 (Ppuk)',
    description: '같은 월 패가 바닥에 1장 있을 때 낸 패도 같은 월이면 뻑',
    penalty: { ppukCount: 3, effect: '상대방에게 벌칙' },
  },
  {
    id: 'jjok',
    name: '쪽',
    description: '바닥의 패 2장과 내 패 1장이 매칭',
    bonus: { type: 'pi', count: 1 },
  },
  {
    id: 'ssaksseuli',
    name: '싹쓸이',
    description: '내 패로 바닥 패를 모두 가져감 (바닥이 비게 됨)',
    bonus: { type: 'pi', count: 1 },
  },
  {
    id: 'poktan',
    name: '폭탄',
    description: '같은 월 패 4장이 한 손에 있으면',
    effect: '해당 월 패 4장 모두 즉시 획득',
  },
  {
    id: 'heundeulgi',
    name: '흔들기',
    description: '같은 월 3장을 가지고 시작 시 선택적 공개',
    bonus: { multiplier: 2, description: '점수 2배' },
  },
  {
    id: 'nagari',
    name: '나가리',
    description: '덱이 다 떨어질 때까지 아무도 점수를 내지 못함',
    effect: '무승부 (판돈 유지 후 재경기)',
  },
];

// ===================================================================
// 8. 게임 설정 (Game Settings)
// ===================================================================
export const GAME_SETTINGS = {
  players: {
    min: 2,
    max: 3,
    default: 2,
  },
  cards: {
    total: 48,
    perPlayer: {
      2: 10, // 2인: 각 10장
      3: 7,  // 3인: 각 7장
    },
    floor: {
      2: 8,  // 2인: 바닥 8장
      3: 6,  // 3인: 바닥 6장
    },
  },
  winCondition: {
    minScore: 3,  // 최소 승리 점수
    defaultTarget: 7, // 기본 목표 점수
  },
};

// ===================================================================
// 9. 유틸리티 함수 (Utility Functions)
// ===================================================================

/**
 * 획득한 카드로 점수 계산
 * @param {Array} capturedCards - 획득한 카드 배열
 * @returns {Object} { total: number, breakdown: Array }
 */
export const calculateScore = (capturedCards) => {
  const breakdown = [];
  let total = 0;

  for (const rule of SCORING_RULES) {
    if (rule.checkFn(capturedCards)) {
      const score = rule.scoreFn
        ? rule.scoreFn(capturedCards)
        : rule.score;

      if (score > 0) {
        breakdown.push({
          rule: rule.name,
          score: score,
          description: rule.condition,
        });
        total += score;
      }
    }
  }

  return { total, breakdown };
};

/**
 * 카드 매칭 가능 여부 체크
 * @param {Object} card1
 * @param {Object} card2
 * @returns {boolean}
 */
export const canMatch = (card1, card2) => {
  return MATCHING_RULES.basic.check(card1, card2);
};

/**
 * 바닥 카드 상황에 따른 액션 결정
 * @param {Array} floorCards - 같은 월의 바닥 카드들
 * @returns {Object} 매칭 시나리오
 */
export const getMatchingScenario = (floorCards) => {
  const count = floorCards.length;
  return MATCHING_RULES.scenarios.find(s => s.floorCount === count)
    || MATCHING_RULES.scenarios[0];
};

export default {
  CARD_TYPES,
  CARD_SUBTYPES,
  MONTH_INFO,
  HWATU_DECK,
  SCORING_RULES,
  MATCHING_RULES,
  SPECIAL_RULES,
  GAME_SETTINGS,
  calculateScore,
  canMatch,
  getMatchingScenario,
};
