#!/bin/bash

# ilouli.com 배포 스크립트
# 사용법: ./deploy.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 경로 설정
PROJECT_DIR="/home/feel3025/myproject/homepage"
FRONTEND_DIR="$PROJECT_DIR/frontend"
DEPLOY_DIR="/var/www/html"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  ilouli.com 배포 시작${NC}"
echo -e "${YELLOW}========================================${NC}"

# 프론트엔드 디렉토리로 이동
cd "$FRONTEND_DIR"

# 1. 빌드
echo -e "\n${GREEN}[1/3] 빌드 중...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}빌드 실패!${NC}"
    exit 1
fi

echo -e "${GREEN}빌드 완료!${NC}"

# 2. 배포
echo -e "\n${GREEN}[2/3] 배포 중...${NC}"
sudo cp -r "$FRONTEND_DIR/build/"* "$DEPLOY_DIR/"

if [ $? -ne 0 ]; then
    echo -e "${RED}배포 실패!${NC}"
    exit 1
fi

echo -e "${GREEN}배포 완료!${NC}"

# 3. 권한 설정
echo -e "\n${GREEN}[3/3] 권한 설정 중...${NC}"
sudo chown -R www-data:www-data "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  배포 성공!${NC}"
echo -e "${GREEN}  https://ilouli.com${NC}"
echo -e "${GREEN}========================================${NC}"
