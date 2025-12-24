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
router.post('/shortform/generate', authenticateToken, imageUpload.single('referenceImage'), async (req, res) => {
  try {
    const {
      prompt,  // 프롬프트 텍스트 (새 UI)
      topic,   // 레거시 호환
      style = 'educational',
      duration = 10,
      resolution = '1080p',
      useMock = 'false'  // Mock 모드 (API 비용 절약)
    } = req.body;

    const userId = req.user.id;
    const promptText = prompt || topic;

    if (!promptText) {
      return res.status(400).json({ success: false, error: '영상 아이디어를 입력해주세요.' });
    }

    // 작업 ID 생성
    const jobId = `shortform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // DB에 작업 기록
    const stmt = db.prepare(`
      INSERT INTO ai_jobs (job_id, user_id, job_type, status, input_file, parameters, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      jobId,
      userId,
      'shortform',
      'processing',
      req.file ? req.file.filename : null,
      JSON.stringify({ prompt: promptText, style, duration, resolution, useMock: useMock === 'true' })
    );

    // Python 파이프라인 실행 (백그라운드)
    const shortsDir = path.join(__dirname, '..', 'shorts');
    const pythonPath = path.join(shortsDir, 'venv', 'bin', 'python');
    const scriptPath = path.join(shortsDir, 'main.py');
    const outputName = jobId;

    // Python CLI 인자 구성
    const args = ['generate', promptText, '-o', outputName];
    if (useMock === 'true') {
      args.push('--mock');
    }

    console.log(`[Shortform ${jobId}] Starting: python ${args.join(' ')}`);

    // Python 스크립트 비동기 실행
    const python = spawn(pythonPath, [scriptPath, ...args], {
      cwd: shortsDir,
      env: { ...process.env },
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdoutData = '';
    let stderrData = '';

    python.stdout.on('data', (data) => {
      stdoutData += data.toString();
      console.log(`[Shortform ${jobId}] ${data}`);

      // 진행 단계 파싱 및 DB 업데이트
      const stepMatch = data.toString().match(/\[(\d)\/4\]/);
      if (stepMatch) {
        db.prepare(`
          UPDATE ai_jobs SET parameters = json_set(parameters, '$.currentStep', ?)
          WHERE job_id = ?
        `).run(parseInt(stepMatch[1]), jobId);
      }
    });

    python.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.error(`[Shortform ${jobId}] Error: ${data}`);
    });

    python.on('close', (code) => {
      console.log(`[Shortform ${jobId}] Process exited with code ${code}`);

      if (code === 0) {
        // 출력 파일 경로 파싱
        const outputMatch = stdoutData.match(/출력: (.+\.mp4)/);
        const outputFile = outputMatch ? path.basename(outputMatch[1]) : null;

        db.prepare(`
          UPDATE ai_jobs
          SET status = 'completed', output_file = ?, completed_at = datetime('now')
          WHERE job_id = ?
        `).run(outputFile, jobId);
      } else {
        db.prepare(`
          UPDATE ai_jobs
          SET status = 'failed', error_message = ?, completed_at = datetime('now')
          WHERE job_id = ?
        `).run(stderrData.slice(0, 500), jobId);
      }
    });

    python.unref();

    res.json({
      success: true,
      jobId,
      message: '숏폼 영상 생성 작업이 시작되었습니다.',
      estimatedTime: useMock === 'true' ? 10 : 120, // Mock: 10초, 실제: 2분
      statusUrl: `/api/ai/job/${jobId}`
    });

  } catch (error) {
    console.error('Shortform generate error:', error);
    res.status(500).json({ success: false, error: '숏폼 생성 요청 실패: ' + error.message });
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

    const params = JSON.parse(job.parameters || '{}');

    // 숏폼 결과물 URL 생성
    let downloadUrl = null;
    let videoUrl = null;
    if (job.status === 'completed' && job.output_file) {
      if (job.job_type === 'shortform') {
        // shorts/output 폴더에서 제공
        downloadUrl = `/api/ai/shortform/${job.job_id}/download`;
        videoUrl = `/api/ai/shortform/${job.job_id}/video`;
      } else {
        downloadUrl = `/api/ai/job/${job.job_id}/download`;
      }
    }

    res.json({
      success: true,
      job: {
        jobId: job.job_id,
        type: job.job_type,
        status: job.status,
        currentStep: params.currentStep || 0,
        parameters: params,
        inputFile: job.input_file,
        outputFile: job.output_file,
        downloadUrl,
        videoUrl,
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
// 숏폼 영상 스트리밍/다운로드
// ============================================
router.get('/shortform/:jobId/video', authenticateToken, (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const job = db.prepare(`
      SELECT * FROM ai_jobs WHERE job_id = ? AND user_id = ? AND job_type = 'shortform'
    `).get(jobId, userId);

    if (!job || job.status !== 'completed') {
      return res.status(404).json({ success: false, error: '영상을 찾을 수 없습니다.' });
    }

    const shortsOutputDir = path.join(__dirname, '..', 'shorts', 'output');
    const videoPath = path.join(shortsOutputDir, `${jobId}.mp4`);

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ success: false, error: '영상 파일이 존재하지 않습니다.' });
    }

    // 비디오 스트리밍
    const stat = fs.statSync(videoPath);
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;

      const file = fs.createReadStream(videoPath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(videoPath).pipe(res);
    }

  } catch (error) {
    console.error('Shortform video error:', error);
    res.status(500).json({ success: false, error: '영상 로드 실패' });
  }
});

router.get('/shortform/:jobId/download', authenticateToken, (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const job = db.prepare(`
      SELECT * FROM ai_jobs WHERE job_id = ? AND user_id = ? AND job_type = 'shortform'
    `).get(jobId, userId);

    if (!job || job.status !== 'completed') {
      return res.status(404).json({ success: false, error: '영상을 찾을 수 없습니다.' });
    }

    const shortsOutputDir = path.join(__dirname, '..', 'shorts', 'output');
    const videoPath = path.join(shortsOutputDir, `${jobId}.mp4`);

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ success: false, error: '영상 파일이 존재하지 않습니다.' });
    }

    const params = JSON.parse(job.parameters || '{}');
    const filename = `shorts_${(params.prompt || 'video').substring(0, 20).replace(/[^a-zA-Z0-9가-힣]/g, '_')}.mp4`;

    res.download(videoPath, filename);

  } catch (error) {
    console.error('Shortform download error:', error);
    res.status(500).json({ success: false, error: '다운로드 실패' });
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
