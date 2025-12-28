/**
 * i18n 다국어 테스트 스크립트
 * 실행: node test-i18n.js
 */

const puppeteer = require('puppeteer');

// 로컬 빌드 테스트를 위해 serve 사용 또는 프로덕션 URL
const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testI18n() {
  console.log('=== i18n 다국어 테스트 시작 ===\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // 콘솔 로그 캡처
    page.on('console', msg => {
      if (msg.text().includes('[') || msg.text().includes('i18n') || msg.text().includes('language')) {
        console.log('  [Browser]', msg.text());
      }
    });

    // 1. 페이지 로드
    console.log('1. 페이지 로드 중...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('   페이지 로드 완료\n');

    // 2. 현재 언어 확인
    console.log('2. 현재 언어 상태 확인...');
    const initialLang = await page.evaluate(() => {
      return {
        i18nextLng: localStorage.getItem('i18nextLng'),
        htmlLang: document.documentElement.lang,
        navigatorLang: navigator.language
      };
    });
    console.log('   localStorage.i18nextLng:', initialLang.i18nextLng);
    console.log('   document.lang:', initialLang.htmlLang);
    console.log('   navigator.language:', initialLang.navigatorLang);
    console.log('');

    // 3. 네비게이션 텍스트 확인
    console.log('3. 네비게이션 텍스트 확인...');
    const navTexts = await page.evaluate(() => {
      const texts = [];
      document.querySelectorAll('nav a, nav button, .nav-link').forEach(el => {
        if (el.textContent.trim()) {
          texts.push(el.textContent.trim().substring(0, 30));
        }
      });
      return texts.slice(0, 10);
    });
    console.log('   네비게이션 텍스트:', navTexts);
    console.log('');

    // 4. 언어 선택기 찾기
    console.log('4. 언어 선택기 확인...');
    const langSelector = await page.$('.language-selector, .lang-trigger, [aria-label*="언어"]');
    if (langSelector) {
      console.log('   언어 선택기 발견: OK');

      // 5. 언어 선택기 클릭
      console.log('\n5. 언어 선택기 클릭...');
      await langSelector.click();
      await new Promise(r => setTimeout(r, 500));

      // 6. 영어 옵션 확인
      const langOptions = await page.evaluate(() => {
        const options = [];
        document.querySelectorAll('.lang-option, .lang-dropdown button').forEach(el => {
          options.push({
            text: el.textContent.trim(),
            class: el.className
          });
        });
        return options;
      });
      console.log('   언어 옵션:', langOptions);

      // 7. 영어로 변경
      console.log('\n6. 영어로 변경 시도...');
      const englishOption = await page.$('.lang-option:first-child, .lang-dropdown button:first-child');
      if (englishOption) {
        await englishOption.click();
        await new Promise(r => setTimeout(r, 1000));

        // 8. 변경 후 확인
        console.log('\n7. 언어 변경 후 확인...');
        const afterLang = await page.evaluate(() => {
          return {
            i18nextLng: localStorage.getItem('i18nextLng'),
            htmlLang: document.documentElement.lang
          };
        });
        console.log('   localStorage.i18nextLng:', afterLang.i18nextLng);

        const afterNavTexts = await page.evaluate(() => {
          const texts = [];
          document.querySelectorAll('nav a, nav button, .nav-link').forEach(el => {
            if (el.textContent.trim()) {
              texts.push(el.textContent.trim().substring(0, 30));
            }
          });
          return texts.slice(0, 10);
        });
        console.log('   변경 후 네비게이션:', afterNavTexts);
      }
    } else {
      console.log('   언어 선택기를 찾을 수 없음');
    }

    // 9. 스크린샷 저장
    console.log('\n8. 스크린샷 저장...');
    await page.screenshot({ path: '/tmp/i18n-test.png', fullPage: false });
    console.log('   저장 완료: /tmp/i18n-test.png');

    console.log('\n=== 테스트 완료 ===');

  } catch (error) {
    console.error('테스트 오류:', error.message);
  } finally {
    await browser.close();
  }
}

testI18n();
