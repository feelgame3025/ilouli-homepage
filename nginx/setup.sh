#!/bin/bash

# ilouli.com Nginx 설정 스크립트
# 사용법: sudo bash setup.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== ilouli.com Nginx 설정 ==="

# 1. React 프로덕션 빌드
echo "1. React 프로덕션 빌드 중..."
cd "$PROJECT_DIR/frontend"
npm run build

# 2. Nginx 설정 파일 복사
echo "2. Nginx 설정 파일 복사..."
sudo cp "$SCRIPT_DIR/ilouli.conf" /etc/nginx/sites-available/ilouli.com

# 3. 심볼릭 링크 생성
echo "3. 심볼릭 링크 생성..."
sudo ln -sf /etc/nginx/sites-available/ilouli.com /etc/nginx/sites-enabled/

# 4. 기본 설정 비활성화 (선택)
# sudo rm -f /etc/nginx/sites-enabled/default

# 5. Nginx 설정 테스트
echo "4. Nginx 설정 테스트..."
sudo nginx -t

# 6. Nginx 재시작
echo "5. Nginx 재시작..."
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "=== 설정 완료 ==="
echo "사이트: http://ilouli.com"
echo ""
echo "다음 단계:"
echo "1. /etc/hosts에 '127.0.0.1 ilouli.com' 추가 (로컬 테스트용)"
echo "2. DNS 설정에서 ilouli.com -> 서버 IP 연결"
echo "3. SSL 인증서 설정: sudo certbot --nginx -d ilouli.com -d www.ilouli.com"
