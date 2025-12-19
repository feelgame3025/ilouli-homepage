const express = require('express');
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// 모든 사용자 조회 (관리자 전용)
router.get('/', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, social_id, social_provider, picture, tier, status, join_date, created_at
      FROM users
      WHERE status = 'approved' OR status IS NULL
      ORDER BY created_at DESC
    `).all();

    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// 대기 중인 사용자 조회 (관리자 전용)
router.get('/pending', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, tier, status, join_date, created_at
      FROM users
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `).all();

    res.json({ users });
  } catch (err) {
    console.error('Get pending users error:', err);
    res.status(500).json({ error: 'Failed to get pending users' });
  }
});

// 사용자 승인 (관리자 전용)
router.post('/:id/approve', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  try {
    const result = db.prepare(`
      UPDATE users SET status = 'approved', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User approved' });
  } catch (err) {
    console.error('Approve user error:', err);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// 사용자 거절 (관리자 전용)
router.post('/:id/reject', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User rejected' });
  } catch (err) {
    console.error('Reject user error:', err);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// 사용자 등급 변경 (관리자 전용)
router.put('/:id/tier', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { tier } = req.body;

  const validTiers = ['guest', 'general', 'subscriber', 'family', 'admin'];
  if (!validTiers.includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  try {
    const result = db.prepare(`
      UPDATE users SET tier = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(tier, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Tier updated' });
  } catch (err) {
    console.error('Update tier error:', err);
    res.status(500).json({ error: 'Failed to update tier' });
  }
});

// 사용자 삭제 (관리자 전용)
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  // 자기 자신은 삭제 불가
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
