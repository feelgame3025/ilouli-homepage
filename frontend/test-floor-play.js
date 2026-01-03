/**
 * 바닥 패 선택 기능 실제 플레이 테스트
 */

const puppeteer = require('puppeteer');

async function testFloorPlay() {
  console.log('=== 바닥 패 선택 플레이 테스트 ===\n');

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
      const tabs = document.querySelectorAll('button');
      for (const tab of tabs) {
        if (tab.textContent?.includes('이메일')) { tab.click(); break; }
      }
    });
    await new Promise(r => setTimeout(r, 500));
    await page.type('#email', 'admin@ilouli.com');
    await page.type('#password', 'admin123');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));

    // 게임 시작
    console.log('2. 게임 시작...');
    await page.goto('https://lab.ilouli.com/games', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      document.querySelectorAll('.game-card').forEach(c => {
        if (c.textContent?.includes('고스톱')) c.click();
      });
    });
    await new Promise(r => setTimeout(r, 2000));

    // 게임 시작 버튼
    await page.evaluate(() => {
      document.querySelectorAll('button').forEach(b => {
        if (b.textContent?.includes('시작')) b.click();
      });
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('3. 카드 플레이 및 선택 상황 찾기...\n');

    let foundSelection = false;
    let turnCount = 0;
    const maxTurns = 20;

    while (!foundSelection && turnCount < maxTurns) {
      turnCount++;

      // 현재 게임 상태 확인
      const state = await page.evaluate(() => {
        const text = document.body.innerText;
        const selectionHint = document.querySelector('.selection-hint');
        const clickableFloorCards = document.querySelectorAll('.floor-area .clickable, .floor-section .clickable');

        return {
          isPlayerTurn: text.includes('카드를 선택하세요'),
          hasSelectionHint: !!selectionHint,
          selectionHintText: selectionHint?.textContent || '',
          clickableFloorCount: clickableFloorCards.length,
          gameEnded: text.includes('게임 종료') || text.includes('승리') || text.includes('패배')
        };
      });

      if (state.gameEnded) {
        console.log('   게임 종료됨');
        break;
      }

      if (state.hasSelectionHint || state.clickableFloorCount > 0) {
        foundSelection = true;
        console.log(`\n   ✓ [턴 ${turnCount}] 바닥 패 선택 상황 발견!`);
        console.log('   선택 힌트:', state.selectionHintText);
        console.log('   클릭 가능 바닥 카드:', state.clickableFloorCount);

        await page.screenshot({ path: '/tmp/floor-selection-found.png', fullPage: true });
        console.log('   스크린샷: /tmp/floor-selection-found.png');

        // 바닥 카드 선택 테스트
        const clickResult = await page.evaluate(() => {
          const clickableCards = document.querySelectorAll('.floor-area .clickable, .floor-section .clickable');
          if (clickableCards.length > 0) {
            clickableCards[0].click();
            return { clicked: true, cardCount: clickableCards.length };
          }
          return { clicked: false };
        });
        console.log('   바닥 카드 클릭:', clickResult);

        await new Promise(r => setTimeout(r, 1500));
        await page.screenshot({ path: '/tmp/floor-selection-after.png', fullPage: true });
        console.log('   클릭 후: /tmp/floor-selection-after.png');
        break;
      }

      // 플레이어 턴이면 카드 플레이
      if (state.isPlayerTurn) {
        console.log(`   [턴 ${turnCount}] 플레이어 턴 - 카드 내기`);

        // 첫 번째 클릭 가능한 카드 더블클릭 (바로 내기)
        await page.evaluate(() => {
          const handCards = document.querySelectorAll('.hand-grid .hwatu-card-new:not(.disabled)');
          if (handCards.length > 0) {
            // 더블클릭 이벤트 발생
            const event = new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window });
            handCards[0].dispatchEvent(event);
          }
        });

        await new Promise(r => setTimeout(r, 2000));
      } else {
        // 컴퓨터 턴 대기
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    // 결과
    console.log('\n=== 결과 ===');
    if (foundSelection) {
      console.log('✓ 바닥 패 선택 기능 작동 확인됨');
    } else {
      console.log(`△ ${maxTurns}턴 동안 2장 매칭 상황 미발생 (랜덤 배패)`);

      // 마지막 상태 스크린샷
      await page.screenshot({ path: '/tmp/floor-selection-end.png', fullPage: true });
      console.log('  최종 상태: /tmp/floor-selection-end.png');
    }

  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await browser.close();
  }
}

testFloorPlay();
