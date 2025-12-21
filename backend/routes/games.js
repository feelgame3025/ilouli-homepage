const express = require('express');
const db = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 점수 저장
router.post('/scores', optionalAuth, (req, res) => {
  try {
    const { gameId, playerName, score, details } = req.body;
    const userId = req.user?.id || null;

    if (!gameId || !playerName || score === undefined) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }

    const stmt = db.prepare(`
      INSERT INTO game_scores (user_id, game_id, player_name, score, details)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      gameId,
      playerName,
      score,
      details ? JSON.stringify(details) : null
    );

    // 현재 순위 계산
    const rank = db.prepare(`
      SELECT COUNT(*) + 1 as rank
      FROM game_scores
      WHERE game_id = ? AND score > ?
    `).get(gameId, score);

    res.json({
      success: true,
      scoreId: result.lastInsertRowid,
      rank: rank.rank
    });
  } catch (error) {
    console.error('Score save error:', error);
    res.status(500).json({ error: '점수 저장 실패' });
  }
});

// 게임별 랭킹 조회
router.get('/scores/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const scores = db.prepare(`
      SELECT
        gs.id,
        gs.player_name,
        gs.score,
        gs.details,
        gs.created_at,
        u.name as user_name,
        u.picture as user_picture
      FROM game_scores gs
      LEFT JOIN users u ON gs.user_id = u.id
      WHERE gs.game_id = ?
      ORDER BY gs.score DESC
      LIMIT ?
    `).all(gameId, limit);

    res.json({
      gameId,
      scores: scores.map((s, idx) => ({
        id: s.id,
        rank: idx + 1,
        playerName: s.player_name,
        userName: s.user_name,
        userPicture: s.user_picture,
        score: s.score,
        details: s.details ? JSON.parse(s.details) : null,
        createdAt: s.created_at
      }))
    });
  } catch (error) {
    console.error('Score fetch error:', error);
    res.status(500).json({ error: '랭킹 조회 실패' });
  }
});

// 모든 게임 랭킹 조회
router.get('/scores', (req, res) => {
  try {
    const gameIds = ['memory', 'tictactoe', 'sudoku', 'gostop', 'poker'];
    const result = {};

    for (const gameId of gameIds) {
      const scores = db.prepare(`
        SELECT
          gs.id,
          gs.player_name,
          gs.score,
          gs.created_at,
          u.name as user_name
        FROM game_scores gs
        LEFT JOIN users u ON gs.user_id = u.id
        WHERE gs.game_id = ?
        ORDER BY gs.score DESC
        LIMIT 10
      `).all(gameId);

      result[gameId] = scores.map((s, idx) => ({
        id: s.id,
        rank: idx + 1,
        playerName: s.player_name,
        userName: s.user_name,
        score: s.score,
        createdAt: s.created_at
      }));
    }

    res.json({ rankings: result });
  } catch (error) {
    console.error('All scores fetch error:', error);
    res.status(500).json({ error: '랭킹 조회 실패' });
  }
});

// 내 점수 조회
router.get('/my-scores', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const scores = db.prepare(`
      SELECT
        id,
        game_id,
        player_name,
        score,
        details,
        created_at
      FROM game_scores
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(userId);

    res.json({
      scores: scores.map(s => ({
        id: s.id,
        gameId: s.game_id,
        playerName: s.player_name,
        score: s.score,
        details: s.details ? JSON.parse(s.details) : null,
        createdAt: s.created_at
      }))
    });
  } catch (error) {
    console.error('My scores fetch error:', error);
    res.status(500).json({ error: '내 점수 조회 실패' });
  }
});

module.exports = router;
