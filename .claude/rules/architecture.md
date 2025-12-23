# 아키텍처 규칙 (Architecture Rules)

## 서브도메인 구조

| 서브도메인 | 용도 | 접근 권한 |
|------------|------|-----------|
| `ilouli.com` | 메인 사이트 (랜딩, About, 인증) | 모두 |
| `ai.ilouli.com` | AI 기능 (스토리보드, 콘텐츠 도구) | 구독자 이상 |
| `community.ilouli.com` | 커뮤니티 (공지사항, 자유게시판) | 모두 |
| `family.ilouli.com` | 가족 공간 | Family/Admin |
| `admin.ilouli.com` | 관리자 대시보드 | Admin |
| `lab.ilouli.com` | 관리자 랩 (테스트 존, 파일 업로드) | Family/Admin |

## 로컬 개발 시 서브도메인 시뮬레이션

```
http://localhost:3000/?host=ai
http://localhost:3000/?host=community
http://localhost:3000/?host=family
http://localhost:3000/?host=admin
http://localhost:3000/?host=lab
```

## 기술 스택

- **Frontend:** React 19, React Router v6, i18next
- **Backend:** Express.js, SQLite (better-sqlite3), JWT 인증
- **인프라:** Nginx (리버스 프록시), PM2 (프로세스 관리), Let's Encrypt (SSL)

## 프로젝트 구조

```
homepage/
├── frontend/
│   ├── src/
│   │   ├── App.js              # Host-based router selection
│   │   ├── shared/             # 공용 컴포넌트
│   │   │   ├── NavigationBar.js
│   │   │   ├── ProtectedRoute.js
│   │   │   └── LanguageSelector.js
│   │   ├── features/           # 도메인별 기능
│   │   │   ├── auth/           # Login, Signup, Profile
│   │   │   ├── main/           # LandingPage, About
│   │   │   ├── admin/          # Admin dashboard
│   │   │   ├── community/      # Community features
│   │   │   ├── ai/             # AI Storyboard, Content Tools
│   │   │   ├── family/         # Family space, Calendar
│   │   │   └── lab/            # TestZone, Games, FileUpload
│   │   ├── routers/            # Host-specific routers
│   │   ├── contexts/           # React contexts
│   │   ├── services/           # API services
│   │   └── locales/            # i18n translations
│   └── .env
├── backend/
│   ├── server.js
│   ├── database.js
│   ├── routes/
│   ├── middleware/
│   └── ilouli.db
└── .claude/                    # Claude 설정
```

## 새 컴포넌트 추가 규칙

- **공용 컴포넌트**: `shared/` 폴더에 추가
- **기능 컴포넌트**: 해당 feature 폴더에 추가
- **새 도메인**: `features/` 아래에 새 폴더 생성

## User Tiers

| Tier | Access Level |
|------|--------------|
| Guest | Public pages only |
| General | Community, basic features |
| Subscriber | AI features |
| Family | All features, family space |
| Admin | Full access, admin dashboard |
