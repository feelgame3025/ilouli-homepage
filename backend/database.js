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

// 파일 업로드 테이블
db.exec(`
  CREATE TABLE IF NOT EXISTS uploaded_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    file_path TEXT NOT NULL,
    folder TEXT DEFAULT '기본',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  )
`);

// folder 컬럼 추가 (기존 DB 마이그레이션)
try {
  db.exec(`ALTER TABLE uploaded_files ADD COLUMN folder TEXT DEFAULT '기본'`);
} catch (e) {
  // 이미 존재하면 무시
}

// 게임 점수 테이블
db.exec(`
  CREATE TABLE IF NOT EXISTS game_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    game_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  )
`);

// AI 작업 테이블
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    job_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    input_file TEXT,
    output_file TEXT,
    parameters TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// AI 작업 인덱스
try {
  db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_jobs_user ON ai_jobs(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_jobs_type ON ai_jobs(job_type)`);
} catch (e) {
  // 이미 존재하면 무시
}

// 커뮤니티 게시글 테이블
db.exec(`
  CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    board TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// 커뮤니티 댓글 테이블
db.exec(`
  CREATE TABLE IF NOT EXISTS community_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES community_comments(id) ON DELETE CASCADE
  )
`);

// 커뮤니티 신고 테이블
db.exec(`
  CREATE TABLE IF NOT EXISTS community_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    handled_by INTEGER,
    handled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL
  )
`);

// community_reports 테이블에 status, handled_by, handled_at 컬럼 추가 (마이그레이션)
try {
  db.exec(`ALTER TABLE community_reports ADD COLUMN status TEXT DEFAULT 'pending'`);
} catch (e) {
  // 이미 존재하면 무시
}

try {
  db.exec(`ALTER TABLE community_reports ADD COLUMN handled_by INTEGER`);
} catch (e) {
  // 이미 존재하면 무시
}

try {
  db.exec(`ALTER TABLE community_reports ADD COLUMN handled_at DATETIME`);
} catch (e) {
  // 이미 존재하면 무시
}

// 커뮤니티 인덱스
try {
  db.exec(`CREATE INDEX IF NOT EXISTS idx_community_posts_board ON community_posts(board)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_community_comments_user ON community_comments(user_id)`);
} catch (e) {
  // 이미 존재하면 무시
}

// 알림 테이블
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    metadata TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// metadata 컬럼 추가 (기존 DB 마이그레이션)
try {
  db.exec(`ALTER TABLE notifications ADD COLUMN metadata TEXT`);
} catch (e) {
  // 이미 존재하면 무시
}

// 알림 인덱스
try {
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)`);
} catch (e) {
  // 이미 존재하면 무시
}

// API 키 저장 테이블
db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_name TEXT UNIQUE NOT NULL,
    key_value TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Google OAuth 토큰 테이블 (영구 캘린더 연결용)
db.exec(`
  CREATE TABLE IF NOT EXISTS google_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type TEXT DEFAULT 'Bearer',
    scope TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Google 토큰 인덱스
try {
  db.exec(`CREATE INDEX IF NOT EXISTS idx_google_tokens_user ON google_tokens(user_id)`);
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
