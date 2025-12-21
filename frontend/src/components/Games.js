import React, { useState, useEffect, useCallback } from 'react';
import gameSound from '../utils/gameSound';
import './Games.css';

// ==================== 리더보드 시스템 ====================
const Leaderboard = {
  getScores(gameId) {
    const data = localStorage.getItem(`leaderboard_${gameId}`);
    return data ? JSON.parse(data) : [];
  },

  addScore(gameId, name, score, details = {}) {
    const scores = this.getScores(gameId);
    const newEntry = {
      id: Date.now(),
      name: name || '익명',
      score,
      details,
      date: new Date().toISOString()
    };
    scores.push(newEntry);
    // 점수 높은 순 정렬 (게임에 따라 다를 수 있음)
    scores.sort((a, b) => b.score - a.score);
    // 상위 10개만 유지
    const top10 = scores.slice(0, 10);
    localStorage.setItem(`leaderboard_${gameId}`, JSON.stringify(top10));
    return top10.findIndex(s => s.id === newEntry.id) + 1; // 순위 반환
  },

  getRank(gameId, score) {
    const scores = this.getScores(gameId);
    const rank = scores.filter(s => s.score > score).length + 1;
    return rank;
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
  const scores = Leaderboard.getScores(gameId);

  return (
    <div className="leaderboard-overlay" onClick={onClose}>
      <div className="leaderboard-modal" onClick={e => e.stopPropagation()}>
        <div className="leaderboard-header">
          <h3>🏆 {gameName} 랭킹</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="leaderboard-content">
          {scores.length === 0 ? (
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
                    <td>{entry.name}</td>
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
  const [showSubmit, setShowSubmit] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalRank, setFinalRank] = useState(0);

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
  }, [difficulty]);

  useEffect(() => {
    gameSound.init();
    generateSudoku();
  }, [generateSudoku]);

  useEffect(() => {
    if (!isComplete && startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime, isComplete]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCellClick = (row, col) => {
    if (initial[row]?.[col]) return;
    setSelected({ row, col });
    gameSound.playClick();
  };

  const handleNumberInput = (num) => {
    if (!selected || initial[selected.row]?.[selected.col]) return;

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
        setErrors(e => e + 1);
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
    <div className="game-play-area sudoku-area">
      <div className="game-header-bar">
        <button onClick={() => { gameSound.playClick(); onBack(); }} className="back-btn">← 뒤로</button>
        <h2>수도쿠</h2>
        <div className="header-right">
          <button onClick={() => setShowLeaderboard(true)} className="ranking-btn">🏆</button>
          <span className="game-score">{formatTime(elapsedTime)} | 오류: {errors}</span>
          <SoundToggle isMuted={isMuted} onToggle={toggleSound} />
        </div>
      </div>

      <div className="sudoku-controls">
        <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="difficulty-select">
          <option value="easy">쉬움</option>
          <option value="medium">보통</option>
          <option value="hard">어려움</option>
        </select>
        <button onClick={generateSudoku} className="game-btn small">새 게임</button>
      </div>

      <div className="sudoku-board">
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

// ==================== 고스톱 (맞고) 게임 ====================
const GoStop = ({ onBack }) => {
  const [isMuted, setIsMuted] = useState(gameSound.getMuted());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameState, setGameState] = useState('betting'); // betting, playing, result
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [currentBet, setCurrentBet] = useState(100);
  const [chips, setChips] = useState(1000);
  const [message, setMessage] = useState('베팅 금액을 선택하세요');
  const [playerCards, setPlayerCards] = useState([]);
  const [computerCards, setComputerCards] = useState([]);
  const [fieldCards, setFieldCards] = useState([]);
  const [playerCollected, setPlayerCollected] = useState({ 광: [], 띠: [], 피: [], 동물: [] });
  const [computerCollected, setComputerCollected] = useState({ 광: [], 띠: [], 피: [], 동물: [] });
  const [showSubmit, setShowSubmit] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalRank, setFinalRank] = useState(0);
  const [canGo, setCanGo] = useState(false);
  const [goCount, setGoCount] = useState(0);

  // 화투 카드 정의
  const createDeck = () => {
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const deck = [];

    months.forEach((month, idx) => {
      // 각 월별 4장씩
      const monthNum = idx + 1;
      // 광 (1월 소나무, 3월 벚꽃, 8월 억새, 11월 오동, 12월 비)
      const gwangMonths = [1, 3, 8, 11, 12];
      // 동물
      const animalMonths = [2, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      // 띠
      const ttiMonths = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12];

      for (let i = 0; i < 4; i++) {
        let type = '피';
        if (i === 0 && gwangMonths.includes(monthNum)) type = '광';
        else if (i === 1 && animalMonths.includes(monthNum)) type = '동물';
        else if (i === 2 && ttiMonths.includes(monthNum)) type = '띠';

        deck.push({
          id: `${monthNum}-${i}`,
          month: monthNum,
          monthName: month,
          type,
          emoji: getCardEmoji(monthNum, type)
        });
      }
    });

    return deck.sort(() => Math.random() - 0.5);
  };

  const getCardEmoji = (month, type) => {
    const emojis = {
      1: { 광: '🌲', 동물: '🦢', 띠: '🎋', 피: '🌿' },
      2: { 광: '🌸', 동물: '🐦', 띠: '🎋', 피: '🌸' },
      3: { 광: '🌸', 동물: '🐦', 띠: '🎋', 피: '🌸' },
      4: { 광: '🌺', 동물: '🐦', 띠: '🎋', 피: '🌺' },
      5: { 광: '🌿', 동물: '🦋', 띠: '🎋', 피: '🌿' },
      6: { 광: '🌺', 동물: '🦋', 띠: '🎋', 피: '🌺' },
      7: { 광: '🐗', 동물: '🐗', 띠: '🎋', 피: '🍂' },
      8: { 광: '🌕', 동물: '🦢', 띠: '🎋', 피: '🍃' },
      9: { 광: '🍶', 동물: '🦋', 띠: '🎋', 피: '🌾' },
      10: { 광: '🦌', 동물: '🦌', 띠: '🎋', 피: '🍁' },
      11: { 광: '🌧️', 동물: '🐉', 띠: '🎋', 피: '🍂' },
      12: { 광: '☔', 동물: '🐦', 띠: '🎋', 피: '🌧️' }
    };
    return emojis[month]?.[type] || '🎴';
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
    const deck = createDeck();

    setPlayerCards(deck.slice(0, 7));
    setComputerCards(deck.slice(7, 14));
    setFieldCards(deck.slice(14, 22));
    setPlayerCollected({ 광: [], 띠: [], 피: [], 동물: [] });
    setComputerCollected({ 광: [], 띠: [], 피: [], 동물: [] });
    setPlayerScore(0);
    setComputerScore(0);
    setGoCount(0);
    setCanGo(false);
    setGameState('playing');
    setMessage('카드를 선택하세요');
  };

  const calculatePoints = (collected) => {
    let points = 0;
    // 광
    if (collected.광.length >= 3) points += collected.광.length * 3;
    // 동물
    if (collected.동물.length >= 5) points += collected.동물.length;
    // 띠
    if (collected.띠.length >= 5) points += collected.띠.length;
    // 피 (10장 이상)
    if (collected.피.length >= 10) points += collected.피.length - 9;

    return points;
  };

  const playCard = (card) => {
    if (gameState !== 'playing') return;

    gameSound.playFlip();

    // 같은 월의 카드 찾기
    const matchingField = fieldCards.filter(f => f.month === card.month);

    let newPlayerCards = playerCards.filter(c => c.id !== card.id);
    let newFieldCards = [...fieldCards];
    let newCollected = { ...playerCollected };

    if (matchingField.length > 0) {
      // 매칭되는 카드가 있으면 가져감
      const matched = matchingField[0];
      newFieldCards = fieldCards.filter(f => f.id !== matched.id);
      newCollected[card.type] = [...newCollected[card.type], card];
      newCollected[matched.type] = [...newCollected[matched.type], matched];
      gameSound.playMatch();
    } else {
      // 없으면 바닥에 내려놓음
      newFieldCards.push(card);
    }

    setPlayerCards(newPlayerCards);
    setFieldCards(newFieldCards);
    setPlayerCollected(newCollected);

    const points = calculatePoints(newCollected);
    setPlayerScore(points);

    // 점수가 3점 이상이면 고/스톱 선택 가능
    if (points >= 3 && !canGo) {
      setCanGo(true);
      setMessage('고 또는 스톱을 선택하세요');
      return;
    }

    // 컴퓨터 턴
    setTimeout(() => computerTurn(newFieldCards), 500);
  };

  const computerTurn = (currentFieldCards) => {
    if (computerCards.length === 0) {
      endGame();
      return;
    }

    // 간단한 AI: 매칭되는 카드 우선 선택
    let cardToPlay = computerCards[0];
    for (const card of computerCards) {
      if (currentFieldCards.some(f => f.month === card.month)) {
        cardToPlay = card;
        break;
      }
    }

    const matchingField = currentFieldCards.filter(f => f.month === cardToPlay.month);

    let newComputerCards = computerCards.filter(c => c.id !== cardToPlay.id);
    let newFieldCards = [...currentFieldCards];
    let newCollected = { ...computerCollected };

    if (matchingField.length > 0) {
      const matched = matchingField[0];
      newFieldCards = currentFieldCards.filter(f => f.id !== matched.id);
      newCollected[cardToPlay.type] = [...newCollected[cardToPlay.type], cardToPlay];
      newCollected[matched.type] = [...newCollected[matched.type], matched];
    } else {
      newFieldCards.push(cardToPlay);
    }

    setComputerCards(newComputerCards);
    setFieldCards(newFieldCards);
    setComputerCollected(newCollected);
    setComputerScore(calculatePoints(newCollected));

    if (newComputerCards.length === 0 && playerCards.length === 0) {
      endGame();
    } else {
      setMessage('카드를 선택하세요');
    }
  };

  const handleGo = () => {
    setGoCount(g => g + 1);
    setCanGo(false);
    setMessage('고! 계속합니다');
    gameSound.playSuccess();
  };

  const handleStop = () => {
    endGame();
  };

  const endGame = () => {
    const playerPoints = playerScore * (goCount + 1);
    const computerPoints = computerScore;

    let winAmount = 0;
    if (playerPoints > computerPoints) {
      winAmount = currentBet * (goCount + 1);
      setChips(c => c + winAmount);
      setMessage(`승리! +${winAmount} 칩`);
      gameSound.playWin();
    } else if (playerPoints < computerPoints) {
      winAmount = -currentBet;
      setChips(c => c + winAmount);
      setMessage(`패배! ${winAmount} 칩`);
      gameSound.playLose();
    } else {
      setMessage('무승부!');
      gameSound.playDraw();
    }

    setGameState('result');

    if (chips + winAmount >= 2000) {
      const score = chips + winAmount;
      setFinalScore(score);
      setFinalRank(Leaderboard.getRank('gostop', score));
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

  return (
    <div className="game-play-area gostop-area">
      <div className="game-header-bar">
        <button onClick={() => { gameSound.playClick(); onBack(); }} className="back-btn">← 뒤로</button>
        <h2>고스톱</h2>
        <div className="header-right">
          <button onClick={() => setShowLeaderboard(true)} className="ranking-btn">🏆</button>
          <span className="game-score">칩: {chips}</span>
          <SoundToggle isMuted={isMuted} onToggle={toggleSound} />
        </div>
      </div>

      <div className="gostop-message">{message}</div>

      {gameState === 'betting' && (
        <div className="betting-area">
          <p>베팅 금액:</p>
          <div className="bet-buttons">
            {[50, 100, 200, 500].map(bet => (
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

      {gameState === 'playing' && (
        <div className="gostop-table">
          <div className="opponent-area">
            <div className="card-count">컴퓨터: {computerCards.length}장</div>
            <div className="score-display">점수: {computerScore}</div>
          </div>

          <div className="field-area">
            <div className="field-cards">
              {fieldCards.map(card => (
                <div key={card.id} className="hwatu-card field">
                  <span className="card-emoji">{card.emoji}</span>
                  <span className="card-month">{card.month}월</span>
                </div>
              ))}
            </div>
          </div>

          <div className="player-area">
            <div className="score-display">점수: {playerScore} {goCount > 0 && `(고 ${goCount}회)`}</div>
            <div className="player-cards">
              {playerCards.map(card => (
                <div
                  key={card.id}
                  className="hwatu-card playable"
                  onClick={() => !canGo && playCard(card)}
                >
                  <span className="card-emoji">{card.emoji}</span>
                  <span className="card-month">{card.month}월</span>
                  <span className="card-type">{card.type}</span>
                </div>
              ))}
            </div>
          </div>

          {canGo && (
            <div className="go-stop-buttons">
              <button onClick={handleGo} className="game-btn go-btn">고!</button>
              <button onClick={handleStop} className="game-btn stop-btn">스톱</button>
            </div>
          )}
        </div>
      )}

      {gameState === 'result' && (
        <div className="result-area">
          <div className="result-scores">
            <div>내 점수: {playerScore} × {goCount + 1} = {playerScore * (goCount + 1)}</div>
            <div>상대 점수: {computerScore}</div>
          </div>
          <button onClick={() => setGameState('betting')} className="game-btn">다시 하기</button>
        </div>
      )}

      {showLeaderboard && (
        <LeaderboardDisplay gameId="gostop" gameName="고스톱" onClose={() => setShowLeaderboard(false)} />
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

  useEffect(() => {
    gameSound.init();
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
                            <span className="rank-name">{entry.name}</span>
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
