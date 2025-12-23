const express = require('express');
const db = require('../database');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/community/posts - 게시글 목록 조회
router.get('/posts', optionalAuth, (req, res) => {
  const { board = 'free', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    // 게시글 목록 조회 (작성자 정보 포함)
    const posts = db.prepare(`
      SELECT
        p.id,
        p.board,
        p.title,
        p.content,
        p.views,
        p.created_at,
        p.updated_at,
        u.id as author_id,
        u.name as author_name,
        u.email as author_email,
        u.picture as author_picture,
        (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) as comment_count
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.board = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(board, parseInt(limit), offset);

    // 전체 게시글 수
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM community_posts WHERE board = ?
    `).get(board).count;

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch posts' });
  }
});

// POST /api/community/posts - 게시글 작성
router.post('/posts', authMiddleware, (req, res) => {
  const { board, title, content } = req.body;
  const userId = req.user.id;

  if (!board || !title || !content) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO community_posts (user_id, board, title, content)
      VALUES (?, ?, ?, ?)
    `).run(userId, board, title, content);

    const post = db.prepare(`
      SELECT
        p.*,
        u.name as author_name,
        u.email as author_email,
        u.picture as author_picture
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    res.json({ success: true, data: post });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ success: false, error: 'Failed to create post' });
  }
});

// GET /api/community/posts/:id - 게시글 상세 조회
router.get('/posts/:id', optionalAuth, (req, res) => {
  const { id } = req.params;

  try {
    // 조회수 증가
    db.prepare(`
      UPDATE community_posts SET views = views + 1 WHERE id = ?
    `).run(id);

    // 게시글 조회
    const post = db.prepare(`
      SELECT
        p.*,
        u.id as author_id,
        u.name as author_name,
        u.email as author_email,
        u.picture as author_picture
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // 댓글 조회 (대댓글 포함)
    const comments = db.prepare(`
      SELECT
        c.*,
        u.id as author_id,
        u.name as author_name,
        u.email as author_email,
        u.picture as author_picture
      FROM community_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(id);

    res.json({ success: true, data: { post, comments } });
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch post' });
  }
});

// PUT /api/community/posts/:id - 게시글 수정
router.put('/posts/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.id;
  const userTier = req.user.tier;

  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    // 게시글 조회
    const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // 작성자 또는 관리자만 수정 가능
    if (post.user_id !== userId && userTier !== 'admin') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    // 게시글 수정
    db.prepare(`
      UPDATE community_posts
      SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, content, id);

    // 수정된 게시글 조회
    const updatedPost = db.prepare(`
      SELECT
        p.*,
        u.name as author_name,
        u.email as author_email,
        u.picture as author_picture
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(id);

    res.json({ success: true, data: updatedPost });
  } catch (err) {
    console.error('Update post error:', err);
    res.status(500).json({ success: false, error: 'Failed to update post' });
  }
});

// DELETE /api/community/posts/:id - 게시글 삭제
router.delete('/posts/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userTier = req.user.tier;

  try {
    // 게시글 조회
    const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // 작성자 또는 관리자만 삭제 가능
    if (post.user_id !== userId && userTier !== 'admin') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    // 게시글 삭제 (댓글도 CASCADE로 자동 삭제됨)
    db.prepare('DELETE FROM community_posts WHERE id = ?').run(id);

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete post' });
  }
});

// POST /api/community/posts/:id/comments - 댓글 작성
router.post('/posts/:id/comments', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { content, parent_id } = req.body;
  const userId = req.user.id;

  if (!content) {
    return res.status(400).json({ success: false, error: 'Content is required' });
  }

  try {
    // 게시글 존재 확인
    const post = db.prepare('SELECT id FROM community_posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // 대댓글인 경우 부모 댓글 존재 확인
    if (parent_id) {
      const parentComment = db.prepare('SELECT id FROM community_comments WHERE id = ?').get(parent_id);
      if (!parentComment) {
        return res.status(404).json({ success: false, error: 'Parent comment not found' });
      }
    }

    // 댓글 작성
    const result = db.prepare(`
      INSERT INTO community_comments (post_id, user_id, parent_id, content)
      VALUES (?, ?, ?, ?)
    `).run(id, userId, parent_id || null, content);

    // 작성된 댓글 조회
    const comment = db.prepare(`
      SELECT
        c.*,
        u.id as author_id,
        u.name as author_name,
        u.email as author_email,
        u.picture as author_picture
      FROM community_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.json({ success: true, data: comment });
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ success: false, error: 'Failed to create comment' });
  }
});

// DELETE /api/community/comments/:id - 댓글 삭제
router.delete('/comments/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userTier = req.user.tier;

  try {
    // 댓글 조회
    const comment = db.prepare('SELECT * FROM community_comments WHERE id = ?').get(id);

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // 작성자 또는 관리자만 삭제 가능
    if (comment.user_id !== userId && userTier !== 'admin') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    // 댓글 삭제 (대댓글도 CASCADE로 자동 삭제됨)
    db.prepare('DELETE FROM community_comments WHERE id = ?').run(id);

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
});

// POST /api/community/posts/:id/report - 게시글/댓글 신고
router.post('/posts/:id/report', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { target_type, reason } = req.body;
  const userId = req.user.id;

  if (!target_type || !reason) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  if (!['post', 'comment'].includes(target_type)) {
    return res.status(400).json({ success: false, error: 'Invalid target type' });
  }

  try {
    // 타겟 존재 확인
    if (target_type === 'post') {
      const post = db.prepare('SELECT id FROM community_posts WHERE id = ?').get(id);
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }
    } else if (target_type === 'comment') {
      const comment = db.prepare('SELECT id FROM community_comments WHERE id = ?').get(id);
      if (!comment) {
        return res.status(404).json({ success: false, error: 'Comment not found' });
      }
    }

    // 중복 신고 확인
    const existingReport = db.prepare(`
      SELECT id FROM community_reports
      WHERE user_id = ? AND target_type = ? AND target_id = ?
    `).get(userId, target_type, id);

    if (existingReport) {
      return res.status(400).json({ success: false, error: 'Already reported' });
    }

    // 신고 생성
    db.prepare(`
      INSERT INTO community_reports (user_id, target_type, target_id, reason)
      VALUES (?, ?, ?, ?)
    `).run(userId, target_type, id, reason);

    res.json({ success: true, message: 'Report submitted successfully' });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit report' });
  }
});

// GET /api/community/reports - 신고 목록 조회 (관리자 전용)
router.get('/reports', authMiddleware, (req, res) => {
  if (req.user.tier !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  try {
    const reports = db.prepare(`
      SELECT
        r.*,
        u.name as reporter_name,
        u.email as reporter_email
      FROM community_reports r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `).all();

    res.json({ success: true, data: reports });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
});

module.exports = router;
