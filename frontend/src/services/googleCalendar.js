// Google Calendar API 서비스
// 환경변수에서 클라이언트 ID를 가져옵니다
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Google API 스크립트 로드
export const loadGoogleScripts = () => {
  return new Promise((resolve, reject) => {
    // GAPI 스크립트 로드
    if (!document.getElementById('google-api-script')) {
      const gapiScript = document.createElement('script');
      gapiScript.id = 'google-api-script';
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      gapiScript.defer = true;
      gapiScript.onload = () => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: API_KEY,
              discoveryDocs: [DISCOVERY_DOC],
            });
            gapiInited = true;
            if (gisInited) resolve();
          } catch (err) {
            reject(err);
          }
        });
      };
      document.body.appendChild(gapiScript);
    }

    // GIS 스크립트 로드 (Google Identity Services)
    if (!document.getElementById('google-gis-script')) {
      const gisScript = document.createElement('script');
      gisScript.id = 'google-gis-script';
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.async = true;
      gisScript.defer = true;
      gisScript.onload = () => {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', // 나중에 설정
        });
        gisInited = true;
        if (gapiInited) resolve();
      };
      document.body.appendChild(gisScript);
    }
  });
};

// Google 로그인
export const signInToGoogle = () => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google API not initialized'));
      return;
    }

    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        reject(resp);
        return;
      }
      // 토큰 저장
      const token = window.gapi.client.getToken();
      localStorage.setItem('google_calendar_token', JSON.stringify(token));
      resolve(token);
    };

    // 기존 토큰 확인
    const savedToken = localStorage.getItem('google_calendar_token');
    if (savedToken) {
      try {
        const token = JSON.parse(savedToken);
        window.gapi.client.setToken(token);
        resolve(token);
        return;
      } catch (e) {
        localStorage.removeItem('google_calendar_token');
      }
    }

    // 새 토큰 요청
    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

// Google 로그아웃
export const signOutFromGoogle = () => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
    localStorage.removeItem('google_calendar_token');
  }
};

// Google 연결 상태 확인
export const isGoogleConnected = () => {
  const savedToken = localStorage.getItem('google_calendar_token');
  return !!savedToken;
};

// 저장된 토큰으로 복원
export const restoreGoogleSession = async () => {
  const savedToken = localStorage.getItem('google_calendar_token');
  if (savedToken && window.gapi?.client) {
    try {
      const token = JSON.parse(savedToken);
      window.gapi.client.setToken(token);
      return true;
    } catch (e) {
      localStorage.removeItem('google_calendar_token');
    }
  }
  return false;
};

// Google 캘린더에서 이벤트 가져오기
export const fetchGoogleEvents = async (timeMin, timeMax) => {
  try {
    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90일
      showDeleted: false,
      singleEvents: true,
      maxResults: 100,
      orderBy: 'startTime',
    });

    const events = response.result.items || [];

    // Google 이벤트를 우리 형식으로 변환
    return events.map(event => ({
      id: `google_${event.id}`,
      googleId: event.id,
      title: event.summary || '(제목 없음)',
      description: event.description || '',
      date: event.start.date || event.start.dateTime?.split('T')[0],
      time: event.start.dateTime ? event.start.dateTime.split('T')[1]?.substring(0, 5) : null,
      allDay: !event.start.dateTime,
      category: 'other',
      isGoogleEvent: true,
      googleLink: event.htmlLink,
      createdAt: event.created,
    }));
  } catch (err) {
    console.error('Error fetching Google events:', err);
    throw err;
  }
};

// Google 캘린더에 이벤트 추가
export const addGoogleEvent = async (eventData) => {
  try {
    const event = {
      summary: eventData.title,
      description: eventData.description || '',
      start: eventData.allDay
        ? { date: eventData.date }
        : { dateTime: `${eventData.date}T${eventData.time || '09:00'}:00`, timeZone: 'Asia/Seoul' },
      end: eventData.allDay
        ? { date: eventData.date }
        : { dateTime: `${eventData.date}T${eventData.time || '10:00'}:00`, timeZone: 'Asia/Seoul' },
    };

    const response = await window.gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response.result;
  } catch (err) {
    console.error('Error adding Google event:', err);
    throw err;
  }
};

// Google 캘린더에서 이벤트 삭제
export const deleteGoogleEvent = async (eventId) => {
  try {
    await window.gapi.client.calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    return true;
  } catch (err) {
    console.error('Error deleting Google event:', err);
    throw err;
  }
};

// Google 캘린더에서 이벤트 수정
export const updateGoogleEvent = async (eventId, eventData) => {
  try {
    const event = {
      summary: eventData.title,
      description: eventData.description || '',
      start: eventData.allDay
        ? { date: eventData.date }
        : { dateTime: `${eventData.date}T${eventData.time || '09:00'}:00`, timeZone: 'Asia/Seoul' },
      end: eventData.allDay
        ? { date: eventData.date }
        : { dateTime: `${eventData.date}T${eventData.time || '10:00'}:00`, timeZone: 'Asia/Seoul' },
    };

    const response = await window.gapi.client.calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
    });

    return response.result;
  } catch (err) {
    console.error('Error updating Google event:', err);
    throw err;
  }
};
