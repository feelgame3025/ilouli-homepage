# 코딩 스타일 규칙 (Coding Style Rules)

## 디자인 가이드라인

Apple 스타일 미니멀리즘을 따른다:
- 깔끔한 레이아웃
- 충분한 여백
- 부드러운 애니메이션
- 고품질 비주얼
- 반응형 디자인

## React 컴포넌트

- 함수형 컴포넌트 사용
- hooks 활용 (useState, useEffect, useCallback, useMemo)
- 컴포넌트별 CSS 파일 사용 (예: `Component.js` + `Component.css`)

## 파일 명명 규칙

- 컴포넌트: PascalCase (예: `NavigationBar.js`)
- 스타일: 컴포넌트와 동일 (예: `NavigationBar.css`)
- 유틸리티/서비스: camelCase (예: `socialAuth.js`)
- 라우터: PascalCase + Router (예: `MainRouter.js`)

## 국제화 (i18n)

- 모든 사용자 facing 텍스트는 `useTranslation()` 사용
- 번역 파일: `src/locales/en/translation.json`, `src/locales/ko/translation.json`

## CSS 규칙

- 표준 CSS 사용 (CSS-in-JS 아님)
- BEM 스타일 네이밍 권장
- 반응형 breakpoints 일관성 유지
