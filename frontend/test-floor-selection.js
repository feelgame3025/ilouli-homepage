/**
 * 바닥 패 선택 기능 테스트 스크립트
 */

const puppeteer = require('puppeteer');

const LOGIN_URL = 'https://ilouli.com/login';

async function testFloorSelection() {
  console.log('=== 바닥 패 선택 기능 테스트 ===\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // 1. 로그인
    console.log('1. 로그인 중...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.evaluate(() => {
      const tabs = document.querySelectorAll('button');
      for (const tab of tabs) {
        if (tab.textContent?.includes('이메일')) {
          tab.click();
          return true;
        }
      }
    });
    await new Promise(r => setTimeout(r, 500));

    await page.type('#email', 'admin@ilouli.com');
    await page.type('#password', 'admin123');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
      page.click('button[type="submit"]')
    ]);
    await new Promise(r => setTimeout(r, 1000));
    console.log('   로그인 완료\n');

    // 2. 게임 페이지로 이동
    console.log('2. 게임 페이지 이동...');
    await page.goto('https://lab.ilouli.com/games', { waitUntil: 'networkidle2', timeout: 30000 });

    // 고스톱 선택
    await page.evaluate(() => {
      const cards = document.querySelectorAll('.game-card');
      for (const card of cards) {
        if (card.textContent?.includes('고스톱')) {
          card.click();
          return true;
        }
      }
    });
    await new Promise(r => setTimeout(r, 2000));
    console.log('   고스톱 게임 선택 완료\n');

    // 3. 여러 번 게임 시작하여 바닥 패 선택 상황 찾기
    console.log('3. 바닥 패 선택 상황 테스트...');

    let foundSelectionScenario = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!foundSelectionScenario && attempts < maxAttempts) {
      attempts++;
      console.log(`\n   [시도 ${attempts}/${maxAttempts}]`);

      // 게임 시작
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent?.includes('시작') || btn.textContent?.includes('새 게임')) {
            btn.click();
            return true;
          }
        }
      });
      await new Promise(r => setTimeout(r, 2000));

      // 바닥 카드 분석
      const floorAnalysis = await page.evaluate(() => {
        const floorSection = document.querySelector('.floor-area, [class*="floor"]');
        const floorCards = floorSection ? floorSection.querySelectorAll('[class*="hwatu-card"]') : [];

        // 각 카드의 월(month) 정보 추출
        const cardMonths = [];
        floorCards.forEach(card => {
          const img = card.querySelector('img');
          if (img && img.src) {
            // 이미지 URL이나 data 속성에서 월 정보 추출 시도
            const dataMonth = card.dataset?.month || card.getAttribute('data-month');
            const className = card.className;
            cardMonths.push({
              src: img.src.split('/').pop(),
              month: dataMonth,
              className: className
            });
          }
        });

        // 바닥에 같은 월 카드가 2장 이상 있는지 확인
        const monthCounts = {};
        cardMonths.forEach(card => {
          if (card.month) {
            monthCounts[card.month] = (monthCounts[card.month] || 0) + 1;
          }
        });

        const duplicateMonths = Object.entries(monthCounts)
          .filter(([month, count]) => count >= 2)
          .map(([month, count]) => ({ month, count }));

        return {
          totalFloorCards: floorCards.length,
          cardMonths,
          duplicateMonths,
          hasDuplicates: duplicateMonths.length > 0
        };
      });

      console.log('   바닥 카드 수:', floorAnalysis.totalFloorCards);
      console.log('   중복 월:', floorAnalysis.duplicateMonths.length > 0
        ? floorAnalysis.duplicateMonths.map(d => `${d.month}월(${d.count}장)`).join(', ')
        : '없음');

      // 내 패에서 바닥과 같은 월 카드 찾기
      const handAnalysis = await page.evaluate(() => {
        const handSection = document.querySelector('.player-hand, [class*="hand"]');
        const handCards = handSection ? handSection.querySelectorAll('[class*="hwatu-card"]') : [];

        const cards = [];
        handCards.forEach((card, idx) => {
          const img = card.querySelector('img');
          const dataMonth = card.dataset?.month || card.getAttribute('data-month');
          cards.push({
            index: idx,
            month: dataMonth,
            src: img?.src?.split('/').pop() || 'unknown'
          });
        });

        return { handCards: cards, total: handCards.length };
      });

      console.log('   내 패 카드 수:', handAnalysis.total);

      // 카드 하나 클릭해서 선택 UI 테스트
      console.log('\n   카드 클릭 테스트...');

      const clickResult = await page.evaluate(() => {
        const handCards = document.querySelectorAll('.player-hand [class*="hwatu-card"], [class*="hand"] [class*="hwatu-card"]');

        if (handCards.length > 0) {
          // 첫 번째 카드 클릭
          handCards[0].click();
          return { clicked: true, cardIndex: 0 };
        }
        return { clicked: false };
      });

      console.log('   클릭 결과:', clickResult);
      await new Promise(r => setTimeout(r, 1500));

      // 선택 UI 확인
      const selectionUI = await page.evaluate(() => {
        // 선택 힌트나 클릭 가능한 바닥 카드 확인
        const selectionHints = document.querySelectorAll('.selection-hint, [class*="selection"]');
        const clickableFloorCards = document.querySelectorAll('.floor-area .clickable, [class*="floor"] .clickable');
        const pendingSelection = document.querySelector('[class*="pending"], [class*="waiting"]');

        // 메시지 확인
        const messageArea = document.querySelector('[class*="message"], [class*="status"]');
        const messageText = messageArea?.textContent || '';

        // 바닥 카드 중 하이라이트된 것 확인
        const highlightedCards = document.querySelectorAll('[class*="hwatu-card"].clickable, [class*="hwatu-card"][class*="selectable"]');

        return {
          hasSelectionHints: selectionHints.length > 0,
          clickableFloorCards: clickableFloorCards.length,
          highlightedCards: highlightedCards.length,
          hasPendingSelection: !!pendingSelection,
          message: messageText.substring(0, 100),
          bodyText: document.body.innerText.substring(0, 500)
        };
      });

      console.log('   선택 힌트:', selectionUI.hasSelectionHints);
      console.log('   클릭 가능 바닥 카드:', selectionUI.clickableFloorCards);
      console.log('   하이라이트된 카드:', selectionUI.highlightedCards);
      console.log('   대기 상태:', selectionUI.hasPendingSelection);

      await page.screenshot({ path: `/tmp/floor-select-${attempts}.png`, fullPage: true });
      console.log(`   스크린샷: /tmp/floor-select-${attempts}.png`);

      if (selectionUI.clickableFloorCards > 0 || selectionUI.highlightedCards > 0 || selectionUI.hasSelectionHints) {
        foundSelectionScenario = true;
        console.log('\n   ✓ 바닥 패 선택 UI 발견!');

        // 바닥 카드 클릭 테스트
        const floorClickResult = await page.evaluate(() => {
          const clickableCards = document.querySelectorAll('.floor-area .clickable, [class*="floor"] [class*="hwatu-card"].clickable');
          if (clickableCards.length > 0) {
            clickableCards[0].click();
            return { clicked: true, count: clickableCards.length };
          }
          return { clicked: false };
        });

        console.log('   바닥 카드 클릭:', floorClickResult);
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: '/tmp/floor-select-after-click.png', fullPage: true });
        console.log('   클릭 후 스크린샷: /tmp/floor-select-after-click.png');
      }

      // 다음 시도를 위해 뒤로가기 후 재시작
      if (!foundSelectionScenario && attempts < maxAttempts) {
        await page.evaluate(() => {
          const backBtn = document.querySelector('button');
          if (backBtn && backBtn.textContent?.includes('뒤로')) {
            backBtn.click();
          }
        });
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // 4. 결과 요약
    console.log('\n=== 테스트 결과 ===');
    if (foundSelectionScenario) {
      console.log('✓ 바닥 패 선택 기능 확인됨');
    } else {
      console.log('△ 바닥 패 선택 상황이 발생하지 않음 (랜덤 배패)');
      console.log('  - 같은 월 카드가 바닥에 2장 이상 있고');
      console.log('  - 내 패에도 해당 월 카드가 있어야 선택 UI가 나타남');
    }

    // 5. 코드 구현 확인
    console.log('\n5. 코드 구현 확인...');
    const codeCheck = await page.evaluate(() => {
      // Games.js에서 pendingSelection 관련 코드 확인을 위한 간접 테스트
      // 게임 상태에서 선택 관련 요소 존재 여부
      return {
        hasFloorArea: !!document.querySelector('.floor-area, [class*="floor"]'),
        hasHandArea: !!document.querySelector('.player-hand, [class*="hand"]'),
        hasHwatuCards: document.querySelectorAll('[class*="hwatu-card"]').length,
        cssClasses: [...new Set(
          Array.from(document.querySelectorAll('[class*="hwatu"]'))
            .flatMap(el => el.className.split(' '))
            .filter(c => c.includes('hwatu') || c.includes('click') || c.includes('select'))
        )].slice(0, 10)
      };
    });

    console.log('   바닥 영역:', codeCheck.hasFloorArea);
    console.log('   손패 영역:', codeCheck.hasHandArea);
    console.log('   화투 카드:', codeCheck.hasHwatuCards);
    console.log('   CSS 클래스:', codeCheck.cssClasses);

    console.log('\n=== 테스트 완료 ===');

  } catch (error) {
    console.error('테스트 오류:', error.message);
  } finally {
    await browser.close();
  }
}

testFloorSelection();
