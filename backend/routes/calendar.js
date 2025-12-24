const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const { google } = require('googleapis');

// Google OAuth 설정
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://api.ilouli.com/api/calendar/auth/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
];

// OAuth2 클라이언트 생성
const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
};

// 사용자의 OAuth2 클라이언트 가져오기 (토큰 포함)
const getUserOAuth2Client = async (userId) => {
  const tokenRow = db.prepare(`
    SELECT * FROM google_tokens WHERE user_id = ?
  `).get(userId);

  if (!tokenRow) {
    return null;
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    token_type: tokenRow.token_type,
    expiry_date: new Date(tokenRow.expires_at).getTime()
  });

  // 토큰 갱신 이벤트 핸들러
  oauth2Client.on('tokens', (tokens) => {
    console.log('Token refreshed for user:', userId);

    const updateData = {
      access_token: tokens.access_token,
      updated_at: new Date().toISOString()
    };

    if (tokens.expiry_date) {
      updateData.expires_at = new Date(tokens.expiry_date).toISOString();
    }

    db.prepare(`
      UPDATE google_tokens
      SET access_token = ?, expires_at = ?, updated_at = ?
      WHERE user_id = ?
    `).run(
      updateData.access_token,
      updateData.expires_at || tokenRow.expires_at,
      updateData.updated_at,
      userId
    );
  });

  return oauth2Client;
};

// ============================================================================
// OAuth 인증 엔드포인트
// ============================================================================

// GET /auth/url - OAuth 인증 URL 생성
router.get('/auth/url', authMiddleware, (req, res) => {
  try {
    const oauth2Client = createOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // refresh_token 받기 위해 필수
      scope: SCOPES,
      prompt: 'consent', // 항상 refresh_token 받기 위해
      state: req.user.id.toString() // 사용자 ID 전달
    });

    res.json({ url: authUrl });
  } catch (error) {
    console.error('Failed to generate auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// GET /auth/callback - OAuth 콜백 처리
router.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error('OAuth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'https://family.ilouli.com'}/calendar?error=${error}`);
  }

  if (!code || !state) {
    return res.redirect(`${process.env.FRONTEND_URL || 'https://family.ilouli.com'}/calendar?error=missing_params`);
  }

  const userId = parseInt(state, 10);

  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.error('No refresh token received');
      return res.redirect(`${process.env.FRONTEND_URL || 'https://family.ilouli.com'}/calendar?error=no_refresh_token`);
    }

    // 토큰 저장 (기존 것이 있으면 업데이트)
    const expiresAt = new Date(tokens.expiry_date).toISOString();
    const now = new Date().toISOString();

    const existingToken = db.prepare('SELECT id FROM google_tokens WHERE user_id = ?').get(userId);

    if (existingToken) {
      db.prepare(`
        UPDATE google_tokens
        SET access_token = ?, refresh_token = ?, token_type = ?, scope = ?, expires_at = ?, updated_at = ?
        WHERE user_id = ?
      `).run(
        tokens.access_token,
        tokens.refresh_token,
        tokens.token_type || 'Bearer',
        tokens.scope,
        expiresAt,
        now,
        userId
      );
    } else {
      db.prepare(`
        INSERT INTO google_tokens (user_id, access_token, refresh_token, token_type, scope, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        tokens.access_token,
        tokens.refresh_token,
        tokens.token_type || 'Bearer',
        tokens.scope,
        expiresAt,
        now,
        now
      );
    }

    console.log('Google Calendar connected for user:', userId);
    res.redirect(`${process.env.FRONTEND_URL || 'https://family.ilouli.com'}/calendar?connected=true`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'https://family.ilouli.com'}/calendar?error=token_exchange_failed`);
  }
});

// GET /auth/status - 연결 상태 확인
router.get('/auth/status', authMiddleware, async (req, res) => {
  try {
    const oauth2Client = await getUserOAuth2Client(req.user.id);

    if (!oauth2Client) {
      return res.json({ connected: false });
    }

    // 토큰 유효성 확인 (간단한 API 호출)
    try {
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      await calendar.calendarList.list({ maxResults: 1 });
      res.json({ connected: true });
    } catch (error) {
      if (error.code === 401 || error.code === 403) {
        // 토큰이 완전히 만료됨 - 삭제
        db.prepare('DELETE FROM google_tokens WHERE user_id = ?').run(req.user.id);
        res.json({ connected: false, reason: 'token_expired' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// POST /auth/disconnect - 연결 해제
router.post('/auth/disconnect', authMiddleware, async (req, res) => {
  try {
    const oauth2Client = await getUserOAuth2Client(req.user.id);

    if (oauth2Client) {
      // Google에서 토큰 폐기 시도
      try {
        await oauth2Client.revokeCredentials();
      } catch (e) {
        console.log('Token revocation failed (may already be invalid):', e.message);
      }
    }

    // DB에서 토큰 삭제
    db.prepare('DELETE FROM google_tokens WHERE user_id = ?').run(req.user.id);

    res.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// ============================================================================
// Calendar API 프록시 엔드포인트
// ============================================================================

// GET /events - 이벤트 목록 조회
router.get('/events', authMiddleware, async (req, res) => {
  try {
    const oauth2Client = await getUserOAuth2Client(req.user.id);

    if (!oauth2Client) {
      return res.status(401).json({ error: 'Google Calendar not connected' });
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const timeMin = req.query.timeMin || new Date().toISOString();
    const timeMax = req.query.timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      showDeleted: false,
      singleEvents: true,
      maxResults: 100,
      orderBy: 'startTime'
    });

    const events = (response.data.items || []).map(event => ({
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
      createdAt: event.created
    }));

    res.json({ events });
  } catch (error) {
    console.error('Failed to fetch events:', error);

    if (error.code === 401 || error.code === 403) {
      return res.status(401).json({ error: 'Token expired', needsReconnect: true });
    }

    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /events - 이벤트 생성
router.post('/events', authMiddleware, async (req, res) => {
  try {
    const oauth2Client = await getUserOAuth2Client(req.user.id);

    if (!oauth2Client) {
      return res.status(401).json({ error: 'Google Calendar not connected' });
    }

    const { title, description, date, time, allDay } = req.body;

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: title,
      description: description || '',
      start: allDay
        ? { date }
        : { dateTime: `${date}T${time || '09:00'}:00`, timeZone: 'Asia/Seoul' },
      end: allDay
        ? { date }
        : { dateTime: `${date}T${time || '10:00'}:00`, timeZone: 'Asia/Seoul' }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });

    res.json({ success: true, event: response.data });
  } catch (error) {
    console.error('Failed to create event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /events/:eventId - 이벤트 수정
router.put('/events/:eventId', authMiddleware, async (req, res) => {
  try {
    const oauth2Client = await getUserOAuth2Client(req.user.id);

    if (!oauth2Client) {
      return res.status(401).json({ error: 'Google Calendar not connected' });
    }

    const { eventId } = req.params;
    const { title, description, date, time, allDay } = req.body;

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: title,
      description: description || '',
      start: allDay
        ? { date }
        : { dateTime: `${date}T${time || '09:00'}:00`, timeZone: 'Asia/Seoul' },
      end: allDay
        ? { date }
        : { dateTime: `${date}T${time || '10:00'}:00`, timeZone: 'Asia/Seoul' }
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      resource: event
    });

    res.json({ success: true, event: response.data });
  } catch (error) {
    console.error('Failed to update event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /events/:eventId - 이벤트 삭제
router.delete('/events/:eventId', authMiddleware, async (req, res) => {
  try {
    const oauth2Client = await getUserOAuth2Client(req.user.id);

    if (!oauth2Client) {
      return res.status(401).json({ error: 'Google Calendar not connected' });
    }

    const { eventId } = req.params;

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
