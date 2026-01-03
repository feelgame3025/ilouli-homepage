# Audio Analysis API Documentation

## Overview

The Audio Analysis API provides speech-to-text transcription and AI-powered analysis of audio files. It supports multiple STT providers (OpenAI Whisper and Naver Clova) and uses Claude AI for intelligent analysis.

## Endpoints

### 1. Analyze Audio

**POST** `/api/audio/analyze`

Transcribes an audio file and generates analysis including speakers, key points, keywords, and summary.

#### Request

- **Authentication**: Required (Bearer token)
- **Content-Type**: `multipart/form-data`

**Form Data:**
- `file` (required): Audio file (mp3, m4a, wav, webm, ogg, mp4)
  - Max size: 100MB
- `provider` (optional): STT provider - `"whisper"` or `"clova"` (default: `"whisper"`)

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', audioFile);
formData.append('provider', 'whisper'); // or 'clova'

const response = await fetch('https://api.ilouli.com/api/audio/analyze', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
```

#### Response

**Success (200):**
```json
{
  "success": true,
  "data": {
    "transcript": [
      {
        "speaker": "화자1",
        "time": "00:00",
        "text": "안녕하세요..."
      },
      {
        "speaker": "화자2",
        "time": "00:15",
        "text": "네, 안녕하세요..."
      }
    ],
    "keyPoints": [
      "프로젝트 일정 논의",
      "예산 검토 필요",
      "다음 회의 일정 확정"
    ],
    "keywords": [
      "프로젝트",
      "일정",
      "예산",
      "회의",
      "검토"
    ],
    "summary": "이번 회의에서는 프로젝트의 전반적인 일정과 예산에 대해 논의하였으며, 다음 회의 일정을 확정했습니다."
  }
}
```

**Error Responses:**

- **400 Bad Request**: No file uploaded or invalid provider
  ```json
  {
    "success": false,
    "error": "No audio file uploaded"
  }
  ```

- **401 Unauthorized**: Missing or invalid authentication token
  ```json
  {
    "error": "No token provided"
  }
  ```

- **413 Payload Too Large**: File exceeds 100MB
  ```json
  {
    "success": false,
    "error": "File too large (max 100MB)"
  }
  ```

- **500 Internal Server Error**: Processing failed
  ```json
  {
    "success": false,
    "error": "Audio analysis failed",
    "details": "Error details..."
  }
  ```

- **503 Service Unavailable**: STT provider not configured
  ```json
  {
    "success": false,
    "error": "STT service not configured"
  }
  ```

### 2. Get Available Providers

**GET** `/api/audio/providers`

Returns information about available STT providers and their configuration status.

#### Request

- **Authentication**: Required (Bearer token)

**Example:**
```javascript
const response = await fetch('https://api.ilouli.com/api/audio/providers', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
```

#### Response

**Success (200):**
```json
{
  "success": true,
  "providers": [
    {
      "name": "whisper",
      "available": true,
      "description": "OpenAI Whisper API",
      "features": [
        "Multilingual",
        "Timestamps",
        "High accuracy"
      ]
    },
    {
      "name": "clova",
      "available": false,
      "description": "Naver Clova Speech API",
      "features": [
        "Korean optimized",
        "Fast processing"
      ]
    }
  ]
}
```

## Environment Variables

Add these to your `.env` file:

```env
# OpenAI Whisper API (for STT)
OPENAI_API_KEY=sk-...

# Naver Clova Speech API (optional, for Korean-optimized STT)
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret

# Anthropic Claude API (for analysis)
ANTHROPIC_API_KEY=sk-ant-...
```

### Getting API Keys

1. **OpenAI Whisper**:
   - Sign up at https://platform.openai.com/
   - Create API key in API Keys section

2. **Naver Clova Speech** (optional):
   - Register at https://www.ncloud.com/
   - Create application in Console
   - Get Client ID and Secret from API settings

3. **Anthropic Claude**:
   - Sign up at https://console.anthropic.com/
   - Create API key in Settings

## Supported Audio Formats

- **MP3** (audio/mpeg) - `.mp3`
- **M4A** (audio/mp4) - `.m4a`
- **WAV** (audio/wav, audio/x-wav) - `.wav`
- **WebM** (audio/webm) - `.webm`
- **OGG** (audio/ogg) - `.ogg`
- **MP4** (video/mp4 with audio track) - `.mp4`

Maximum file size: **100MB**

## STT Providers

### OpenAI Whisper
- **Best for**: Multilingual support, high accuracy
- **Features**: Automatic timestamps, wide language support
- **Limitations**: No native speaker diarization (identified by Claude AI)
- **Cost**: Pay per minute

### Naver Clova Speech
- **Best for**: Korean language optimization
- **Features**: Fast processing, Korean dialect support
- **Limitations**: Primarily Korean-focused
- **Cost**: Based on Naver Cloud pricing

## Analysis Pipeline

1. **Upload**: Audio file uploaded via multipart/form-data
2. **STT**: Speech-to-text using selected provider (Whisper or Clova)
3. **AI Analysis**: Claude analyzes transcript to:
   - Identify speakers (화자1, 화자2, etc.)
   - Format transcript with timestamps
   - Extract key points
   - Generate keywords
   - Create summary
4. **Cleanup**: Temporary audio file deleted
5. **Response**: Structured JSON returned

## Error Handling

The service includes comprehensive error handling:

- Invalid file types rejected
- File size limits enforced
- Missing API keys detected
- Provider errors caught and reported
- Temporary files cleaned up on success or error

## Performance Considerations

- Large audio files (>10 minutes) may take several minutes to process
- Whisper API processes in real-time (1 minute audio ≈ 1 minute processing)
- Claude analysis adds 5-15 seconds depending on transcript length
- Network latency depends on file size and upload speed

## Example Usage (Complete Flow)

```javascript
// 1. Check available providers
async function checkProviders(token) {
  const response = await fetch('https://api.ilouli.com/api/audio/providers', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { providers } = await response.json();

  // Find available provider
  const available = providers.find(p => p.available);
  return available ? available.name : null;
}

// 2. Analyze audio file
async function analyzeAudio(audioFile, token) {
  // Check providers
  const provider = await checkProviders(token);
  if (!provider) {
    throw new Error('No STT provider available');
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('provider', provider);

  // Upload and analyze
  const response = await fetch('https://api.ilouli.com/api/audio/analyze', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Analysis failed');
  }

  const result = await response.json();
  return result.data;
}

// 3. Use the results
const audioFile = document.querySelector('input[type="file"]').files[0];
const token = localStorage.getItem('token');

try {
  const analysis = await analyzeAudio(audioFile, token);

  console.log('Transcript:', analysis.transcript);
  console.log('Key Points:', analysis.keyPoints);
  console.log('Keywords:', analysis.keywords);
  console.log('Summary:', analysis.summary);
} catch (error) {
  console.error('Analysis failed:', error.message);
}
```

## Notes

- Speaker diarization (identifying different speakers) is performed by Claude AI based on conversation patterns
- Timestamps are provided by Whisper API; Clova provides continuous text
- The service automatically detects language for Whisper (default: Korean)
- All uploaded files are deleted after processing for privacy
- Analysis quality depends on audio clarity and background noise levels
