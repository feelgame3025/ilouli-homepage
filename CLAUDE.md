# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 상위 규칙 참조

> **필수**: 이 프로젝트는 `myproject` 워크스페이스의 하위 프로젝트입니다.
>
> 작업 전 **상위 규칙을 확인**하고 해당 절차를 따릅니다.

| 참조 문서 | 경로 | 내용 |
|----------|------|------|
| 기본 규칙 | `../CLAUDE.md` | 개발 착수 전 계획 수립, 오케스트레이션 |
| 코딩 컨벤션 | `../docs/CONVENTIONS.md` | 명명 규칙, 코드 스타일 |
| **디자인 시스템** | `.claude/rules/design-system.md` | UI/UX 규칙, 접근성, 토큰 |
| Claude 기능 | `../docs/CLAUDE_FEATURES.md` | 슬래시 명령어, 스킬 |
| 레지스트리 | `../.claude/REGISTRY.md` | 전체 명령어/스킬 목록 |

### 핵심 상위 규칙

1. **개발 착수 전 계획 수립** → 분석 → 계획 → 승인 → 개발
2. **병렬 개발 시 오케스트레이션** → 작업 분해 → 검수 → 연동
3. **코드 스타일** → `../.editorconfig`, `../shared/configs/` 참조
4. **디자인 시스템** → `.claude/rules/design-system.md` 참조 (Hierarchy & Accessibility 우선)

---

## 병렬 개발 (Frontend + Backend)

> **기본 모드**: 이 프로젝트는 기능 개발 시 **Frontend/Backend 동시 개발**을 기본으로 한다.

```
┌─────────────────────────────────────────────────────────┐
│  오케스트레이터 (메인 에이전트)                           │
│  1. API 인터페이스 정의                                  │
│  2. 병렬 개발 지시                                       │
│  3. 결과물 검수 및 연동                                  │
└─────────────────────────────────────────────────────────┘
              │                    │
              ▼                    ▼
      ┌──────────────┐     ┌──────────────┐
      │   Agent A    │     │   Agent B    │
      │   Frontend   │     │   Backend    │
      │  (React 19)  │     │  (Express)   │
      └──────────────┘     └──────────────┘
              │                    │
              └────────┬───────────┘
                       ▼
              ┌──────────────┐
              │   연동 검증   │
              └──────────────┘
```

### 개발 흐름

```
1. 요청 분석
   ↓
2. API 인터페이스 먼저 정의
   - 엔드포인트: POST /api/...
   - Request: { ... }
   - Response: { ... }
   ↓
3. 병렬 개발 시작
   → Agent A: Frontend (컴포넌트, 상태관리, API 호출)
   → Agent B: Backend (라우트, DB, 비즈니스 로직)
   ↓
4. 결과물 검수
   - 코드 리뷰
   - API 스펙 일치 확인
   ↓
5. 연동 테스트
   - 실제 API 호출 검증
   - 에러 케이스 확인
```

### 인터페이스 정의 템플릿

```
## API 인터페이스

### [기능명]
- **Endpoint**: POST /api/...
- **Auth**: Required (JWT)

**Request:**
```json
{
  "field1": "string",
  "field2": "number"
}
```

**Response (성공):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Response (실패):**
```json
{
  "success": false,
  "error": "에러 메시지"
}
```
```

### 파일 위치 규칙

| 구분 | 위치 |
|-----|------|
| Frontend 컴포넌트 | `frontend/src/features/[도메인]/` |
| Frontend 서비스 | `frontend/src/services/` |
| Backend 라우트 | `backend/routes/` |
| Backend 미들웨어 | `backend/middleware/` |

### 체크리스트

- [ ] API 엔드포인트 정의 완료
- [ ] Frontend 컴포넌트 구현
- [ ] Backend 라우트 구현
- [ ] API 스펙 일치 확인
- [ ] 에러 처리 일관성
- [ ] 연동 테스트 완료

---

## 작업 규칙 (Working Rules)

**자율 진행 원칙**: 사용자의 승인을 일일이 구하지 않고, 할 수 있는 작업은 스스로 판단하여 진행한다.
- 코드 수정, 파일 생성/삭제, 설정 변경 등은 승인 없이 바로 진행
- 에러 발생 시 스스로 해결 시도
- 작업 완료 후 결과만 보고
- 단, 민감한 작업(프로덕션 배포, 데이터 삭제 등)은 확인 필요

## Project Overview

ilouli.com is a React-based web platform serving as a brand portal with AI-powered creative tools. It features an AI Storyboard Pipeline for creators and private family spaces. The project follows a tiered user model (Guest, General, Subscriber, Family, Admin) with a freemium business model.

## Subdomain Architecture

프로젝트는 기능별 서브도메인으로 분리되어 운영됩니다:

| 서브도메인 | 용도 | 접근 권한 |
|------------|------|-----------|
| `ilouli.com` | 메인 사이트 (랜딩, About, 인증) | 모두 |
| `ai.ilouli.com` | AI 기능 (스토리보드, 콘텐츠 도구) | 구독자 이상 |
| `community.ilouli.com` | 커뮤니티 (공지사항, 자유게시판) | 모두 |
| `family.ilouli.com` | 가족 공간 | Family/Admin |
| `admin.ilouli.com` | 관리자 대시보드 | Admin |
| `lab.ilouli.com` | 관리자 랩 (테스트 존, 파일 업로드) | Family/Admin |

**로컬 개발 시 서브도메인 시뮬레이션:**
```
http://localhost:3000/?host=ai      # AI 서브도메인
http://localhost:3000/?host=community
http://localhost:3000/?host=family
http://localhost:3000/?host=admin
http://localhost:3000/?host=lab
```

## Commands

All commands should be run from the `frontend/` directory:

```bash
# Development server (http://localhost:3000)
npm start

# Run tests in watch mode
npm test

# Run a single test file
npm test -- --testPathPattern="App.test.js"

# Production build
npm run build
```

## Deployment

**자동 배포 (GitHub Actions):**
- `main` 브랜치에 push하면 자동으로 빌드 및 배포
- 워크플로우: `.github/workflows/deploy.yml`
- 배포 시간: 약 50초

```bash
# 변경사항 커밋 → 자동 배포
git add .
git commit -m "변경 내용"
git push
# GitHub Actions가 자동으로 빌드 후 서버에 배포
```

**배포 상태 확인:**
```bash
gh run list --limit 5  # 최근 배포 상태
```

**수동 배포 (필요시):**
```bash
cd frontend && npm run build
sudo cp -r build/* /var/www/html/
```

**DNS 설정:**
- A 레코드: `ilouli.com`, `*.ilouli.com`, `api.ilouli.com` → 서버 IP (125.242.20.78)

## Backend API

Express.js + SQLite 백엔드 서버:

**서버 관리:**
```bash
# PM2로 관리
pm2 status              # 상태 확인
pm2 restart ilouli-api  # 재시작
pm2 logs ilouli-api     # 로그 확인
```

**API 엔드포인트 (https://api.ilouli.com):**
- `POST /api/auth/login` - 로그인
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/social-login` - 소셜 로그인 (Google/Kakao)
- `GET /api/auth/me` - 현재 사용자 정보
- `GET /api/users` - 전체 회원 목록 (Admin)
- `GET /api/users/pending` - 승인 대기 회원 (Admin)
- `POST /api/users/:id/approve` - 회원 승인 (Admin)
- `POST /api/users/:id/reject` - 회원 거절 (Admin)
- `PUT /api/users/:id/tier` - 등급 변경 (Admin)
- `DELETE /api/users/:id` - 회원 삭제 (Admin)

**데이터베이스:** `backend/ilouli.db` (SQLite)

**기본 관리자 계정:**
- 이메일: admin@ilouli.com
- 비밀번호: admin123

## Architecture

**Tech Stack:**
- **Frontend:** React 19, React Router v6, i18next
- **Backend:** Express.js, SQLite (better-sqlite3), JWT 인증
- **인프라:** Nginx (리버스 프록시), PM2 (프로세스 관리), Let's Encrypt (SSL)
- Host-based routing for subdomains
- Standard CSS (component-level `.css` files)

**Project Structure:**
```
homepage/
├── frontend/
│   ├── src/
│   │   ├── App.js              # Host-based router selection
│   │   ├── shared/             # 공통 컴포넌트 (NavigationBar, ProtectedRoute)
│   │   ├── features/           # 기능별 컴포넌트
│   │   │   ├── auth/           # Login, Signup, Profile
│   │   │   ├── main/           # LandingPage, About
│   │   │   ├── admin/          # Admin Dashboard
│   │   │   ├── community/      # Community
│   │   │   ├── ai/             # AIStoryboard, AIContentTools
│   │   │   ├── family/         # FamilySpace, FamilyCalendar
│   │   │   └── lab/            # TestZone, Games, FileUpload
│   │   ├── routers/            # Host-specific routers
│   │   ├── contexts/           # React contexts (Auth, Community, Notification)
│   │   ├── services/           # API services
│   │   └── locales/            # i18n translations
│   └── .env                    # Frontend environment variables
├── backend/
│   ├── server.js               # Express server entry
│   ├── database.js             # SQLite database setup
│   ├── routes/                 # API routes
│   ├── middleware/             # JWT middleware
│   ├── ilouli.db               # SQLite database file
│   └── .env                    # Backend environment variables
├── docs/                       # 기획 및 개발 문서
│   └── ai/                     # AI 기능 문서
│       └── youtube-shorts-prd.md
├── .claude/                    # Claude Code 설정
│   ├── settings.json
│   ├── rules/                  # 프로젝트 규칙
│   ├── commands/               # 커스텀 명령어
│   └── agents/                 # 에이전트 설정
└── CLAUDE.md
```

## Host-based Routing

각 서브도메인별 라우트:

**Main (ilouli.com):**
- `/` - Landing page
- `/about` - About page
- `/login`, `/signup` - Authentication
- `/profile` - User profile

**AI (ai.ilouli.com):**
- `/storyboard` - AI Storyboard
- `/content-tools` - AI Content Tools

**Community (community.ilouli.com):**
- `/announcements` - Announcements
- `/free-board` - Free discussion board

**Family (family.ilouli.com):**
- `/` - Family Space

**Admin (admin.ilouli.com):**
- `/` - Admin Dashboard

**Lab (lab.ilouli.com):**
- `/test-zone` - Test Zone
- `/file-upload` - File Upload

## User Tiers

| Tier | Access Level |
|------|--------------|
| Guest | Public pages only |
| General | Community, basic features |
| Subscriber | AI features |
| Family | All features, family space |
| Admin | Full access, admin dashboard |

## Key Documentation

- `PRD.md` - Product Requirements Document with detailed feature specifications, user tiers, and business model
- `GEMINI.md` - Previous AI assistant documentation for this project
- `docs/ai/youtube-shorts-prd.md` - YouTube Shorts 자동 생성 PRD (AI 영어 학습 쇼츠)

## Design Guidelines

> **상세 규칙**: `.claude/rules/design-system.md` 참조

### 핵심 원칙

1. **기본기(Hierarchy)와 접근성(Accessibility)** 우선
2. **가독성 중심의 위계**: 정보가 잘 보이는 것이 가장 중요
3. **명도 대비 4.5:1 법칙**: 시각 약자 배려

### 디자인 토큰

- **토큰 위치**: `frontend/src/index.css :root`
- 타이포그래피: `--font-size-title`, `--font-size-body`, `--font-size-caption`
- 색상: `--color-text-primary`, `--color-text-secondary`, `--color-accent`
- 간격 (8px 그리드): `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`
- 버튼: `--button-height-md: 44px` (최소 터치 타겟)

### 컴포넌트 개발 시 체크리스트

- [ ] 디자인 토큰(CSS 변수) 사용하는가?
- [ ] 타이포그래피 3단계 이내인가?
- [ ] 명도 대비 4.5:1 이상인가?
- [ ] 버튼 높이 44px 이상인가?
- [ ] 모든 상태(Hover, Active, Disabled) 정의했는가?
- [ ] Empty State 디자인이 있는가?

## Asset Management

**에셋 사용 원칙:** 사용자 업로드 파일(`backend/uploads/`)을 앱 에셋으로 사용할 때는 반드시 별도 위치에 복사해서 사용한다.

| 구분 | 위치 | 용도 |
|------|------|------|
| 사용자 업로드 | `backend/uploads/` | 임시 저장, 사용자가 삭제 가능 |
| 앱 에셋 | `frontend/public/assets/` 또는 `backend/assets/` | 앱에서 사용하는 고정 리소스 |

**에셋 적용 절차:**
1. 파일 업로드 페이지(`lab.ilouli.com/file-upload`)에서 이미지 업로드
2. 테스트 존에서 확인 및 검증
3. 확정된 에셋은 `assets/` 폴더로 복사
4. 코드에서 복사된 에셋 경로 사용
5. 원본 업로드 파일은 삭제 가능

**예시 - 고스톱 화투 이미지:**
```
# 현재: uploads에서 직접 사용 (임시)
backend/uploads/1766365648113-246585907.png

# 권장: assets로 복사 후 사용
backend/assets/hwatu/1-1.png
frontend/public/assets/hwatu/1-1.png
```

## Development Workflow

**개발 프로세스:**
1. **테스트 존 개발** - 새로운 기능은 `lab.ilouli.com/test-zone`에서 먼저 개발
2. **기능 검증** - 테스트 존에서 충분히 테스트 및 검증
3. **메뉴 배치** - 개발 완료 후 적절한 서브도메인으로 이동
4. **정식 배포** - 프로덕션 빌드 및 배포

**테스트 존 접근:** Family/Admin 등급만 접근 가능

## Development Status

**Completed:**
- Backend API (Express.js + SQLite)
- Authentication (Login/Signup with tier-based access)
- Social Login (Google, Kakao OAuth)
- Admin Dashboard (User management with provider filter, last login tracking)
- Community (Posts, comments, reports, announcements)
- Notification System (In-app notifications with settings)
- Family Calendar (Google Calendar integration)
- Internationalization (English/Korean)
- Responsive navigation with mobile menu
- Subdomain-based architecture
- Cross-subdomain authentication (cookie-based)

**In Progress / TODO:**

### AI 콘텐츠 도구 (ai.ilouli.com)
| 기능 | 상태 | 설명 |
|------|------|------|
| 콘텐츠 요약 | 대기 | 긴 텍스트를 AI로 요약 |
| 콘텐츠 변환 | 대기 | 문체/형식 변환 |
| 블로그 초안 | 대기 | AI 블로그 글 생성 |
| 일일 보고서 | 대기 | 자동 보고서 생성 |

### AI 스토리보드 (ai.ilouli.com/storyboard)
| 기능 | 상태 | 설명 |
|------|------|------|
| 핵심 설정 (Step 1) | 대기 | 장르, 분위기, 캐릭터 설정 |
| 장면 입력 (Step 2) | UI 완료 | 스토리 텍스트 입력 |
| AI 생성 (Step 3) | 대기 | 스토리 → 이미지 프롬프트 변환 |
| 시각화 (Step 4) | 대기 | 이미지 생성 및 표시 |
| Character Lock | 대기 | 캐릭터 일관성 유지 기능 |

### YouTube Shorts 자동 생성 (ai.ilouli.com)
| 기능 | 상태 | 설명 |
|------|------|------|
| 콘텐츠 생성 | MVP 완료 | GPT-4o-mini로 영어 학습 스크립트 생성 |
| 영상 생성 | MVP 완료 | Kling AI로 AI 영상 생성 |
| 음성 생성 | MVP 완료 | OpenAI TTS로 나레이션 생성 |
| 영상 편집 | MVP 완료 | FFmpeg로 자막/로고 합성 |
| 자동 업로드 | 대기 | YouTube API로 쇼츠 업로드 |

**코드:** `backend/shorts/` (Python CLI 파이프라인)
**PRD 문서:** `docs/ai/youtube-shorts-prd.md`

### 기타 AI 기능
| 기능 | 상태 | 목표 위치 |
|------|------|-----------|
| AI Photo Gallery | 대기 | family.ilouli.com |
| AI Usage Statistics | 대기 | admin.ilouli.com |
