# YouTube Shorts 개발 체크리스트

**작성일**: 2025-12-24
**PRD 문서**: [youtube-shorts-prd.md](./youtube-shorts-prd.md)
**Backend 코드**: `backend/shorts/`
**Frontend 코드**: `frontend/src/features/ai/AIVideoCreator.js`

---

## 현재 상태 요약

| 구분 | 상태 | 비고 |
|------|------|------|
| Backend CLI 파이프라인 | ✅ MVP 완료 | Mock/실제 API 둘 다 지원 |
| Frontend UI | ✅ 완료 | 숏폼 탭 UI 구현됨 |
| Frontend-Backend 연동 | ❌ 미완료 | Mock 데이터로 동작 중 |
| YouTube 자동 업로드 | ❌ 미완료 | PRD에 구현 방법 명세됨 |

---

## Phase 1: Backend CLI 파이프라인 (✅ 완료)

### M1: 환경 설정 및 API 키 연동
- [x] Python 환경 구축 (`venv/`)
- [x] 의존성 설치 (`requirements.txt`)
- [x] 환경변수 설정 (`.env.example`)
- [x] 기본 프로젝트 구조 (`config.py`)

### M2: 콘텐츠 생성 모듈
- [x] GPT-4o-mini API 연동 (`content_generator.py`)
- [x] 프롬프트 설계 (영어 문장 + 한국어 번역 + 비디오 프롬프트)
- [x] 출력 JSON 파싱 및 검증
- [x] 품질 검증 로직 (금지어, 필수 스타일 키워드)
- [x] Mock 생성기 (`MockContentGenerator`)

### M3: 비디오 생성 모듈
- [x] Kling AI API 연동 (`video_generator.py`)
- [x] 비디오 생성 요청 및 폴링
- [x] 비디오 다운로드 및 저장
- [x] 재시도 로직
- [x] Mock 생성기 (`MockVideoGenerator`)

### M4: 오디오 생성 모듈
- [x] OpenAI TTS API 연동 (`tts_generator.py`)
- [x] 음성 종류별 설정 (nova, shimmer 등)
- [x] 속도 조절 (아동용 0.9x)
- [x] Mock 생성기 (`MockTTSGenerator`)
- [ ] BGM 풀 구축 (assets/bgm/ - 현재 비어있음)

### M5: 편집/렌더링 모듈
- [x] FFmpeg 파이프라인 (`video_editor.py`)
- [x] 자막 오버레이 (영어/한국어)
- [x] 오디오 믹싱 (음성 + BGM)
- [x] 9:16 비율 출력 (1080x1920)

### M6: 통합 및 테스트
- [x] End-to-end 파이프라인 (`main.py`)
- [x] CLI 인터페이스 (generate, batch, check)
- [x] Mock 모드 지원 (`--mock`)
- [x] 에러 핸들링 및 재시도

### M7: MVP 검증
- [x] README 문서화 (`README.md`)
- [x] 테스트 영상 생성 (`output/shorts_동물원에서_*.mp4` 존재)

---

## Phase 2: Frontend-Backend 연동 (🔄 진행 필요)

### 2.1 Backend API 엔드포인트 추가
- [ ] Express 라우트 추가 (`backend/routes/shorts.js`)
  - [ ] `POST /api/shorts/generate` - 숏폼 생성 요청
  - [ ] `GET /api/shorts/status/:jobId` - 생성 상태 확인
  - [ ] `GET /api/shorts/history` - 생성 히스토리
  - [ ] `GET /api/shorts/download/:jobId` - 영상 다운로드

### 2.2 Python 파이프라인 연동 방식 결정
- [ ] 옵션 A: Express에서 Python subprocess 호출
- [ ] 옵션 B: Python FastAPI 서버로 분리
- [ ] 옵션 C: 큐 시스템 도입 (Redis + Worker)

### 2.3 Frontend 서비스 연동
- [ ] `videoCreator.js` 실제 API 호출 구현
- [ ] 진행 상태 폴링 구현
- [ ] 에러 핸들링 UI
- [ ] 다운로드 기능 구현

### 2.4 생성 히스토리 저장
- [ ] SQLite 테이블 추가 (`shorts` 테이블)
- [ ] 생성 결과 저장
- [ ] 히스토리 조회 API

---

## Phase 3: 품질 개선 (📋 대기)

### 3.1 BGM 풀 구축
- [ ] Suno AI로 BGM 20곡 생성 (일회성)
- [ ] `assets/bgm/` 폴더에 저장
- [ ] 분위기별 분류 (cheerful, calm, energetic)

### 3.2 자막 개선
- [ ] 나눔고딕 폰트 설치 확인
- [ ] 자막 스타일 개선 (반투명 배경 등)
- [ ] 자막 타이밍 동기화

### 3.3 품질 검증 자동화
- [ ] 영상 길이 검증 (8-12초)
- [ ] 해상도 검증 (1080x1920)
- [ ] 자막 잘림 검증

---

## Phase 4: YouTube 자동 업로드 (📋 대기)

### 4.1 Google Cloud 설정
- [ ] Google Cloud 프로젝트 생성
- [ ] YouTube Data API v3 활성화
- [ ] OAuth 2.0 클라이언트 ID 생성
- [ ] `client_secrets.json` 저장

### 4.2 업로드 클라이언트 구현
- [ ] `youtube_uploader.py` 작성
- [ ] 인증 토큰 관리
- [ ] 비디오 업로드 함수
- [ ] 메타데이터 자동 생성 (제목, 설명, 태그)

### 4.3 업로드 기능 연동
- [ ] CLI에 upload 명령어 추가
- [ ] Frontend에 업로드 버튼 추가
- [ ] 업로드 상태 표시

---

## Phase 5: 확장 기능 (📋 향후)

### 5.1 다중 문장/회화 형식
- [ ] 2-3개 문장 연속 생성
- [ ] 캐릭터 대화 형식

### 5.2 캐릭터 일관성 (시리즈물)
- [ ] 캐릭터 설정 저장
- [ ] 동일 캐릭터 재사용

### 5.3 배치 스케줄링
- [ ] 자동 예약 생성
- [ ] 자동 업로드 스케줄

### 5.4 성과 분석 대시보드
- [ ] 조회수 트래킹
- [ ] 인기 주제 분석

---

## 우선순위 정리

| 순위 | 작업 | 예상 복잡도 |
|------|------|------------|
| **P0** | Backend API 엔드포인트 추가 | 중 |
| **P0** | Frontend-Backend 연동 | 중 |
| **P1** | BGM 풀 구축 | 하 |
| **P1** | 히스토리 저장 (SQLite) | 하 |
| **P2** | YouTube 자동 업로드 | 상 |
| **P3** | 품질 검증 자동화 | 중 |
| **P3** | 배치 스케줄링 | 중 |

---

## 다음 작업 제안

### 즉시 시작 가능 (P0)
1. **Backend API 추가**: `backend/routes/shorts.js` 생성
   - Python subprocess 방식으로 시작 (가장 간단)
   - 나중에 필요시 큐 시스템으로 전환

2. **Frontend 연동**: `videoCreator.js` 수정
   - Mock 대신 실제 API 호출
   - 진행 상태 폴링

### 병렬 작업 가능
- BGM 파일 수집 (저작권 프리 사이트에서)
- 한글 폰트 설치 확인

---

## 참고 링크

- [PRD 문서](./youtube-shorts-prd.md) - 상세 요구사항
- [Kling AI API Docs](https://app.klingai.com/global/dev/document-api)
- [OpenAI TTS API](https://platform.openai.com/docs/guides/text-to-speech)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [무료 BGM - Pixabay](https://pixabay.com/music/)
- [무료 BGM - Uppbeat](https://uppbeat.io/)
