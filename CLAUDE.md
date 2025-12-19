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

Production server uses nginx with subdomain support:
```bash
# Build and deploy
npm run build
sudo cp -r build/* /var/www/html/
sudo cp nginx/ilouli.com.conf /etc/nginx/sites-available/ilouli.com
sudo ln -sf /etc/nginx/sites-available/ilouli.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**DNS 설정 필요:**
- A 레코드: `ilouli.com`, `www.ilouli.com` → 서버 IP
- A 레코드: `ai.ilouli.com`, `community.ilouli.com`, `family.ilouli.com`, `admin.ilouli.com`, `lab.ilouli.com` → 서버 IP
- 또는 와일드카드: `*.ilouli.com` → 서버 IP

## Architecture

**Tech Stack:**
- React 19 with Create React App
- React Router v6 for client-side routing
- i18next for internationalization (English, Korean)
- Host-based routing for subdomains
- Standard CSS (component-level `.css` files)
- React Testing Library for tests

**Project Structure:**
```
frontend/
├── src/
│   ├── App.js              # Host-based router selection
│   ├── i18n.js             # i18next configuration
│   ├── index.js            # Entry point
│   ├── components/         # Feature components
│   │   ├── About.js
│   │   ├── Admin.js
│   │   ├── AIStoryboard.js
│   │   ├── AIContentTools.js
│   │   ├── Community.js
│   │   ├── FamilySpace.js
│   │   ├── FileUpload.js
│   │   ├── LandingPage.js
│   │   ├── NavigationBar.js  # Host-aware navigation
│   │   ├── Profile.js
│   │   ├── ProtectedRoute.js
│   │   └── TestZone.js
│   ├── routers/            # Host-specific routers
│   │   ├── MainRouter.js
│   │   ├── AIRouter.js
│   │   ├── CommunityRouter.js
│   │   ├── FamilyRouter.js
│   │   ├── AdminRouter.js
│   │   └── LabRouter.js
│   ├── utils/
│   │   └── hostConfig.js   # Subdomain detection & URL generation
│   ├── contexts/
│   │   ├── AppProvider.js
│   │   ├── AuthContext.js
│   │   ├── CommunityContext.js
│   │   ├── NotificationContext.js
│   │   └── AssetContext.js
│   └── locales/
│       ├── en.json
│       └── ko.json
├── nginx/
│   └── ilouli.com.conf     # Nginx subdomain configuration
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
- Authentication (Login/Signup with tier-based access)
- Admin Dashboard (User management, content moderation)
- Community (Posts, comments, reports, announcements)
- Notification System (In-app notifications with settings)
- Internationalization (English/Korean)
- Responsive navigation with mobile menu
- **Subdomain-based architecture**

**In Progress / TODO:**
| 기능 | 상태 | 현재 위치 | 목표 서브도메인 |
|------|------|-----------|-----------------|
| AI Storyboard Pipeline | 개발 중 | ai.ilouli.com | ai.ilouli.com |
| AI Content Tools | 개발 중 | ai.ilouli.com | ai.ilouli.com |
| Character Lock | 대기 | - | AI Storyboard 내 |
| Smart Calendar | 대기 | - | family.ilouli.com |
| AI Photo Gallery | 대기 | - | family.ilouli.com |
| AI Usage Statistics | 대기 | - | admin.ilouli.com |
| Email Notifications | 대기 | - | Backend 연동 |
