/**
 * 고스톱 게임 단순 테스트 (정확한 셀렉터 사용)
 */

const puppeteer = require('puppeteer');

async function testGoStop() {
  console.log('=== 고스톱 게임 테스트 ===\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // 로그인
    console.log('1. 로그인...');
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
    console.log('   로그인 완료\n');

    // 게임 페이지로 이동
    console.log('2. 게임 페이지 이동...');
    await page.goto('https://lab.ilouli.com/games', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      document.querySelectorAll('.game-card').forEach(c => {
        if (c.textContent?.includes('고스톱')) c.click();
      });
    });
    await new Promise(r => setTimeout(r, 2000));

    // 게임 시작
    console.log('3. 게임 시작...');
    await page.evaluate(() => {
      document.querySelectorAll('button').forEach(b => {
        if (b.textContent?.includes('시작')) b.click();
      });
    });
    await new Promise(r => setTimeout(r, 2000));

    // 정확한 셀렉터로 카드 수집 (hwatu-card-new만 직접 선택)
    console.log('4. 카드 분포 확인...');

    const cardAnalysis = await page.evaluate(() => {
      // hwatu-card-new 클래스를 가진 요소만 정확히 선택
      const getCardImages = (container) => {
        if (!container) return [];
        const cards = container.querySelectorAll('.hwatu-card-new');
        return Array.from(cards).map(card => {
          const img = card.querySelector('img');
          return img ? img.src.split('/').pop() : null;
        }).filter(Boolean);
      };

      const hand = document.querySelector('.hand-grid');
      const floor = document.querySelector('.floor-section');
      const playerCollected = document.querySelector('.player-collected');
      const opponentSection = document.querySelector('.opponent-section');

      const handCards = getCardImages(hand);
      const floorCards = getCardImages(floor);
      const playerCards = getCardImages(playerCollected);
      const opponentCards = getCardImages(opponentSection);

      // 덱 카드 수
      const deckText = document.body.innerText.match(/남은 패:\s*(\d+)장/);
      const deckCount = deckText ? parseInt(deckText[1]) : 0;

      return {
        hand: handCards.length,
        floor: floorCards.length,
        playerCollected: playerCards.length,
        opponentCollected: opponentCards.length,
        deck: deckCount,
        total: handCards.length + floorCards.length + playerCards.length + opponentCards.length + deckCount + 10, // +10 for computer hand
        allCards: [...handCards, ...floorCards, ...playerCards, ...opponentCards]
      };
    });

    console.log('   손패:', cardAnalysis.hand, '장');
    console.log('   바닥:', cardAnalysis.floor, '장');
    console.log('   내 획득:', cardAnalysis.playerCollected, '장');
    console.log('   상대 획득:', cardAnalysis.opponentCollected, '장');
    console.log('   덱 (예상):', cardAnalysis.deck, '장');
    console.log('   총합 (컴퓨터 손패 10장 포함):', cardAnalysis.total, '장');

    // 중복 카드 체크
    const cardCounts = {};
    cardAnalysis.allCards.forEach(card => {
      cardCounts[card] = (cardCounts[card] || 0) + 1;
    });
    const duplicates = Object.entries(cardCounts).filter(([, count]) => count > 1);

    if (duplicates.length > 0) {
      console.log('\n   [경고] 중복 카드 발견:');
      duplicates.forEach(([card, count]) => {
        console.log(`     - ${card}: ${count}장`);
      });
    } else {
      console.log('\n   [OK] 중복 카드 없음');
    }

    // 몇 턴 플레이 테스트
    console.log('\n5. 자동 플레이 테스트 (5턴)...');

    for (let turn = 1; turn <= 5; turn++) {
      // 게임 종료 체크
      const isEnded = await page.evaluate(() => {
        return document.body.innerText.includes('게임 종료') ||
               document.body.innerText.includes('승리') ||
               document.body.innerText.includes('패배');
      });

      if (isEnded) {
        console.log(`   [턴 ${turn}] 게임 종료`);
        break;
      }

      // 플레이어 턴이면 카드 내기
      const isPlayerTurn = await page.evaluate(() => {
        return document.body.innerText.includes('카드를 선택하세요');
      });

      if (isPlayerTurn) {
        await page.evaluate(() => {
          const handCards = document.querySelectorAll('.hand-grid .hwatu-card-new:not(.disabled)');
          if (handCards.length > 0) {
            const event = new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window });
            handCards[0].dispatchEvent(event);
          }
        });
        console.log(`   [턴 ${turn}] 카드 내기 완료`);
      } else {
        console.log(`   [턴 ${turn}] 컴퓨터 턴 대기`);
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    // 최종 상태 확인
    console.log('\n6. 최종 상태...');
    const finalState = await page.evaluate(() => {
      const getCardCount = (container) => {
        if (!container) return 0;
        return container.querySelectorAll('.hwatu-card-new').length;
      };

      const hand = document.querySelector('.hand-grid');
      const floor = document.querySelector('.floor-section');
      const playerCollected = document.querySelector('.player-collected');
      const opponentSection = document.querySelector('.opponent-section');

      const scoreMatch = document.body.innerText.match(/(\d+)\s*점/g);

      return {
        handCount: getCardCount(hand),
        floorCount: getCardCount(floor),
        playerCollectedCount: getCardCount(playerCollected),
        opponentCollectedCount: getCardCount(opponentSection),
        scores: scoreMatch || []
      };
    });

    console.log('   손패:', finalState.handCount, '장');
    console.log('   바닥:', finalState.floorCount, '장');
    console.log('   내 획득:', finalState.playerCollectedCount, '장');
    console.log('   상대 획득:', finalState.opponentCollectedCount, '장');
    console.log('   점수:', finalState.scores.join(', ') || '없음');

    await page.screenshot({ path: '/tmp/gostop-test-final.png', fullPage: true });
    console.log('\n   스크린샷: /tmp/gostop-test-final.png');

    console.log('\n=== 테스트 완료 ===');

  } catch (error) {
    console.error('테스트 오류:', error.message);
  } finally {
    await browser.close();
  }
}

testGoStop();
