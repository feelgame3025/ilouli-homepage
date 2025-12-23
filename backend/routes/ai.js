const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const db = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// AI 작업용 디렉토리 생성
const aiUploadsDir = path.join(__dirname, '..', 'uploads', 'ai');
const aiOutputDir = path.join(__dirname, '..', 'uploads', 'ai-output');

[aiUploadsDir, aiOutputDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer 설정 (이미지 전용)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, aiUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `ai-${uniqueSuffix}${ext}`);
  }
});

const imageUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 이미지 형식입니다. (JPG, PNG, WEBP만 가능)'), false);
    }
  }
});

// ============================================
// 이미지 → 영상 변환 API
// ============================================
router.post('/image-to-video', authenticateToken, imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '이미지 파일이 필요합니다.' });
    }

    const { motionStyle = 'zoom_in', duration = 5, resolution = '1080p' } = req.body;
    const userId = req.user.id;

    // 작업 ID 생성
    const jobId = `img2vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // DB에 작업 기록
    const stmt = db.prepare(`
      INSERT INTO ai_jobs (job_id, user_id, job_type, status, input_file, parameters, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      jobId,
      userId,
      'image_to_video',
      'pending',
      req.file.filename,
      JSON.stringify({ motionStyle, duration, resolution })
    );

    // TODO: 실제 AI 서비스 연동 (Kling AI, Runway 등)
    // 현재는 Mock 응답 반환

    // 비동기 처리 시뮬레이션 (실제로는 작업 큐에 추가)
    setTimeout(() => {
      db.prepare(`
        UPDATE ai_jobs SET status = 'completed', completed_at = datetime('now')
        WHERE job_id = ?
      `).run(jobId);
    }, 5000);

    res.json({
      success: true,
      jobId,
      message: '영상 변환 작업이 시작되었습니다.',
      estimatedTime: duration * 10, // 예상 소요 시간 (초)
      statusUrl: `/api/ai/job/${jobId}`
    });

  } catch (error) {
    console.error('Image to video error:', error);
    res.status(500).json({ success: false, error: '영상 변환 요청 실패' });
  }
});

// ============================================
// 이미지 업스케일링 API
// ============================================
router.post('/upscale', authenticateToken, imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '이미지 파일이 필요합니다.' });
    }

    const { scale = 2, enhanceDetails = true } = req.body;
    const userId = req.user.id;

    // 작업 ID 생성
    const jobId = `upscale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // DB에 작업 기록
    const stmt = db.prepare(`
      INSERT INTO ai_jobs (job_id, user_id, job_type, status, input_file, parameters, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      jobId,
      userId,
      'upscale',
      'pending',
      req.file.filename,
      JSON.stringify({ scale, enhanceDetails })
    );

    // TODO: 실제 AI 업스케일링 서비스 연동 (Real-ESRGAN 등)
    // 현재는 Mock 응답 반환

    setTimeout(() => {
      db.prepare(`
        UPDATE ai_jobs SET status = 'completed', completed_at = datetime('now')
        WHERE job_id = ?
      `).run(jobId);
    }, 3000);

    res.json({
      success: true,
      jobId,
      message: '이미지 업스케일링 작업이 시작되었습니다.',
      estimatedTime: 30,
      statusUrl: `/api/ai/job/${jobId}`
    });

  } catch (error) {
    console.error('Upscale error:', error);
    res.status(500).json({ success: false, error: '업스케일링 요청 실패' });
  }
});

// ============================================
// 숏폼 영상 생성 API
// ============================================
router.post('/shortform/generate', authenticateToken, async (req, res) => {
  try {
    const { topic, style = 'educational', duration = 30, resolution = '1080p' } = req.body;
    const userId = req.user.id;

    if (!topic) {
      return res.status(400).json({ success: false, error: '영상 주제가 필요합니다.' });
    }

    // 작업 ID 생성
    const jobId = `shortform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // DB에 작업 기록
    const stmt = db.prepare(`
      INSERT INTO ai_jobs (job_id, user_id, job_type, status, parameters, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      jobId,
      userId,
      'shortform',
      'pending',
      JSON.stringify({ topic, style, duration, resolution })
    );

    // Python 파이프라인 실행 (백그라운드)
    const shortsDir = path.join(__dirname, '..', 'shorts');
    const pythonPath = path.join(shortsDir, 'venv', 'bin', 'python');
    const scriptPath = path.join(shortsDir, 'main.py');

    // 환경변수 설정
    const env = {
      ...process.env,
      JOB_ID: jobId,
      TOPIC: topic,
      STYLE: style,
      DURATION: duration.toString(),
      RESOLUTION: resolution
    };

    // Python 스크립트 비동기 실행
    const python = spawn(pythonPath, [scriptPath, '--topic', topic, '--duration', duration.toString()], {
      cwd: shortsDir,
      env,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    python.stdout.on('data', (data) => {
      console.log(`[Shortform ${jobId}] ${data}`);
    });

    python.stderr.on('data', (data) => {
      console.error(`[Shortform ${jobId}] Error: ${data}`);
    });

    python.on('close', (code) => {
      const status = code === 0 ? 'completed' : 'failed';
      db.prepare(`
        UPDATE ai_jobs SET status = ?, completed_at = datetime('now')
        WHERE job_id = ?
      `).run(status, jobId);
    });

    python.unref();

    res.json({
      success: true,
      jobId,
      message: '숏폼 영상 생성 작업이 시작되었습니다.',
      estimatedTime: duration * 5, // 예상 소요 시간
      statusUrl: `/api/ai/job/${jobId}`
    });

  } catch (error) {
    console.error('Shortform generate error:', error);
    res.status(500).json({ success: false, error: '숏폼 생성 요청 실패' });
  }
});

// ============================================
// 작업 상태 조회 API
// ============================================
router.get('/job/:jobId', authenticateToken, (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const job = db.prepare(`
      SELECT * FROM ai_jobs WHERE job_id = ? AND user_id = ?
    `).get(jobId, userId);

    if (!job) {
      return res.status(404).json({ success: false, error: '작업을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      job: {
        jobId: job.job_id,
        type: job.job_type,
        status: job.status,
        parameters: JSON.parse(job.parameters || '{}'),
        inputFile: job.input_file,
        outputFile: job.output_file,
        createdAt: job.created_at,
        completedAt: job.completed_at,
        error: job.error_message
      }
    });

  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({ success: false, error: '작업 상태 조회 실패' });
  }
});

// ============================================
// 작업 결과물 다운로드 API
// ============================================
router.get('/job/:jobId/download', authenticateToken, (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const job = db.prepare(`
      SELECT * FROM ai_jobs WHERE job_id = ? AND user_id = ? AND status = 'completed'
    `).get(jobId, userId);

    if (!job) {
      return res.status(404).json({ success: false, error: '완료된 작업을 찾을 수 없습니다.' });
    }

    if (!job.output_file) {
      return res.status(404).json({ success: false, error: '출력 파일이 없습니다.' });
    }

    const filePath = path.join(aiOutputDir, job.output_file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: '파일이 존재하지 않습니다.' });
    }

    res.download(filePath);

  } catch (error) {
    console.error('Job download error:', error);
    res.status(500).json({ success: false, error: '파일 다운로드 실패' });
  }
});

// ============================================
// 사용자별 AI 작업 히스토리
// ============================================
router.get('/history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const jobs = db.prepare(`
      SELECT * FROM ai_jobs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, parseInt(limit), parseInt(offset));

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM ai_jobs WHERE user_id = ?
    `).get(userId);

    res.json({
      success: true,
      jobs: jobs.map(job => ({
        jobId: job.job_id,
        type: job.job_type,
        status: job.status,
        parameters: JSON.parse(job.parameters || '{}'),
        createdAt: job.created_at,
        completedAt: job.completed_at
      })),
      total: total.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('AI history error:', error);
    res.status(500).json({ success: false, error: 'AI 히스토리 조회 실패' });
  }
});

// ============================================
// AI 사용량 통계 (Admin 전용)
// ============================================
router.get('/usage', authenticateToken, (req, res) => {
  try {
    // Admin 체크
    if (req.user.tier !== 'admin') {
      return res.status(403).json({ success: false, error: '관리자 권한이 필요합니다.' });
    }

    // 전체 통계
    const totalStats = db.prepare(`
      SELECT
        job_type,
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
      FROM ai_jobs
      GROUP BY job_type
    `).all();

    // 오늘 통계
    const todayStats = db.prepare(`
      SELECT
        job_type,
        COUNT(*) as count
      FROM ai_jobs
      WHERE date(created_at) = date('now')
      GROUP BY job_type
    `).all();

    // 사용자별 통계 (상위 10명)
    const userStats = db.prepare(`
      SELECT
        u.name,
        u.email,
        COUNT(j.id) as job_count
      FROM ai_jobs j
      JOIN users u ON j.user_id = u.id
      GROUP BY j.user_id
      ORDER BY job_count DESC
      LIMIT 10
    `).all();

    res.json({
      success: true,
      stats: {
        total: totalStats,
        today: todayStats,
        topUsers: userStats
      }
    });

  } catch (error) {
    console.error('AI usage stats error:', error);
    res.status(500).json({ success: false, error: 'AI 통계 조회 실패' });
  }
});

module.exports = router;
