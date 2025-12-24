# 코드 리팩토링 계획서

> **작성일**: 2025-12-23
> **목적**: 중복 코드 제거, 일관성 확보, 유지보수성 향상

---

## 1. 현재 문제점 요약

### 1.1 API 설정 불일치 (6개 파일)

| 파일 | 변수명 | 환경변수 |
|------|--------|----------|
| api.js | `API_BASE_URL` | `REACT_APP_API_URL` |
| community.js | `API_BASE_URL` | `REACT_APP_API_BASE_URL` ❌ |
| notifications.js | `API_URL` ❌ | `REACT_APP_API_URL` |
| imageUpscaler.js | `API_BASE_URL` | `REACT_APP_API_URL` |
| imageToVideo.js | `API_BASE_URL` | `REACT_APP_API_URL` |
| videoCreator.js | `API_BASE_URL` | `REACT_APP_API_URL` |

### 1.2 토큰 관리 불일치 (4가지 방식)

```
api.js:           getToken() - 쿠키 기반 ✅ (올바름)
community.js:     localStorage.getItem('token') ❌
videoCreator.js:  localStorage.getItem('ilouli_token') ❌
notifications.js: 파라미터로 token 전달
```

### 1.3 Mock 모드 변수명 불일치

```
imageUpscaler.js: MOCK_MODE = false
videoCreator.js:  USE_MOCK_MODE = true ❌
imageToVideo.js:  MOCK_MODE = false
```

### 1.4 중복 유틸리티 함수

| 함수 | 위치 | 비고 |
|------|------|------|
| `formatFileSize()` | imageUpscaler.js | 파일 크기 포맷 |
| `readFileAsDataURL()` | imageToVideo.js | 파일 읽기 |
| `validateImageFile()` | imageToVideo.js | 이미지 검증 |

### 1.5 에러 처리 패턴 불일치 (4가지)

```javascript
// 패턴 1: api.js
const data = await response.json();
if (!response.ok) throw new Error(data.error);

// 패턴 2: community.js
if (!response.ok) throw new Error('Failed');

// 패턴 3: imageToVideo.js
const errorData = await response.json().catch(() => ({}));
throw new Error(errorData.error || '기본 메시지');

// 패턴 4: videoCreator.js
return { success: false, error: '...' };
```

### 1.6 localStorage 키 불일치

```
AuthContext:        쿠키 ('ilouli_token')
CommunityContext:   'ilouli_posts', 'ilouli_reports'
NotificationContext: 'ilouli_notifications'
CalendarContext:    'ilouli_family_calendar'
AssetContext:       'ilouli_assets'
```

---

## 2. 리팩토링 계획

### Phase 1: 설정 및 상수 통합 (즉시)

#### 1.1 API 설정 중앙화

**생성**: `src/config/api.js`

```javascript
// src/config/api.js
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.ilouli.com';
export const USE_MOCK_MODE = process.env.REACT_APP_USE_MOCK === 'true';

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  COMMUNITY: '/api/community',
  NOTIFICATIONS: '/api/notifications',
  AI: '/api/ai',
  FILES: '/api/files',
  ADMIN: '/api/admin',
};
```

**수정 대상**: 6개 서비스 파일

#### 1.2 Storage 키 상수화

**생성**: `src/constants/storageKeys.js`

```javascript
// src/constants/storageKeys.js
export const STORAGE_KEYS = {
  TOKEN: 'ilouli_token',
  USER: 'ilouli_user',
  POSTS: 'ilouli_posts',
  REPORTS: 'ilouli_reports',
  NOTIFICATIONS: 'ilouli_notifications',
  NOTIFICATION_SETTINGS: 'ilouli_notification_settings',
  CALENDAR: 'ilouli_family_calendar',
  ASSETS: 'ilouli_assets',
};
```

**수정 대상**: 5개 Context 파일

#### 1.3 파일 유틸리티 통합

**생성**: `src/utils/file.js`

```javascript
// src/utils/file.js
export const formatFileSize = (bytes) => { ... };
export const readFileAsDataURL = (file) => { ... };
export const validateImageFile = (file, options) => { ... };
export const validateVideoFile = (file, options) => { ... };
```

**수정 대상**: imageUpscaler.js, imageToVideo.js

---

### Phase 2: API 레이어 통합 (1주)

#### 2.1 API 베이스 클래스 개선

**수정**: `src/services/api.js`

```javascript
// 토큰 가져오기 함수 export
export const getToken = () => { ... };
export const getAuthHeaders = () => { ... };

// 통합 요청 함수
export const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: getAuthHeaders(),
    ...options,
  });
  return handleResponse(response);
};

// 에러 처리 통합
const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || 'Request failed', response.status);
  }
  return data;
};
```

#### 2.2 서비스 파일 통합

**수정 대상**:
- `community.js` → `api.js`의 `getToken()` 사용
- `notifications.js` → `api.js`의 `apiRequest()` 사용
- `imageUpscaler.js` → 설정 import
- `imageToVideo.js` → 설정 import

---

### Phase 3: 공통 컴포넌트 생성 (1주)

#### 3.1 생성할 컴포넌트

| 컴포넌트 | 용도 | 현재 상태 |
|----------|------|----------|
| `LoadingSpinner` | 로딩 표시 | 각 파일에서 다르게 구현 |
| `ErrorMessage` | 에러 표시 | 일관성 없음 |
| `ProgressBar` | 진행률 표시 | 3가지 방식 |
| `EmptyState` | 데이터 없음 | 각 파일에서 다르게 구현 |
| `FileUploader` | 파일 업로드 | 중복 구현 |

**생성 위치**: `src/shared/`

---

### Phase 4: 컨텍스트 최적화 (2주)

#### 4.1 컨텍스트 분리

| 현재 | 분리 후 |
|------|---------|
| AuthContext (인증+관리자) | AuthContext + AdminContext |
| CommunityContext (300줄+) | CommunityContext + useCommunityAPI |
| CalendarContext (370줄) | CalendarContext + useGoogleCalendar |

#### 4.2 커스텀 훅 생성

```
src/hooks/
  ├── useApi.js         # API 호출 래퍼
  ├── useLocalStorage.js # localStorage 관리
  ├── useMockData.js    # Mock 데이터 처리
  └── useProgress.js    # 진행률 상태 관리
```

---

## 3. 파일 변경 목록

### 생성할 파일

| 파일 | 목적 |
|------|------|
| `src/config/api.js` | API 설정 중앙화 |
| `src/constants/storageKeys.js` | localStorage 키 상수 |
| `src/utils/file.js` | 파일 처리 유틸 |
| `src/utils/validation.js` | 검증 유틸 |
| `src/shared/LoadingSpinner.js` | 로딩 컴포넌트 |
| `src/shared/ErrorMessage.js` | 에러 컴포넌트 |
| `src/shared/ProgressBar.js` | 진행률 컴포넌트 |
| `src/shared/EmptyState.js` | 빈 상태 컴포넌트 |
| `src/hooks/useApi.js` | API 훅 |
| `src/hooks/useLocalStorage.js` | Storage 훅 |

### 수정할 파일

| 파일 | 변경 내용 |
|------|----------|
| `services/api.js` | getToken, apiRequest export |
| `services/community.js` | 설정/토큰 통합 |
| `services/notifications.js` | 설정/토큰 통합 |
| `services/imageUpscaler.js` | 설정 import, 유틸 사용 |
| `services/imageToVideo.js` | 설정 import, 유틸 사용 |
| `services/videoCreator.js` | 설정 import |
| `contexts/AuthContext.js` | 상수 사용 |
| `contexts/CommunityContext.js` | 상수 사용, 훅 분리 |
| `contexts/NotificationContext.js` | 상수 사용 |
| `contexts/CalendarContext.js` | 상수 사용 |
| `contexts/AssetContext.js` | 상수 사용 |

---

## 4. 예상 효과

| 항목 | Before | After |
|------|--------|-------|
| API URL 정의 | 6곳 | 1곳 |
| 토큰 관리 방식 | 4가지 | 1가지 |
| 파일 유틸 함수 | 3곳 중복 | 1곳 통합 |
| Storage 키 | 하드코딩 | 상수화 |
| 에러 처리 | 4가지 패턴 | 1가지 통합 |
| Mock 모드 변수 | 3가지 | 1가지 (환경변수) |

---

## 5. 진행 순서

```
[x] Phase 1.1: API 설정 중앙화 (src/config/api.js) ✅ 완료
[x] Phase 1.2: Storage 키 상수화 (src/constants/storageKeys.js) ✅ 완료
[x] Phase 1.3: 파일 유틸리티 통합 (src/utils/file.js) ✅ 완료
[x] Phase 2.1: API 베이스 개선 (services/api.js) ✅ 완료
[x] Phase 2.2: 서비스 파일들 통합 적용 ✅ 완료
[x] Phase 3.1: 공통 컴포넌트 생성 ✅ 완료
[x] Phase 4.1: 컨텍스트 분리 및 최적화 ✅ 완료
```

### 완료일: 2025-12-24

---

## 6. 주의사항

1. **점진적 리팩토링**: 한 번에 모든 것을 바꾸지 않고 단계별 진행
2. **테스트**: 각 단계 후 기능 테스트 필수
3. **백업**: 주요 변경 전 커밋
4. **호환성**: 기존 기능 깨지지 않도록 주의

---

## 7. 완료 보고

모든 리팩토링 작업이 완료되었습니다.

### 생성된 파일
- `src/config/api.js` - API 설정 중앙화
- `src/constants/storageKeys.js` - Storage 키 상수
- `src/utils/file.js` - 파일 유틸리티
- `src/shared/LoadingSpinner.js` - 로딩 스피너
- `src/shared/ProgressBar.js` - 진행률 바
- `src/shared/ErrorMessage.js` - 에러 메시지
- `src/shared/EmptyState.js` - 빈 상태
- `src/shared/FileUploader.js` - 파일 업로더
- `src/hooks/useApi.js` - API 훅
- `src/hooks/useLocalStorage.js` - 스토리지 훅
- `src/hooks/useMockData.js` - Mock 데이터 훅
- `src/hooks/useProgress.js` - 진행률 훅
- `src/hooks/useCommunityAPI.js` - 커뮤니티 API 훅
- `src/hooks/useGoogleCalendar.js` - Google 캘린더 훅

### 추가 수정 사항
- Google Calendar 연결 유지 기능 개선
- 로그인 세션 유지 기능 개선
- 가족공간 서브메뉴 추가
