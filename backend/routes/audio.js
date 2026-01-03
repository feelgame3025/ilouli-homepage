const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeAudio } = require('../services/audioAnalysis');
const { authMiddleware } = require('../middleware/auth');

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/audio');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-randomnumber-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter to accept only audio files
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'audio/mpeg',      // mp3
    'audio/mp4',       // m4a
    'audio/wav',       // wav
    'audio/x-wav',     // wav
    'audio/webm',      // webm
    'audio/ogg',       // ogg
    'video/mp4',       // mp4 (audio track)
    'video/webm'       // webm (audio track)
  ];

  const allowedExts = ['.mp3', '.m4a', '.wav', '.webm', '.ogg', '.mp4'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

/**
 * POST /api/audio/analyze
 * Analyze uploaded audio file
 *
 * Body (multipart/form-data):
 * - file: Audio file (required)
 * - provider: STT provider - "whisper" or "clova" (optional, default: "whisper")
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     transcript: [{ speaker: "화자1", time: "00:00", text: "..." }],
 *     keyPoints: ["...", "..."],
 *     keywords: ["...", "..."],
 *     summary: "..."
 *   }
 * }
 */
router.post('/analyze', authMiddleware, upload.single('file'), async (req, res) => {
  let filePath = null;

  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file uploaded'
      });
    }

    filePath = req.file.path;
    const provider = req.body.provider || 'whisper';

    // Validate provider
    if (!['whisper', 'clova'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider. Must be "whisper" or "clova"'
      });
    }

    console.log(`[Audio Route] Analyzing audio file: ${req.file.filename}`);
    console.log(`[Audio Route] Provider: ${provider}`);
    console.log(`[Audio Route] User: ${req.user.email}`);

    // Analyze audio
    const result = await analyzeAudio(filePath, provider);

    // Clean up uploaded file after analysis
    try {
      fs.unlinkSync(filePath);
      console.log(`[Audio Route] Cleaned up temporary file: ${filePath}`);
    } catch (cleanupError) {
      console.warn(`[Audio Route] Failed to cleanup file: ${cleanupError.message}`);
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[Audio Route] Error:', error.message);

    // Clean up file on error
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.warn(`[Audio Route] Failed to cleanup file on error: ${cleanupError.message}`);
      }
    }

    // Determine appropriate status code
    let statusCode = 500;
    let errorMessage = 'Audio analysis failed';

    if (error.message.includes('not configured')) {
      statusCode = 503;
      errorMessage = 'STT service not configured';
    } else if (error.message.includes('Invalid file type')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('File too large')) {
      statusCode = 413;
      errorMessage = 'File too large (max 100MB)';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
});

/**
 * GET /api/audio/providers
 * Get available STT providers and their status
 *
 * Response:
 * {
 *   success: true,
 *   providers: [
 *     { name: "whisper", available: true, description: "OpenAI Whisper API" },
 *     { name: "clova", available: false, description: "Naver Clova Speech API" }
 *   ]
 * }
 */
router.get('/providers', authMiddleware, (req, res) => {
  const providers = [
    {
      name: 'whisper',
      available: !!process.env.OPENAI_API_KEY,
      description: 'OpenAI Whisper API',
      features: ['Multilingual', 'Timestamps', 'High accuracy']
    },
    {
      name: 'clova',
      available: !!(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET),
      description: 'Naver Clova Speech API',
      features: ['Korean optimized', 'Fast processing']
    }
  ];

  res.json({
    success: true,
    providers
  });
});

module.exports = router;
