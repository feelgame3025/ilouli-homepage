import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import gameSound from '../utils/gameSound';
import './Games.css';

// ==================== 리더보드 시스템 ====================
// 서버 기반 리더보드 (로컬 캐시 포함)
const Leaderboard = {
  cache: {},

  // 로컬 스토리지에서 점수 가져오기 (캐시 또는 폴백)
  getScores(gameId) {
    // 캐시가 있으면 캐시 사용
    if (this.cache[gameId]) {
      return this.cache[gameId];
    }
    // 없으면 로컬 스토리지에서 가져오기
    const data = localStorage.getItem(`leaderboard_${gameId}`);
    return data ? JSON.parse(data) : [];
  },

  // 서버에서 점수 가져오기
  async fetchScores(gameId) {
    try {
      const response = await api.get(`/api/games/scores/${gameId}`);
      const scores = response.data.scores.map(s => ({
        id: s.id,
        name: s.playerName,
        userName: s.userName,
        score: s.score,
        date: s.createdAt
      }));
      this.cache[gameId] = scores;
      localStorage.setItem(`leaderboard_${gameId}`, JSON.stringify(scores));
      return scores;
    } catch (error) {
      console.error('Failed to fetch scores:', error);
      return this.getScores(gameId);
    }
  },

  // 서버에 점수 저장
  async addScore(gameId, name, score, details = {}) {
    try {
      const response = await api.post('/api/games/scores', {
        gameId,
        playerName: name || '익명',
        score,
        details
      });
      // 캐시 새로고침
      await this.fetchScores(gameId);
      return response.data.rank;
    } catch (error) {
      console.error('Failed to save score:', error);
      // 서버 실패 시 로컬에만 저장
      const scores = this.getScores(gameId);
      const newEntry = {
        id: Date.now(),
        name: name || '익명',
        score,
        details,
        date: new Date().toISOString()
      };
      scores.push(newEntry);
      scores.sort((a, b) => b.score - a.score);
      const top10 = scores.slice(0, 10);
      localStorage.setItem(`leaderboard_${gameId}`, JSON.stringify(top10));
      return top10.findIndex(s => s.id === newEntry.id) + 1;
    }
  },

  getRank(gameId, score) {
    const scores = this.getScores(gameId);
    const rank = scores.filter(s => s.score > score).length + 1;
    return rank;
  },

  // 모든 게임 점수 가져오기
  async fetchAllScores() {
    try {
      const response = await api.get('/api/games/scores');
      const rankings = response.data.rankings;
      for (const gameId in rankings) {
        const scores = rankings[gameId].map(s => ({
          id: s.id,
          name: s.playerName,
          userName: s.userName,
          score: s.score,
          date: s.createdAt
        }));
        this.cache[gameId] = scores;
        localStorage.setItem(`leaderboard_${gameId}`, JSON.stringify(scores));
      }
      return true;
    } catch (error) {
      console.error('Failed to fetch all scores:', error);
      return false;
    }
  }
};

// 사운드 토글 버튼 컴포넌트
const SoundToggle = ({ isMuted, onToggle }) => (
  <button
    className={`sound-toggle ${isMuted ? 'muted' : ''}`}
    onClick={onToggle}
    title={isMuted ? '소리 켜기' : '소리 끄기'}
  >
    {isMuted ? '🔇' : '🔊'}
  </button>
);

// 리더보드 표시 컴포넌트
const LeaderboardDisplay = ({ gameId, gameName, onClose }) => {
  const [scores, setScores] = useState(Leaderboard.getScores(gameId));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      const data = await Leaderboard.fetchScores(gameId);
      setScores(data);
      setLoading(false);
    };
    fetchScores();
  }, [gameId]);

  return (
    <div className="leaderboard-overlay" onClick={onClose}>
      <div className="leaderboard-modal" onClick={e => e.stopPropagation()}>
        <div className="leaderboard-header">
          <h3>🏆 {gameName} 랭킹</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="leaderboard-content">
          {loading ? (
            <p className="loading-scores">로딩 중...</p>
          ) : scores.length === 0 ? (
            <p className="no-scores">아직 기록이 없습니다.</p>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>이름</th>
                  <th>점수</th>
                  <th>날짜</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((entry, idx) => (
                  <tr key={entry.id} className={idx < 3 ? `rank-${idx + 1}` : ''}>
                    <td className="rank">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td>{entry.userName || entry.name}</td>
                    <td className="score">{entry.score.toLocaleString()}</td>
                    <td className="date">{new Date(entry.date).toLocaleDateString('ko-KR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// 점수 등록 모달
const ScoreSubmitModal = ({ score, rank, onSubmit, onClose }) => {
  const [name, setName] = useState(localStorage.getItem('playerName') || '');

  const handleSubmit = () => {
    localStorage.setItem('playerName', name);
    onSubmit(name);
  };

  return (
    <div className="leaderboard-overlay">
      <div className="leaderboard-modal score-submit">
        <h3>🎉 게임 완료!</h3>
        <p className="final-score">점수: <strong>{score.toLocaleString()}</strong></p>
        {rank <= 10 && <p className="rank-notice">🏆 {rank}위 달성!</p>}
        <div className="name-input-area">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="이름 입력"
            maxLength={10}
            className="name-input"
          />
          <button onClick={handleSubmit} className="game-btn">등록</button>
        </div>
        <button onClick={onClose} className="skip-btn">건너뛰기</button>
      </div>
    </div>
  );
};

// ==================== 메모리 카드 게임 ====================
const MemoryGame = ({ onBack }) => {
  const emojis = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎸', '🎺'];
  const [cards, setCards] = useState(() => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji, flipped: false, matched: false }));
    return shuffled;
  });
  const [flippedCards, setFlippedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isMuted, setIsMuted] = useState(gameSound.getMuted());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalRank, setFinalRank] = useState(0);

  useEffect(() => {
    gameSound.init();
    gameSound.playGameStart();
  }, []);

  const calculateScore = (moves) => Math.max(1000 - (moves * 50), 100);

  const handleCardClick = (id) => {
    if (isChecking) return;
    const card = cards.find(c => c.id === id);
    if (card.flipped || card.matched) return;

    gameSound.playFlip();

    const newCards = cards.map(c =>
      c.id === id ? { ...c, flipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const newMoves = moves + 1;
      setMoves(newMoves);
      setIsChecking(true);
      const [first, second] = newFlipped;
      const firstCard = newCards.find(c => c.id === first);
      const secondCard = newCards.find(c => c.id === second);

      if (firstCard.emoji === secondCard.emoji) {
        gameSound.playMatch();
        const updatedCards = newCards.map(c =>
          c.id === first || c.id === second ? { ...c, matched: true } : c
        );
        setCards(updatedCards);
        setFlippedCards([]);
        setIsChecking(false);

        if (updatedCards.every(c => c.matched)) {
          setTimeout(() => {
            gameSound.playWin();
            const score = calculateScore(newMoves);
            setFinalScore(score);
            setFinalRank(Leaderboard.getRank('memory', score));
            setShowSubmit(true);
          }, 300);
        }
      } else {
        gameSound.playWrong();
        setTimeout(() => {
          setCards(newCards.map(c =>
            c.id === first || c.id === second ? { ...c, flipped: false } : c
          ));
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  const resetGame = () => {
    gameSound.playClick();
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji, flipped: false, matched: false }));
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    gameSound.playGameStart();
  };

  const handleScoreSubmit = (name) => {
    Leaderboard.addScore('memory', name, finalScore, { moves });
    setShowSubmit(false);
  };

  const toggleSound = () => {
    const muted = gameSound.toggleMute();
    setIsMuted(muted);
  };

  const isComplete = cards.every(c => c.matched);

  return (
    <div className="game-play-area">
      <div className="game-header-bar">
        <button onClick={() => { gameSound.playClick(); onBack(); }} className="back-btn">← 뒤로</button>
        <h2>메모리 게임</h2>
        <div className="header-right">
          <button onClick={() => setShowLeaderboard(true)} className="ranking-btn">🏆</button>
          <span className="game-score">시도: {moves}회</span>
          <SoundToggle isMuted={isMuted} onToggle={toggleSound} />
        </div>
      </div>

      {isComplete && !showSubmit && (
        <div className="game-complete">
          <h3>🎉 축하합니다!</h3>
          <p>{moves}번 만에 완료! (점수: {calculateScore(moves)})</p>
          <button onClick={resetGame} className="game-btn">다시 하기</button>
        </div>
      )}

      <div className="memory-grid">
        {cards.map(card => (
          <div
            key={card.id}
            className={`memory-card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            <div className="card-inner">
              <div className="card-front">?</div>
              <div className="card-back">{card.emoji}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={resetGame} className="game-btn reset-btn">새 게임</button>

      {showLeaderboard && (
        <LeaderboardDisplay gameId="memory" gameName="메모리 게임" onClose={() => setShowLeaderboard(false)} />
      )}
      {showSubmit && (
        <ScoreSubmitModal
          score={finalScore}
          rank={finalRank}
          onSubmit={handleScoreSubmit}
          onClose={() => setShowSubmit(false)}
        />
      )}
    </div>
  );
};

// ==================== 틱택토 게임 ====================
const TicTacToe = ({ onBack }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [isMuted, setIsMuted] = useState(gameSound.getMuted());
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    gameSound.init();
    gameSound.playGameStart();
  }, []);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    return null;
  };

  const result = calculateWinner(board);
  const winner = result?.winner;
  const winningLine = result?.line || [];
  const isDraw = !winner && board.every(cell => cell !== null);

  const handleClick = (index) => {
    if (board[index] || winner) return;
    gameSound.playClick();
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const newResult = calculateWinner(newBoard);
    if (newResult?.winner) {
      setTimeout(() => gameSound.playWin(), 100);
      const newScores = { ...scores, [newResult.winner]: scores[newResult.winner] + 1 };
      setScores(newScores);
      Leaderboard.addScore('tictactoe', newResult.winner, newScores[newResult.winner]);
    } else if (newBoard.every(cell => cell !== null)) {
      gameSound.playDraw();
    }
  };

  const resetGame = () => {
    gameSound.playClick();
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const toggleSound = () => {
    const muted = gameSound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="game-play-area">
      <div className="game-header-bar">
        <button onClick={() => { gameSound.playClick(); onBack(); }} className="back-btn">← 뒤로</button>
        <h2>틱택토</h2>
        <div className="header-right">
          <button onClick={() => setShowLeaderboard(true)} className="ranking-btn">🏆</button>
          <span className="game-score">X: {scores.X} | O: {scores.O}</span>
          <SoundToggle isMuted={isMuted} onToggle={toggleSound} />
        </div>
      </div>

      <div className="ttt-status">
        {winner ? `🎉 ${winner} 승리!` : isDraw ? '무승부!' : `다음 차례: ${isXNext ? 'X' : 'O'}`}
      </div>

      <div className="ttt-board">
        {board.map((cell, index) => (
          <button
            key={index}
            className={`ttt-cell ${cell} ${winningLine.includes(index) ? 'winning' : ''}`}
            onClick={() => handleClick(index)}
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="game-buttons">
        <button onClick={resetGame} className="game-btn">새 게임</button>
        <button onClick={() => { setScores({ X: 0, O: 0 }); resetGame(); }} className="game-btn secondary">점수 초기화</button>
      </div>

      {showLeaderboard && (
        <LeaderboardDisplay gameId="tictactoe" gameName="틱택토" onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
};

// ==================== 수도쿠 게임 ====================
const MAX_ERRORS = 15; // 최대 실패 횟수

const Sudoku = ({ onBack }) => {
  const [isMuted, setIsMuted] = useState(gameSound.getMuted());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [board, setBoard] = useState([]);
  const [solution, setSolution] = useState([]);
  const [initial, setInitial] = useState([]);
  const [selected, setSelected] = useState(null);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalRank, setFinalRank] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 수도쿠 생성 함수
  const generateSudoku = useCallback(() => {
    // 간단한 수도쿠 생성 (완전한 알고리즘은 복잡하므로 미리 정의된 패턴 사용)
    const baseSolution = [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9]
    ];

    // 행/열/숫자 섞기로 변형
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const numMap = shuffle([1,2,3,4,5,6,7,8,9]);
    const newSolution = baseSolution.map(row =>
      row.map(n => numMap[n - 1])
    );

    // 난이도에 따라 빈칸 수 결정
    const emptyCount = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 40 : 50;
    const newBoard = newSolution.map(row => [...row]);

    let removed = 0;
    while (removed < emptyCount) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (newBoard[r][c] !== 0) {
        newBoard[r][c] = 0;
        removed++;
      }
    }

    setSolution(newSolution);
    setBoard(newBoard);
    setInitial(newBoard.map(row => row.map(n => n !== 0)));
    setSelected(null);
    setErrors(0);
    setStartTime(Date.now());
    setElapsedTime(0);
    setIsComplete(false);
    setIsGameOver(false);
  }, [difficulty]);

  useEffect(() => {
    gameSound.init();
    generateSudoku();
  }, [generateSudoku]);

  useEffect(() => {
    if (!isComplete && !isGameOver && startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime, isComplete, isGameOver]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCellClick = (row, col) => {
    if (initial[row]?.[col] || isGameOver || isComplete) return;
    setSelected({ row, col });
    gameSound.playClick();
  };

  const handleNumberInput = (num) => {
    if (!selected || initial[selected.row]?.[selected.col] || isGameOver || isComplete) return;

    const newBoard = board.map(row => [...row]);
    newBoard[selected.row][selected.col] = num;
    setBoard(newBoard);

    if (num !== 0) {
      if (solution[selected.row][selected.col] === num) {
        gameSound.playMatch();
        // 완료 체크
        const isSolved = newBoard.every((row, r) =>
          row.every((cell, c) => cell === solution[r][c])
        );
        if (isSolved) {
          gameSound.playWin();
          setIsComplete(true);
          const score = calculateScore();
          setFinalScore(score);
          setFinalRank(Leaderboard.getRank('sudoku', score));
          setShowSubmit(true);
        }
      } else {
        gameSound.playWrong();
        const newErrors = errors + 1;
        setErrors(newErrors);
        // 15회 실패 시 게임 오버
        if (newErrors >= MAX_ERRORS) {
          setIsGameOver(true);
          gameSound.playLose();
        }
      }
    }
  };

  const calculateScore = () => {
    const baseScore = difficulty === 'easy' ? 500 : difficulty === 'medium' ? 1000 : 1500;
    const timeBonus = Math.max(0, 300 - elapsedTime) * 2;
    const errorPenalty = errors * 50;
    return Math.max(baseScore + timeBonus - errorPenalty, 100);
  };

  const handleScoreSubmit = (name) => {
    Leaderboard.addScore('sudoku', name, finalScore, { difficulty, time: elapsedTime, errors });
    setShowSubmit(false);
  };

  const toggleSound = () => {
    const muted = gameSound.toggleMute();
    setIsMuted(muted);
  };

  const getCellClass = (row, col) => {
    let classes = 'sudoku-cell';
    if (initial[row]?.[col]) classes += ' initial';
    if (selected?.row === row && selected?.col === col) classes += ' selected';
    if (selected && (selected.row === row || selected.col === col)) classes += ' highlighted';
    if (board[row]?.[col] && board[row][col] !== solution[row]?.[col]) classes += ' error';
    if ((row + 1) % 3 === 0 && row < 8) classes += ' border-bottom';
    if ((col + 1) % 3 === 0 && col < 8) classes += ' border-right';
    return classes;
  };

  return (
    <div className={`game-play-area sudoku-area ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      <div className="game-header-bar">
        <button onClick={() => { gameSound.playClick(); isFullscreen ? setIsFullscreen(false) : onBack(); }} className="back-btn">
          {isFullscreen ? '✕ 닫기' : '← 뒤로'}
        </button>
        <h2>수도쿠</h2>
        <div className="header-right">
          <button onClick={() => setShowLeaderboard(true)} className="ranking-btn">🏆</button>
          <span className="game-score">{formatTime(elapsedTime)}</span>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="fullscreen-toggle" title="전체화면">
            {isFullscreen ? '⤓' : '⤢'}
          </button>
          <SoundToggle isMuted={isMuted} onToggle={toggleSound} />
        </div>
      </div>

      {/* 남은 기회 표시 */}
      <div className="sudoku-lives">
        <span className="lives-label">기회</span>
        <div className="lives-hearts">
          {[...Array(MAX_ERRORS)].map((_, i) => (
            <span key={i} className={`heart ${i < MAX_ERRORS - errors ? 'active' : 'lost'}`} />
          ))}
        </div>
        <span className="lives-count">{MAX_ERRORS - errors}/{MAX_ERRORS}</span>
      </div>

      <div className="sudoku-controls">
        <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="difficulty-select" disabled={isGameOver || isComplete}>
          <option value="easy">쉬움</option>
          <option value="medium">보통</option>
          <option value="hard">어려움</option>
        </select>
        <button onClick={generateSudoku} className="game-btn small">새 게임</button>
      </div>

      {/* 게임 오버 표시 */}
      {isGameOver && (
        <div className="sudoku-gameover">
          <h3>💔 게임 오버!</h3>
          <p>15번의 실패로 게임이 종료되었습니다.</p>
          <button onClick={generateSudoku} className="game-btn">다시 도전</button>
        </div>
      )}

      <div className={`sudoku-board ${isGameOver ? 'game-over' : ''}`}>
        {board.map((row, r) => (
          <div key={r} className="sudoku-row">
            {row.map((cell, c) => (
              <div
                key={c}
                className={getCellClass(r, c)}
                onClick={() => handleCellClick(r, c)}
              >
                {cell !== 0 ? cell : ''}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="sudoku-numpad">
        {[1,2,3,4,5,6,7,8,9].map(num => (
          <button key={num} className="numpad-btn" onClick={() => handleNumberInput(num)}>
            {num}
          </button>
        ))}
        <button className="numpad-btn erase" onClick={() => handleNumberInput(0)}>⌫</button>
      </div>

      {showLeaderboard && (
        <LeaderboardDisplay gameId="sudoku" gameName="수도쿠" onClose={() => setShowLeaderboard(false)} />
      )}
      {showSubmit && (
        <ScoreSubmitModal
          score={finalScore}
          rank={finalRank}
          onSubmit={handleScoreSubmit}
          onClose={() => setShowSubmit(false)}
        />
      )}
    </div>
  );
};

// ==================== 맞고 게임 ====================
// 화투 이미지 매핑 (서버 업로드된 실제 화투 이미지)
const HWATU_IMAGE_MAP = {
  '1-1': '1766365648113-246585907.png',
  '1-2': '1766365648040-398829771.png',
  '1-3': '1766365647990-957864677.png',
  '1-4': '1766365647901-991381946.png',
  '2-1': '1766365648299-896721373.png',
  '2-2': '1766365648264-567946987.png',
  '2-3': '1766365648281-422771943.png',
  '2-4': '1766365648146-136778318.png',
  '3-1': '1766365648007-26931206.png',
  '3-2': '1766365648061-457781584.png',
  '3-3': '1766365648096-895991008.png',
  '3-4': '1766365647920-205705528.png',
  '4-1': '1766365648213-442459374.png',
  '4-2': '1766365648129-211245955.png',
  '4-3': '1766365648162-58848333.png',
  '4-4': '1766365648246-955995828.png',
  '5-1': '1766365647802-768277004.png',
  '5-2': '1766365647936-615083179.png',
  '5-3': '1766365647975-673220710.png',
  '5-4': '1766365648079-717804224.png',
  '6-1': '1766365648179-819603995.png',
  '6-2': '1766365648229-284854545.png',
  '6-3': '1766365648195-217754773.png',
  '6-4': '1766365648315-903974657.png',
  '7-1': '1766365647954-486907208.png',
  '7-2': '1766365647885-332796171.png',
  '7-3': '1766365647859-981807374.png',
  '7-4': '1766365648024-379925920.png',
  '8-1': '1766365648470-903551197.png',
  '8-2': '1766365648518-775832240.png',
  '8-3': '1766365648485-208944818.png',
  '8-4': '1766365648437-74352903.png',
  '9-1': '1766365648656-182981457.png',
  '9-2': '1766365648622-253389898.png',
  '9-3': '1766365648605-469820217.png',
  '9-4': '1766365648553-51756069.png',
  '10-1': '1766365648367-911477294.png',
  '10-2': '1766365648422-610609444.png',
  '10-3': '1766365648386-728581906.png',
  '10-4': '1766365648502-932841805.png',
  '11-1': '1766365648588-806626211.png',
  '11-2': '1766365648570-323944655.png',
  '11-3': '1766365648536-891418201.png',
  '11-4': '1766365648639-790562712.png',
  '12-1': '1766365648403-709711113.png',
  '12-2': '1766365648334-202283624.png',
  '12-3': '1766365648349-721958801.png',
  '12-4': '1766365648454-752753178.png',
};

const getHwatuImageUrl = (month, index) => {
  const key = `${month}-${index}`;
  const filename = HWATU_IMAGE_MAP[key];
  return filename ? `https://api.ilouli.com/api/files/view/${filename}` : null;
};

// 화투패 48장 정의 - 한국식 전통 화투 (나무위키 참고)
// 각 월별 테마: 1월 송학, 2월 매조, 3월 벚꽃, 4월 흑싸리, 5월 난초, 6월 모란
// 7월 홍싸리, 8월 공산(억새), 9월 국화, 10월 단풍, 11월 오동, 12월 비
const HWATU_DECK = [
  // 1월 (송학/松鶴) - 소나무와 두루미, 태양
  { month: 1, imageIndex: 1, name: '송학', type: '광', subtype: null, desc: '학+태양', piCount: 0 },
  { month: 1, imageIndex: 2, name: '송학', type: '띠', subtype: '홍단', desc: '홍단', piCount: 0 },
  { month: 1, imageIndex: 3, name: '송학', type: '피', subtype: null, desc: '소나무', piCount: 1 },
  { month: 1, imageIndex: 4, name: '송학', type: '피', subtype: null, desc: '소나무', piCount: 1 },
  // 2월 (매조/梅鳥) - 매화와 휘파람새(꾀꼬리)
  { month: 2, imageIndex: 1, name: '매조', type: '열끗', subtype: '고도리', desc: '꾀꼬리', piCount: 0 },
  { month: 2, imageIndex: 2, name: '매조', type: '띠', subtype: '홍단', desc: '홍단', piCount: 0 },
  { month: 2, imageIndex: 3, name: '매조', type: '피', subtype: null, desc: '매화', piCount: 1 },
  { month: 2, imageIndex: 4, name: '매조', type: '피', subtype: null, desc: '매화', piCount: 1 },
  // 3월 (벚꽃/桜) - 벚꽃과 장막(만막)
  { month: 3, imageIndex: 1, name: '벚꽃', type: '광', subtype: null, desc: '장막', piCount: 0 },
  { month: 3, imageIndex: 2, name: '벚꽃', type: '띠', subtype: '홍단', desc: '홍단', piCount: 0 },
  { month: 3, imageIndex: 3, name: '벚꽃', type: '피', subtype: null, desc: '벚꽃', piCount: 1 },
  { month: 3, imageIndex: 4, name: '벚꽃', type: '피', subtype: null, desc: '벚꽃', piCount: 1 },
  // 4월 (흑싸리/藤) - 등나무와 두견새
  { month: 4, imageIndex: 1, name: '흑싸리', type: '열끗', subtype: '고도리', desc: '두견새', piCount: 0 },
  { month: 4, imageIndex: 2, name: '흑싸리', type: '띠', subtype: '초단', desc: '초단', piCount: 0 },
  { month: 4, imageIndex: 3, name: '흑싸리', type: '피', subtype: null, desc: '등나무', piCount: 1 },
  { month: 4, imageIndex: 4, name: '흑싸리', type: '피', subtype: null, desc: '등나무', piCount: 1 },
  // 5월 (난초/菖蒲) - 창포(제비붓꽃)와 팔교다리
  { month: 5, imageIndex: 1, name: '난초', type: '열끗', subtype: null, desc: '팔교', piCount: 0 },
  { month: 5, imageIndex: 2, name: '난초', type: '띠', subtype: '초단', desc: '초단', piCount: 0 },
  { month: 5, imageIndex: 3, name: '난초', type: '피', subtype: null, desc: '창포', piCount: 1 },
  { month: 5, imageIndex: 4, name: '난초', type: '피', subtype: null, desc: '창포', piCount: 1 },
  // 6월 (모란/牡丹) - 모란과 나비
  { month: 6, imageIndex: 1, name: '모란', type: '열끗', subtype: null, desc: '나비', piCount: 0 },
  { month: 6, imageIndex: 2, name: '모란', type: '띠', subtype: '청단', desc: '청단', piCount: 0 },
  { month: 6, imageIndex: 3, name: '모란', type: '피', subtype: null, desc: '모란', piCount: 1 },
  { month: 6, imageIndex: 4, name: '모란', type: '피', subtype: null, desc: '모란', piCount: 1 },
  // 7월 (홍싸리/萩) - 홍싸리와 멧돼지
  { month: 7, imageIndex: 1, name: '홍싸리', type: '열끗', subtype: null, desc: '멧돼지', piCount: 0 },
  { month: 7, imageIndex: 2, name: '홍싸리', type: '띠', subtype: '초단', desc: '초단', piCount: 0 },
  { month: 7, imageIndex: 3, name: '홍싸리', type: '피', subtype: null, desc: '싸리', piCount: 1 },
  { month: 7, imageIndex: 4, name: '홍싸리', type: '피', subtype: null, desc: '싸리', piCount: 1 },
  // 8월 (공산/芒) - 억새밭과 보름달, 기러기
  { month: 8, imageIndex: 1, name: '공산', type: '광', subtype: null, desc: '보름달', piCount: 0 },
  { month: 8, imageIndex: 2, name: '공산', type: '열끗', subtype: '고도리', desc: '기러기', piCount: 0 },
  { month: 8, imageIndex: 3, name: '공산', type: '피', subtype: null, desc: '억새', piCount: 1 },
  { month: 8, imageIndex: 4, name: '공산', type: '피', subtype: null, desc: '억새', piCount: 1 },
  // 9월 (국화/菊) - 국화와 술잔(壽)
  { month: 9, imageIndex: 1, name: '국화', type: '열끗', subtype: null, desc: '술잔', piCount: 0 },
  { month: 9, imageIndex: 2, name: '국화', type: '띠', subtype: '청단', desc: '청단', piCount: 0 },
  { month: 9, imageIndex: 3, name: '국화', type: '피', subtype: null, desc: '국화', piCount: 1 },
  { month: 9, imageIndex: 4, name: '국화', type: '피', subtype: null, desc: '국화', piCount: 1 },
  // 10월 (단풍/紅葉) - 단풍과 사슴
  { month: 10, imageIndex: 1, name: '단풍', type: '열끗', subtype: null, desc: '사슴', piCount: 0 },
  { month: 10, imageIndex: 2, name: '단풍', type: '띠', subtype: '청단', desc: '청단', piCount: 0 },
  { month: 10, imageIndex: 3, name: '단풍', type: '피', subtype: null, desc: '단풍', piCount: 1 },
  { month: 10, imageIndex: 4, name: '단풍', type: '피', subtype: null, desc: '단풍', piCount: 1 },
  // 11월 (오동/桐) - 오동나무와 봉황
  { month: 11, imageIndex: 1, name: '오동', type: '광', subtype: '비광', desc: '봉황', piCount: 0 },
  { month: 11, imageIndex: 2, name: '오동', type: '피', subtype: null, desc: '오동', piCount: 1 },
  { month: 11, imageIndex: 3, name: '오동', type: '피', subtype: null, desc: '오동', piCount: 1 },
  { month: 11, imageIndex: 4, name: '오동', type: '피', subtype: '쌍피', desc: '쌍피', piCount: 2 },
  // 12월 (비/雨) - 버드나무, 비, 오노노 도후(우산 쓴 인물)
  { month: 12, imageIndex: 1, name: '비', type: '광', subtype: '비광', desc: '비광', piCount: 0 },
  { month: 12, imageIndex: 2, name: '비', type: '열끗', subtype: null, desc: '제비', piCount: 0 },
  { month: 12, imageIndex: 3, name: '비', type: '띠', subtype: null, desc: '띠', piCount: 0 },
  { month: 12, imageIndex: 4, name: '비', type: '피', subtype: '쌍피', desc: '쌍피', piCount: 2 },
];

const GoStop = ({ onBack }) => {
  const [isMuted, setIsMuted] = useState(gameSound.getMuted());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameState, setGameState] = useState('betting');
  const [chips, setChips] = useState(1000);
  const [currentBet, setCurrentBet] = useState(100);
  const [message, setMessage] = useState('베팅 금액을 선택하세요');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [computerHand, setComputerHand] = useState([]);
  const [fieldCards, setFieldCards] = useState([]);

  const [playerCollected, setPlayerCollected] = useState({ 광: [], 열끗: [], 띠: [], 피: [] });
  const [computerCollected, setComputerCollected] = useState({ 광: [], 열끗: [], 띠: [], 피: [] });

  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [goCount, setGoCount] = useState(0);
  const [canStop, setCanStop] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);

  const [showSubmit, setShowSubmit] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalRank, setFinalRank] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState([]);

  // 애니메이션 상태
  const [playingCard, setPlayingCard] = useState(null);
  const [computerPlayingCard, setComputerPlayingCard] = useState(null);
  const [matchedCards, setMatchedCards] = useState([]);
  const [showMatchEffect, setShowMatchEffect] = useState(false);
  const [matchEffectText, setMatchEffectText] = useState('매칭!');

  useEffect(() => {
    gameSound.init();
  }, []);

  // 덱 섞기
  const shuffleDeck = () => {
    const newDeck = HWATU_DECK.map((card, idx) => ({
      ...card,
      id: `card-${idx}-${Date.now()}`
    }));
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };

  // 점수 계산 (맞고 룰)
  const calculateScore = useCallback((collected) => {
    let score = 0;
    const breakdown = [];

    // 광 점수
    const gwangCards = collected.광;
    const hasBiGwang = gwangCards.some(c => c.subtype === '비광');
    const gwangCount = gwangCards.length;

    if (gwangCount === 5) {
      score += 15;
      breakdown.push({ name: '오광', score: 15 });
    } else if (gwangCount === 4) {
      score += 4;
      breakdown.push({ name: '사광', score: 4 });
    } else if (gwangCount === 3) {
      if (hasBiGwang) {
        score += 2;
        breakdown.push({ name: '비삼광', score: 2 });
      } else {
        score += 3;
        breakdown.push({ name: '삼광', score: 3 });
      }
    }

    // 고도리 (2,4,8월 새)
    const godoriCards = collected.열끗.filter(c => c.subtype === '고도리');
    if (godoriCards.length === 3) {
      score += 5;
      breakdown.push({ name: '고도리', score: 5 });
    }

    // 홍단 (1,2,3월 홍단)
    const hongdanCards = collected.띠.filter(c => c.subtype === '홍단');
    if (hongdanCards.length === 3) {
      score += 3;
      breakdown.push({ name: '홍단', score: 3 });
    }

    // 청단 (6,9,10월 청단)
    const cheongdanCards = collected.띠.filter(c => c.subtype === '청단');
    if (cheongdanCards.length === 3) {
      score += 3;
      breakdown.push({ name: '청단', score: 3 });
    }

    // 초단 (4,5,7월 초단)
    const chodanCards = collected.띠.filter(c => c.subtype === '초단');
    if (chodanCards.length === 3) {
      score += 3;
      breakdown.push({ name: '초단', score: 3 });
    }

    // 열끗 (5장 이상)
    if (collected.열끗.length >= 5) {
      const yeolkkeut = collected.열끗.length - 4;
      score += yeolkkeut;
      breakdown.push({ name: `열끗 ${collected.열끗.length}장`, score: yeolkkeut });
    }

    // 띠 (5장 이상)
    if (collected.띠.length >= 5) {
      const tti = collected.띠.length - 4;
      score += tti;
      breakdown.push({ name: `띠 ${collected.띠.length}장`, score: tti });
    }

    // 피 (10장 이상, 쌍피는 2장으로 계산)
    const piCount = collected.피.reduce((sum, c) => sum + c.piCount, 0);
    if (piCount >= 10) {
      const piScore = piCount - 9;
      score += piScore;
      breakdown.push({ name: `피 ${piCount}장`, score: piScore });
    }

    return { score, breakdown };
  }, []);

  // 게임 시작
  const startGame = () => {
    if (currentBet > chips) {
      setMessage('칩이 부족합니다!');
      return;
    }

    gameSound.playGameStart();
    const newDeck = shuffleDeck();

    // 카드 배분: 플레이어 7장, 컴퓨터 7장, 바닥 6장
    setPlayerHand(newDeck.slice(0, 7));
    setComputerHand(newDeck.slice(7, 14));
    setFieldCards(newDeck.slice(14, 20));
    setDeck(newDeck.slice(20));

    setPlayerCollected({ 광: [], 열끗: [], 띠: [], 피: [] });
    setComputerCollected({ 광: [], 열끗: [], 띠: [], 피: [] });
    setPlayerScore(0);
    setComputerScore(0);
    setGoCount(0);
    setCanStop(false);
    setIsPlayerTurn(true);
    setSelectedCard(null);
    setScoreBreakdown([]);
    setGameState('playing');
    setMessage('카드를 선택하세요');
  };

  // 카드 선택
  const selectCard = (card) => {
    if (!isPlayerTurn || canStop || playingCard) return;
    setSelectedCard(card);
    gameSound.playClick();
  };

  // 더블클릭으로 바로 카드 내기
  const handleDoubleClick = (card) => {
    if (!isPlayerTurn || canStop || playingCard) return;
    setSelectedCard(card);
    setTimeout(() => playCardWithAnimation(card), 50);
  };

  // 카드 내기 (애니메이션 포함)
  const playCardWithAnimation = (cardToPlay) => {
    const card = cardToPlay || selectedCard;
    if (!card || !isPlayerTurn || canStop || playingCard) return;

    // 애니메이션 시작
    setPlayingCard(card);
    gameSound.playFlip();

    const matchingCards = fieldCards.filter(f => f.month === card.month);

    // 매칭되는 카드 하이라이트 (0.5초 후)
    setTimeout(() => {
      if (matchingCards.length > 0) {
        setMatchedCards(matchingCards.map(c => c.id));
        setMatchEffectText(matchingCards.length === 3 ? '싹쓸이!' : '매칭!');
      }
    }, 500);

    // 애니메이션 후 실제 카드 내기 처리 (1초 후)
    setTimeout(() => {
      processPlayCard(card, matchingCards);
    }, 1000);
  };

  // 실제 카드 처리 로직
  const processPlayCard = (card, matchingCards) => {
    let newFieldCards = [...fieldCards];
    let newCollected = JSON.parse(JSON.stringify(playerCollected));
    let newHand = playerHand.filter(c => c.id !== card.id);

    if (matchingCards.length === 0) {
      // 매칭 카드 없음 - 바닥에 놓기
      newFieldCards.push(card);
    } else if (matchingCards.length === 1) {
      // 1장 매칭 - 둘 다 가져오기
      const matched = matchingCards[0];
      newFieldCards = fieldCards.filter(f => f.id !== matched.id);
      newCollected[card.type].push(card);
      newCollected[matched.type].push(matched);
      setShowMatchEffect(true);
      gameSound.playMatch();
    } else if (matchingCards.length === 2) {
      // 2장 매칭 - 하나 선택 (자동으로 첫 번째 선택)
      const matched = matchingCards[0];
      newFieldCards = fieldCards.filter(f => f.id !== matched.id);
      newCollected[card.type].push(card);
      newCollected[matched.type].push(matched);
      setShowMatchEffect(true);
      gameSound.playMatch();
    } else if (matchingCards.length === 3) {
      // 3장 매칭 - 모두 가져오기
      newFieldCards = fieldCards.filter(f => f.month !== card.month);
      newCollected[card.type].push(card);
      matchingCards.forEach(m => newCollected[m.type].push(m));
      setShowMatchEffect(true);
      gameSound.playMatch();
    }

    // 이펙트 표시 후 처리 (0.8초 후)
    setTimeout(() => {
      setShowMatchEffect(false);
      setMatchedCards([]);
      setPlayingCard(null);

      // 덱에서 카드 뽑기
      if (deck.length > 0) {
        const drawnCard = deck[0];
        const newDeck = deck.slice(1);
        setDeck(newDeck);

        const drawnMatches = newFieldCards.filter(f => f.month === drawnCard.month);
        if (drawnMatches.length === 0) {
          newFieldCards.push(drawnCard);
        } else if (drawnMatches.length === 1) {
          const matched = drawnMatches[0];
          newFieldCards = newFieldCards.filter(f => f.id !== matched.id);
          newCollected[drawnCard.type].push(drawnCard);
          newCollected[matched.type].push(matched);
        } else if (drawnMatches.length >= 2) {
          const matched = drawnMatches[0];
          newFieldCards = newFieldCards.filter(f => f.id !== matched.id);
          newCollected[drawnCard.type].push(drawnCard);
          newCollected[matched.type].push(matched);
        }
      }

      setPlayerHand(newHand);
      setFieldCards(newFieldCards);
      setPlayerCollected(newCollected);
      setSelectedCard(null);

      const { score, breakdown } = calculateScore(newCollected);
      setPlayerScore(score);
      setScoreBreakdown(breakdown);

      // 7점 이상이면 스톱 가능
      if (score >= 7) {
        setCanStop(true);
        setMessage(`${score}점! 고 또는 스톱?`);
        return;
      }

      // 게임 종료 체크
      if (newHand.length === 0) {
        endGame(newCollected, computerCollected);
        return;
      }

      // 컴퓨터 턴 (1초 후)
      setIsPlayerTurn(false);
      setMessage('컴퓨터 턴...');
      setTimeout(() => computerTurnWithAnimation(newFieldCards), 1000);
    }, 800);
  };

  // 카드 내기 버튼용
  const playCard = () => {
    playCardWithAnimation(selectedCard);
  };

  // 컴퓨터 턴 (애니메이션 포함)
  const computerTurnWithAnimation = (currentFieldCards) => {
    if (computerHand.length === 0) {
      endGame(playerCollected, computerCollected);
      return;
    }

    // AI: 매칭 우선, 광/열끗/띠 우선
    let bestCard = computerHand[0];
    let bestScore = -1;

    for (const card of computerHand) {
      const matches = currentFieldCards.filter(f => f.month === card.month);
      let cardScore = 0;
      if (matches.length > 0) cardScore += 10;
      if (card.type === '광') cardScore += 5;
      else if (card.type === '열끗') cardScore += 3;
      else if (card.type === '띠') cardScore += 2;
      if (cardScore > bestScore) {
        bestScore = cardScore;
        bestCard = card;
      }
    }

    const matchingCards = currentFieldCards.filter(f => f.month === bestCard.month);

    // 1단계: 컴퓨터 카드 선택 애니메이션
    setComputerPlayingCard(bestCard);
    gameSound.playFlip();
    setMessage(`컴퓨터가 ${bestCard.month}월 ${bestCard.name} 카드를 냅니다`);

    // 2단계: 매칭 카드 하이라이트 (0.6초 후)
    setTimeout(() => {
      if (matchingCards.length > 0) {
        setMatchedCards(matchingCards.map(c => c.id));
        setMatchEffectText(matchingCards.length === 3 ? '싹쓸이!' : '매칭!');
        setShowMatchEffect(true);
        gameSound.playMatch();
      }
    }, 600);

    // 3단계: 실제 처리 (1.2초 후)
    setTimeout(() => {
      let newFieldCards = [...currentFieldCards];
      let newCollected = JSON.parse(JSON.stringify(computerCollected));
      let newHand = computerHand.filter(c => c.id !== bestCard.id);

      if (matchingCards.length === 0) {
        newFieldCards.push(bestCard);
      } else {
        const matched = matchingCards[0];
        newFieldCards = currentFieldCards.filter(f => f.id !== matched.id);
        if (matchingCards.length === 3) {
          newFieldCards = currentFieldCards.filter(f => f.month !== bestCard.month);
          matchingCards.forEach(m => newCollected[m.type].push(m));
        } else {
          newCollected[matched.type].push(matched);
        }
        newCollected[bestCard.type].push(bestCard);
      }

      // 4단계: 이펙트 정리 및 덱에서 뽑기 (0.6초 후)
      setTimeout(() => {
        setShowMatchEffect(false);
        setMatchedCards([]);
        setComputerPlayingCard(null);

        // 덱에서 뽑기
        if (deck.length > 0) {
          const drawnCard = deck[0];
          const newDeck = deck.slice(1);
          setDeck(newDeck);

          const drawnMatches = newFieldCards.filter(f => f.month === drawnCard.month);
          if (drawnMatches.length === 0) {
            newFieldCards.push(drawnCard);
          } else {
            const matched = drawnMatches[0];
            newFieldCards = newFieldCards.filter(f => f.id !== matched.id);
            newCollected[drawnCard.type].push(drawnCard);
            newCollected[matched.type].push(matched);
          }
        }

        setComputerHand(newHand);
        setFieldCards(newFieldCards);
        setComputerCollected(newCollected);

        const { score } = calculateScore(newCollected);
        setComputerScore(score);

        if (newHand.length === 0) {
          endGame(playerCollected, newCollected);
          return;
        }

        // 플레이어 턴으로 전환 (0.5초 후)
        setTimeout(() => {
          setIsPlayerTurn(true);
          setMessage('카드를 선택하세요');
        }, 500);
      }, 600);
    }, 1200);
  };

  // 기존 computerTurn (handleGo에서 사용)
  const computerTurn = (currentFieldCards) => {
    computerTurnWithAnimation(currentFieldCards);
  };

  // 고
  const handleGo = () => {
    setGoCount(g => g + 1);
    setCanStop(false);
    setMessage('고! 계속합니다');
    gameSound.playClick();
    setIsPlayerTurn(false);
    setTimeout(() => computerTurn(fieldCards), 800);
  };

  // 스톱
  const handleStop = () => {
    endGame(playerCollected, computerCollected);
  };

  // 게임 종료
  const endGame = (pCollected, cCollected) => {
    const { score: pScore, breakdown: pBreakdown } = calculateScore(pCollected);
    const { score: cScore } = calculateScore(cCollected);

    const finalPlayerScore = pScore * (goCount + 1);
    const finalComputerScore = cScore;

    setScoreBreakdown(pBreakdown);

    let winAmount = 0;
    if (finalPlayerScore > finalComputerScore && pScore >= 7) {
      winAmount = currentBet * (goCount + 1);
      setChips(c => c + winAmount);
      setMessage(`승리! +${winAmount} 칩`);
      gameSound.playWin();
    } else if (finalComputerScore > finalPlayerScore || pScore < 7) {
      winAmount = -currentBet;
      setChips(c => c + winAmount);
      setMessage(`패배! ${winAmount} 칩`);
      gameSound.playLose();
    } else {
      setMessage('무승부!');
      gameSound.playDraw();
    }

    setPlayerScore(finalPlayerScore);
    setComputerScore(finalComputerScore);
    setGameState('result');

    if (chips + winAmount >= 2000) {
      setFinalScore(chips + winAmount);
      setFinalRank(Leaderboard.getRank('gostop', chips + winAmount));
      setShowSubmit(true);
    }
  };

  const handleScoreSubmit = (name) => {
    Leaderboard.addScore('gostop', name, finalScore);
    setShowSubmit(false);
  };

  const toggleSound = () => {
    const muted = gameSound.toggleMute();
    setIsMuted(muted);
  };

  // 수집한 카드 개수
  const getCollectedCount = (collected) => ({
    광: collected.광.length,
    열끗: collected.열끗.length,
    띠: collected.띠.length,
    피: collected.피.reduce((sum, c) => sum + c.piCount, 0)
  });

  // 화투 카드 렌더링 컴포넌트 - 실제 이미지 사용
  const HwatuCard = ({ card, isSelected, isDisabled, onClick, onDoubleClick, size = 'normal', isPlaying, isMatched }) => {
    const imageUrl = getHwatuImageUrl(card.month, card.imageIndex);

    return (
      <div
        className={`hwatu-card-new ${size} ${card.type} ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${isPlaying ? 'playing' : ''} ${isMatched ? 'matched' : ''}`}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      >
        <div className="hwatu-card-inner">
          <div className="hwatu-image-container">
            {imageUrl ? (
              <img src={imageUrl} alt={`${card.month}월 ${card.name}`} className="hwatu-real-image" />
            ) : (
              <span className="hwatu-fallback">{card.month}월</span>
            )}
          </div>
          {size !== 'mini' && (
            <div className="hwatu-overlay">
              <span className={`hwatu-type-badge ${card.type}`}>
                {card.type === '열끗' ? '열' : card.type}
              </span>
            </div>
          )}
          {isPlaying && <div className="card-play-effect" />}
          {isMatched && <div className="card-match-effect" />}
        </div>
      </div>
    );
  };

  return (
    <div className={`gostop-container ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* 헤더 - FileUpload 스타일 */}
      <header className="gostop-header">
        <div className="gostop-header-top">
          <button onClick={() => { gameSound.playClick(); isFullscreen ? setIsFullscreen(false) : onBack(); }} className="back-btn">
            {isFullscreen ? '✕ 닫기' : '← 뒤로'}
          </button>
          <h1>맞고</h1>
          <div className="header-actions">
            <button onClick={() => setShowLeaderboard(true)} className="ranking-btn">🏆</button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="fullscreen-toggle" title="전체화면">
              {isFullscreen ? '⤓' : '⤢'}
            </button>
            <SoundToggle isMuted={isMuted} onToggle={toggleSound} />
          </div>
        </div>
        <div className="gostop-chips-display">
          <span className="chips-icon">💰</span>
          <span className="chips-amount">{chips.toLocaleString()}</span>
          <span className="chips-label">칩</span>
        </div>
      </header>

      {/* 메시지 바 */}
      <div className="gostop-message-bar">
        <p>{message}</p>
      </div>

      {/* 베팅 화면 - FileUpload 카드 스타일 */}
      {gameState === 'betting' && (
        <div className="gostop-content">
          <div className="betting-section">
            <div className="section-card">
              <div className="section-header">
                <h2>베팅 금액 선택</h2>
              </div>
              <div className="bet-chips-grid">
                {[50, 100, 200, 500].map(bet => (
                  <button
                    key={bet}
                    className={`bet-chip ${currentBet === bet ? 'active' : ''}`}
                    onClick={() => setCurrentBet(bet)}
                    disabled={bet > chips}
                  >
                    <span className="chip-icon">🪙</span>
                    <span className="chip-value">{bet}</span>
                  </button>
                ))}
              </div>
              <button onClick={startGame} className="start-game-btn">
                🎴 게임 시작
              </button>
            </div>

            <div className="section-card rules-card">
              <div className="section-header">
                <h2>게임 규칙</h2>
              </div>
              <div className="rules-grid">
                <div className="rule-item">
                  <span className="rule-icon">🎯</span>
                  <div className="rule-text">
                    <strong>7점 이상</strong>
                    <p>스톱 가능</p>
                  </div>
                </div>
                <div className="rule-item">
                  <span className="rule-icon">🔥</span>
                  <div className="rule-text">
                    <strong>고 선언</strong>
                    <p>점수 배수 증가</p>
                  </div>
                </div>
                <div className="rule-item">
                  <span className="rule-icon">⭐</span>
                  <div className="rule-text">
                    <strong>오광 15점</strong>
                    <p>사광 4점, 삼광 3점</p>
                  </div>
                </div>
                <div className="rule-item">
                  <span className="rule-icon">🎨</span>
                  <div className="rule-text">
                    <strong>족보</strong>
                    <p>고도리/홍단/청단/초단</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 게임 플레이 화면 */}
      {gameState === 'playing' && (
        <div className="gostop-content playing">
          {/* 상대방 영역 */}
          <div className="section-card opponent-section">
            <div className="opponent-header">
              <div className="opponent-avatar">🤖</div>
              <div className="opponent-info">
                <span className="opponent-name">컴퓨터</span>
                <span className="opponent-cards-count">🎴 {computerHand.length}장</span>
              </div>
              <div className="opponent-score-display">
                <span className="score-value">{computerScore}</span>
                <span className="score-label">점</span>
              </div>
            </div>
            {/* 컴퓨터가 내는 카드 표시 */}
            {computerPlayingCard && (
              <div className="computer-playing-card-section">
                <span className="computer-action-label">컴퓨터가 내는 카드</span>
                <div className="computer-playing-card-container">
                  <HwatuCard
                    card={computerPlayingCard}
                    isPlaying={true}
                    size="normal"
                  />
                </div>
              </div>
            )}
            {/* 상대 수집 카드 표시 */}
            <div className="collected-cards-display">
              {computerCollected.광.length > 0 && (
                <div className="collected-group gwang">
                  <div className="collected-group-header">
                    <span className="group-label">광</span>
                    <span className="group-count">{computerCollected.광.length}</span>
                  </div>
                  <div className="collected-cards-row">
                    {computerCollected.광.map(card => (
                      <HwatuCard key={card.id} card={card} size="mini" />
                    ))}
                  </div>
                </div>
              )}
              {computerCollected.열끗.length > 0 && (
                <div className="collected-group yeol">
                  <div className="collected-group-header">
                    <span className="group-label">열끗</span>
                    <span className="group-count">{computerCollected.열끗.length}</span>
                  </div>
                  <div className="collected-cards-row">
                    {computerCollected.열끗.map(card => (
                      <HwatuCard key={card.id} card={card} size="mini" />
                    ))}
                  </div>
                </div>
              )}
              {computerCollected.띠.length > 0 && (
                <div className="collected-group tti">
                  <div className="collected-group-header">
                    <span className="group-label">띠</span>
                    <span className="group-count">{computerCollected.띠.length}</span>
                  </div>
                  <div className="collected-cards-row">
                    {computerCollected.띠.map(card => (
                      <HwatuCard key={card.id} card={card} size="mini" />
                    ))}
                  </div>
                </div>
              )}
              {computerCollected.피.length > 0 && (
                <div className="collected-group pi">
                  <div className="collected-group-header">
                    <span className="group-label">피</span>
                    <span className="group-count">{getCollectedCount(computerCollected).피}</span>
                  </div>
                  <div className="collected-cards-row">
                    {computerCollected.피.map(card => (
                      <HwatuCard key={card.id} card={card} size="mini" />
                    ))}
                  </div>
                </div>
              )}
              {computerCollected.광.length === 0 && computerCollected.열끗.length === 0 &&
               computerCollected.띠.length === 0 && computerCollected.피.length === 0 && (
                <div className="no-collected">아직 획득한 카드 없음</div>
              )}
            </div>
          </div>

          {/* 바닥 카드 영역 */}
          <div className="section-card field-section">
            <div className="section-header">
              <h2>바닥</h2>
              <span className="field-count">{fieldCards.length}장</span>
            </div>
            <div className="field-cards-container">
              {fieldCards.length === 0 ? (
                <div className="empty-field">바닥에 카드가 없습니다</div>
              ) : (
                <div className="hwatu-cards-grid">
                  {fieldCards.map(card => (
                    <HwatuCard
                      key={card.id}
                      card={card}
                      size="small"
                      isMatched={matchedCards.includes(card.id)}
                    />
                  ))}
                </div>
              )}
              {showMatchEffect && (
                <div className="match-effect-overlay">
                  <span className="match-text">{matchEffectText}</span>
                </div>
              )}
            </div>
          </div>

          {/* 플레이어 수집 카드 */}
          <div className="section-card player-collected-section">
            <div className="player-collected-header">
              <span className="collected-title">내 획득 카드</span>
              <span className="player-score-chip">
                {playerScore}점 {goCount > 0 && `(고${goCount})`}
              </span>
            </div>
            <div className="collected-cards-display player">
              {playerCollected.광.length > 0 && (
                <div className="collected-group gwang">
                  <div className="collected-group-header">
                    <span className="group-label">광</span>
                    <span className="group-count">{playerCollected.광.length}</span>
                  </div>
                  <div className="collected-cards-row">
                    {playerCollected.광.map(card => (
                      <HwatuCard key={card.id} card={card} size="mini" />
                    ))}
                  </div>
                </div>
              )}
              {playerCollected.열끗.length > 0 && (
                <div className="collected-group yeol">
                  <div className="collected-group-header">
                    <span className="group-label">열끗</span>
                    <span className="group-count">{playerCollected.열끗.length}</span>
                  </div>
                  <div className="collected-cards-row">
                    {playerCollected.열끗.map(card => (
                      <HwatuCard key={card.id} card={card} size="mini" />
                    ))}
                  </div>
                </div>
              )}
              {playerCollected.띠.length > 0 && (
                <div className="collected-group tti">
                  <div className="collected-group-header">
                    <span className="group-label">띠</span>
                    <span className="group-count">{playerCollected.띠.length}</span>
                  </div>
                  <div className="collected-cards-row">
                    {playerCollected.띠.map(card => (
                      <HwatuCard key={card.id} card={card} size="mini" />
                    ))}
                  </div>
                </div>
              )}
              {playerCollected.피.length > 0 && (
                <div className="collected-group pi">
                  <div className="collected-group-header">
                    <span className="group-label">피</span>
                    <span className="group-count">{getCollectedCount(playerCollected).피}</span>
                  </div>
                  <div className="collected-cards-row">
                    {playerCollected.피.map(card => (
                      <HwatuCard key={card.id} card={card} size="mini" />
                    ))}
                  </div>
                </div>
              )}
              {playerCollected.광.length === 0 && playerCollected.열끗.length === 0 &&
               playerCollected.띠.length === 0 && playerCollected.피.length === 0 && (
                <div className="no-collected">아직 획득한 카드 없음</div>
              )}
            </div>
          </div>

          {/* 플레이어 패 */}
          <div className="section-card player-hand-section">
            <div className="section-header">
              <h2>내 패</h2>
              <span className="hand-count">{playerHand.length}장</span>
              <span className="hand-hint">더블클릭으로 바로 내기</span>
            </div>
            <div className="hwatu-cards-grid hand-grid">
              {playerHand.map(card => (
                <HwatuCard
                  key={card.id}
                  card={card}
                  isSelected={selectedCard?.id === card.id}
                  isDisabled={!isPlayerTurn || canStop || playingCard}
                  isPlaying={playingCard?.id === card.id}
                  onClick={() => selectCard(card)}
                  onDoubleClick={() => handleDoubleClick(card)}
                />
              ))}
            </div>
            {selectedCard && !canStop && !playingCard && (
              <button onClick={playCard} className="play-card-btn">
                🎴 카드 내기
              </button>
            )}
          </div>

          {/* 고/스톱 버튼 */}
          {canStop && (
            <div className="go-stop-section">
              <button onClick={handleGo} className="go-btn">🔥 고!</button>
              <button onClick={handleStop} className="stop-btn">✋ 스톱</button>
            </div>
          )}
        </div>
      )}

      {/* 결과 화면 */}
      {gameState === 'result' && (
        <div className="gostop-content">
          <div className="section-card result-section">
            <div className="result-header">
              <h2>{message}</h2>
            </div>

            <div className="result-comparison">
              <div className="result-player you">
                <div className="result-avatar">😊</div>
                <span className="result-name">나</span>
                <span className="result-score">{playerScore}점</span>
                {goCount > 0 && <span className="go-multiplier">×{goCount + 1}</span>}
              </div>
              <div className="result-vs">VS</div>
              <div className="result-player opponent">
                <div className="result-avatar">🤖</div>
                <span className="result-name">컴퓨터</span>
                <span className="result-score">{computerScore}점</span>
              </div>
            </div>

            {scoreBreakdown.length > 0 && (
              <div className="score-breakdown-section">
                <h3>점수 구성</h3>
                <div className="breakdown-list">
                  {scoreBreakdown.map((item, idx) => (
                    <div key={idx} className="breakdown-row">
                      <span className="breakdown-name">{item.name}</span>
                      <span className="breakdown-score">+{item.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setGameState('betting')} className="play-again-btn">
              🔄 다시 하기
            </button>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <LeaderboardDisplay gameId="gostop" gameName="맞고" onClose={() => setShowLeaderboard(false)} />
      )}
      {showSubmit && (
        <ScoreSubmitModal
          score={finalScore}
          rank={finalRank}
          onSubmit={handleScoreSubmit}
          onClose={() => setShowSubmit(false)}
        />
      )}
    </div>
  );
};

// ==================== 포커 게임 ====================
const Poker = ({ onBack }) => {
  const [isMuted, setIsMuted] = useState(gameSound.getMuted());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameState, setGameState] = useState('betting'); // betting, dealing, exchange, showdown
  const [chips, setChips] = useState(1000);
  const [currentBet, setCurrentBet] = useState(50);
  const [playerHand, setPlayerHand] = useState([]);
  const [computerHand, setComputerHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [deck, setDeck] = useState([]);
  const [message, setMessage] = useState('베팅 금액을 선택하세요');
  const [playerRank, setPlayerRank] = useState('');
  const [computerRank, setComputerRank] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalRank, setFinalRank] = useState(0);

  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  const createDeck = () => {
    const newDeck = [];
    suits.forEach(suit => {
      values.forEach((value, idx) => {
        newDeck.push({
          id: `${suit}${value}`,
          suit,
          value,
          numValue: idx + 2,
          isRed: suit === '♥' || suit === '♦'
        });
      });
    });
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const evaluateHand = (hand) => {
    const sortedHand = [...hand].sort((a, b) => b.numValue - a.numValue);
    const values = sortedHand.map(c => c.numValue);
    const suits = sortedHand.map(c => c.suit);

    const isFlush = suits.every(s => s === suits[0]);
    const isStraight = values.every((v, i) => i === 0 || values[i-1] - v === 1) ||
      (values.join(',') === '14,5,4,3,2'); // A-2-3-4-5

    const valueCounts = {};
    values.forEach(v => { valueCounts[v] = (valueCounts[v] || 0) + 1; });
    const counts = Object.values(valueCounts).sort((a, b) => b - a);

    // 족보 판정
    if (isFlush && isStraight && values[0] === 14) return { rank: 10, name: '로얄 플러시' };
    if (isFlush && isStraight) return { rank: 9, name: '스트레이트 플러시' };
    if (counts[0] === 4) return { rank: 8, name: '포카드' };
    if (counts[0] === 3 && counts[1] === 2) return { rank: 7, name: '풀하우스' };
    if (isFlush) return { rank: 6, name: '플러시' };
    if (isStraight) return { rank: 5, name: '스트레이트' };
    if (counts[0] === 3) return { rank: 4, name: '트리플' };
    if (counts[0] === 2 && counts[1] === 2) return { rank: 3, name: '투페어' };
    if (counts[0] === 2) return { rank: 2, name: '원페어' };
    return { rank: 1, name: '하이카드' };
  };

  useEffect(() => {
    gameSound.init();
  }, []);

  const startGame = () => {
    if (currentBet > chips) {
      setMessage('칩이 부족합니다!');
      return;
    }

    gameSound.playGameStart();
    const newDeck = createDeck();
    setDeck(newDeck.slice(10));
    setPlayerHand(newDeck.slice(0, 5));
    setComputerHand(newDeck.slice(5, 10));
    setSelectedCards([]);
    setPlayerRank('');
    setComputerRank('');
    setGameState('exchange');
    setMessage('교환할 카드를 선택하세요 (최대 3장)');
  };

  const toggleCardSelection = (cardId) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else if (selectedCards.length < 3) {
      setSelectedCards([...selectedCards, cardId]);
    }
    gameSound.playClick();
  };

  const exchangeCards = () => {
    gameSound.playFlip();

    // 플레이어 카드 교환
    let newPlayerHand = playerHand.filter(c => !selectedCards.includes(c.id));
    const cardsNeeded = 5 - newPlayerHand.length;
    newPlayerHand = [...newPlayerHand, ...deck.slice(0, cardsNeeded)];

    // 컴퓨터 AI: 페어 이하면 높은 카드 2장 유지
    let newComputerHand = [...computerHand];
    const compEval = evaluateHand(computerHand);
    if (compEval.rank < 3) {
      const sorted = [...computerHand].sort((a, b) => b.numValue - a.numValue);
      newComputerHand = sorted.slice(0, 2);
      newComputerHand = [...newComputerHand, ...deck.slice(cardsNeeded, cardsNeeded + 3)];
    }

    setPlayerHand(newPlayerHand);
    setComputerHand(newComputerHand);
    setDeck(deck.slice(cardsNeeded + 3));

    // 승부
    setTimeout(() => {
      const pEval = evaluateHand(newPlayerHand);
      const cEval = evaluateHand(newComputerHand);
      setPlayerRank(pEval.name);
      setComputerRank(cEval.name);

      let winAmount = 0;
      if (pEval.rank > cEval.rank) {
        winAmount = currentBet;
        setMessage(`승리! ${pEval.name}로 이겼습니다! +${winAmount}`);
        gameSound.playWin();
      } else if (pEval.rank < cEval.rank) {
        winAmount = -currentBet;
        setMessage(`패배... ${cEval.name}에게 졌습니다. ${winAmount}`);
        gameSound.playLose();
      } else {
        // 같은 족보면 높은 카드 비교
        const pHigh = Math.max(...newPlayerHand.map(c => c.numValue));
        const cHigh = Math.max(...newComputerHand.map(c => c.numValue));
        if (pHigh > cHigh) {
          winAmount = currentBet;
          setMessage(`승리! 높은 카드로 이겼습니다! +${winAmount}`);
          gameSound.playWin();
        } else if (pHigh < cHigh) {
          winAmount = -currentBet;
          setMessage(`패배... 높은 카드에서 졌습니다. ${winAmount}`);
          gameSound.playLose();
        } else {
          setMessage('무승부!');
          gameSound.playDraw();
        }
      }

      const newChips = chips + winAmount;
      setChips(newChips);
      setGameState('showdown');

      if (newChips >= 2000) {
        setFinalScore(newChips);
        setFinalRank(Leaderboard.getRank('poker', newChips));
        setShowSubmit(true);
      }
    }, 500);
  };

  const handleScoreSubmit = (name) => {
    Leaderboard.addScore('poker', name, finalScore);
    setShowSubmit(false);
  };

  const toggleSound = () => {
    const muted = gameSound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="game-play-area poker-area">
      <div className="game-header-bar">
        <button onClick={() => { gameSound.playClick(); onBack(); }} className="back-btn">← 뒤로</button>
        <h2>포커</h2>
        <div className="header-right">
          <button onClick={() => setShowLeaderboard(true)} className="ranking-btn">🏆</button>
          <span className="game-score">칩: {chips}</span>
          <SoundToggle isMuted={isMuted} onToggle={toggleSound} />
        </div>
      </div>

      <div className="poker-message">{message}</div>

      {gameState === 'betting' && (
        <div className="betting-area">
          <p>베팅 금액:</p>
          <div className="bet-buttons">
            {[25, 50, 100, 200].map(bet => (
              <button
                key={bet}
                className={`bet-btn ${currentBet === bet ? 'active' : ''}`}
                onClick={() => setCurrentBet(bet)}
                disabled={bet > chips}
              >
                {bet}
              </button>
            ))}
          </div>
          <button onClick={startGame} className="game-btn">게임 시작</button>
        </div>
      )}

      {(gameState === 'exchange' || gameState === 'showdown') && (
        <div className="poker-table">
          <div className="opponent-hand">
            <p>상대 패 {computerRank && `- ${computerRank}`}</p>
            <div className="cards">
              {computerHand.map((card, idx) => (
                <div
                  key={card.id}
                  className={`poker-card ${card.isRed ? 'red' : ''} ${gameState === 'showdown' ? 'revealed' : 'hidden'}`}
                >
                  {gameState === 'showdown' ? (
                    <>
                      <span className="card-value">{card.value}</span>
                      <span className="card-suit">{card.suit}</span>
                    </>
                  ) : '🂠'}
                </div>
              ))}
            </div>
          </div>

          <div className="player-hand">
            <p>내 패 {playerRank && `- ${playerRank}`}</p>
            <div className="cards">
              {playerHand.map(card => (
                <div
                  key={card.id}
                  className={`poker-card ${card.isRed ? 'red' : ''} ${selectedCards.includes(card.id) ? 'selected' : ''}`}
                  onClick={() => gameState === 'exchange' && toggleCardSelection(card.id)}
                >
                  <span className="card-value">{card.value}</span>
                  <span className="card-suit">{card.suit}</span>
                </div>
              ))}
            </div>
          </div>

          {gameState === 'exchange' && (
            <div className="exchange-controls">
              <button onClick={exchangeCards} className="game-btn">
                {selectedCards.length > 0 ? `${selectedCards.length}장 교환` : '교환 안함'}
              </button>
            </div>
          )}

          {gameState === 'showdown' && (
            <button onClick={() => setGameState('betting')} className="game-btn">다시 하기</button>
          )}
        </div>
      )}

      {showLeaderboard && (
        <LeaderboardDisplay gameId="poker" gameName="포커" onClose={() => setShowLeaderboard(false)} />
      )}
      {showSubmit && (
        <ScoreSubmitModal
          score={finalScore}
          rank={finalRank}
          onSubmit={handleScoreSubmit}
          onClose={() => setShowSubmit(false)}
        />
      )}
    </div>
  );
};

// ==================== 메인 게임 컴포넌트 ====================
const Games = () => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [isMuted, setIsMuted] = useState(gameSound.getMuted());
  const [showAllRankings, setShowAllRankings] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    gameSound.init();
    // 서버에서 모든 점수 가져오기
    Leaderboard.fetchAllScores().then(() => {
      forceUpdate(n => n + 1); // 점수 로드 후 UI 업데이트
    });
  }, []);

  const games = [
    { id: 'memory', name: '메모리 게임', icon: '🧠', desc: '카드를 뒤집어 짝을 맞춰보세요', component: MemoryGame },
    { id: 'tictactoe', name: '틱택토', icon: '⭕', desc: '3개를 먼저 연결하면 승리!', component: TicTacToe },
    { id: 'sudoku', name: '수도쿠', icon: '🔢', desc: '숫자 퍼즐의 정석', component: Sudoku },
    { id: 'gostop', name: '고스톱', icon: '🎴', desc: '화투로 즐기는 맞고', component: GoStop },
    { id: 'poker', name: '포커', icon: '🃏', desc: '5장 드로우 포커', component: Poker },
  ];

  const handleGameSelect = (gameId) => {
    gameSound.playClick();
    setSelectedGame(gameId);
  };

  const toggleSound = () => {
    const muted = gameSound.toggleMute();
    setIsMuted(muted);
  };

  if (selectedGame) {
    const Game = games.find(g => g.id === selectedGame)?.component;
    return <Game onBack={() => { gameSound.playClick(); setSelectedGame(null); }} />;
  }

  return (
    <div className="games-container">
      <div className="games-header">
        <div className="games-title-row">
          <h1>게임</h1>
          <div className="header-buttons">
            <button onClick={() => setShowAllRankings(true)} className="ranking-btn main">🏆 전체 랭킹</button>
            <SoundToggle isMuted={isMuted} onToggle={toggleSound} />
          </div>
        </div>
        <p>다양한 미니게임을 즐겨보세요</p>
      </div>

      <div className="games-grid">
        {games.map(game => (
          <div
            key={game.id}
            className="game-card"
            onClick={() => handleGameSelect(game.id)}
          >
            <div className="game-icon">{game.icon}</div>
            <h3>{game.name}</h3>
            <p>{game.desc}</p>
            {Leaderboard.getScores(game.id).length > 0 && (
              <div className="game-top-score">
                🏆 최고: {Leaderboard.getScores(game.id)[0]?.score.toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {showAllRankings && (
        <div className="leaderboard-overlay" onClick={() => setShowAllRankings(false)}>
          <div className="leaderboard-modal all-rankings" onClick={e => e.stopPropagation()}>
            <div className="leaderboard-header">
              <h3>🏆 전체 게임 랭킹</h3>
              <button className="close-btn" onClick={() => setShowAllRankings(false)}>×</button>
            </div>
            <div className="all-rankings-content">
              {games.map(game => {
                const scores = Leaderboard.getScores(game.id);
                return (
                  <div key={game.id} className="game-ranking-section">
                    <h4>{game.icon} {game.name}</h4>
                    {scores.length === 0 ? (
                      <p className="no-scores">기록 없음</p>
                    ) : (
                      <div className="top-3">
                        {scores.slice(0, 3).map((entry, idx) => (
                          <div key={entry.id} className={`rank-item rank-${idx + 1}`}>
                            <span className="rank-badge">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                            </span>
                            <span className="rank-name">{entry.userName || entry.name}</span>
                            <span className="rank-score">{entry.score.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Games;
