const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/notifications - 알림 목록 조회
router.get('/', authMiddleware, (req, res) => {
  try {
    const { unreadOnly, limit = 50 } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT
        id,
        user_id as userId,
        type,
        title,
        message,
        link,
        metadata,
        is_read as read,
        created_at as createdAt
      FROM notifications
      WHERE user_id = ?
    `;

    const params = [userId];

    if (unreadOnly === 'true') {
      query += ` AND is_read = 0`;
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const notifications = db.prepare(query).all(...params);

    // metadata를 JSON 파싱
    const parsedNotifications = notifications.map(n => ({
      ...n,
      metadata: n.metadata ? JSON.parse(n.metadata) : {},
      read: n.read === 1
    }));

    // 읽지 않은 알림 개수
    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(userId).count;

    res.json({
      success: true,
      notifications: parsedNotifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/:id/read - 알림 읽음 처리
router.put('/:id/read', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 본인의 알림인지 확인
    const notification = db.prepare(`
      SELECT * FROM notifications WHERE id = ? AND user_id = ?
    `).get(id, userId);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    // 읽음 처리
    db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = ? AND user_id = ?
    `).run(id, userId);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
});

// PUT /api/notifications/read-all - 모든 알림 읽음 처리
router.put('/read-all', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;

    db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ? AND is_read = 0
    `).run(userId);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark all notifications as read' });
  }
});

// DELETE /api/notifications/:id - 알림 삭제
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 본인의 알림인지 확인
    const notification = db.prepare(`
      SELECT * FROM notifications WHERE id = ? AND user_id = ?
    `).get(id, userId);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    // 삭제
    db.prepare(`
      DELETE FROM notifications WHERE id = ? AND user_id = ?
    `).run(id, userId);

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

// DELETE /api/notifications - 모든 알림 삭제
router.delete('/', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;

    db.prepare(`
      DELETE FROM notifications WHERE user_id = ?
    `).run(userId);

    res.json({ success: true, message: 'All notifications deleted' });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to delete all notifications' });
  }
});

// POST /api/notifications - 알림 생성 (내부용 + Admin)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { userId, type, title, message, link, metadata } = req.body;

    // Admin이 아니면 자기 자신에게만 알림 생성 가능
    if (req.user.tier !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    // 필수 필드 검증
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId, type, title, message are required'
      });
    }

    // 대상 사용자 존재 확인
    const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 알림 생성
    const result = db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      type,
      title,
      message,
      link || null,
      metadata ? JSON.stringify(metadata) : null
    );

    const newNotification = db.prepare(`
      SELECT
        id,
        user_id as userId,
        type,
        title,
        message,
        link,
        metadata,
        is_read as read,
        created_at as createdAt
      FROM notifications
      WHERE id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      notification: {
        ...newNotification,
        metadata: newNotification.metadata ? JSON.parse(newNotification.metadata) : {},
        read: newNotification.read === 1
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, error: 'Failed to create notification' });
  }
});

// Helper function to create notification (for internal use)
function createNotification(userId, type, title, message, link = null, metadata = {}) {
  try {
    const result = db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      type,
      title,
      message,
      link || null,
      metadata ? JSON.stringify(metadata) : null
    );

    return {
      success: true,
      notificationId: result.lastInsertRowid
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export both router and helper function
module.exports = router;
module.exports.createNotification = createNotification;
