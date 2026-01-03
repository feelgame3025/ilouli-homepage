const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

/**
 * Audio Analysis Service
 * Supports multiple STT providers (Whisper, Clova) and Claude for analysis
 */

/**
 * Analyze audio file using specified provider
 * @param {string} filePath - Path to audio file
 * @param {string} provider - STT provider ("whisper" or "clova")
 * @returns {Object} Analysis result with transcript, keyPoints, keywords, summary
 */
async function analyzeAudio(filePath, provider = 'whisper') {
  try {
    console.log(`[AudioAnalysis] Starting analysis with provider: ${provider}`);
    console.log(`[AudioAnalysis] File: ${filePath}`);

    // Step 1: Speech-to-Text
    let rawTranscript;
    if (provider === 'whisper') {
      rawTranscript = await transcribeWithWhisper(filePath);
    } else if (provider === 'clova') {
      rawTranscript = await transcribeWithClova(filePath);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    console.log(`[AudioAnalysis] Transcription completed. Length: ${rawTranscript.length} chars`);

    // Step 2: Analyze with Claude
    const analysis = await analyzeWithClaude(rawTranscript);

    console.log(`[AudioAnalysis] Analysis completed successfully`);

    return {
      transcript: analysis.transcript,
      keyPoints: analysis.keyPoints,
      keywords: analysis.keywords,
      summary: analysis.summary
    };
  } catch (error) {
    console.error('[AudioAnalysis] Error:', error.message);
    throw new Error(`Audio analysis failed: ${error.message}`);
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 * @param {string} filePath - Path to audio file
 * @returns {string} Raw transcript text
 */
async function transcribeWithWhisper(filePath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('model', 'whisper-1');
    formData.append('language', 'ko'); // Default to Korean, can be made configurable
    formData.append('response_format', 'verbose_json'); // Get timestamps

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${apiKey}`
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    // Whisper doesn't provide speaker diarization by default
    // Return the text with segments if available
    if (response.data.segments) {
      return response.data.segments.map(seg =>
        `[${formatTime(seg.start)}] ${seg.text}`
      ).join('\n');
    }

    return response.data.text;
  } catch (error) {
    console.error('[Whisper] Error:', error.response?.data || error.message);
    throw new Error(`Whisper transcription failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Transcribe audio using Naver Clova Speech API
 * @param {string} filePath - Path to audio file
 * @returns {string} Raw transcript text
 */
async function transcribeWithClova(filePath) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('NAVER_CLIENT_ID or NAVER_CLIENT_SECRET not configured');
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // Determine content type
    let contentType = 'application/octet-stream';
    if (ext === '.mp3') contentType = 'audio/mpeg';
    else if (ext === '.wav') contentType = 'audio/wav';
    else if (ext === '.m4a') contentType = 'audio/mp4';

    const response = await axios.post(
      'https://naveropenapi.apigw.ntruss.com/recog/v1/stt?lang=Kor',
      fileBuffer,
      {
        headers: {
          'Content-Type': contentType,
          'X-NCP-APIGW-API-KEY-ID': clientId,
          'X-NCP-APIGW-API-KEY': clientSecret
        }
      }
    );

    if (response.data && response.data.text) {
      return response.data.text;
    }

    throw new Error('No text in Clova response');
  } catch (error) {
    console.error('[Clova] Error:', error.response?.data || error.message);
    throw new Error(`Clova transcription failed: ${error.response?.data?.errorMessage || error.message}`);
  }
}

/**
 * Analyze transcript using Claude API
 * Extracts speakers, key points, keywords, and summary
 * @param {string} rawTranscript - Raw transcript text
 * @returns {Object} Structured analysis
 */
async function analyzeWithClaude(rawTranscript) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  try {
    const prompt = `다음은 오디오 파일의 전사(transcript) 텍스트입니다. 이를 분석하여 다음 정보를 JSON 형식으로 추출해주세요:

1. transcript: 화자별로 구분된 대화 내용 (배열)
   - 각 항목: { speaker: "화자1", time: "00:00", text: "발언 내용" }
   - 화자를 구분할 수 없으면 "화자1"로 통일
   - 타임스탬프가 있으면 사용하고, 없으면 순서대로 번호 부여

2. keyPoints: 핵심 포인트 3-5개 (배열)

3. keywords: 주요 키워드 5-10개 (배열)

4. summary: 전체 요약 (2-3문장)

반드시 다음 JSON 형식으로만 응답하세요:
{
  "transcript": [{"speaker": "화자1", "time": "00:00", "text": "..."}],
  "keyPoints": ["...", "..."],
  "keywords": ["...", "..."],
  "summary": "..."
}

전사 텍스트:
${rawTranscript}`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    const content = response.data.content[0].text;

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = content.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }

    const analysis = JSON.parse(jsonText);

    // Validate structure
    if (!analysis.transcript || !Array.isArray(analysis.transcript)) {
      throw new Error('Invalid transcript format');
    }
    if (!analysis.keyPoints || !Array.isArray(analysis.keyPoints)) {
      throw new Error('Invalid keyPoints format');
    }
    if (!analysis.keywords || !Array.isArray(analysis.keywords)) {
      throw new Error('Invalid keywords format');
    }
    if (!analysis.summary || typeof analysis.summary !== 'string') {
      throw new Error('Invalid summary format');
    }

    return analysis;
  } catch (error) {
    console.error('[Claude] Error:', error.response?.data || error.message);

    // Fallback: Return simple analysis if Claude fails
    if (error.message.includes('Invalid') || error.name === 'SyntaxError') {
      console.warn('[Claude] Falling back to simple analysis');
      return {
        transcript: [{ speaker: '화자1', time: '00:00', text: rawTranscript }],
        keyPoints: ['오디오 분석 진행됨'],
        keywords: ['오디오', '분석'],
        summary: rawTranscript.substring(0, 200) + '...'
      };
    }

    throw new Error(`Claude analysis failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Format seconds to MM:SS
 * @param {number} seconds
 * @returns {string} Formatted time
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

module.exports = {
  analyzeAudio
};
