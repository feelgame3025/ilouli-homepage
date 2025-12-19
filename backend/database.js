const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'ilouli.db');
const db = new Database(dbPath);

// 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    social_id TEXT UNIQUE,
    social_provider TEXT,
    picture TEXT,
    tier TEXT DEFAULT 'general',
    status TEXT DEFAULT 'pending',
    join_date TEXT DEFAULT (date('now')),
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// last_login 컬럼 추가 (기존 DB 마이그레이션)
try {
  db.exec(`ALTER TABLE users ADD COLUMN last_login DATETIME`);
} catch (e) {
  // 이미 존재하면 무시
}

// 기본 관리자 계정 생성
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@ilouli.com');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (name, email, password, tier, status, join_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Administrator', 'admin@ilouli.com', hashedPassword, 'admin', 'approved', '2025-01-01');
  console.log('Default admin account created');
}

module.exports = db;
