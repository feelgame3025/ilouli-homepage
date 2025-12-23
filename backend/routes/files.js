const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// uploads 디렉토리 생성
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
  }
});

// 파일 업로드
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다.' });
    }

    const userId = req.user.id;
    const folder = req.body.folder || '기본';

    const stmt = db.prepare(`
      INSERT INTO uploaded_files (user_id, filename, original_name, file_size, mime_type, file_path, folder)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      req.file.filename,
      req.file.originalname,
      req.file.size,
      req.file.mimetype,
      req.file.path,
      folder
    );

    res.json({
      success: true,
      file: {
        id: result.lastInsertRowid,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        folder: folder,
        url: `/api/files/view/${req.file.filename}`,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('File upload error:', error);

    // 업로드 실패 시 파일 삭제
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: '파일 업로드 실패' });
  }
});

// 파일 목록 조회
router.get('/list', optionalAuth, (req, res) => {
  try {
    const { folder, limit = 100, offset = 0 } = req.query;
    const userId = req.user?.id;

    // Admin은 모든 파일, 일반 사용자는 본인 파일만, 비로그인은 빈 배열
    let query = `
      SELECT id, filename, original_name, file_size, mime_type, folder, uploaded_at, user_id
      FROM uploaded_files
    `;
    const params = [];

    if (!req.user) {
      // 비로그인 사용자는 빈 배열 반환
      return res.json({ files: [] });
    }

    // Admin이 아니면 본인 파일만
    if (req.user.tier !== 'admin') {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }

    // 폴더 필터링
    if (folder) {
      query += params.length > 0 ? ' AND folder = ?' : ' WHERE folder = ?';
      params.push(folder);
    }

    query += ' ORDER BY folder, uploaded_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const files = db.prepare(query).all(...params);

    res.json({
      files: files.map(f => ({
        id: f.id,
        filename: f.filename,
        originalName: f.original_name,
        size: f.file_size,
        mimeType: f.mime_type,
        folder: f.folder || '기본',
        url: `/api/files/view/${f.filename}`,
        uploadedAt: f.uploaded_at,
        isOwner: f.user_id === userId
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: files.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('File list error:', error);
    res.status(500).json({ error: '파일 목록 조회 실패' });
  }
});

// 파일 보기/다운로드
router.get('/view/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // Path traversal 방지: filename에 경로 구분자가 포함되어 있으면 거부
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: '잘못된 파일명입니다.' });
    }

    const file = db.prepare('SELECT * FROM uploaded_files WHERE filename = ?').get(filename);

    if (!file) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    const filePath = path.join(uploadsDir, filename);
    const normalizedPath = path.normalize(filePath);

    // 추가 보안 검증: 정규화된 경로가 uploads 디렉토리 내에 있는지 확인
    if (!normalizedPath.startsWith(uploadsDir)) {
      console.error('Path traversal attempt:', { filename, filePath, normalizedPath });
      return res.status(403).json({ error: '접근이 거부되었습니다.' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '파일이 존재하지 않습니다.' });
    }

    // Content-Type 설정
    res.setHeader('Content-Type', file.mime_type);
    res.sendFile(filePath);
  } catch (error) {
    console.error('File view error:', error);
    res.status(500).json({ error: '파일 조회 실패' });
  }
});

// 파일 삭제
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const file = db.prepare('SELECT * FROM uploaded_files WHERE id = ?').get(id);

    if (!file) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    // 권한 확인: 파일 소유자 또는 Admin만 삭제 가능
    const isOwner = file.user_id === req.user.id;
    const isAdmin = req.user.tier === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: '파일을 삭제할 권한이 없습니다.' });
    }

    // 파일 시스템에서 삭제
    const filePath = path.join(uploadsDir, file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // DB에서 삭제
    db.prepare('DELETE FROM uploaded_files WHERE id = ?').run(id);

    res.json({ success: true, message: '파일이 삭제되었습니다.' });
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({ error: '파일 삭제 실패' });
  }
});

module.exports = router;
