/**
 * 고스톱 게임 테스트 스크립트
 */

const puppeteer = require('puppeteer');

const LOGIN_URL = 'https://ilouli.com/login';

async function testGoStop() {
  console.log('=== 고스톱 게임 테스트 ===\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // 콘솔 에러 캡처
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 이미지 로드 실패 캡처
    const failedImages = [];
    page.on('requestfailed', request => {
      const url = request.url();
      if (url.includes('hwatu') || url.includes('.png') || url.includes('.jpg')) {
        failedImages.push(url);
      }
    });

    // 1. 로그인
    console.log('1. 로그인 중...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: '/tmp/gostop-0-login.png' });

    // 이메일 로그인 탭 클릭
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('button');
      for (const tab of tabs) {
        if (tab.textContent?.includes('이메일')) {
          tab.click();
          return true;
        }
      }
      return false;
    });
    await new Promise(r => setTimeout(r, 500));

    // 로그인 폼 입력
    await page.type('#email', 'admin@ilouli.com');
    await page.type('#password', 'admin123');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
      page.click('button[type="submit"]')
    ]);
    await new Promise(r => setTimeout(r, 1000));
    console.log('   로그인 완료\n');

    // 2. Lab 게임 페이지로 이동
    console.log('2. Lab 게임 페이지 이동...');
    await page.goto('https://lab.ilouli.com/games', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: '/tmp/gostop-1-games.png', fullPage: true });
    console.log('   스크린샷: /tmp/gostop-1-games.png\n');

    // 3. 페이지 내용 확인
    console.log('3. 게임 목록 확인...');
    const gamesPage = await page.evaluate(() => {
      const games = [];
      document.querySelectorAll('[class*="game"], [class*="card"], button').forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length < 100) {
          games.push(text.substring(0, 50));
        }
      });
      return {
        url: window.location.href,
        bodyText: document.body.innerText.substring(0, 500),
        games: [...new Set(games)].slice(0, 10)
      };
    });
    console.log('   URL:', gamesPage.url);
    console.log('   게임 요소들:', gamesPage.games);

    // 4. 고스톱 게임 찾기 및 클릭
    console.log('\n4. 고스톱 게임 선택...');
    const goStopClicked = await page.evaluate(() => {
      // 게임 카드 클릭
      const cards = document.querySelectorAll('[class*="game-card"], [class*="GameCard"], .game-card');
      for (const card of cards) {
        if (card.textContent?.includes('고스톱')) {
          card.click();
          return { found: true, text: card.textContent?.substring(0, 50), method: 'game-card' };
        }
      }

      // 모든 클릭 가능 요소에서 고스톱 찾기
      const allElements = document.querySelectorAll('button, a, [onclick]');
      for (const el of allElements) {
        if (el.textContent?.includes('고스톱')) {
          el.click();
          return { found: true, text: el.textContent?.substring(0, 50), method: 'button' };
        }
      }

      return { found: false };
    });

    console.log('   클릭 결과:', goStopClicked);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/gostop-2-selected.png', fullPage: true });
    console.log('   스크린샷: /tmp/gostop-2-selected.png\n');

    // 5. 게임 화면 분석
    console.log('5. 게임 화면 분석...');
    const gameScreen = await page.evaluate(() => {
      const text = document.body.innerText;
      const images = document.querySelectorAll('img');
      const hwatuImages = [];

      images.forEach(img => {
        if (img.src.includes('hwatu') || img.src.includes('1767')) {
          hwatuImages.push({
            src: img.src.split('/').pop(),
            loaded: img.complete && img.naturalHeight > 0,
            size: `${img.naturalWidth}x${img.naturalHeight}`
          });
        }
      });

      return {
        hasPlayer: text.includes('플레이어') || text.includes('내 패'),
        hasComputer: text.includes('컴퓨터') || text.includes('AI') || text.includes('상대'),
        hasFloor: text.includes('바닥'),
        hasScore: text.includes('점'),
        hasStartButton: text.includes('시작') || text.includes('Start'),
        totalImages: images.length,
        hwatuImages: hwatuImages,
        preview: text.substring(0, 300)
      };
    });

    console.log('   플레이어:', gameScreen.hasPlayer);
    console.log('   컴퓨터:', gameScreen.hasComputer);
    console.log('   바닥:', gameScreen.hasFloor);
    console.log('   점수:', gameScreen.hasScore);
    console.log('   시작버튼:', gameScreen.hasStartButton);
    console.log('   전체 이미지:', gameScreen.totalImages);
    console.log('   화투 이미지:', gameScreen.hwatuImages.length);

    if (gameScreen.hwatuImages.length > 0) {
      console.log('\n   화투 이미지 샘플:');
      gameScreen.hwatuImages.slice(0, 5).forEach(img => {
        console.log(`     - ${img.src}: ${img.loaded ? '✓ 로드됨' : '✗ 실패'} (${img.size})`);
      });

      const loadedCount = gameScreen.hwatuImages.filter(i => i.loaded).length;
      const failedCount = gameScreen.hwatuImages.filter(i => !i.loaded).length;
      console.log(`\n   로드 통계: 성공 ${loadedCount}, 실패 ${failedCount}`);
    }

    // 6. 게임 시작
    console.log('\n6. 게임 시작 시도...');
    const startResult = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent?.trim() || '';
        if (text.includes('시작') || text.includes('Start') || text.includes('새 게임') || text.includes('New')) {
          btn.click();
          return { clicked: true, button: text };
        }
      }
      return { clicked: false };
    });

    if (startResult.clicked) {
      console.log('   시작 버튼 클릭:', startResult.button);
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: '/tmp/gostop-3-playing.png', fullPage: true });
      console.log('   스크린샷: /tmp/gostop-3-playing.png\n');

      // 게임 진행 상태 확인
      console.log('7. 게임 진행 상태...');
      const playState = await page.evaluate(() => {
        const text = document.body.innerText;
        const images = document.querySelectorAll('img');
        const hwatuCount = Array.from(images).filter(img =>
          img.src.includes('hwatu') || img.src.includes('1767')
        ).length;

        const loadedHwatu = Array.from(images).filter(img =>
          (img.src.includes('hwatu') || img.src.includes('1767')) &&
          img.complete && img.naturalHeight > 0
        ).length;

        const cards = document.querySelectorAll('[class*="hwatu-card"], [class*="card"]');

        return {
          hwatuImages: hwatuCount,
          loadedHwatu: loadedHwatu,
          cardElements: cards.length,
          hasHand: text.includes('내 패') || text.includes('손패'),
          hasTurn: text.includes('차례') || text.includes('Turn'),
          preview: text.substring(0, 400)
        };
      });

      console.log('   화투 이미지:', playState.hwatuImages, '(로드됨:', playState.loadedHwatu + ')');
      console.log('   카드 요소:', playState.cardElements);
      console.log('   손패 표시:', playState.hasHand);
      console.log('   턴 표시:', playState.hasTurn);
      console.log('\n   게임 화면:');
      console.log('   ', playState.preview.replace(/\n/g, ' ').substring(0, 250) + '...');

      // 카드 클릭 테스트
      console.log('\n8. 카드 클릭 테스트...');
      const cardClick = await page.evaluate(() => {
        const cards = document.querySelectorAll('[class*="hwatu-card"]');
        if (cards.length > 0) {
          const clickableCards = Array.from(cards).filter(c =>
            !c.classList.contains('disabled') && c.offsetParent !== null
          );
          if (clickableCards.length > 0) {
            clickableCards[0].click();
            return { clicked: true, totalCards: cards.length, clickable: clickableCards.length };
          }
        }
        return { clicked: false, totalCards: cards.length };
      });

      console.log('   카드 클릭:', cardClick);
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: '/tmp/gostop-4-cardclick.png', fullPage: true });
      console.log('   스크린샷: /tmp/gostop-4-cardclick.png');

    } else {
      console.log('   시작 버튼을 찾을 수 없음');
    }

    // 에러 리포트
    if (consoleErrors.length > 0) {
      console.log('\n[Console Errors]');
      consoleErrors.slice(0, 5).forEach(e => console.log('  -', e.substring(0, 100)));
    }

    if (failedImages.length > 0) {
      console.log('\n[Failed Images]');
      failedImages.slice(0, 5).forEach(url => console.log('  -', url));
    }

    console.log('\n=== 테스트 완료 ===');

  } catch (error) {
    console.error('테스트 오류:', error.message);
    await browser.close();
    throw error;
  } finally {
    await browser.close();
  }
}

testGoStop();
