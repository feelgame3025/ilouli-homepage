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

## Architecture

**Tech Stack:**
- React 19 with Create React App
- React Router v6 for client-side routing
- Standard CSS (component-level `.css` files)
- React Testing Library for tests

**Project Structure:**
```
frontend/
├── src/
│   ├── App.js              # Root component with route definitions
│   ├── index.js            # Entry point
│   └── components/         # Feature components
│       ├── LandingPage.js
│       ├── NavigationBar.js
│       ├── AIStoryboard.js # AI creative pipeline
│       ├── FamilySpace.js  # Family-tier private area
│       └── Profile.js
```

**Routing:**
- `/` - Landing page
- `/storyboard` - AI Storyboard feature
- `/family` - Family-only space
- `/profile` - User profile

## Key Documentation

- `PRD.md` - Product Requirements Document with detailed feature specifications, user tiers, and business model
- `GEMINI.md` - Previous AI assistant documentation for this project

## Design Guidelines

Follow Apple-inspired minimalism: clean layouts, generous whitespace, smooth animations, and high-quality visuals. Ensure responsive design across devices.
