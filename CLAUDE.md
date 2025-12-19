# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**자동 배포:** GitHub에 커밋하면 자동으로 빌드 및 배포됩니다.
```bash
# 변경사항 커밋 → 자동 배포
git add .
git commit -m "변경 내용"
git push
```

**수동 배포 (필요시):**
```bash
npm run build
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
│   │   ├── components/         # Feature components
│   │   ├── routers/            # Host-specific routers
│   │   ├── contexts/           # React contexts (Auth, Community, Notification)
│   │   ├── services/           # API services
│   │   │   ├── api.js          # Backend API client
│   │   │   └── socialAuth.js   # Google/Kakao OAuth
│   │   └── locales/            # i18n translations
│   └── .env                    # Frontend environment variables
├── backend/
│   ├── server.js               # Express server entry
│   ├── database.js             # SQLite database setup
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   └── users.js            # User management routes
│   ├── middleware/
│   │   └── auth.js             # JWT middleware
│   ├── ilouli.db               # SQLite database file
│   └── .env                    # Backend environment variables
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

## Design Guidelines

Follow Apple-inspired minimalism: clean layouts, generous whitespace, smooth animations, and high-quality visuals. Ensure responsive design across devices.

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
| 기능 | 상태 | 현재 위치 | 목표 서브도메인 |
|------|------|-----------|-----------------|
| AI Storyboard Pipeline | 개발 중 | ai.ilouli.com | ai.ilouli.com |
| AI Content Tools | 개발 중 | ai.ilouli.com | ai.ilouli.com |
| Character Lock | 대기 | - | AI Storyboard 내 |
| AI Photo Gallery | 대기 | - | family.ilouli.com |
| AI Usage Statistics | 대기 | - | admin.ilouli.com |
