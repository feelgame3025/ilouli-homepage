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
router.post('/upload', optionalAuth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다.' });
    }

    const userId = req.user?.id || null;
    const stmt = db.prepare(`
      INSERT INTO uploaded_files (user_id, filename, original_name, file_size, mime_type, file_path)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      req.file.filename,
      req.file.originalname,
      req.file.size,
      req.file.mimetype,
      req.file.path
    );

    res.json({
      success: true,
      file: {
        id: result.lastInsertRowid,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url: `/api/files/view/${req.file.filename}`,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: '파일 업로드 실패' });
  }
});

// 파일 목록 조회
router.get('/list', optionalAuth, (req, res) => {
  try {
    const files = db.prepare(`
      SELECT id, filename, original_name, file_size, mime_type, uploaded_at
      FROM uploaded_files
      ORDER BY uploaded_at DESC
      LIMIT 100
    `).all();

    res.json({
      files: files.map(f => ({
        id: f.id,
        filename: f.filename,
        originalName: f.original_name,
        size: f.file_size,
        mimeType: f.mime_type,
        url: `/api/files/view/${f.filename}`,
        uploadedAt: f.uploaded_at
      }))
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
    const file = db.prepare('SELECT * FROM uploaded_files WHERE filename = ?').get(filename);

    if (!file) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '파일이 존재하지 않습니다.' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('File view error:', error);
    res.status(500).json({ error: '파일 조회 실패' });
  }
});

// 파일 삭제
router.delete('/:id', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const file = db.prepare('SELECT * FROM uploaded_files WHERE id = ?').get(id);

    if (!file) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
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
