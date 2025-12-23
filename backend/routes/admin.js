const express = require('express');
const crypto = require('crypto');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 암호화 키 (실제 프로덕션에서는 환경변수로 관리)
const ENCRYPTION_KEY = process.env.API_KEY_SECRET || 'ilouli-api-key-encryption-secret-32';
const IV_LENGTH = 16;

// 암호화 함수
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// 복호화 함수
function decrypt(text) {
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return null;
  }
}

// Admin 권한 체크 미들웨어
const requireAdmin = (req, res, next) => {
  if (req.user.tier !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }
  next();
};

// ============================================
// API 키 상태 조회
// ============================================
router.get('/api-keys/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const keys = db.prepare(`
      SELECT key_name FROM api_keys WHERE is_active = 1
    `).all();

    const status = {
      openai: false,
      kling: false,
      replicate: false
    };

    keys.forEach(k => {
      if (status.hasOwnProperty(k.key_name)) {
        status[k.key_name] = true;
      }
    });

    res.json({ success: true, status });
  } catch (error) {
    console.error('API key status error:', error);
    res.status(500).json({ error: 'API 키 상태 조회 실패' });
  }
});

// ============================================
// API 키 저장
// ============================================
router.post('/api-keys', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { keyName, keyValue } = req.body;

    if (!keyName || !keyValue) {
      return res.status(400).json({ error: 'API 키 이름과 값이 필요합니다.' });
    }

    const validKeys = ['openai', 'kling', 'replicate'];
    if (!validKeys.includes(keyName)) {
      return res.status(400).json({ error: '유효하지 않은 API 키 이름입니다.' });
    }

    // 기존 키 삭제
    db.prepare('DELETE FROM api_keys WHERE key_name = ?').run(keyName);

    // 암호화하여 저장
    const encryptedValue = encrypt(keyValue);

    db.prepare(`
      INSERT INTO api_keys (key_name, key_value, is_active, created_at, updated_at)
      VALUES (?, ?, 1, datetime('now'), datetime('now'))
    `).run(keyName, encryptedValue);

    res.json({ success: true, message: 'API 키가 저장되었습니다.' });
  } catch (error) {
    console.error('API key save error:', error);
    res.status(500).json({ error: 'API 키 저장 실패' });
  }
});

// ============================================
// API 키 삭제
// ============================================
router.delete('/api-keys/:keyName', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { keyName } = req.params;

    db.prepare('DELETE FROM api_keys WHERE key_name = ?').run(keyName);

    res.json({ success: true, message: 'API 키가 삭제되었습니다.' });
  } catch (error) {
    console.error('API key delete error:', error);
    res.status(500).json({ error: 'API 키 삭제 실패' });
  }
});

// ============================================
// API 키 조회 (내부용 - 암호화된 키 복호화)
// ============================================
function getApiKey(keyName) {
  try {
    const row = db.prepare(`
      SELECT key_value FROM api_keys WHERE key_name = ? AND is_active = 1
    `).get(keyName);

    if (!row) return null;

    return decrypt(row.key_value);
  } catch (error) {
    console.error('Get API key error:', error);
    return null;
  }
}

module.exports = router;
module.exports.getApiKey = getApiKey;
