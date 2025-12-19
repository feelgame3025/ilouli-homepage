// 서브도메인 설정
export const HOSTS = {
  MAIN: 'main',
  AI: 'ai',
  COMMUNITY: 'community',
  FAMILY: 'family',
  ADMIN: 'admin',
  LAB: 'lab'
};

// 도메인 설정 (프로덕션/개발 환경)
const DOMAIN = process.env.REACT_APP_DOMAIN || 'ilouli.com';
const DEV_PORT = 3000;

// 현재 호스트 감지
export const getCurrentHost = () => {
  const hostname = window.location.hostname;

  // 로컬 개발 환경
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // 쿼리 파라미터로 호스트 시뮬레이션 (?host=ai)
    const params = new URLSearchParams(window.location.search);
    const hostParam = params.get('host');
    if (hostParam && Object.values(HOSTS).includes(hostParam)) {
      return hostParam;
    }
    return HOSTS.MAIN;
  }

  // 프로덕션 환경
  if (hostname === DOMAIN || hostname === `www.${DOMAIN}`) {
    return HOSTS.MAIN;
  }

  // 서브도메인 추출
  const subdomain = hostname.replace(`.${DOMAIN}`, '');

  switch (subdomain) {
    case 'ai':
      return HOSTS.AI;
    case 'community':
      return HOSTS.COMMUNITY;
    case 'family':
      return HOSTS.FAMILY;
    case 'admin':
      return HOSTS.ADMIN;
    case 'lab':
      return HOSTS.LAB;
    default:
      return HOSTS.MAIN;
  }
};

// 호스트별 URL 생성
export const getHostUrl = (host, path = '') => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // 로컬 개발 환경
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (host === HOSTS.MAIN) {
      return `${protocol}//${hostname}:${DEV_PORT}${path}`;
    }
    return `${protocol}//${hostname}:${DEV_PORT}${path}?host=${host}`;
  }

  // 프로덕션 환경
  if (host === HOSTS.MAIN) {
    return `${protocol}//${DOMAIN}${path}`;
  }

  return `${protocol}//${host}.${DOMAIN}${path}`;
};

// 호스트 정보
export const HOST_INFO = {
  [HOSTS.MAIN]: {
    name: 'ilouli.com',
    title: 'ilouli.com',
    description: '창작, 연결, 그리고 유산'
  },
  [HOSTS.AI]: {
    name: 'AI 기능',
    title: 'AI - ilouli.com',
    description: 'AI 기반 창작 도구'
  },
  [HOSTS.COMMUNITY]: {
    name: '커뮤니티',
    title: 'Community - ilouli.com',
    description: '아이디어를 공유하고 소통하세요'
  },
  [HOSTS.FAMILY]: {
    name: '가족 공간',
    title: 'Family - ilouli.com',
    description: '가족을 위한 프라이빗 공간'
  },
  [HOSTS.ADMIN]: {
    name: '관리자',
    title: 'Admin - ilouli.com',
    description: '관리자 대시보드'
  },
  [HOSTS.LAB]: {
    name: '관리자 랩',
    title: 'Lab - ilouli.com',
    description: '새로운 기능 테스트'
  }
};

// 호스트별 필요 권한
export const HOST_REQUIRED_TIERS = {
  [HOSTS.MAIN]: null, // 누구나 접근 가능
  [HOSTS.AI]: ['subscriber', 'family', 'admin'],
  [HOSTS.COMMUNITY]: null, // 누구나 접근 가능 (글쓰기는 회원만)
  [HOSTS.FAMILY]: ['family', 'admin'],
  [HOSTS.ADMIN]: ['admin'],
  [HOSTS.LAB]: ['family', 'admin']
};
