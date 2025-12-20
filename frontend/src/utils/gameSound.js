// 게임 사운드 유틸리티 - Web Audio API 사용

class GameSound {
  constructor() {
    this.audioContext = null;
    this.isMuted = localStorage.getItem('gameSoundMuted') === 'true';
    this.volume = parseFloat(localStorage.getItem('gameSoundVolume')) || 0.5;
  }

  // AudioContext 초기화 (사용자 상호작용 후 호출)
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // 음소거 토글
  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('gameSoundMuted', this.isMuted.toString());
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = muted;
    localStorage.setItem('gameSoundMuted', muted.toString());
  }

  getMuted() {
    return this.isMuted;
  }

  // 볼륨 설정 (0-1)
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('gameSoundVolume', this.volume.toString());
  }

  getVolume() {
    return this.volume;
  }

  // 기본 톤 재생
  playTone(frequency, duration, type = 'sine', attack = 0.01, decay = 0.1) {
    if (this.isMuted || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + attack);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  // 클릭 효과음
  playClick() {
    this.init();
    this.playTone(800, 0.1, 'sine');
  }

  // 카드 뒤집기 효과음
  playFlip() {
    this.init();
    this.playTone(400, 0.08, 'triangle');
    setTimeout(() => this.playTone(600, 0.08, 'triangle'), 40);
  }

  // 매칭 성공 효과음
  playMatch() {
    this.init();
    this.playTone(523, 0.15, 'sine'); // C5
    setTimeout(() => this.playTone(659, 0.15, 'sine'), 100); // E5
    setTimeout(() => this.playTone(784, 0.2, 'sine'), 200); // G5
  }

  // 틀림 효과음
  playWrong() {
    this.init();
    this.playTone(200, 0.15, 'sawtooth');
    setTimeout(() => this.playTone(150, 0.2, 'sawtooth'), 100);
  }

  // 승리 효과음
  playWin() {
    this.init();
    const notes = [523, 587, 659, 784, 880, 1047]; // C5 scale up
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine'), i * 80);
    });
  }

  // 패배 효과음
  playLose() {
    this.init();
    const notes = [392, 349, 330, 294]; // G4 down
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'triangle'), i * 150);
    });
  }

  // 무승부 효과음
  playDraw() {
    this.init();
    this.playTone(440, 0.15, 'sine');
    setTimeout(() => this.playTone(440, 0.15, 'sine'), 200);
  }

  // 카운트다운 비프음
  playBeep() {
    this.init();
    this.playTone(880, 0.1, 'square');
  }

  // 성공적인 액션 효과음
  playSuccess() {
    this.init();
    this.playTone(660, 0.1, 'sine');
    setTimeout(() => this.playTone(880, 0.15, 'sine'), 80);
  }

  // 반응 테스트 시작음
  playReady() {
    this.init();
    this.playTone(330, 0.3, 'sine');
  }

  // 반응 테스트 클릭음
  playReactionClick() {
    this.init();
    this.playTone(1200, 0.05, 'sine');
  }

  // 가위바위보 선택음
  playSelect() {
    this.init();
    this.playTone(500, 0.08, 'triangle');
  }

  // 가위바위보 롤링음
  playRoll() {
    this.init();
    this.playTone(300 + Math.random() * 200, 0.05, 'square');
  }

  // 게임 시작음
  playGameStart() {
    this.init();
    this.playTone(440, 0.1, 'sine');
    setTimeout(() => this.playTone(554, 0.1, 'sine'), 100);
    setTimeout(() => this.playTone(659, 0.15, 'sine'), 200);
  }

  // 레벨업/달성 효과음
  playAchievement() {
    this.init();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.12, 'sine'), i * 60);
    });
  }

  // 버튼 호버 효과음
  playHover() {
    this.init();
    this.playTone(600, 0.03, 'sine');
  }

  // 타이머 틱 효과음
  playTick() {
    this.init();
    this.playTone(1000, 0.02, 'sine');
  }

  // 정답 효과음
  playCorrect() {
    this.init();
    this.playTone(880, 0.1, 'sine');
    setTimeout(() => this.playTone(1100, 0.15, 'sine'), 80);
  }

  // 힌트 효과음 (위/아래)
  playUp() {
    this.init();
    this.playTone(440, 0.1, 'triangle');
    setTimeout(() => this.playTone(550, 0.1, 'triangle'), 80);
  }

  playDown() {
    this.init();
    this.playTone(550, 0.1, 'triangle');
    setTimeout(() => this.playTone(440, 0.1, 'triangle'), 80);
  }
}

// 싱글톤 인스턴스
const gameSound = new GameSound();
export default gameSound;
