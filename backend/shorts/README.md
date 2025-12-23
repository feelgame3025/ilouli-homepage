# YouTube Shorts 자동 생성 파이프라인

AI를 활용하여 아동용 영어 학습 유튜브 쇼츠를 자동으로 생성합니다.

## 기능

- **콘텐츠 생성**: GPT-4o-mini로 영어 문장, 한국어 번역, 비디오 프롬프트 생성
- **비디오 생성**: Kling AI로 귀여운 캐릭터 애니메이션 영상 생성
- **음성 생성**: OpenAI TTS로 자연스러운 영어 나레이션 생성
- **영상 편집**: FFmpeg로 자막 오버레이, 오디오 믹싱, 최종 렌더링

## 설치

```bash
cd backend/shorts

# 가상환경 생성 (권장)
python3 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일에 API 키 입력
```

## 사용법

### 기본 사용

```bash
# 단일 영상 생성
python main.py generate "동물원에서"

# 출력 파일명 지정
python main.py generate "아침 식사" -o breakfast_video

# Mock 모드 (API 호출 없이 테스트)
python main.py generate "테스트" --mock
```

### 배치 생성

```bash
# 여러 주제 한번에 생성
python main.py batch "동물원" "아침식사" "비오는날"
```

### 환경 확인

```bash
python main.py check
```

## 파이프라인 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    사용자 입력 (주제)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1단계: 콘텐츠 생성 (content_generator.py)                   │
│  - GPT-4o-mini API                                          │
│  - Output: 영어 문장 + 한국어 번역 + 비디오 프롬프트           │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│ 2단계: 비디오    │ │ 3단계: TTS 음성  │ │ BGM 선택        │
│ video_generator  │ │ tts_generator   │ │ assets/bgm/     │
│ - Kling AI       │ │ - OpenAI TTS    │ │ - 랜덤 선택     │
└──────────────────┘ └─────────────────┘ └──────────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4단계: 영상 편집 (video_editor.py)                          │
│  - FFmpeg                                                   │
│  - 비디오 + 음성 + BGM 믹싱                                  │
│  - 영어/한국어 자막 오버레이                                  │
│  - Output: MP4 (9:16, 1080x1920)                            │
└─────────────────────────────────────────────────────────────┘
```

## 비용

| 항목 | 서비스 | 예상 비용 |
|------|--------|----------|
| 콘텐츠 생성 | GPT-4o-mini | ~₩0.2 |
| 비디오 생성 | Kling AI | ~₩280 |
| TTS 음성 | OpenAI TTS | ~₩1.7 |
| **합계** | | **~₩282/영상** |

## 폴더 구조

```
shorts/
├── main.py              # CLI 진입점
├── config.py            # 설정
├── content_generator.py # GPT 콘텐츠 생성
├── video_generator.py   # Kling AI 비디오 생성
├── tts_generator.py     # OpenAI TTS
├── video_editor.py      # FFmpeg 렌더링
├── requirements.txt     # 의존성
├── .env                 # 환경변수 (gitignore)
├── .env.example         # 환경변수 예시
├── assets/
│   └── bgm/            # BGM 파일들
├── output/             # 생성된 영상
└── temp/               # 임시 파일
```

## BGM 설정

`assets/bgm/` 폴더에 MP3 또는 WAV 파일을 추가하면 자동으로 랜덤 선택됩니다.

권장 BGM:
- 밝고 경쾌한 분위기
- 10-30초 길이
- 저작권 프리 (Pixabay, Uppbeat 등)

## 문제 해결

### FFmpeg 설치
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

### 한글 폰트 설치
```bash
# Ubuntu/Debian
sudo apt install fonts-nanum
```

## 참고 문서

- [PRD 문서](../../docs/ai/youtube-shorts-prd.md)
- [OpenAI TTS API](https://platform.openai.com/docs/guides/text-to-speech)
- [Kling AI API](https://app.klingai.com/global/dev/document-api)
