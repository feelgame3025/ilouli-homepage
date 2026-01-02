/**
 * ===================================================================
 * 고스톱 게임 스펙 (GoStop Game Specification)
 * ===================================================================
 *
 * 이 파일은 고스톱 게임의 모든 규칙과 카드 정의를 담고 있습니다.
 * 새로운 룰을 추가하거나 수정할 때 이 파일만 편집하면 됩니다.
 *
 * 구조:
 * 0. HWATU_IMAGE_MAP - 화투 이미지 매핑
 * 1. CARD_TYPES - 카드 종류 정의
 * 2. CARD_SUBTYPES - 카드 서브타입 정의
 * 3. MONTH_INFO - 월별 정보
 * 4. HWATU_DECK - 48장 카드 데이터
 * 5. SCORING_RULES - 점수 계산 규칙
 * 6. MATCHING_RULES - 매칭 규칙
 * 7. SPECIAL_RULES - 특수 규칙
 * 8. MULTIPLIER_RULES - 배율 계산 시스템
 * 9. GO_STOP_RULES - 고/스톱 선택 규칙
 * 10. Final Score Calculation - 최종 점수 계산 함수들
 * 11. GAME_SETTINGS - 게임 설정
 * 12. Utility Functions - 유틸리티 함수들
 */

// ===================================================================
// 0. 화투 이미지 매핑 (Hwatu Image Map)
// ===================================================================
export const HWATU_IMAGE_MAP = {
  '1-1': '1767313961055-593956290.png',  // 62K
  '1-2': '1767313960978-907622088.png',  // 59K
  '1-3': '1767313960932-771676234.png',  // 27K
  '1-4': '1767313960863-667088177.png',  // 35K
  '2-1': '1767313961234-239039929.png',  // 107K
  '2-2': '1767313961202-874397884.png',  // 106K
  '2-3': '1767313961214-671014154.png',  // 73K
  '2-4': '1767313961084-93804246.png',   // 86K
  '3-1': '1767313960950-857072578.png',  // 119K
  '3-2': '1767313961005-815162896.png',  // 119K
  '3-3': '1767313961044-542049277.png',  // 112K
  '3-4': '1767313960879-395724033.png',  // 103K
  '4-1': '1767313961151-140243789.png',  // 95K
  '4-2': '1767313961068-119198447.png',  // 63K
  '4-3': '1767313961103-820602257.png',  // 57K
  '4-4': '1767313961187-72022859.png',   // 55K
  '5-1': '1767313960787-346504025.png',  // 105K
  '5-2': '1767313960892-141324195.png',  // 62K
  '5-3': '1767313960919-426003686.png',  // 57K
  '5-4': '1767313961020-362303704.png',  // 56K
  '6-1': '1767313961118-273954114.png',  // 111K
  '6-2': '1767313961175-912393657.png',  // 86K
  '6-3': '1767313961133-483871705.png',  // 90K
  '6-4': '1767313961247-678341460.png',  // 72K
  '7-1': '1767313960908-71867874.png',   // 111K
  '7-2': '1767313960850-8394750.png',    // 76K
  '7-3': '1767313960819-14746724.png',   // 83K
  '7-4': '1767313960967-189073140.png',  // 83K
  '8-1': '1767313961396-9017818.png',    // 39K
  '8-2': '1767313961432-161892793.png',  // 60K
  '8-3': '1767313961407-23032721.png',   // 11K
  '8-4': '1767313961371-639202696.png',  // 11K
  '9-1': '1767313961540-802075219.png',  // 105K
  '9-2': '1767313961515-942460763.png',  // 90K
  '9-3': '1767313961494-777949904.png',  // 77K
  '9-4': '1767313961459-853720886.png',  // 79K
  '10-1': '1767313961309-156171942.png', // 141K
  '10-2': '1767313961363-856430695.png', // 107K
  '10-3': '1767313961327-816524851.png', // 105K
  '10-4': '1767313961420-166464883.png', // 94K
  '11-1': '1767313961482-528321818.png', // 95K
  '11-2': '1767313961470-195154952.png', // 45K
  '11-3': '1767313961447-517248176.png', // 37K
  '11-4': '1767313961525-326287760.png', // 41K
  '12-1': '1767313961348-409931881.png', // 102K
  '12-2': '1767313961263-366817945.png', // 78K
  '12-3': '1767313961275-982195685.png', // 48K
  '12-4': '1767313961384-993638532.png', // 90K
};

// 이미지 URL 생성 함수
export const getHwatuImageUrl = (month, index) => {
  const key = `${month}-${index}`;
  const filename = HWATU_IMAGE_MAP[key];
  return filename ? `/assets/hwatu/${filename}` : null;
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
// 8. 특수 액션 - 흔들기/폭탄 (Special Actions - Shaking/Bomb)
// ===================================================================
/**
 * 특수 액션 규칙
 * - 흔들기: 같은 월 3장 보유 시 선언 가능, 이기면 2배
 * - 폭탄: 초기 손패에 같은 월 4장 보유 시 자동 발동, 이기면 2배
 */
export const SPECIAL_ACTIONS = {
  흔들기: {
    id: 'heundeulgi',
    name: '흔들기',
    nameEn: 'Shaking',
    condition: '같은 월 3장 보유',
    multiplier: 2,
    description: '같은 월의 패를 3장 가지고 있을 때 선언. 이기면 2배',
    isOptional: true, // 선택적 발동
    triggerPhase: 'onPlay', // 패를 낼 때 선택
    /**
     * 흔들기 가능한 월 찾기
     * @param {Array} handCards - 손패
     * @returns {Array} 흔들기 가능한 월 배열
     */
    checkFn: (handCards) => {
      const monthCounts = {};
      handCards.forEach(c => {
        monthCounts[c.month] = (monthCounts[c.month] || 0) + 1;
      });
      return Object.entries(monthCounts)
        .filter(([month, count]) => count >= 3)
        .map(([month]) => parseInt(month));
    }
  },
  폭탄: {
    id: 'poktan',
    name: '폭탄',
    nameEn: 'Bomb',
    condition: '같은 월 4장 보유 (초기 손패)',
    multiplier: 2,
    description: '처음 손패에 같은 월 4장이 있으면 자동 발동. 이기면 2배',
    isOptional: false, // 자동 발동
    triggerPhase: 'onDeal', // 게임 시작 시 자동 체크
    /**
     * 폭탄 발동 가능한 월 찾기
     * @param {Array} handCards - 초기 손패
     * @returns {Array} 폭탄 발동 가능한 월 배열
     */
    checkFn: (handCards) => {
      const monthCounts = {};
      handCards.forEach(c => {
        monthCounts[c.month] = (monthCounts[c.month] || 0) + 1;
      });
      return Object.entries(monthCounts)
        .filter(([month, count]) => count === 4)
        .map(([month]) => parseInt(month));
    }
  }
};

// ===================================================================
// 9. 배율 계산 시스템 (Multiplier System)
// ===================================================================
/**
 * 배율은 곱셈 방식으로 누적됩니다.
 * 예: 흔들기(2배) + 폭탄(2배) = 4배
 */
export const MULTIPLIER_RULES = {
  // 선언 배율
  heundeulgi: {
    name: '흔들기',
    multiplier: 2,
    stackable: true,
    description: '같은 월 3장 공개. 여러 월 가능 (각각 2배씩 곱셈)',
  },
  bomb: {
    name: '폭탄',
    multiplier: 2,
    stackable: true,
    description: '같은 월 4장 한 손에 보유. 여러 월 가능 (각각 2배씩 곱셈)',
  },

  // 게임 중 배율
  ppuk: {
    name: '뻑',
    multiplier: 2,
    stackable: true,
    description: '3번 뻑 발생 시 배율 적용',
  },
  ssul: {
    name: '쓸',
    multiplier: 2,
    stackable: true,
    description: '싹쓸이 배율',
  },

  // 패배 배율 (상대가 이길 때 적용)
  gwangBak: {
    name: '광박',
    multiplier: 2,
    condition: '광 0장으로 패배',
    description: '상대가 광패를 하나도 못 먹었을 때',
  },
  piBak: {
    name: '피박',
    multiplier: 2,
    condition: '피 7장 미만으로 패배',
    description: '상대가 피를 7장 미만으로 먹었을 때',
  },
  meongBak: {
    name: '멍박',
    multiplier: 2,
    condition: '열끗 0장으로 패배',
    description: '상대가 열끗을 하나도 못 먹었을 때',
  },

  // 연속 배율
  goCount: {
    name: '고 횟수',
    multiplierPerGo: 1,
    description: '고를 외칠 때마다 +1점 (배율 아님)',
  },
};

// ===================================================================
// 9. 고/스톱 선택 규칙 (Go/Stop Decision Rules)
// ===================================================================
/**
 * 고/스톱 결정 규칙
 * - 최소 7점 달성 시 스톱 선택 가능
 * - 먼저 7점 달성한 사람은 +3점 보너스
 * - 고 선택 시 매 고마다 +1점
 * - 고 후 상대가 먼저 점수 내면 배율 적용됨
 */
export const GO_STOP_RULES = {
  minScore: 7,  // 최소 7점부터 스톱 가능
  firstWinBonus: 3,  // 먼저 7점 달성 시 추가 3점
  goBonus: 1,  // 고 선언마다 +1점
  maxGo: 3,    // 최대 3고까지 (선택적 규칙)

  // 고 선택 시 리스크
  goRisk: {
    description: '고 선언 후 상대가 먼저 점수 도달하면 배율 적용',
    penalty: 'multiplied',
    detail: '상대가 나중에 이기면 모든 배율이 상대 점수에 적용됨',
  },

  // 스톱 조건
  stopConditions: {
    normal: {
      minScore: 7,
      bonus: 0,
      description: '일반적인 스톱',
    },
    firstWin: {
      minScore: 7,
      bonus: 3,
      description: '먼저 7점 달성 시 +3점',
    },
  },
};

/**
 * 스톱 가능 여부 확인
 * @param {number} score - 현재 점수
 * @param {boolean} isFirstWin - 먼저 7점 달성 여부
 * @returns {boolean}
 */
export const canStop = (score, isFirstWin = false) => {
  return score >= GO_STOP_RULES.minScore;
};

/**
 * 고 보너스 계산
 * @param {number} goCount - 고를 외친 횟수
 * @returns {number} 고 보너스 점수
 */
export const calculateGoBonus = (goCount) => {
  return goCount * GO_STOP_RULES.goBonus;
};

/**
 * 스톱 시 최종 점수 계산
 * @param {number} baseScore - 기본 점수
 * @param {number} goCount - 고 횟수
 * @param {boolean} isFirstWin - 먼저 승리 여부
 * @returns {number}
 */
export const calculateStopScore = (baseScore, goCount = 0, isFirstWin = false) => {
  let total = baseScore;

  // 고 보너스
  total += calculateGoBonus(goCount);

  // 먼저 승리 보너스
  if (isFirstWin) {
    total += GO_STOP_RULES.firstWinBonus;
  }

  return total;
};

// ===================================================================
// 10. 최종 점수 계산 (Final Score Calculation)
// ===================================================================
/**
 * 패배 조건 체크 함수들
 */
export const isGwangBak = (capturedCards) => {
  const gwang = capturedCards.filter(c => c.type === '광');
  return gwang.length === 0;
};

export const isPiBak = (capturedCards) => {
  const piCount = capturedCards.reduce((sum, c) => sum + c.piCount, 0);
  return piCount < 7;
};

export const isMeongBak = (capturedCards) => {
  const yeol = capturedCards.filter(c => c.type === '열끗');
  return yeol.length === 0;
};

/**
 * 배율 계산
 * @param {Object} gameState - 게임 상태
 * @param {Object} opponent - 상대방 정보
 * @returns {number} 최종 배율
 */
export const calculateMultiplier = (gameState, opponent = null) => {
  let multiplier = 1;

  // 1. 흔들기 배율 (여러 번 가능)
  if (gameState.heundeulgiCount > 0) {
    multiplier *= Math.pow(2, gameState.heundeulgiCount);
  }

  // 2. 폭탄 배율 (여러 번 가능)
  if (gameState.bombCount > 0) {
    multiplier *= Math.pow(2, gameState.bombCount);
  }

  // 3. 뻑 배율 (3번 이상 시)
  if (gameState.ppukCount >= 3) {
    const ppukMultiplierCount = Math.floor(gameState.ppukCount / 3);
    multiplier *= Math.pow(2, ppukMultiplierCount);
  }

  // 4. 쓸 배율
  if (gameState.ssulCount > 0) {
    multiplier *= Math.pow(2, gameState.ssulCount);
  }

  // 5. 상대 벌칙 배율 (상대가 박 당한 경우)
  if (opponent && opponent.captured) {
    if (isGwangBak(opponent.captured)) {
      multiplier *= 2;
    }
    if (isPiBak(opponent.captured)) {
      multiplier *= 2;
    }
    if (isMeongBak(opponent.captured)) {
      multiplier *= 2;
    }
  }

  return multiplier;
};

/**
 * 최종 점수 계산 (배율 포함)
 * @param {Object} gameState - 게임 상태 { capturedCards, goCount, heundeulgiCount, bombCount, ppukCount, ssulCount }
 * @param {Object} opponent - 상대방 정보 { captured }
 * @param {boolean} isFirstWin - 먼저 승리 여부
 * @returns {Object} { baseScore, goBonus, firstWinBonus, multiplier, finalScore, breakdown }
 */
export const calculateFinalScore = (gameState, opponent = null, isFirstWin = false) => {
  // 1. 기본 점수 계산 (SCORING_RULES 사용)
  const scoreResult = calculateScore(gameState.capturedCards);
  let baseScore = scoreResult.total;

  // 2. 고 보너스
  const goBonus = calculateGoBonus(gameState.goCount || 0);
  baseScore += goBonus;

  // 3. 먼저 승리 보너스
  const firstWinBonus = isFirstWin ? GO_STOP_RULES.firstWinBonus : 0;
  baseScore += firstWinBonus;

  // 4. 배율 계산
  const multiplier = calculateMultiplier(gameState, opponent);

  // 5. 최종 점수
  const finalScore = baseScore * multiplier;

  // 6. 상세 내역
  const breakdown = {
    scoringRules: scoreResult.breakdown,
    goBonus: goBonus,
    firstWinBonus: firstWinBonus,
    subtotal: baseScore,
    multipliers: [],
    finalScore: finalScore,
  };

  // 배율 상세
  if (gameState.heundeulgiCount > 0) {
    breakdown.multipliers.push({
      name: '흔들기',
      count: gameState.heundeulgiCount,
      multiplier: Math.pow(2, gameState.heundeulgiCount),
    });
  }
  if (gameState.bombCount > 0) {
    breakdown.multipliers.push({
      name: '폭탄',
      count: gameState.bombCount,
      multiplier: Math.pow(2, gameState.bombCount),
    });
  }
  if (gameState.ppukCount >= 3) {
    const count = Math.floor(gameState.ppukCount / 3);
    breakdown.multipliers.push({
      name: '뻑',
      count: count,
      multiplier: Math.pow(2, count),
    });
  }
  if (gameState.ssulCount > 0) {
    breakdown.multipliers.push({
      name: '쓸',
      count: gameState.ssulCount,
      multiplier: Math.pow(2, gameState.ssulCount),
    });
  }
  if (opponent && opponent.captured) {
    if (isGwangBak(opponent.captured)) {
      breakdown.multipliers.push({ name: '광박', multiplier: 2 });
    }
    if (isPiBak(opponent.captured)) {
      breakdown.multipliers.push({ name: '피박', multiplier: 2 });
    }
    if (isMeongBak(opponent.captured)) {
      breakdown.multipliers.push({ name: '멍박', multiplier: 2 });
    }
  }

  return {
    baseScore: scoreResult.total,
    goBonus,
    firstWinBonus,
    subtotal: baseScore,
    multiplier,
    finalScore,
    breakdown,
  };
};

// ===================================================================
// 11. 게임 설정 (Game Settings)
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
// 12. 유틸리티 함수 (Utility Functions)
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
  SPECIAL_ACTIONS,
  MULTIPLIER_RULES,
  GO_STOP_RULES,
  GAME_SETTINGS,
  calculateScore,
  canMatch,
  getMatchingScenario,
  canStop,
  calculateGoBonus,
  calculateStopScore,
  isGwangBak,
  isPiBak,
  isMeongBak,
  calculateMultiplier,
  calculateFinalScore,
};
