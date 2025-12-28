# Community API Documentation

Base URL: `https://api.ilouli.com/api/community`

## 게시글 (Posts)

### 1. 게시글 목록 조회
**GET** `/posts`

Query Parameters:
- `board` (optional): 게시판 구분 (`announcement`, `free`) - 기본값: `free`
- `page` (optional): 페이지 번호 - 기본값: `1`
- `limit` (optional): 페이지당 게시글 수 - 기본값: `20`

Response:
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "board": "free",
        "title": "게시글 제목",
        "content": "게시글 내용",
        "views": 10,
        "author_id": 1,
        "author_name": "홍길동",
        "author_email": "user@example.com",
        "author_picture": "https://...",
        "comment_count": 5,
        "created_at": "2025-01-15 10:00:00",
        "updated_at": "2025-01-15 10:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 2. 게시글 작성
**POST** `/posts`

Authentication: Required (JWT)

Request Body:
```json
{
  "board": "free",
  "title": "게시글 제목",
  "content": "게시글 내용"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "board": "free",
    "title": "게시글 제목",
    "content": "게시글 내용",
    "views": 0,
    "author_name": "홍길동",
    "author_email": "user@example.com",
    "author_picture": "https://...",
    "created_at": "2025-01-15 10:00:00",
    "updated_at": "2025-01-15 10:00:00"
  }
}
```

### 3. 게시글 상세 조회
**GET** `/posts/:id`

Response:
```json
{
  "success": true,
  "data": {
    "post": {
      "id": 1,
      "user_id": 1,
      "board": "free",
      "title": "게시글 제목",
      "content": "게시글 내용",
      "views": 11,
      "author_id": 1,
      "author_name": "홍길동",
      "author_email": "user@example.com",
      "author_picture": "https://...",
      "created_at": "2025-01-15 10:00:00",
      "updated_at": "2025-01-15 10:00:00"
    },
    "comments": [
      {
        "id": 1,
        "post_id": 1,
        "user_id": 2,
        "parent_id": null,
        "content": "댓글 내용",
        "author_id": 2,
        "author_name": "김철수",
        "author_email": "user2@example.com",
        "author_picture": "https://...",
        "created_at": "2025-01-15 10:30:00",
        "updated_at": "2025-01-15 10:30:00"
      }
    ]
  }
}
```

### 4. 게시글 수정
**PUT** `/posts/:id`

Authentication: Required (작성자 또는 Admin)

Request Body:
```json
{
  "title": "수정된 제목",
  "content": "수정된 내용"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "board": "free",
    "title": "수정된 제목",
    "content": "수정된 내용",
    "views": 11,
    "author_name": "홍길동",
    "author_email": "user@example.com",
    "author_picture": "https://...",
    "created_at": "2025-01-15 10:00:00",
    "updated_at": "2025-01-15 11:00:00"
  }
}
```

### 5. 게시글 삭제
**DELETE** `/posts/:id`

Authentication: Required (작성자 또는 Admin)

Response:
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

## 댓글 (Comments)

### 1. 댓글 목록 조회
**GET** `/posts/:id/comments`

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "post_id": 1,
      "user_id": 2,
      "parent_id": null,
      "content": "댓글 내용",
      "author_id": 2,
      "author_name": "김철수",
      "author_email": "user2@example.com",
      "author_picture": "https://...",
      "created_at": "2025-01-15 10:30:00",
      "updated_at": "2025-01-15 10:30:00"
    },
    {
      "id": 2,
      "post_id": 1,
      "user_id": 3,
      "parent_id": 1,
      "content": "대댓글 내용",
      "author_id": 3,
      "author_name": "이영희",
      "author_email": "user3@example.com",
      "author_picture": "https://...",
      "created_at": "2025-01-15 10:35:00",
      "updated_at": "2025-01-15 10:35:00"
    }
  ]
}
```

### 2. 댓글 작성
**POST** `/posts/:id/comments`

Authentication: Required (JWT)

Request Body:
```json
{
  "content": "댓글 내용",
  "parent_id": null  // 대댓글인 경우 부모 댓글 ID
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "post_id": 1,
    "user_id": 2,
    "parent_id": null,
    "content": "댓글 내용",
    "author_id": 2,
    "author_name": "김철수",
    "author_email": "user2@example.com",
    "author_picture": "https://...",
    "created_at": "2025-01-15 10:30:00",
    "updated_at": "2025-01-15 10:30:00"
  }
}
```

### 3. 댓글 삭제
**DELETE** `/comments/:id`

Authentication: Required (작성자 또는 Admin)

Response:
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

## 신고 (Reports)

### 1. 게시글/댓글 신고
**POST** `/posts/:id/report`

Authentication: Required (JWT)

Request Body:
```json
{
  "target_type": "post",  // "post" 또는 "comment"
  "reason": "신고 사유"
}
```

Response:
```json
{
  "success": true,
  "message": "Report submitted successfully"
}
```

### 2. 신고 목록 조회 (관리자)
**GET** `/reports`

Authentication: Required (Admin)

Query Parameters:
- `status` (optional): 신고 상태 필터 (`pending`, `approved`, `rejected`)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "target_type": "post",
      "target_id": 10,
      "reason": "부적절한 내용",
      "status": "pending",
      "handled_by": null,
      "handled_at": null,
      "reporter_name": "김철수",
      "reporter_email": "user2@example.com",
      "handler_name": null,
      "handler_email": null,
      "created_at": "2025-01-15 10:00:00",
      "target_content": {
        "id": 10,
        "title": "신고된 게시글 제목",
        "content": "신고된 게시글 내용"
      }
    }
  ]
}
```

### 3. 신고 처리 (관리자)
**PUT** `/reports/:id`

Authentication: Required (Admin)

Request Body:
```json
{
  "status": "approved",  // "pending", "approved", "rejected"
  "action": "delete_target"  // "delete_target", "warn_user", "ignore" (optional)
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 2,
    "target_type": "post",
    "target_id": 10,
    "reason": "부적절한 내용",
    "status": "approved",
    "handled_by": 1,
    "handled_at": "2025-01-15 11:00:00",
    "reporter_name": "김철수",
    "reporter_email": "user2@example.com",
    "handler_name": "관리자",
    "handler_email": "admin@ilouli.com",
    "created_at": "2025-01-15 10:00:00"
  }
}
```

---

## Error Responses

모든 엔드포인트에서 공통으로 사용되는 에러 응답:

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

### HTTP Status Codes

- `200` - 성공
- `400` - 잘못된 요청 (필수 필드 누락, 유효하지 않은 값)
- `401` - 인증 필요
- `403` - 권한 없음 (작성자/관리자만 접근 가능)
- `404` - 리소스를 찾을 수 없음
- `500` - 서버 에러

---

## 사용 예시

### JavaScript (Fetch API)

```javascript
// 게시글 목록 조회
const response = await fetch('https://api.ilouli.com/api/community/posts?board=free&page=1');
const data = await response.json();

// 게시글 작성 (인증 필요)
const response = await fetch('https://api.ilouli.com/api/community/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    board: 'free',
    title: '새 게시글',
    content: '게시글 내용'
  })
});
const data = await response.json();

// 댓글 작성 (인증 필요)
const response = await fetch(`https://api.ilouli.com/api/community/posts/${postId}/comments`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    content: '댓글 내용',
    parent_id: null
  })
});
const data = await response.json();

// 신고 접수 (인증 필요)
const response = await fetch(`https://api.ilouli.com/api/community/posts/${postId}/report`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    target_type: 'post',
    reason: '부적절한 내용'
  })
});
const data = await response.json();
```

---

## 데이터베이스 스키마

### community_posts
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | Primary Key |
| user_id | INTEGER | 작성자 ID (Foreign Key) |
| board | TEXT | 게시판 구분 (`announcement`, `free`) |
| title | TEXT | 제목 |
| content | TEXT | 내용 |
| views | INTEGER | 조회수 |
| created_at | DATETIME | 작성일 |
| updated_at | DATETIME | 수정일 |

### community_comments
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | Primary Key |
| post_id | INTEGER | 게시글 ID (Foreign Key) |
| user_id | INTEGER | 작성자 ID (Foreign Key) |
| parent_id | INTEGER | 부모 댓글 ID (대댓글인 경우) |
| content | TEXT | 내용 |
| created_at | DATETIME | 작성일 |
| updated_at | DATETIME | 수정일 |

### community_reports
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | Primary Key |
| user_id | INTEGER | 신고자 ID (Foreign Key) |
| target_type | TEXT | 신고 대상 타입 (`post`, `comment`) |
| target_id | INTEGER | 신고 대상 ID |
| reason | TEXT | 신고 사유 |
| status | TEXT | 처리 상태 (`pending`, `approved`, `rejected`) |
| handled_by | INTEGER | 처리자 ID (Foreign Key) |
| handled_at | DATETIME | 처리일 |
| created_at | DATETIME | 신고일 |
