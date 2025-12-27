# Google OAuth 설정 가이드

## 오류: redirect_uri_mismatch

이 오류는 Google Cloud Console에 등록된 도메인과 실제 요청 도메인이 일치하지 않을 때 발생합니다.

---

## 설정 방법

### 1단계: Google Cloud Console 접속

1. https://console.cloud.google.com/ 접속
2. 프로젝트 선택 (ilouli 프로젝트)
3. 왼쪽 메뉴 → **APIs & Services** → **Credentials**

### 2단계: OAuth 2.0 Client ID 수정

1. **OAuth 2.0 Client IDs** 섹션에서 사용 중인 Client ID 클릭
2. 편집 화면 진입

### 3단계: Authorized JavaScript origins 추가

아래 URL들을 모두 추가:

```
https://ilouli.com
https://www.ilouli.com
https://ai.ilouli.com
https://community.ilouli.com
https://family.ilouli.com
https://admin.ilouli.com
https://lab.ilouli.com
```

### 4단계: Authorized redirect URIs 추가

아래 URL들을 모두 추가:

```
https://ilouli.com
https://ilouli.com/login
https://ilouli.com/signup
https://www.ilouli.com
https://www.ilouli.com/login
https://ai.ilouli.com
https://ai.ilouli.com/login
https://community.ilouli.com
https://community.ilouli.com/login
https://family.ilouli.com
https://family.ilouli.com/login
https://admin.ilouli.com
https://admin.ilouli.com/login
https://lab.ilouli.com
https://lab.ilouli.com/login
```

### 5단계: 저장

- **저장** 버튼 클릭
- 반영까지 최대 5분 소요

---

## 로컬 개발 환경 (선택)

로컬에서도 Google 로그인 테스트가 필요하면 추가:

**JavaScript origins:**
```
http://localhost:3000
```

**Redirect URIs:**
```
http://localhost:3000
http://localhost:3000/login
```

---

## 확인 방법

1. 브라우저 개발자 도구 열기 (F12)
2. **Network** 탭 선택
3. Google 로그인 버튼 클릭
4. `accounts.google.com` 요청 찾기
5. Request URL에서 `redirect_uri` 파라미터 확인
6. 해당 URI가 Console에 등록되어 있는지 확인

---

## 문제 해결

### 여전히 오류가 발생하면:

1. **캐시 문제**: 브라우저 캐시/쿠키 삭제 후 재시도
2. **반영 시간**: 설정 변경 후 5분 대기
3. **정확한 URL**: `https://` vs `http://`, 후행 슬래시 `/` 여부 확인
4. **Client ID 확인**: .env 파일의 REACT_APP_GOOGLE_CLIENT_ID가 올바른지 확인
