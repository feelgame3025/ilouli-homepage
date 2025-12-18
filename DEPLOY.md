# 배포 가이드

## 1. GitHub 저장소 설정

```bash
# GitHub CLI 로그인
~/.local/bin/gh auth login

# Private 저장소 생성 및 푸시
~/.local/bin/gh repo create ilouli-homepage --private --source=. --push
```

## 2. Nginx 설치 및 설정

```bash
# Nginx 설치
sudo apt update && sudo apt install nginx -y

# 설정 스크립트 실행
sudo bash nginx/setup.sh
```

## 3. 수동 설정 (선택)

```bash
# React 빌드
cd frontend && npm run build

# Nginx 설정 복사
sudo cp nginx/ilouli.conf /etc/nginx/sites-available/ilouli.com
sudo ln -sf /etc/nginx/sites-available/ilouli.com /etc/nginx/sites-enabled/

# Nginx 재시작
sudo nginx -t && sudo systemctl restart nginx
```

## 4. 로컬 테스트

```bash
# /etc/hosts에 추가
echo "127.0.0.1 ilouli.com" | sudo tee -a /etc/hosts
```

## 5. SSL 인증서 (HTTPS)

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx -y

# SSL 인증서 발급
sudo certbot --nginx -d ilouli.com -d www.ilouli.com
```

## 6. 멀티 프로젝트 호스팅

`nginx/multi-host-example.conf` 파일을 참고하여 각 프로젝트별 가상호스트를 설정할 수 있습니다.

### 서브도메인 예시
- `ilouli.com` - 메인 홈페이지
- `api.ilouli.com` - API 서버
- `blog.ilouli.com` - 블로그
- `dev.ilouli.com` - 개발 서버

## 7. 자동 배포 (CI/CD)

GitHub Actions를 사용한 자동 배포:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci && npm run build
      - name: Deploy to server
        run: rsync -avz frontend/build/ user@server:/path/to/build/
```
