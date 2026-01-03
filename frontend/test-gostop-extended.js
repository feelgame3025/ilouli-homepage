/**
 * 고스톱 게임 확장 테스트 - 전체 게임 진행
 */

const puppeteer = require('puppeteer');

async function testGoStopExtended() {
  console.log('=== 고스톱 전체 게임 테스트 ===\n');

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

    // 게임 페이지 이동
    console.log('2. 게임 시작...');
    await page.goto('https://lab.ilouli.com/games', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      document.querySelectorAll('.game-card').forEach(c => {
        if (c.textContent?.includes('고스톱')) c.click();
      });
    });
    await new Promise(r => setTimeout(r, 2000));

    // 게임 시작
    await page.evaluate(() => {
      document.querySelectorAll('button').forEach(b => {
        if (b.textContent?.includes('시작')) b.click();
      });
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('3. 전체 게임 진행...\n');

    let turnCount = 0;
    const maxTurns = 30;
    let gameEnded = false;

    while (!gameEnded && turnCount < maxTurns) {
      turnCount++;

      // 게임 상태 체크
      const state = await page.evaluate(() => {
        const text = document.body.innerText;

        const getCardCount = (container) => {
          if (!container) return 0;
          return container.querySelectorAll('.hwatu-card-new').length;
        };

        const hand = document.querySelector('.hand-grid');
        const floor = document.querySelector('.floor-section');
        const playerCollected = document.querySelector('.player-collected');
        const opponentSection = document.querySelector('.opponent-section');

        return {
          isPlayerTurn: text.includes('카드를 선택하세요'),
          isGoStop: text.includes('고') && text.includes('스톱') && !text.includes('고스톱'),
          gameEnded: text.includes('게임 종료') || text.includes('승리') || text.includes('패배'),
          handCount: getCardCount(hand),
          floorCount: getCardCount(floor),
          playerCount: getCardCount(playerCollected),
          opponentCount: getCardCount(opponentSection)
        };
      });

      if (state.gameEnded) {
        gameEnded = true;
        console.log(`   [턴 ${turnCount}] 게임 종료!`);
        break;
      }

      if (state.isGoStop) {
        // 스톱 선택
        await page.evaluate(() => {
          document.querySelectorAll('button').forEach(b => {
            if (b.textContent?.includes('스톱')) b.click();
          });
        });
        console.log(`   [턴 ${turnCount}] 스톱 선택`);
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }

      if (state.isPlayerTurn) {
        // 더블클릭으로 카드 내기
        await page.evaluate(() => {
          const handCards = document.querySelectorAll('.hand-grid .hwatu-card-new:not(.disabled)');
          if (handCards.length > 0) {
            const event = new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window });
            handCards[0].dispatchEvent(event);
          }
        });

        // 바닥 카드 선택 필요시 처리
        await new Promise(r => setTimeout(r, 500));
        const needSelection = await page.evaluate(() => {
          const clickable = document.querySelectorAll('.floor-section .hwatu-card-new.clickable');
          if (clickable.length > 0) {
            clickable[0].click();
            return true;
          }
          return false;
        });

        if (needSelection) {
          console.log(`   [턴 ${turnCount}] 바닥 카드 선택 (손: ${state.handCount}, 바닥: ${state.floorCount}, 내: ${state.playerCount}, 상대: ${state.opponentCount})`);
        } else {
          console.log(`   [턴 ${turnCount}] 카드 내기 (손: ${state.handCount}, 바닥: ${state.floorCount}, 내: ${state.playerCount}, 상대: ${state.opponentCount})`);
        }
      } else {
        console.log(`   [턴 ${turnCount}] 컴퓨터 턴 (바닥: ${state.floorCount}, 상대: ${state.opponentCount})`);
      }

      await new Promise(r => setTimeout(r, 1500));
    }

    // 최종 결과
    console.log('\n4. 최종 결과...');
    const finalResult = await page.evaluate(() => {
      const text = document.body.innerText;

      const getCardCount = (container) => {
        if (!container) return 0;
        return container.querySelectorAll('.hwatu-card-new').length;
      };

      const hand = document.querySelector('.hand-grid');
      const floor = document.querySelector('.floor-section');
      const playerCollected = document.querySelector('.player-collected');
      const opponentSection = document.querySelector('.opponent-section');

      // 점수 추출
      const playerScoreMatch = text.match(/내\s+점수[:\s]*(\d+)/);
      const computerScoreMatch = text.match(/컴퓨터\s+점수[:\s]*(\d+)/);

      return {
        handCount: getCardCount(hand),
        floorCount: getCardCount(floor),
        playerCount: getCardCount(playerCollected),
        opponentCount: getCardCount(opponentSection),
        total: getCardCount(hand) + getCardCount(floor) + getCardCount(playerCollected) + getCardCount(opponentSection),
        playerScore: playerScoreMatch ? playerScoreMatch[1] : '?',
        computerScore: computerScoreMatch ? computerScoreMatch[1] : '?',
        isWin: text.includes('승리'),
        isLose: text.includes('패배'),
        message: text.substring(0, 200)
      };
    });

    console.log('   손패:', finalResult.handCount, '장');
    console.log('   바닥:', finalResult.floorCount, '장');
    console.log('   내 획득:', finalResult.playerCount, '장');
    console.log('   상대 획득:', finalResult.opponentCount, '장');
    console.log('   화면 총합:', finalResult.total, '장');
    console.log('   결과:', finalResult.isWin ? '승리!' : finalResult.isLose ? '패배' : '진행중');

    await page.screenshot({ path: '/tmp/gostop-extended-final.png', fullPage: true });
    console.log('\n   스크린샷: /tmp/gostop-extended-final.png');

    // 카드 중복 최종 체크
    const duplicateCheck = await page.evaluate(() => {
      const getCardImages = (container) => {
        if (!container) return [];
        const cards = container.querySelectorAll('.hwatu-card-new');
        return Array.from(cards).map(card => {
          const img = card.querySelector('img');
          return img ? img.src.split('/').pop() : null;
        }).filter(Boolean);
      };

      const all = [
        ...getCardImages(document.querySelector('.hand-grid')),
        ...getCardImages(document.querySelector('.floor-section')),
        ...getCardImages(document.querySelector('.player-collected')),
        ...getCardImages(document.querySelector('.opponent-section'))
      ];

      const counts = {};
      all.forEach(card => {
        counts[card] = (counts[card] || 0) + 1;
      });

      return Object.entries(counts).filter(([, count]) => count > 1);
    });

    if (duplicateCheck.length > 0) {
      console.log('\n   [경고] 중복 카드 발견!');
      duplicateCheck.forEach(([card, count]) => {
        console.log(`     - ${card}: ${count}장`);
      });
    } else {
      console.log('\n   [OK] 중복 카드 없음 - 게임 로직 정상');
    }

    console.log('\n=== 테스트 완료 ===');

  } catch (error) {
    console.error('테스트 오류:', error.message);
  } finally {
    await browser.close();
  }
}

testGoStopExtended();
