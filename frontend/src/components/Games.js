import React, { useState, useEffect } from 'react';
import gameSound from '../utils/gameSound';
import './Games.css';

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

// 메모리 카드 게임
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

  useEffect(() => {
    gameSound.init();
    gameSound.playGameStart();
  }, []);

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
      setMoves(m => m + 1);
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

        // 모든 카드가 매칭되었는지 확인
        if (updatedCards.every(c => c.matched)) {
          setTimeout(() => gameSound.playWin(), 300);
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
          <span className="game-score">시도: {moves}회</span>
          <SoundToggle isMuted={isMuted} onToggle={toggleSound} />
        </div>
      </div>

      {isComplete && (
        <div className="game-complete">
          <h3>🎉 축하합니다!</h3>
          <p>{moves}번 만에 완료했습니다!</p>
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
    </div>
  );
};

// 틱택토 게임
const TicTacToe = ({ onBack }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [isMuted, setIsMuted] = useState(gameSound.getMuted());

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
      setScores(s => ({ ...s, [newResult.winner]: s[newResult.winner] + 1 }));
    } else if (newBoard.every(cell => cell !== null)) {
      gameSound.playDraw();
    }
  };

  const resetGame = () => {
    gameSound.playClick();
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const resetScores = () => {
    gameSound.playClick();
    setScores({ X: 0, O: 0 });
    resetGame();
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
        <button onClick={resetScores} className="game-btn secondary">점수 초기화</button>
      </div>
    </div>
  );
};

// 숫자 맞추기 게임
const NumberGuess = ({ onBack }) => {
  const [target, setTarget] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('1부터 100 사이의 숫자를 맞춰보세요!');
  const [attempts, setAttempts] = useState(0);
  const [history, setHistory] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isMuted, setIsMuted] = useState(gameSound.getMuted());
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('numberGuess_best');
    return saved ? parseInt(saved) : null;
  });

  useEffect(() => {
    gameSound.init();
    gameSound.playGameStart();
  }, []);

  const handleGuess = () => {
    const num = parseInt(guess);
    if (isNaN(num) || num < 1 || num > 100) {
      gameSound.playWrong();
      setMessage('1부터 100 사이의 숫자를 입력하세요!');
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setHistory([...history, { num, result: num === target ? 'correct' : num < target ? 'low' : 'high' }]);

    if (num === target) {
      gameSound.playCorrect();
      setTimeout(() => gameSound.playWin(), 200);
      setMessage(`🎉 정답! ${newAttempts}번 만에 맞췄습니다!`);
      setIsComplete(true);
      if (!bestScore || newAttempts < bestScore) {
        setBestScore(newAttempts);
        localStorage.setItem('numberGuess_best', newAttempts.toString());
        setTimeout(() => gameSound.playAchievement(), 500);
      }
    } else if (num < target) {
      gameSound.playUp();
      setMessage('📈 더 높은 숫자입니다!');
    } else {
      gameSound.playDown();
      setMessage('📉 더 낮은 숫자입니다!');
    }
    setGuess('');
  };

  const resetGame = () => {
    gameSound.playClick();
    setTarget(Math.floor(Math.random() * 100) + 1);
    setGuess('');
    setMessage('1부터 100 사이의 숫자를 맞춰보세요!');
    setAttempts(0);
    setHistory([]);
    setIsComplete(false);
    gameSound.playGameStart();
  };

  const toggleSound = () => {
    const muted = gameSound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="game-play-area">
      <div className="game-header-bar">
        <button onClick={() => { gameSound.playClick(); onBack(); }} className="back-btn">← 뒤로</button>
        <h2>숫자 맞추기</h2>
        <div className="header-right">
          <span className="game-score">시도: {attempts}회 {bestScore && `| 최고: ${bestScore}회`}</span>
          <SoundToggle isMuted={isMuted} onToggle={toggleSound} />
        </div>
      </div>

      <div className="number-guess-area">
        <p className={`guess-message ${isComplete ? 'success' : ''}`}>{message}</p>

        {!isComplete && (
          <div className="guess-input-area">
            <input
              type="number"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
              placeholder="숫자 입력"
              min="1"
              max="100"
              className="guess-input"
            />
            <button onClick={handleGuess} className="game-btn">확인</button>
          </div>
        )}

        {history.length > 0 && (
          <div className="guess-history">
            <p>추측 기록:</p>
            <div className="history-chips">
              {history.map((h, i) => (
                <span key={i} className={`history-chip ${h.result}`}>
                  {h.num} {h.result === 'low' ? '↑' : h.result === 'high' ? '↓' : '✓'}
                </span>
              ))}
            </div>
          </div>
        )}

        <button onClick={resetGame} className="game-btn reset-btn">
          {isComplete ? '다시 하기' : '새 게임'}
        </button>
      </div>
    </div>
  );
};

// 반응속도 테스트 게임
const ReactionTest = ({ onBack }) => {
  const [state, setState] = useState('waiting'); // waiting, ready, click, result
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [results, setResults] = useState([]);
  const [timeoutId, setTimeoutId] = useState(null);
  const [isMuted, setIsMuted] = useState(gameSound.getMuted());

  useEffect(() => {
    gameSound.init();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  const startTest = () => {
    setState('ready');
    gameSound.playReady();
    const delay = Math.random() * 4000 + 1000; // 1-5초 랜덤
    const id = setTimeout(() => {
      setState('click');
      setStartTime(Date.now());
      gameSound.playBeep();
    }, delay);
    setTimeoutId(id);
  };

  const handleClick = () => {
    if (state === 'waiting') {
      startTest();
    } else if (state === 'ready') {
      // 너무 일찍 클릭
      clearTimeout(timeoutId);
      gameSound.playWrong();
      setState('early');
    } else if (state === 'click') {
      const time = Date.now() - startTime;
      gameSound.playReactionClick();
      setReactionTime(time);
      const newResults = [...results, time];
      setResults(newResults);
      setState('result');

      // 좋은 기록이면 특별 효과음
      if (time < 200) {
        setTimeout(() => gameSound.playAchievement(), 200);
      } else if (time < 300) {
        setTimeout(() => gameSound.playSuccess(), 200);
      }
    } else if (state === 'result' || state === 'early') {
      startTest();
    }
  };

  const getAverage = () => {
    if (results.length === 0) return 0;
    return Math.round(results.reduce((a, b) => a + b, 0) / results.length);
  };

  const getBestTime = () => {
    if (results.length === 0) return 0;
    return Math.min(...results);
  };

  const getStateStyle = () => {
    switch (state) {
      case 'ready': return { background: '#ef4444', color: 'white' };
      case 'click': return { background: '#22c55e', color: 'white' };
      case 'early': return { background: '#f97316', color: 'white' };
      default: return { background: '#3b82f6', color: 'white' };
    }
  };

  const getMessage = () => {
    switch (state) {
      case 'waiting': return '클릭하여 시작';
      case 'ready': return '초록색이 되면 클릭!';
      case 'click': return '지금 클릭!';
      case 'early': return '너무 빨리 클릭했습니다! 다시 클릭하세요';
      case 'result': return `${reactionTime}ms! 클릭하여 다시 시도`;
      default: return '';
    }
  };

  const toggleSound = () => {
    const muted = gameSound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="game-play-area">
      <div className="game-header-bar">
        <button onClick={() => { gameSound.playClick(); onBack(); }} className="back-btn">← 뒤로</button>
        <h2>반응속도 테스트</h2>
        <div className="header-right">
          <span className="game-score">
            {results.length > 0 && `평균: ${getAverage()}ms | 최고: ${getBestTime()}ms`}
          </span>
          <SoundToggle isMuted={isMuted} onToggle={toggleSound} />
        </div>
      </div>

      <div
        className="reaction-area"
        style={getStateStyle()}
        onClick={handleClick}
      >
        <span className="reaction-message">{getMessage()}</span>
        {state === 'result' && (
          <span className="reaction-emoji">
            {reactionTime < 200 ? '🚀' : reactionTime < 300 ? '⚡' : reactionTime < 400 ? '👍' : '🐢'}
          </span>
        )}
      </div>

      {results.length > 0 && (
        <div className="reaction-results">
          <p>기록: {results.map((r, i) => <span key={i} className="result-chip">{r}ms</span>)}</p>
        </div>
      )}
    </div>
  );
};

// 가위바위보 게임
const RockPaperScissors = ({ onBack }) => {
  const choices = [
    { name: 'rock', emoji: '✊', label: '바위' },
    { name: 'paper', emoji: '✋', label: '보' },
    { name: 'scissors', emoji: '✌️', label: '가위' }
  ];

  const [playerChoice, setPlayerChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [scores, setScores] = useState({ player: 0, computer: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(gameSound.getMuted());

  useEffect(() => {
    gameSound.init();
  }, []);

  const getResult = (player, computer) => {
    if (player === computer) return 'draw';
    if (
      (player === 'rock' && computer === 'scissors') ||
      (player === 'paper' && computer === 'rock') ||
      (player === 'scissors' && computer === 'paper')
    ) return 'win';
    return 'lose';
  };

  const play = (choice) => {
    if (isPlaying) return;
    setIsPlaying(true);
    setPlayerChoice(choice);
    setComputerChoice(null);
    setResult(null);
    gameSound.playSelect();

    // 애니메이션을 위한 딜레이
    let count = 0;
    const interval = setInterval(() => {
      setComputerChoice(choices[Math.floor(Math.random() * 3)].name);
      gameSound.playRoll();
      count++;
      if (count > 6) {
        clearInterval(interval);
        const finalChoice = choices[Math.floor(Math.random() * 3)].name;
        setComputerChoice(finalChoice);
        const gameResult = getResult(choice, finalChoice);
        setResult(gameResult);

        // 결과에 따른 효과음
        setTimeout(() => {
          if (gameResult === 'win') {
            gameSound.playWin();
            setScores(s => ({ ...s, player: s.player + 1 }));
          } else if (gameResult === 'lose') {
            gameSound.playLose();
            setScores(s => ({ ...s, computer: s.computer + 1 }));
          } else {
            gameSound.playDraw();
          }
        }, 100);

        setIsPlaying(false);
      }
    }, 100);
  };

  const getResultMessage = () => {
    if (!result) return '선택하세요!';
    if (result === 'win') return '🎉 이겼습니다!';
    if (result === 'lose') return '😢 졌습니다...';
    return '🤝 무승부!';
  };

  const toggleSound = () => {
    const muted = gameSound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="game-play-area">
      <div className="game-header-bar">
        <button onClick={() => { gameSound.playClick(); onBack(); }} className="back-btn">← 뒤로</button>
        <h2>가위바위보</h2>
        <div className="header-right">
          <span className="game-score">나 {scores.player} : {scores.computer} 컴퓨터</span>
          <SoundToggle isMuted={isMuted} onToggle={toggleSound} />
        </div>
      </div>

      <div className="rps-arena">
        <div className="rps-player">
          <span className="rps-label">나</span>
          <div className={`rps-choice ${playerChoice ? 'selected' : ''}`}>
            {playerChoice ? choices.find(c => c.name === playerChoice)?.emoji : '❓'}
          </div>
        </div>

        <div className="rps-vs">VS</div>

        <div className="rps-player">
          <span className="rps-label">컴퓨터</span>
          <div className={`rps-choice ${computerChoice ? 'selected' : ''} ${isPlaying ? 'animating' : ''}`}>
            {computerChoice ? choices.find(c => c.name === computerChoice)?.emoji : '❓'}
          </div>
        </div>
      </div>

      <div className={`rps-result ${result || ''}`}>
        {getResultMessage()}
      </div>

      <div className="rps-buttons">
        {choices.map(choice => (
          <button
            key={choice.name}
            className={`rps-btn ${playerChoice === choice.name ? 'active' : ''}`}
            onClick={() => play(choice.name)}
            disabled={isPlaying}
          >
            <span className="rps-btn-emoji">{choice.emoji}</span>
            <span className="rps-btn-label">{choice.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// 메인 게임 컴포넌트
const Games = () => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [isMuted, setIsMuted] = useState(gameSound.getMuted());

  useEffect(() => {
    gameSound.init();
  }, []);

  const games = [
    { id: 'memory', name: '메모리 게임', icon: '🧠', desc: '카드를 뒤집어 짝을 맞춰보세요', component: MemoryGame },
    { id: 'tictactoe', name: '틱택토', icon: '⭕', desc: '3개를 먼저 연결하면 승리!', component: TicTacToe },
    { id: 'numberguess', name: '숫자 맞추기', icon: '🔢', desc: '1~100 사이의 숫자를 맞춰보세요', component: NumberGuess },
    { id: 'reaction', name: '반응속도 테스트', icon: '⚡', desc: '얼마나 빠르게 반응할 수 있나요?', component: ReactionTest },
    { id: 'rps', name: '가위바위보', icon: '✊', desc: '컴퓨터와 대결하세요!', component: RockPaperScissors },
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
          <SoundToggle isMuted={isMuted} onToggle={toggleSound} />
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default Games;
