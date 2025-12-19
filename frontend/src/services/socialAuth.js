// 소셜 로그인 서비스 (Google, Kakao)

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const KAKAO_APP_KEY = process.env.REACT_APP_KAKAO_APP_KEY;

let googleAuthInitialized = false;
let kakaoInitialized = false;

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
    // 초기화 안됐으면 먼저 초기화
    if (!googleAuthInitialized || !window.google?.accounts?.oauth2) {
      try {
        await loadGoogleAuthScript();
      } catch (err) {
        reject(new Error('Google Auth not initialized'));
        return;
      }
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile',
      callback: async (response) => {
        if (response.error) {
          reject(response);
          return;
        }

        try {
          // 사용자 정보 가져오기
          const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` }
          }).then(res => res.json());

          resolve({
            provider: 'google',
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture
          });
        } catch (err) {
          reject(err);
        }
      }
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
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
