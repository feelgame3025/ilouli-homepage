# 제품 요구사항 문서 (PRD): AI 기반 영어 학습 쇼츠 자동 제작

**문서 버전**: 1.0
**작성일**: 2025년 12월 23일
**작성자**: Gemini (Senior Product Manager)

---

### 1. 개요 (Overview)

본 문서는 사용자가 '주제' 텍스트만 입력하면, 아동용 영어 학습 유튜브 쇼츠 영상을 자동으로 제작하는 시스템의 요구사항을 정의합니다. 9세 딸 아이의 영어 학습 흥미 유발을 최우선 목표로 하며, 부가적으로 다른 아동들에게도 인기 있는 채널로 성장시키는 것을 목표로 합니다.

### 2. 목표 및 성공 지표 (Goals & Success Metrics)

#### 2.1. 주요 목표 (Primary Goal)
- **목표**: 9세 아동이 영어를 재미있고 자연스럽게 받아들이도록 돕는다.
- **성공 지표**:
    - (정성적) 프로젝트의 주요 이해관계자인 '딸'이 꾸준히 영상 시청을 즐기고, 영상에 나온 영어 표현을 따라 말하려고 시도한다.
    - (정량적) 주 3회 이상 꾸준히 콘텐츠를 제작하여 업로드한다.

#### 2.2. 부가 목표 (Secondary Goal)
- **목표**: 유튜브 채널을 성장시켜 더 많은 아동들에게 유익한 콘텐츠를 제공한다.
- **성공 지표**:
    - 채널 개설 3개월 내 구독자 1,000명 달성.
    - 업로드된 쇼츠 영상의 평균 조회수 3,000회 이상 달성.

### 3. 목표 사용자 (Target Audience)

- **핵심 타겟**: 9세 아동. 간단한 영어 문장을 읽을 수 있는 수준.
- **확장 타겟**: 비슷한 연령대와 영어 수준을 가진 다른 아동 및 그 부모.

### 4. 제품 요구사항 (Product Requirements)

#### 4.1. 사용자 경험 (UX) 및 최종 결과물
사용자는 단일 텍스트 입력 필드에 영상의 '주제' (예: "동물원에서", "생일 파티", "아침 식사 시간")를 한국어로 입력합니다. 시스템은 이 입력을 받아 아래 사양을 충족하는 쇼츠 영상을 자동으로 생성하여 파일로 제공해야 합니다.

- **영상 길이**: 8초 ~ 10초
- **영상 구성**:
    - **비주얼**: 주제와 영어 문장에 맞는 '귀여운 캐릭터 또는 애니메이션' 스타일의 동영상 클립. 정적인 이미지보다 동적인 영상이어야 함.
    - **오디오**:
        1.  **AI 성우**: 생성된 영어 문장을 친근하고 명확한 톤의 AI 목소리로 녹음. (목소리 톤은 추후 선택 가능하도록 고려)
        2.  **배경 음악**: 영상 전체에 걸쳐 경쾌하고 밝은 분위기의 연주곡(BGM) 포함.
    - **자막**:
        1.  화면 하단에 '영어 문장'과 '한국어 번역'이 동시에 표시되어야 함.
        2.  자막은 가독성이 높은 폰트와 색상 조합을 사용해야 함.

#### 4.2. 자동화 파이프라인 (Backend System)
사용자가 주제를 입력했을 때, 시스템 내부에서는 다음 단계가 순차적으로 자동 실행되어야 합니다.

- **1단계: 콘텐츠 생성 (AI Writer)**
    - 입력된 '주제'를 바탕으로 9세 아동 수준에 맞는 간단한 영어 문장 1~2개를 생성합니다.
    - 생성된 영어 문장에 대한 자연스러운 한국어 번역문을 생성합니다.

- **2단계: 비주얼 생성 (AI Video Generator)**
    - 생성된 영어 문장의 의미를 해석하여, 그에 맞는 '귀여운 캐릭터/애니메이션' 스타일의 동영상 클립을 생성합니다.
    - (예: "I see a big elephant" -> 코끼리 캐릭터가 등장하는 애니메이션)

- **3단계: 오디오 생성 (AI Voice & Music Generator)**
    - **(음성)** 영어 문장을 Text-to-Speech (TTS) 기술을 사용해 음성 파일로 변환합니다.
    - **(음악)** 영상의 전체적인 분위기와 어울리는 저작권 문제없는 배경 음악을 생성하거나 라이브러리에서 선택합니다.

- **4. 단계: 최종 편집 및 렌더링 (AI Video Editor)**
    - 생성된 비디오 클립, AI 음성, 배경 음악을 타임라인에 맞게 배치합니다.
    - 비디오 클립 위에 영어/한국어 자막을 오버레이합니다.
    - 모든 요소를 종합하여 최종적인 쇼츠 영상(MP4, 9:16 비율)으로 렌더링합니다.

### 5. 기술 스택 명세 (Technical Stack)

각 파이프라인 단계별로 사용할 AI 서비스를 선정합니다.

#### 5.1. 콘텐츠 생성 (AI Writer)
| 옵션 | 설명 | 예상 비용 | 선정 |
|------|------|----------|------|
| **OpenAI GPT-4o-mini** | 빠르고 저렴, 한국어/영어 우수 | ~$0.00015/1K tokens (~₩0.2) | ✅ **Primary** |
| Claude 3.5 Haiku | 자연스러운 문장 생성 | ~$0.00025/1K tokens | Fallback |
| Gemini 1.5 Flash | 무료 티어 활용 가능 | 무료 (일일 한도 내) | Fallback |

**선정 근거**: 1-2문장 생성에 약 200 tokens 미만 사용 예상. GPT-4o-mini가 비용/성능 균형 최적.

#### 5.2. 비디오 생성 (AI Video Generator)
| 옵션 | 설명 | 예상 비용 (10초) | 선정 |
|------|------|-----------------|------|
| **Kling AI** | 가성비 우수, 1080p, Motion Brush | ~$0.15-0.25 (~₩200-350) | ✅ **Primary** |
| MiniMax (Hailuo) | 물리적 사실감 우수, 저렴 | ~$0.10-0.20 (~₩140-280) | ✅ **Alternative** |
| Pika Labs | 재미있는 효과, 바이럴 적합 | ~$0.12-0.20 (~₩170-280) | Alternative |
| Runway ML | 최고 품질, 비용 높음 | ~$0.30-0.50 (~₩420-700) | 품질 우선 시 |

**선정 근거**: Kling AI가 귀여운 캐릭터 애니메이션 스타일과 비용 효율성에서 최적. 아동용 콘텐츠에 적합한 밝은 스타일 생성 가능.

#### 5.3. 음성 생성 (TTS)
| 옵션 | 설명 | 예상 비용 | 선정 |
|------|------|----------|------|
| **OpenAI TTS** | 자연스러운 음성, 저렴 | $0.015/1K chars (~₩2) | ✅ **Primary** |
| ElevenLabs | 최고 품질, 음성 복제 가능 | $0.18/1K chars (~₩25) | 품질 우선 시 |
| Fish Audio | 한국어 지원 우수 | $0.015/1K chars (~₩2) | Fallback |

**선정 근거**: 영어 문장 1-2개는 약 50-100자 예상. OpenAI TTS가 자연스럽고 비용 효율적. 아동 친화적 톤("shimmer", "nova" 음성 활용).

#### 5.4. 배경음악 생성 (BGM)
| 옵션 | 설명 | 예상 비용 | 선정 |
|------|------|----------|------|
| **Suno API** | AI 음악 생성, 상업적 사용 가능 | ~$0.07/곡 (~₩100) | ✅ **Primary** |
| 무료 BGM 라이브러리 | Pixabay, Uppbeat 등 | 무료 | ✅ **Alternative** |
| Mubert | 실시간 생성, 앰비언트 | ~$0.05/곡 (~₩70) | Alternative |

**선정 근거**: 매번 새 BGM 생성보다 **사전 제작된 BGM 풀(10-20곡)** 구축 후 랜덤 선택이 비용 효율적.
- 초기 1회: Suno로 테마별 BGM 20곡 생성 (~₩2,000 일회성 투자)
- 이후: 무료로 재사용

#### 5.5. 영상 편집/렌더링
| 옵션 | 설명 | 비용 | 선정 |
|------|------|------|------|
| **FFmpeg + MoviePy** | 오픈소스, 완전 제어 가능 | 무료 | ✅ **Primary** |
| Creatomate API | 클라우드 렌더링 | $0.01-0.05/영상 | Alternative |

**선정 근거**: 로컬 서버에서 FFmpeg 실행 시 비용 없음. 자막 오버레이, 오디오 믹싱 모두 가능.

#### 5.6. 기술 스택 요약
```
┌─────────────────────────────────────────────────────────────┐
│                    사용자 입력 (주제)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1단계: 콘텐츠 생성                                          │
│  - GPT-4o-mini API                                          │
│  - Output: 영어 문장 + 한국어 번역 + 비디오 프롬프트           │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│ 2단계: 비디오    │ │ 3-A: TTS 음성   │ │ 3-B: BGM 선택   │
│ - Kling AI API   │ │ - OpenAI TTS    │ │ - 사전구축 풀   │
│ - 10초, 1080p    │ │ - 영어 음성     │ │ - 랜덤 선택     │
└──────────────────┘ └─────────────────┘ └──────────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4단계: 최종 편집                                            │
│  - FFmpeg/MoviePy                                           │
│  - 비디오 + 음성 + BGM 믹싱                                  │
│  - 영어/한국어 자막 오버레이                                  │
│  - Output: MP4 (9:16, 1080x1920)                            │
└─────────────────────────────────────────────────────────────┘
```

### 6. 비용 상세 산정 (Cost Breakdown)

#### 6.1. 영상 1개당 예상 비용

| 단계 | 서비스 | 사용량 | 단가 | 예상 비용 |
|------|--------|--------|------|----------|
| 콘텐츠 생성 | GPT-4o-mini | ~200 tokens | $0.00015/1K | ₩0.2 |
| 비디오 생성 | Kling AI | 10초 | ~$0.20 | ₩280 |
| TTS 음성 | OpenAI TTS | ~80 chars | $0.015/1K | ₩1.7 |
| BGM | 사전 구축 풀 | - | 무료 | ₩0 |
| 렌더링 | FFmpeg | 로컬 | 무료 | ₩0 |
| **합계** | | | | **₩282** |

#### 6.2. 비용 시나리오별 분석

| 시나리오 | 비디오 서비스 | 영상당 비용 | 월 12개 (주3회) |
|----------|--------------|------------|----------------|
| **최적화 (권장)** | Kling AI | ~₩280 | ~₩3,360 |
| 저비용 | MiniMax | ~₩200 | ~₩2,400 |
| 고품질 | Runway ML | ~₩500 | ~₩6,000 |

#### 6.3. 초기 세팅 비용 (일회성)
| 항목 | 비용 |
|------|------|
| BGM 풀 구축 (Suno 20곡) | ~₩2,000 |
| 폰트 구매 (선택) | ₩0-20,000 |
| 서버/인프라 | ₩0 (로컬) |

**결론**: 목표 비용 ₩500 대비 **₩282로 44% 절감** 달성 가능.

### 7. 제약 조건 및 가정 (Constraints & Assumptions)

- **비용**: 영상 1개를 제작하는 데 드는 총비용(API 사용료 등)은 1,000원을 초과하지 않아야 하며, 500원 내외를 목표로 합니다. → **₩280 달성 가능**
- **기술**: 위에 명시된 각 파이프라인 단계를 수행할 수 있는 외부 AI 서비스/API를 조합하여 사용합니다.
- **저작권**: 생성된 모든 비주얼 및 오디오 소스는 상업적 이용(유튜브 수익 창출)에 문제가 없어야 합니다.
  - Kling AI: 유료 플랜 상업적 사용 허용
  - OpenAI TTS: API 사용 시 상업적 사용 허용
  - Suno: Pro 플랜 이상 상업적 사용 허용
- **제작 속도**: 주제 입력부터 최종 영상 파일이 출력되기까지의 총 처리 시간은 10분 이내를 목표로 합니다.

### 8. 데이터 플로우 및 스키마 (Data Flow & Schema)

#### 8.1. 단계별 입출력 데이터 명세

**1단계: 콘텐츠 생성**
```json
// Input
{
  "topic": "동물원에서",           // 사용자 입력 (한국어)
  "difficulty": "beginner",       // 난이도: beginner | intermediate
  "sentence_count": 1             // 문장 수: 1-2
}

// Output
{
  "english_sentence": "I see a big elephant at the zoo!",
  "korean_translation": "나는 동물원에서 큰 코끼리를 봐요!",
  "video_prompt": "A cute cartoon elephant waving its trunk happily at a colorful zoo, kawaii style, bright colors, child-friendly animation",
  "keywords": ["elephant", "zoo", "big"],
  "estimated_duration": 8         // 예상 영상 길이 (초)
}
```

**2단계: 비디오 생성**
```json
// Input
{
  "prompt": "A cute cartoon elephant...",  // 1단계 video_prompt
  "duration": 10,                          // 영상 길이 (초)
  "aspect_ratio": "9:16",                  // 세로 비율
  "style": "cartoon",                      // 스타일 힌트
  "resolution": "1080p"
}

// Output
{
  "video_url": "https://...",              // 생성된 비디오 URL
  "video_path": "/tmp/video_abc123.mp4",   // 다운로드된 로컬 경로
  "actual_duration": 10.2,
  "generation_id": "kling_xyz789"
}
```

**3단계: 오디오 생성**
```json
// Input (TTS)
{
  "text": "I see a big elephant at the zoo!",
  "voice": "nova",                         // OpenAI 음성 옵션
  "speed": 0.9                             // 아동용으로 약간 느리게
}

// Output (TTS)
{
  "audio_path": "/tmp/voice_abc123.mp3",
  "duration": 3.2                          // 음성 길이 (초)
}

// Input (BGM)
{
  "mood": "cheerful",                      // 분위기
  "duration": 10                           // 필요한 길이
}

// Output (BGM)
{
  "bgm_path": "/assets/bgm/cheerful_03.mp3",
  "selected_from": "pre_built_pool"
}
```

**4단계: 최종 편집**
```json
// Input
{
  "video_path": "/tmp/video_abc123.mp4",
  "voice_path": "/tmp/voice_abc123.mp3",
  "bgm_path": "/assets/bgm/cheerful_03.mp3",
  "subtitles": {
    "english": "I see a big elephant at the zoo!",
    "korean": "나는 동물원에서 큰 코끼리를 봐요!"
  },
  "subtitle_style": {
    "font": "NanumSquareRoundEB",
    "english_size": 48,
    "korean_size": 36,
    "position": "bottom",
    "bg_opacity": 0.7
  },
  "audio_mix": {
    "voice_volume": 1.0,
    "bgm_volume": 0.3                      // BGM은 배경으로
  }
}

// Output
{
  "final_video_path": "/output/shorts_20231223_001.mp4",
  "metadata": {
    "title": "🐘 I see a big elephant! | 영어 한마디",
    "description": "오늘의 영어: I see a big elephant at the zoo!\n뜻: 나는 동물원에서 큰 코끼리를 봐요!",
    "tags": ["영어학습", "키즈영어", "쇼츠", "elephant", "동물원"]
  }
}
```

#### 8.2. 데이터베이스 스키마 (선택적)

향후 히스토리 관리 및 분석을 위한 스키마:

```sql
-- 생성된 영상 기록
CREATE TABLE shorts (
  id INTEGER PRIMARY KEY,
  topic TEXT NOT NULL,                    -- 입력 주제
  english_sentence TEXT NOT NULL,
  korean_translation TEXT NOT NULL,
  video_path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  youtube_url TEXT,                       -- 업로드 후 URL
  view_count INTEGER DEFAULT 0,           -- 조회수 (수동 업데이트)
  cost_won INTEGER                        -- 제작 비용 (원)
);

-- 사용된 BGM 트래킹
CREATE TABLE bgm_usage (
  id INTEGER PRIMARY KEY,
  bgm_name TEXT NOT NULL,
  shorts_id INTEGER REFERENCES shorts(id),
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 9. 에러 핸들링 및 Fallback 전략 (Error Handling)

#### 9.1. 단계별 에러 처리

| 단계 | 가능한 에러 | 처리 전략 |
|------|------------|----------|
| **1. 콘텐츠 생성** | API 타임아웃, Rate limit | 1) 재시도 (3회) 2) Fallback: Gemini Flash 사용 |
| | 부적절한 콘텐츠 생성 | 콘텐츠 필터링 후 재생성 요청 |
| **2. 비디오 생성** | 생성 실패, 품질 저하 | 1) 재시도 (2회) 2) Fallback: MiniMax 사용 |
| | API 비용 한도 초과 | 일일 생성 제한 (5개) 알림 |
| **3-A. TTS** | 음성 생성 실패 | Fallback: Fish Audio 또는 Google TTS |
| **3-B. BGM** | BGM 풀 파일 누락 | 기본 BGM 1개 하드코딩 |
| **4. 렌더링** | FFmpeg 에러 | 로그 기록 후 수동 확인 요청 |
| | 디스크 공간 부족 | 이전 임시 파일 자동 정리 |

#### 9.2. 재시도 정책

```python
RETRY_CONFIG = {
    "content_generation": {
        "max_retries": 3,
        "backoff_seconds": [1, 2, 5],
        "fallback": "gemini_flash"
    },
    "video_generation": {
        "max_retries": 2,
        "backoff_seconds": [10, 30],  # 비디오 생성은 오래 걸림
        "fallback": "minimax"
    },
    "tts": {
        "max_retries": 3,
        "backoff_seconds": [1, 2, 3],
        "fallback": "fish_audio"
    }
}
```

#### 9.3. 알림 및 로깅

- **성공**: 최종 영상 경로 + 메타데이터 출력
- **부분 실패**: 어느 단계에서 재시도/fallback 사용했는지 로그
- **완전 실패**: 에러 상세 내용 + 입력값 저장 (디버깅용)

### 10. 품질 기준 및 검증 방법 (Quality Assurance)

#### 10.1. 단계별 품질 체크포인트

| 단계 | 검증 항목 | 기준 | 자동화 |
|------|----------|------|--------|
| **콘텐츠** | 문장 길이 | 3-15 단어 | ✅ 자동 |
| | 난이도 적합성 | 초등 저학년 수준 단어 | ⚠️ 반자동 (단어 리스트 체크) |
| | 번역 정확성 | 의미 전달 | ❌ 수동 샘플링 |
| **비디오** | 영상 길이 | 8-12초 | ✅ 자동 |
| | 해상도 | 1080x1920 | ✅ 자동 |
| | 아동 적합성 | 무서운/폭력적 요소 없음 | ⚠️ 프롬프트로 제어 |
| **오디오** | 음성 명확성 | 발음 정확 | ❌ 수동 샘플링 |
| | BGM 볼륨 | 음성 대비 30% 이하 | ✅ 자동 |
| **최종** | 자막 가독성 | 텍스트 잘림 없음 | ✅ 자동 (길이 체크) |
| | 싱크 | 음성-자막 타이밍 | ⚠️ 반자동 |

#### 10.2. 콘텐츠 안전성 가이드라인

**비디오 프롬프트 필수 포함 키워드:**
- `child-friendly`, `cute`, `cartoon`, `bright colors`, `safe for kids`

**비디오 프롬프트 금지 키워드:**
- `scary`, `horror`, `violent`, `dark`, `realistic human`

**자동 필터링 체크:**
```python
FORBIDDEN_WORDS = ["scary", "horror", "blood", "fight", "죽", "무서"]
REQUIRED_STYLE_WORDS = ["cute", "cartoon", "bright"]
```

#### 10.3. 출시 전 체크리스트

- [ ] 영상이 8-12초 범위인가?
- [ ] 자막이 화면 밖으로 잘리지 않는가?
- [ ] 음성이 명확하게 들리는가?
- [ ] BGM이 음성을 방해하지 않는가?
- [ ] 영상 내용이 아동에게 적합한가?
- [ ] 영어 문장이 문법적으로 올바른가?

### 11. MVP 범위 및 개발 우선순위 (MVP Scope)

#### 11.1. MVP (1차 출시) 범위

**포함:**
- ✅ CLI 기반 주제 입력
- ✅ 단일 영어 문장 생성
- ✅ Kling AI 비디오 생성
- ✅ OpenAI TTS 음성 생성
- ✅ 사전 구축된 BGM 풀에서 랜덤 선택
- ✅ FFmpeg 기반 자막 합성 및 렌더링
- ✅ 로컬 MP4 파일 출력

**제외 (향후):**
- ❌ 웹 UI
- ❌ 자동 유튜브 업로드
- ❌ 다중 문장/회화 형식
- ❌ 캐릭터 일관성 (시리즈물)
- ❌ 성과 분석 대시보드

#### 11.2. 개발 우선순위

| 우선순위 | 기능 | 설명 |
|---------|------|------|
| **P0** | 파이프라인 코어 | 4단계 자동화 파이프라인 구현 |
| **P0** | 콘텐츠 생성 | GPT 프롬프트 최적화 |
| **P0** | 비디오 생성 | Kling API 연동 |
| **P1** | TTS 연동 | OpenAI TTS 연동 |
| **P1** | 자막 렌더링 | FFmpeg 자막 오버레이 |
| **P1** | BGM 믹싱 | 오디오 레이어 합성 |
| **P2** | 에러 핸들링 | 재시도 및 fallback |
| **P2** | 품질 검증 | 자동 체크 로직 |
| **P3** | 히스토리 저장 | SQLite 기록 |
| **P3** | 배치 생성 | 여러 주제 한번에 처리 |

#### 11.3. 기술적 마일스톤

```
[M1] 환경 설정 및 API 키 연동
     - Python 환경 구축
     - OpenAI, Kling API 키 설정
     - 기본 프로젝트 구조

[M2] 콘텐츠 생성 모듈
     - GPT 프롬프트 설계
     - 출력 파싱 및 검증

[M3] 비디오 생성 모듈
     - Kling API 연동
     - 비디오 다운로드 및 저장

[M4] 오디오 생성 모듈
     - TTS 연동
     - BGM 풀 구축

[M5] 편집/렌더링 모듈
     - FFmpeg 파이프라인
     - 자막 오버레이
     - 오디오 믹싱

[M6] 통합 및 테스트
     - End-to-end 파이프라인
     - 에러 핸들링
     - 품질 검증

[M7] MVP 완료
     - 문서화
     - 첫 영상 10개 생성 테스트
```

### 12. 부록 (Appendix)

#### 12.1. GPT 프롬프트 최적화

##### 12.1.1. 기본 프롬프트 템플릿

```
You are an English teacher creating content for 9-year-old Korean children.

Given the topic: "{topic}"

Generate:
1. One simple English sentence (3-10 words) that a beginner can understand
2. Natural Korean translation
3. A video prompt for AI video generation (cute cartoon style, child-friendly)

Rules:
- Use simple vocabulary (Dolch sight words + basic nouns)
- Make it fun and engaging
- Video prompt must include: cute, cartoon, bright colors, child-friendly

Output format (JSON):
{
  "english": "...",
  "korean": "...",
  "video_prompt": "..."
}
```

##### 12.1.2. 주제별 프롬프트 변형 예시

**일상생활 주제:**
```
Topic: "아침 식사"
→ English: "I eat pancakes for breakfast!"
→ Korean: "나는 아침으로 팬케이크를 먹어요!"
→ Video: "A cute cartoon child happily eating fluffy pancakes at a sunny kitchen table, kawaii style, warm colors, cozy breakfast scene"
```

**동물 주제:**
```
Topic: "강아지"
→ English: "The puppy is so fluffy!"
→ Korean: "강아지가 너무 복슬복슬해요!"
→ Video: "An adorable fluffy cartoon puppy wagging its tail happily, big sparkly eyes, pastel colors, cute animation style"
```

**계절/날씨 주제:**
```
Topic: "눈 오는 날"
→ English: "Let's make a snowman!"
→ Korean: "눈사람을 만들자!"
→ Video: "Cute cartoon children building a cheerful snowman in a snowy park, bright winter scene, falling snowflakes, joyful atmosphere"
```

**감정 표현:**
```
Topic: "행복"
→ English: "I am so happy today!"
→ Korean: "오늘 정말 행복해요!"
→ Video: "A joyful cartoon character jumping with happiness, rainbow colors, confetti, bright sunny background, celebration mood"
```

##### 12.1.3. 고급 프롬프트 (다양성 향상)

```python
ADVANCED_PROMPT = """
You are an expert English teacher for Korean children aged 8-10.

Topic: "{topic}"
Previous sentences (avoid repetition): {previous_sentences}

Create engaging English learning content:

1. SENTENCE REQUIREMENTS:
   - Length: 4-8 words
   - Grammar: Present simple or present continuous
   - Vocabulary: Top 500 most common English words
   - Tone: Enthusiastic, fun, relatable to kids

2. VIDEO PROMPT REQUIREMENTS:
   - Style: Cute 2D cartoon / kawaii / Pixar-like 3D
   - Colors: Bright, saturated, child-friendly palette
   - Motion: Character should have clear action/movement
   - Safety: No scary elements, weapons, or realistic humans
   - Must include: "child-friendly", "bright colors", "cute animation"

3. ENGAGEMENT HOOKS (pick one):
   - Question format: "Do you like...?"
   - Exclamation: "Wow! Look at the...!"
   - Action: "Let's go to the...!"
   - Feeling: "I love my...!"

Output JSON:
{{
  "english": "string",
  "korean": "string",
  "video_prompt": "string",
  "difficulty": "easy|medium",
  "category": "animals|food|family|nature|activities|emotions",
  "hook_type": "question|exclamation|action|feeling"
}}
"""
```

##### 12.1.4. 비디오 프롬프트 스타일 가이드

| 스타일 | 프롬프트 키워드 | 적합한 주제 |
|--------|----------------|------------|
| **Kawaii** | `kawaii, chibi, big eyes, pastel colors` | 동물, 음식, 감정 |
| **Pixar-like** | `3D animation, Pixar style, vibrant, expressive` | 모험, 가족, 자연 |
| **Flat 2D** | `flat design, simple shapes, bold colors` | 일상, 숫자, 알파벳 |
| **Storybook** | `watercolor, storybook illustration, soft edges` | 동화, 계절, 잠자리 |

### 13. API 연동 상세 (API Integration Details)

#### 13.1. Kling AI API 연동

##### 13.1.1. 인증 및 설정

```python
# config.py
import os

KLING_CONFIG = {
    "api_key": os.getenv("KLING_API_KEY"),
    "base_url": "https://api.klingai.com/v1",  # 또는 PiAPI 사용 시 변경
    "timeout": 300,  # 비디오 생성은 시간이 오래 걸림
}
```

##### 13.1.2. 비디오 생성 요청

```python
# kling_client.py
import httpx
import asyncio
from typing import Optional

class KlingClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.klingai.com/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    async def create_video(
        self,
        prompt: str,
        duration: int = 10,
        aspect_ratio: str = "9:16",
        model: str = "kling-v1.5"
    ) -> dict:
        """텍스트로부터 비디오 생성 요청"""

        payload = {
            "prompt": prompt,
            "duration": duration,
            "aspect_ratio": aspect_ratio,
            "model": model,
            "cfg_scale": 0.5,  # 프롬프트 충실도
        }

        async with httpx.AsyncClient(timeout=60) as client:
            # 1. 생성 작업 시작
            response = await client.post(
                f"{self.base_url}/videos/text-to-video",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            task_id = response.json()["task_id"]

            # 2. 완료까지 폴링
            return await self._poll_task(client, task_id)

    async def _poll_task(self, client: httpx.AsyncClient, task_id: str) -> dict:
        """작업 완료까지 폴링"""
        max_attempts = 60  # 최대 5분

        for _ in range(max_attempts):
            response = await client.get(
                f"{self.base_url}/tasks/{task_id}",
                headers=self.headers
            )
            result = response.json()

            if result["status"] == "completed":
                return {
                    "video_url": result["output"]["video_url"],
                    "duration": result["output"]["duration"],
                    "task_id": task_id
                }
            elif result["status"] == "failed":
                raise Exception(f"Video generation failed: {result.get('error')}")

            await asyncio.sleep(5)  # 5초마다 확인

        raise TimeoutError("Video generation timed out")

    async def download_video(self, video_url: str, save_path: str) -> str:
        """생성된 비디오 다운로드"""
        async with httpx.AsyncClient() as client:
            response = await client.get(video_url)
            response.raise_for_status()

            with open(save_path, "wb") as f:
                f.write(response.content)

            return save_path
```

##### 13.1.3. PiAPI를 통한 대안 연동

```python
# PiAPI 사용 시 (공식 API 접근이 어려운 경우)
PIAPI_CONFIG = {
    "api_key": os.getenv("PIAPI_KEY"),
    "base_url": "https://api.piapi.ai/v1/kling",
}

# 요청 형식은 유사하나 엔드포인트가 다름
async def create_video_via_piapi(prompt: str) -> dict:
    payload = {
        "model": "kling-v1.5",
        "prompt": prompt,
        "aspect_ratio": "9:16",
        "duration": 10
    }
    # ... 이하 동일
```

#### 13.2. OpenAI TTS API 연동

```python
# tts_client.py
from openai import OpenAI
from pathlib import Path

class TTSClient:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def generate_speech(
        self,
        text: str,
        output_path: str,
        voice: str = "nova",  # alloy, echo, fable, onyx, nova, shimmer
        speed: float = 0.9    # 0.25 ~ 4.0, 아동용은 약간 느리게
    ) -> str:
        """텍스트를 음성으로 변환"""

        response = self.client.audio.speech.create(
            model="tts-1",      # tts-1 또는 tts-1-hd
            voice=voice,
            input=text,
            speed=speed,
            response_format="mp3"
        )

        # 파일로 저장
        response.stream_to_file(output_path)

        return output_path

    def get_recommended_voice(self, content_type: str) -> str:
        """콘텐츠 유형에 맞는 음성 추천"""
        voice_map = {
            "cheerful": "nova",      # 밝고 친근한
            "calm": "shimmer",       # 차분하고 부드러운
            "energetic": "alloy",    # 활기찬
            "storytelling": "fable"  # 이야기 스타일
        }
        return voice_map.get(content_type, "nova")
```

#### 13.3. OpenAI GPT API 연동

```python
# content_generator.py
from openai import OpenAI
import json

class ContentGenerator:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def generate_content(self, topic: str, previous: list = None) -> dict:
        """주제로부터 영어 문장, 번역, 비디오 프롬프트 생성"""

        system_prompt = """You are an English teacher for 9-year-old Korean children.
        Generate engaging, simple English learning content.
        Always respond in valid JSON format."""

        user_prompt = f"""
        Topic: {topic}

        Create:
        1. Simple English sentence (4-8 words)
        2. Natural Korean translation
        3. Cute cartoon video prompt

        JSON format:
        {{"english": "...", "korean": "...", "video_prompt": "..."}}
        """

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=500
        )

        return json.loads(response.choices[0].message.content)
```

#### 13.4. FFmpeg 렌더링 파이프라인

```python
# video_editor.py
import subprocess
from pathlib import Path

class VideoEditor:
    def __init__(self, font_path: str = "/usr/share/fonts/NanumSquareRoundEB.ttf"):
        self.font_path = font_path

    def render_final_video(
        self,
        video_path: str,
        voice_path: str,
        bgm_path: str,
        english_text: str,
        korean_text: str,
        output_path: str
    ) -> str:
        """최종 영상 렌더링: 비디오 + 음성 + BGM + 자막"""

        # 자막 필터 (영어 위, 한국어 아래)
        subtitle_filter = (
            f"drawtext=fontfile='{self.font_path}':text='{english_text}':"
            f"fontsize=48:fontcolor=white:borderw=3:bordercolor=black:"
            f"x=(w-text_w)/2:y=h-200,"
            f"drawtext=fontfile='{self.font_path}':text='{korean_text}':"
            f"fontsize=36:fontcolor=yellow:borderw=2:bordercolor=black:"
            f"x=(w-text_w)/2:y=h-120"
        )

        # FFmpeg 명령어 구성
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,           # 비디오 입력
            "-i", voice_path,           # 음성 입력
            "-i", bgm_path,             # BGM 입력
            "-filter_complex",
            f"[1:a]volume=1.0[voice];"  # 음성 볼륨
            f"[2:a]volume=0.3[bgm];"    # BGM 볼륨 (30%)
            f"[voice][bgm]amix=inputs=2:duration=first[audio];"  # 오디오 믹스
            f"[0:v]{subtitle_filter}[video]",  # 자막 오버레이
            "-map", "[video]",
            "-map", "[audio]",
            "-c:v", "libx264",
            "-c:a", "aac",
            "-shortest",                # 가장 짧은 스트림 기준
            output_path
        ]

        subprocess.run(cmd, check=True)
        return output_path
```

### 14. 유튜브 업로드 자동화 (YouTube Upload Automation)

#### 14.1. 사전 준비

1. **Google Cloud Console 설정**
   - 프로젝트 생성: [console.cloud.google.com](https://console.cloud.google.com)
   - YouTube Data API v3 활성화
   - OAuth 2.0 클라이언트 ID 생성 (데스크톱 앱)
   - `client_secrets.json` 다운로드

2. **필요 패키지**
   ```bash
   pip install google-api-python-client google-auth-oauthlib
   ```

3. **일일 할당량**
   - 기본: 10,000 units/day
   - 비디오 업로드: 1,600 units/건
   - **일일 최대 업로드: ~6개**

#### 14.2. 인증 설정

```python
# youtube_auth.py
import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]

def get_authenticated_service():
    """YouTube API 인증 및 서비스 객체 반환"""

    credentials = None
    token_file = "token.pickle"

    # 저장된 토큰 로드
    if os.path.exists(token_file):
        with open(token_file, "rb") as token:
            credentials = pickle.load(token)

    # 토큰이 없거나 만료된 경우
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "client_secrets.json", SCOPES
            )
            credentials = flow.run_local_server(port=0)

        # 토큰 저장
        with open(token_file, "wb") as token:
            pickle.dump(credentials, token)

    return build("youtube", "v3", credentials=credentials)
```

#### 14.3. 업로드 클라이언트

```python
# youtube_uploader.py
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError
import time

class YouTubeUploader:
    def __init__(self, service):
        self.service = service

    def upload_video(
        self,
        video_path: str,
        title: str,
        description: str,
        tags: list,
        category_id: str = "27",  # 27: Education
        privacy: str = "public"   # public, private, unlisted
    ) -> dict:
        """YouTube에 비디오 업로드"""

        body = {
            "snippet": {
                "title": title,
                "description": description,
                "tags": tags,
                "categoryId": category_id,
                "defaultLanguage": "ko",
                "defaultAudioLanguage": "en"
            },
            "status": {
                "privacyStatus": privacy,
                "selfDeclaredMadeForKids": True,  # 아동용 콘텐츠
                "license": "youtube",
                "embeddable": True
            }
        }

        media = MediaFileUpload(
            video_path,
            mimetype="video/mp4",
            resumable=True,
            chunksize=1024*1024  # 1MB 청크
        )

        request = self.service.videos().insert(
            part="snippet,status",
            body=body,
            media_body=media
        )

        return self._resumable_upload(request)

    def _resumable_upload(self, request) -> dict:
        """재시도 가능한 업로드 (네트워크 오류 대응)"""

        response = None
        retry = 0
        max_retries = 5

        while response is None:
            try:
                status, response = request.next_chunk()
                if status:
                    print(f"Upload {int(status.progress() * 100)}% complete")
            except HttpError as e:
                if e.resp.status in [500, 502, 503, 504]:
                    retry += 1
                    if retry > max_retries:
                        raise
                    wait = 2 ** retry
                    print(f"Retry {retry}/{max_retries} in {wait}s...")
                    time.sleep(wait)
                else:
                    raise

        return {
            "video_id": response["id"],
            "url": f"https://youtube.com/shorts/{response['id']}",
            "title": response["snippet"]["title"]
        }

    def generate_metadata(self, english: str, korean: str, topic: str) -> dict:
        """영상 메타데이터 자동 생성"""

        # 이모지 매핑
        emoji_map = {
            "동물": "🐾", "음식": "🍕", "가족": "👨‍👩‍👧",
            "자연": "🌳", "날씨": "☀️", "학교": "📚"
        }
        emoji = emoji_map.get(topic, "📖")

        title = f"{emoji} {english} | 하루 영어 한마디"

        description = f"""오늘의 영어 표현을 배워봐요! 🎓

🇺🇸 English: {english}
🇰🇷 한국어: {korean}

#shorts #영어공부 #키즈영어 #영어표현 #어린이영어

---
🔔 매일 새로운 영어 표현이 업로드됩니다!
👍 좋아요와 구독으로 응원해주세요!
"""

        tags = [
            "영어공부", "키즈영어", "어린이영어", "영어표현",
            "영어회화", "초등영어", "영어쇼츠", "English for kids",
            topic, english.split()[0]  # 첫 단어를 태그로
        ]

        return {
            "title": title[:100],  # YouTube 제목 제한
            "description": description,
            "tags": tags[:30]  # 태그 30개 제한
        }
```

#### 14.4. 통합 파이프라인 예시

```python
# main.py
import asyncio
from content_generator import ContentGenerator
from kling_client import KlingClient
from tts_client import TTSClient
from video_editor import VideoEditor
from youtube_uploader import YouTubeUploader, get_authenticated_service

async def create_and_upload_short(topic: str):
    """전체 파이프라인: 주제 → 유튜브 업로드"""

    # 1. 콘텐츠 생성
    content_gen = ContentGenerator(os.getenv("OPENAI_API_KEY"))
    content = content_gen.generate_content(topic)
    print(f"✅ Content: {content['english']}")

    # 2. 비디오 생성
    kling = KlingClient(os.getenv("KLING_API_KEY"))
    video_result = await kling.create_video(content["video_prompt"])
    video_path = await kling.download_video(
        video_result["video_url"],
        f"/tmp/video_{topic}.mp4"
    )
    print(f"✅ Video: {video_path}")

    # 3. TTS 생성
    tts = TTSClient(os.getenv("OPENAI_API_KEY"))
    voice_path = tts.generate_speech(
        content["english"],
        f"/tmp/voice_{topic}.mp3"
    )
    print(f"✅ Voice: {voice_path}")

    # 4. 최종 렌더링
    editor = VideoEditor()
    final_path = editor.render_final_video(
        video_path=video_path,
        voice_path=voice_path,
        bgm_path="assets/bgm/cheerful_01.mp3",
        english_text=content["english"],
        korean_text=content["korean"],
        output_path=f"output/short_{topic}.mp4"
    )
    print(f"✅ Final: {final_path}")

    # 5. 유튜브 업로드
    service = get_authenticated_service()
    uploader = YouTubeUploader(service)
    metadata = uploader.generate_metadata(
        content["english"],
        content["korean"],
        topic
    )
    result = uploader.upload_video(
        final_path,
        **metadata,
        privacy="public"
    )
    print(f"✅ Uploaded: {result['url']}")

    return result

# 실행
if __name__ == "__main__":
    asyncio.run(create_and_upload_short("강아지"))
```

#### 14.5. 업로드 스케줄링 (선택)

```python
# scheduler.py
import schedule
import time

TOPICS_QUEUE = [
    "아침 식사", "학교 가는 길", "친구와 놀기",
    "저녁 식사", "잠자리", "주말 활동"
]

def scheduled_upload():
    """예약된 시간에 자동 업로드"""
    if TOPICS_QUEUE:
        topic = TOPICS_QUEUE.pop(0)
        asyncio.run(create_and_upload_short(topic))

# 매일 오전 9시, 오후 3시, 저녁 7시 업로드
schedule.every().day.at("09:00").do(scheduled_upload)
schedule.every().day.at("15:00").do(scheduled_upload)
schedule.every().day.at("19:00").do(scheduled_upload)

while True:
    schedule.run_pending()
    time.sleep(60)
```

#### 14.6. 주의사항

| 항목 | 내용 |
|------|------|
| **일일 할당량** | 10,000 units (업로드 ~6개/일) |
| **아동용 콘텐츠** | `selfDeclaredMadeForKids: True` 필수 설정 |
| **토큰 관리** | `token.pickle` 보안 유지, .gitignore에 추가 |
| **썸네일** | 별도 API 호출 필요 (500 units 추가) |
| **Shorts 인식** | 60초 미만 + 9:16 비율이면 자동 인식 |

#### 12.2. 참고 자료

- [Kling AI API Documentation](https://app.klingai.com/global/dev/document-api)
- [PiAPI - Kling API](https://piapi.ai/docs/kling-api)
- [OpenAI TTS API](https://platform.openai.com/docs/guides/text-to-speech)
- [YouTube Data API - Upload](https://developers.google.com/youtube/v3/guides/uploading_a_video)
- [YouTube Data API - Python Quickstart](https://developers.google.com/youtube/v3/quickstart/python)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Suno AI](https://suno.com)

---

**문서 이력**
| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2025-12-23 | 초안 작성 |
| 1.1 | 2025-12-23 | 기술 스택, 비용, 데이터 플로우, MVP 범위 추가 |
| 1.2 | 2025-12-23 | API 연동 상세, 유튜브 자동화, GPT 프롬프트 최적화 추가 |
