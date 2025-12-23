---
argument-hint: [feature/ComponentName]
description: 새 React 컴포넌트 생성
---

"$ARGUMENTS" 이름으로 새 React 컴포넌트를 생성해줘.

## 경로 규칙
- `shared/ComponentName` → `frontend/src/shared/ComponentName.js`
- `auth/ComponentName` → `frontend/src/features/auth/ComponentName.js`
- `admin/ComponentName` → `frontend/src/features/admin/ComponentName.js`
- `community/ComponentName` → `frontend/src/features/community/ComponentName.js`
- `ai/ComponentName` → `frontend/src/features/ai/ComponentName.js`
- `family/ComponentName` → `frontend/src/features/family/ComponentName.js`
- `lab/ComponentName` → `frontend/src/features/lab/ComponentName.js`
- `main/ComponentName` → `frontend/src/features/main/ComponentName.js`

## 생성 항목
1. 컴포넌트 `.js` 파일 생성
2. 컴포넌트 `.css` 파일 생성
3. 기본 함수형 컴포넌트 구조 작성
4. CSS import 포함
5. export default 포함

인자가 없으면 어느 feature에 어떤 컴포넌트를 만들지 물어봐줘.
