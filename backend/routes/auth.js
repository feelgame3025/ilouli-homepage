const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// 로그인
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 소셜 로그인 계정은 비밀번호 로그인 불가
    if (!user.password) {
      return res.status(401).json({ error: 'Please use social login' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Account pending approval' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ error: 'Account rejected' });
    }

    // 마지막 로그인 시간 업데이트
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    const token = generateToken(user);
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 회원가입
router.post('/signup', (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, password, tier, status)
      VALUES (?, ?, ?, 'general', 'pending')
    `).run(name, email, hashedPassword);

    res.json({ pending: true, message: 'Account created, pending approval' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// 소셜 로그인
router.post('/social-login', (req, res) => {
  const { provider, id, email, name, picture } = req.body;

  try {
    const socialId = `${provider}_${id}`;

    // 기존 소셜 계정 찾기
    let user = db.prepare('SELECT * FROM users WHERE social_id = ?').get(socialId);

    // 같은 이메일로 가입된 계정 찾기
    if (!user && email) {
      user = db.prepare('SELECT * FROM users WHERE email = ? AND social_id IS NULL').get(email);

      // 기존 이메일 계정에 소셜 연동
      if (user) {
        db.prepare(`
          UPDATE users SET social_id = ?, social_provider = ?, picture = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(socialId, provider, picture, user.id);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      }
    }

    if (user) {
      if (user.status === 'rejected') {
        return res.status(403).json({ error: 'Account rejected' });
      }

      // 마지막 로그인 시간 업데이트
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
      const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);

      const token = generateToken(updatedUser);
      const { password: _, ...userWithoutPassword } = updatedUser;
      return res.json({ user: userWithoutPassword, token });
    }

    // 새 소셜 계정 생성 (자동 승인)
    const result = db.prepare(`
      INSERT INTO users (name, email, social_id, social_provider, picture, tier, status, last_login)
      VALUES (?, ?, ?, ?, ?, 'general', 'approved', CURRENT_TIMESTAMP)
    `).run(name, email, socialId, provider, picture);

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(newUser);
    const { password: _, ...userWithoutPassword } = newUser;

    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error('Social login error:', err);
    res.status(500).json({ error: 'Social login failed' });
  }
});

// 토큰으로 현재 사용자 정보 가져오기
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
