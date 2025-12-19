// 소셜 로그인 서비스 (Google, Kakao)

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const KAKAO_APP_KEY = process.env.REACT_APP_KAKAO_APP_KEY;

let googleAuthInitialized = false;
let kakaoInitialized = false;

// Google OAuth 콜백 저장 키
const GOOGLE_AUTH_CALLBACK_KEY = 'google_auth_callback';
const GOOGLE_AUTH_STATE_KEY = 'google_auth_state';

// 인앱 브라우저 감지 (WebView만 - Custom Tab은 허용)
export const isInAppBrowser = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;

  // WebView 전용 패턴 (Custom Tab은 제외)
  const webViewPatterns = [
    /\bwv\b/i,              // 안드로이드 웹뷰
    /WebView/i,             // 일반 웹뷰
  ];

  // 먼저 WebView인지 확인
  const isWebView = webViewPatterns.some(pattern => pattern.test(ua));

  // 인앱 브라우저 패턴 (이들 중 일부는 Custom Tab 사용)
  const inAppPatterns = [
    /KAKAOTALK/i,          // 카카오톡 (WebView 사용)
    /Instagram/i,          // 인스타그램
    /FBAN|FBAV/i,          // 페이스북
    /Twitter/i,            // 트위터
    /Line\//i,             // 라인
  ];

  const isInApp = inAppPatterns.some(pattern => pattern.test(ua));

  return isWebView || isInApp;
};

// Google OAuth가 차단되는 WebView 환경인지 확인
export const isBlockedWebView = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;

  // WebView 감지 패턴
  const webViewPatterns = [
    /\bwv\b/i,         // Android WebView
    /WebView/i,        // Generic WebView
    /FBAN|FBAV/i,      // Facebook
    /Instagram/i,      // Instagram
    /KAKAOTALK/i,      // KakaoTalk
    /NAVER\(/i,        // Naver App (NAVER( 패턴)
    /Line\//i,         // Line
    /Twitter/i,        // Twitter
    /DaumApps/i,       // Daum
    /band\//i,         // Band
  ];

  const isWebView = webViewPatterns.some(pattern => pattern.test(ua));

  // iOS에서 Safari가 아닌 경우 (인앱 브라우저)
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isRealSafari = isIOS && /Safari/i.test(ua) && !webViewPatterns.some(p => p.test(ua));
  const isIOSWebView = isIOS && !isRealSafari;

  // Android에서 Chrome이 아닌 경우
  const isAndroid = /Android/i.test(ua);
  const hasChrome = /Chrome\/[\d.]+/i.test(ua);
  const isAndroidChrome = isAndroid && hasChrome && !/wv\b/i.test(ua);
  const isAndroidWebView = isAndroid && !isAndroidChrome;

  console.log('[Auth] User Agent:', ua);
  console.log('[Auth] isWebView:', isWebView, 'isIOSWebView:', isIOSWebView, 'isAndroidWebView:', isAndroidWebView);

  return isWebView || isIOSWebView || isAndroidWebView;
};

// 외부 브라우저로 열기
export const openInExternalBrowser = (url) => {
  const ua = navigator.userAgent;

  // Android: Intent URL 사용
  if (/Android/i.test(ua)) {
    const intentUrl = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
    return;
  }

  // iOS: Safari로 열기 시도
  if (/iPhone|iPad|iPod/i.test(ua)) {
    // x-web-search 스킴 사용 (Safari 열기)
    window.location.href = url;
    return;
  }

  // 기타: 새 창으로 열기
  window.open(url, '_blank');
};

// ==================== Google 로그인 ====================

// Google Identity Services 스크립트 로드
export const loadGoogleAuthScript = () => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('google-gis-script')) {
      if (window.google?.accounts?.id) {
        googleAuthInitialized = true;
        resolve();
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleAuthInitialized = true;
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

// Google OAuth 리다이렉트 URL 생성
const getGoogleOAuthUrl = (redirectUri) => {
  const state = Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem(GOOGLE_AUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: 'email profile',
    state: state,
    prompt: 'select_account'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// Google OAuth 콜백 처리 (URL hash에서 토큰 추출)
export const handleGoogleOAuthCallback = async () => {
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token')) {
    return null;
  }

  console.log('[Google Auth] Processing OAuth callback...');

  // URL hash에서 파라미터 추출
  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  const state = params.get('state');
  const error = params.get('error');

  // 에러 체크
  if (error) {
    console.error('[Google Auth] OAuth error:', error);
    // URL에서 hash 제거
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    throw new Error(error);
  }

  // state 검증
  const savedState = sessionStorage.getItem(GOOGLE_AUTH_STATE_KEY);
  if (state && savedState && state !== savedState) {
    console.error('[Google Auth] State mismatch');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    throw new Error('State mismatch');
  }

  if (!accessToken) {
    return null;
  }

  // URL에서 hash 제거
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  sessionStorage.removeItem(GOOGLE_AUTH_STATE_KEY);

  try {
    // 사용자 정보 가져오기
    const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(res => res.json());

    console.log('[Google Auth] User info received:', userInfo.email);

    return {
      provider: 'google',
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    };
  } catch (err) {
    console.error('[Google Auth] Failed to fetch user info:', err);
    throw err;
  }
};

// Google 로그인 실행
export const signInWithGoogle = () => {
  return new Promise(async (resolve, reject) => {
    console.log('[Google Auth] Starting login...');
    console.log('[Google Auth] Client ID:', GOOGLE_CLIENT_ID ? 'Set' : 'NOT SET');

    // WebView 환경에서는 Google OAuth가 차단됨
    if (isBlockedWebView()) {
      console.log('[Google Auth] Blocked WebView detected');
      reject({ type: 'webview_blocked', message: 'Google login is not supported in this browser' });
      return;
    }

    // 일반 팝업 모드
    // 초기화 안됐으면 먼저 초기화
    if (!googleAuthInitialized || !window.google?.accounts?.oauth2) {
      console.log('[Google Auth] Not initialized, loading script...');
      try {
        await loadGoogleAuthScript();
        // 스크립트 로드 후 잠시 대기
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error('[Google Auth] Failed to load script:', err);
        reject(new Error('Google Auth not initialized'));
        return;
      }
    }

    if (!window.google?.accounts?.oauth2) {
      console.error('[Google Auth] OAuth2 not available after script load');
      reject(new Error('Google OAuth2 not available'));
      return;
    }

    console.log('[Google Auth] Initializing token client...');

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: async (response) => {
          console.log('[Google Auth] Callback received:', response.error || 'success');

          if (response.error) {
            console.error('[Google Auth] Error in callback:', response);
            reject(response);
            return;
          }

          try {
            console.log('[Google Auth] Fetching user info...');
            // 사용자 정보 가져오기
            const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` }
            }).then(res => res.json());

            console.log('[Google Auth] User info received:', userInfo.email);

            resolve({
              provider: 'google',
              id: userInfo.sub,
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture
            });
          } catch (err) {
            console.error('[Google Auth] Failed to fetch user info:', err);
            reject(err);
          }
        },
        error_callback: (error) => {
          console.error('[Google Auth] Error callback:', error);
          reject(error);
        }
      });

      console.log('[Google Auth] Requesting access token...');
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      console.error('[Google Auth] Failed to init token client:', err);
      reject(err);
    }
  });
};

// ==================== Kakao 로그인 ====================

// Kakao SDK 스크립트 로드
export const loadKakaoScript = () => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('kakao-sdk-script')) {
      if (window.Kakao) {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(KAKAO_APP_KEY);
        }
        kakaoInitialized = true;
        resolve();
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'kakao-sdk-script';
    script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js';
    script.async = true;
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_APP_KEY);
      }
      kakaoInitialized = true;
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

// Kakao 로그인 실행
export const signInWithKakao = () => {
  return new Promise(async (resolve, reject) => {
    // 초기화 안됐으면 먼저 초기화
    if (!kakaoInitialized || !window.Kakao) {
      try {
        await loadKakaoScript();
      } catch (err) {
        reject(new Error('Kakao SDK not initialized'));
        return;
      }
    }

    window.Kakao.Auth.login({
      success: async (authObj) => {
        try {
          // 사용자 정보 요청
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: (res) => {
              const kakaoAccount = res.kakao_account;
              resolve({
                provider: 'kakao',
                id: res.id.toString(),
                email: kakaoAccount?.email || `kakao_${res.id}@kakao.local`,
                name: kakaoAccount?.profile?.nickname || '카카오 사용자',
                picture: kakaoAccount?.profile?.profile_image_url
              });
            },
            fail: (err) => {
              reject(err);
            }
          });
        } catch (err) {
          reject(err);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

// ==================== 초기화 ====================

// 모든 소셜 로그인 SDK 초기화
export const initSocialAuth = async () => {
  const results = await Promise.allSettled([
    loadGoogleAuthScript(),
    loadKakaoScript()
  ]);

  return {
    google: results[0].status === 'fulfilled',
    kakao: results[1].status === 'fulfilled'
  };
};
