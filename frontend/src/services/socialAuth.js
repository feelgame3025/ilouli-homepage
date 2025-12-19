// 소셜 로그인 서비스 (Google, Kakao)

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const KAKAO_APP_KEY = process.env.REACT_APP_KAKAO_APP_KEY;

let googleAuthInitialized = false;
let kakaoInitialized = false;

// 인앱 브라우저 감지
export const isInAppBrowser = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;

  // 일반적인 인앱 브라우저 패턴
  const inAppPatterns = [
    /KAKAOTALK/i,          // 카카오톡
    /NAVER/i,              // 네이버 앱
    /Instagram/i,          // 인스타그램
    /FBAN|FBAV/i,          // 페이스북
    /Twitter/i,            // 트위터
    /Line\//i,             // 라인
    /wv\)/i,               // 안드로이드 웹뷰
    /WebView/i,            // 일반 웹뷰
  ];

  return inAppPatterns.some(pattern => pattern.test(ua));
};

// 외부 브라우저로 열기 안내
export const getExternalBrowserUrl = () => {
  const currentUrl = window.location.href;

  // iOS Safari로 열기
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return `x-safari-${currentUrl}`;
  }

  // Android Chrome으로 열기
  return `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
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

// Google 로그인 실행
export const signInWithGoogle = () => {
  return new Promise(async (resolve, reject) => {
    console.log('[Google Auth] Starting login...');
    console.log('[Google Auth] Client ID:', GOOGLE_CLIENT_ID ? 'Set' : 'NOT SET');

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
