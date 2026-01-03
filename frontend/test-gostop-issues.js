/**
 * 고스톱 게임 이슈 수집 테스트
 * - 카드 중복 배치
 * - 점수 계산 오류
 * - 획득 카드 문제
 */

const puppeteer = require('puppeteer');

const issues = [];
let gameCount = 0;

async function logIssue(type, description, details = {}) {
  issues.push({
    game: gameCount,
    type,
    description,
    details,
    timestamp: new Date().toISOString()
  });
  console.log(`  [이슈] ${type}: ${description}`);
}

async function runGameTest(page) {
  gameCount++;
  console.log(`\n========== 게임 ${gameCount} ==========`);

  // 게임 시작
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(b => {
      const text = b.textContent || '';
      if (text.includes('시작') || text.includes('새 게임')) b.click();
    });
  });
  await new Promise(r => setTimeout(r, 2000));

  let turnCount = 0;
  let prevState = null;
  const maxTurns = 30;
  const cardHistory = [];

  while (turnCount < maxTurns) {
    turnCount++;

    // 현재 게임 상태 수집
    const state = await page.evaluate(() => {
      const getText = (sel) => document.querySelector(sel)?.textContent || '';
      const bodyText = document.body.innerText;

      // 카드 정보 수집 함수
      const getCards = (selector) => {
        const cards = [];
        document.querySelectorAll(selector).forEach(card => {
          const img = card.querySelector('img');
          if (img && img.src) {
            const src = img.src.split('/').pop();
            const month = card.dataset?.month || card.getAttribute('data-month');
            const type = card.dataset?.type || card.getAttribute('data-type');
            cards.push({ src, month, type, id: card.dataset?.id });
          }
        });
        return cards;
      };

      // 점수 추출
      const extractScore = (text) => {
        const match = text.match(/(\d+)\s*점/);
        return match ? parseInt(match[1]) : 0;
      };

      // 컴퓨터 획득 카드
      const computerSection = document.querySelector('.opponent-section, [class*="computer"], [class*="opponent"]');
      const computerCards = computerSection ? getCards('.hwatu-card-new, [class*="hwatu-card"]') : [];

      // 플레이어 획득 카드
      const playerCollected = document.querySelector('.player-collected, [class*="collected"]');
      const playerCards = playerCollected ? getCards('.hwatu-card-new, [class*="hwatu-card"]') : [];

      // 바닥 카드
      const floorSection = document.querySelector('.floor-area, .floor-section, [class*="floor"]');
      const floorCards = floorSection ? getCards('.hwatu-card-new, [class*="hwatu-card"]') : [];

      // 손패
      const handSection = document.querySelector('.hand-grid, .player-hand, [class*="hand"]');
      const handCards = handSection ? getCards('.hwatu-card-new, [class*="hwatu-card"]') : [];

      // 점수 정보
      const computerScoreEl = document.querySelector('.opponent-section .score, [class*="computer"] [class*="score"]');
      const playerScoreEl = document.querySelector('.player-collected .score, [class*="player"] [class*="score"]');

      // 각 타입별 카드 수 (광, 열, 띠, 피)
      const countByType = (section) => {
        const result = { 광: 0, 열: 0, 띠: 0, 피: 0 };
        if (!section) return result;

        section.querySelectorAll('.card-category, [class*="category"]').forEach(cat => {
          const label = cat.querySelector('.category-label, h4')?.textContent || '';
          const cards = cat.querySelectorAll('.hwatu-card-new, [class*="hwatu-card"]');
          if (label.includes('광')) result['광'] = cards.length;
          else if (label.includes('열')) result['열'] = cards.length;
          else if (label.includes('띠')) result['띠'] = cards.length;
          else if (label.includes('피')) result['피'] = cards.length;
        });
        return result;
      };

      return {
        isPlayerTurn: bodyText.includes('카드를 선택하세요'),
        isComputerTurn: bodyText.includes('컴퓨터') && bodyText.includes('턴'),
        gameEnded: bodyText.includes('게임 종료') || bodyText.includes('승리') || bodyText.includes('패배'),
        canStop: bodyText.includes('고') || bodyText.includes('스톱'),

        computerCards,
        computerCardCount: computerCards.length,
        computerTypes: countByType(computerSection),

        playerCards,
        playerCardCount: playerCards.length,
        playerTypes: countByType(playerCollected),

        floorCards,
        floorCardCount: floorCards.length,

        handCards,
        handCardCount: handCards.length,

        // 전체 카드 src 목록 (중복 체크용)
        allCardSrcs: [...computerCards, ...playerCards, ...floorCards, ...handCards].map(c => c.src),

        bodyPreview: bodyText.substring(0, 300)
      };
    });

    // 게임 종료 체크
    if (state.gameEnded) {
      console.log(`  [턴 ${turnCount}] 게임 종료`);

      // 최종 상태 스크린샷
      await page.screenshot({ path: `/tmp/gostop-game${gameCount}-end.png`, fullPage: true });

      // 최종 점수 검증
      const finalState = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        const computerScore = bodyText.match(/컴퓨터.*?(\d+)\s*점/)?.[1] || '0';
        const playerScore = bodyText.match(/내.*?(\d+)\s*점|플레이어.*?(\d+)\s*점/)?.[1] || '0';
        return { computerScore, playerScore };
      });

      console.log(`  최종 점수 - 컴퓨터: ${finalState.computerScore}점, 플레이어: ${finalState.playerScore}점`);
      break;
    }

    // 카드 중복 체크
    const srcCounts = {};
    state.allCardSrcs.forEach(src => {
      srcCounts[src] = (srcCounts[src] || 0) + 1;
    });

    const duplicates = Object.entries(srcCounts).filter(([src, count]) => count > 1);
    if (duplicates.length > 0) {
      await logIssue('DUPLICATE_CARD', `같은 이미지 카드 중복 발견`, {
        duplicates: duplicates.map(([src, count]) => `${src}: ${count}장`),
        turn: turnCount
      });
      await page.screenshot({ path: `/tmp/gostop-issue-dup-${gameCount}-${turnCount}.png`, fullPage: true });
    }

    // 상태 변화 기록
    if (prevState) {
      // 컴퓨터 카드 변화 체크
      if (state.computerCardCount > prevState.computerCardCount) {
        const diff = state.computerCardCount - prevState.computerCardCount;
        console.log(`  [턴 ${turnCount}] 컴퓨터 카드 획득 +${diff} (총 ${state.computerCardCount}장)`);

        // 갑자기 너무 많은 카드를 획득했는지 체크
        if (diff > 4) {
          await logIssue('ABNORMAL_ACQUIRE', `컴퓨터가 한 턴에 ${diff}장 획득 (비정상)`, {
            turn: turnCount,
            before: prevState.computerCardCount,
            after: state.computerCardCount
          });
          await page.screenshot({ path: `/tmp/gostop-issue-acquire-${gameCount}-${turnCount}.png`, fullPage: true });
        }
      }

      // 플레이어 카드 변화 체크
      if (state.playerCardCount > prevState.playerCardCount) {
        const diff = state.playerCardCount - prevState.playerCardCount;
        console.log(`  [턴 ${turnCount}] 플레이어 카드 획득 +${diff} (총 ${state.playerCardCount}장)`);
      }

      // 바닥 카드 변화 체크
      if (Math.abs(state.floorCardCount - prevState.floorCardCount) > 4) {
        await logIssue('FLOOR_ANOMALY', `바닥 카드 급격한 변화`, {
          turn: turnCount,
          before: prevState.floorCardCount,
          after: state.floorCardCount
        });
      }
    }

    prevState = state;

    // 플레이어 턴이면 카드 플레이
    if (state.isPlayerTurn && !state.canStop) {
      // 더블클릭으로 카드 내기
      await page.evaluate(() => {
        const handCards = document.querySelectorAll('.hand-grid .hwatu-card-new:not(.disabled)');
        if (handCards.length > 0) {
          const event = new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window });
          handCards[0].dispatchEvent(event);
        }
      });
      await new Promise(r => setTimeout(r, 1500));
    } else if (state.canStop) {
      // 고/스톱 선택 - 스톱 선택
      await page.evaluate(() => {
        document.querySelectorAll('button').forEach(b => {
          if (b.textContent?.includes('스톱')) b.click();
        });
      });
      await new Promise(r => setTimeout(r, 1000));
    } else {
      // 컴퓨터 턴 대기
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // 게임 완료 후 상세 상태 저장
  const finalDetails = await page.evaluate(() => {
    const sections = [];
    document.querySelectorAll('.card-category, [class*="category"]').forEach(cat => {
      const label = cat.querySelector('.category-label, h4')?.textContent || 'unknown';
      const count = cat.querySelectorAll('.hwatu-card-new, [class*="hwatu-card"]').length;
      sections.push({ label, count });
    });
    return { sections };
  });

  console.log(`  카드 분류:`, finalDetails.sections);
}

async function main() {
  console.log('=== 고스톱 이슈 수집 테스트 시작 ===\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // 로그인
    console.log('로그인 중...');
    await page.goto('https://ilouli.com/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      document.querySelectorAll('button').forEach(b => {
        if (b.textContent?.includes('이메일')) b.click();
      });
    });
    await new Promise(r => setTimeout(r, 500));
    await page.type('#email', 'admin@ilouli.com');
    await page.type('#password', 'admin123');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));
    console.log('로그인 완료\n');

    // 게임 페이지로 이동
    await page.goto('https://lab.ilouli.com/games', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      document.querySelectorAll('.game-card').forEach(c => {
        if (c.textContent?.includes('고스톱')) c.click();
      });
    });
    await new Promise(r => setTimeout(r, 2000));

    // 여러 게임 테스트
    const numGames = 3;
    for (let i = 0; i < numGames; i++) {
      await runGameTest(page);

      // 게임 사이 잠시 대기
      if (i < numGames - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // 이슈 요약
    console.log('\n\n========== 이슈 요약 ==========');
    if (issues.length === 0) {
      console.log('발견된 이슈 없음');
    } else {
      console.log(`총 ${issues.length}개 이슈 발견:\n`);
      issues.forEach((issue, idx) => {
        console.log(`${idx + 1}. [게임 ${issue.game}] ${issue.type}`);
        console.log(`   설명: ${issue.description}`);
        console.log(`   상세: ${JSON.stringify(issue.details)}`);
        console.log('');
      });
    }

    // 이슈 JSON 저장
    const fs = require('fs');
    fs.writeFileSync('/tmp/gostop-issues.json', JSON.stringify(issues, null, 2));
    console.log('이슈 저장: /tmp/gostop-issues.json');

  } catch (error) {
    console.error('테스트 오류:', error.message);
  } finally {
    await browser.close();
  }
}

main();
