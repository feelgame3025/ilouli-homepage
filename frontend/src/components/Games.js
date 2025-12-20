import React from 'react';
import './Games.css';

const Games = () => {

  return (
    <div className="games-container">
      <div className="games-header">
        <h1>게임</h1>
        <p>다양한 미니게임을 즐겨보세요</p>
      </div>

      <div className="games-grid">
        <div className="game-card coming-soon">
          <div className="game-icon">🎮</div>
          <h3>준비 중</h3>
          <p>곧 재미있는 게임이 추가됩니다!</p>
        </div>
      </div>
    </div>
  );
};

export default Games;
