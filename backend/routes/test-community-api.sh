#!/bin/bash

# Community API Test Script
# 커뮤니티 API 엔드포인트 테스트

BASE_URL="https://api.ilouli.com/api/community"
ADMIN_EMAIL="admin@ilouli.com"
ADMIN_PASSWORD="admin123"

echo "=================================="
echo "Community API Test"
echo "=================================="

# 1. Admin 로그인하여 토큰 가져오기
echo -e "\n1. Admin Login..."
LOGIN_RESPONSE=$(curl -s -X POST "https://api.ilouli.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo $LOGIN_RESPONSE | jq .
  exit 1
fi

echo "✅ Login successful! Token: ${TOKEN:0:20}..."

# 2. 게시글 목록 조회
echo -e "\n2. Get posts (board=free, page=1, limit=5)..."
curl -s "$BASE_URL/posts?board=free&page=1&limit=5" | jq .

# 3. 게시글 작성 (테스트용)
echo -e "\n3. Create test post..."
CREATE_POST=$(curl -s -X POST "$BASE_URL/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "board": "free",
    "title": "테스트 게시글",
    "content": "커뮤니티 API 테스트를 위한 게시글입니다."
  }')

POST_ID=$(echo $CREATE_POST | jq -r '.data.id')
echo "✅ Post created! ID: $POST_ID"
echo $CREATE_POST | jq .

# 4. 게시글 상세 조회
echo -e "\n4. Get post detail (ID: $POST_ID)..."
curl -s "$BASE_URL/posts/$POST_ID" | jq .

# 5. 댓글 작성
echo -e "\n5. Create comment on post $POST_ID..."
CREATE_COMMENT=$(curl -s -X POST "$BASE_URL/posts/$POST_ID/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "테스트 댓글입니다.",
    "parent_id": null
  }')

COMMENT_ID=$(echo $CREATE_COMMENT | jq -r '.data.id')
echo "✅ Comment created! ID: $COMMENT_ID"
echo $CREATE_COMMENT | jq .

# 6. 댓글 목록 조회 (새 엔드포인트)
echo -e "\n6. Get comments for post $POST_ID..."
curl -s "$BASE_URL/posts/$POST_ID/comments" | jq .

# 7. 신고 접수 (게시글)
echo -e "\n7. Report post $POST_ID..."
REPORT_POST=$(curl -s -X POST "$BASE_URL/posts/$POST_ID/report" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "target_type": "post",
    "reason": "테스트 신고입니다 (스팸)"
  }')

echo $REPORT_POST | jq .

# 8. 신고 목록 조회 (관리자)
echo -e "\n8. Get all reports (Admin only)..."
REPORTS=$(curl -s "$BASE_URL/reports" \
  -H "Authorization: Bearer $TOKEN")

REPORT_ID=$(echo $REPORTS | jq -r '.data[0].id')
echo "✅ Reports fetched! First report ID: $REPORT_ID"
echo $REPORTS | jq .

# 9. 신고 처리 (새 엔드포인트 - 승인 및 게시글 삭제하지 않음)
if [ "$REPORT_ID" != "null" ] && [ ! -z "$REPORT_ID" ]; then
  echo -e "\n9. Handle report $REPORT_ID (status: rejected)..."
  HANDLE_REPORT=$(curl -s -X PUT "$BASE_URL/reports/$REPORT_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "status": "rejected"
    }')

  echo $HANDLE_REPORT | jq .
else
  echo -e "\n9. Skip report handling (no reports found)"
fi

# 10. 신고 목록 조회 (상태 필터링 - pending만)
echo -e "\n10. Get pending reports only..."
curl -s "$BASE_URL/reports?status=pending" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 11. 게시글 수정
echo -e "\n11. Update post $POST_ID..."
UPDATE_POST=$(curl -s -X PUT "$BASE_URL/posts/$POST_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "수정된 테스트 게시글",
    "content": "내용이 수정되었습니다."
  }')

echo $UPDATE_POST | jq .

# 12. 댓글 삭제
echo -e "\n12. Delete comment $COMMENT_ID..."
DELETE_COMMENT=$(curl -s -X DELETE "$BASE_URL/comments/$COMMENT_ID" \
  -H "Authorization: Bearer $TOKEN")

echo $DELETE_COMMENT | jq .

# 13. 게시글 삭제
echo -e "\n13. Delete post $POST_ID..."
DELETE_POST=$(curl -s -X DELETE "$BASE_URL/posts/$POST_ID" \
  -H "Authorization: Bearer $TOKEN")

echo $DELETE_POST | jq .

echo -e "\n=================================="
echo "All tests completed!"
echo "=================================="
