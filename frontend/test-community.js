/**
 * 커뮤니티 페이지 테스트 스크립트
 */

const puppeteer = require('puppeteer');

const TEST_URL = 'https://community.ilouli.com';

async function testCommunity() {
  console.log('=== 커뮤니티 페이지 테스트 ===\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // 콘솔 로그 캡처
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('error') || text.includes('Error') || text.includes('fail')) {
        console.log('  [Console Error]', text);
      }
    });

    // 네트워크 에러 캡처
    page.on('requestfailed', request => {
      console.log('  [Network Error]', request.url(), request.failure().errorText);
    });

    // 1. 커뮤니티 페이지 로드
    console.log('1. 커뮤니티 페이지 로드 중...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('   로드 완료\n');

    // 2. 페이지 타이틀/내용 확인
    console.log('2. 페이지 내용 확인...');
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent || 'N/A',
        h2: document.querySelector('h2')?.textContent || 'N/A',
        bodyText: document.body.innerText.substring(0, 500)
      };
    });
    console.log('   Title:', pageContent.title);
    console.log('   H1:', pageContent.h1);
    console.log('   Body preview:', pageContent.bodyText.substring(0, 200) + '...\n');

    // 3. 게시글 목록 확인
    console.log('3. 게시글 목록 확인...');
    const posts = await page.evaluate(() => {
      const postElements = document.querySelectorAll('[class*="post"], [class*="Post"], [class*="article"], [class*="item"], .community-post, .post-item, .announcement-item');
      const results = [];
      postElements.forEach(el => {
        const title = el.querySelector('[class*="title"], h3, h4')?.textContent || el.textContent.substring(0, 50);
        results.push(title.trim());
      });
      return results.slice(0, 10);
    });
    console.log('   발견된 게시글:', posts.length > 0 ? posts : '없음');

    // 4. 로딩/에러 상태 확인
    console.log('\n4. 로딩/에러 상태 확인...');
    const states = await page.evaluate(() => {
      const loading = document.querySelector('[class*="loading"], [class*="Loading"], .spinner');
      const error = document.querySelector('[class*="error"], [class*="Error"]');
      const empty = document.querySelector('[class*="empty"], [class*="Empty"], [class*="no-data"]');
      return {
        hasLoading: !!loading,
        hasError: !!error,
        hasEmpty: !!empty,
        errorText: error?.textContent || null,
        emptyText: empty?.textContent || null
      };
    });
    console.log('   로딩 중:', states.hasLoading);
    console.log('   에러:', states.hasError, states.errorText || '');
    console.log('   빈 상태:', states.hasEmpty, states.emptyText || '');

    // 5. 스크린샷 저장
    console.log('\n5. 스크린샷 저장...');
    await page.screenshot({ path: '/tmp/community-test.png', fullPage: true });
    console.log('   저장 완료: /tmp/community-test.png');

    // 6. 공지사항 탭 클릭 시도
    console.log('\n6. 공지사항 탭 확인...');
    const announcementTab = await page.$('a[href*="announcement"], button:has-text("공지"), [class*="tab"]:has-text("공지")');
    if (announcementTab) {
      await announcementTab.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: '/tmp/community-announcements.png', fullPage: true });
      console.log('   공지사항 스크린샷: /tmp/community-announcements.png');
    } else {
      console.log('   공지사항 탭을 찾을 수 없음');
    }

    console.log('\n=== 테스트 완료 ===');

  } catch (error) {
    console.error('테스트 오류:', error.message);
  } finally {
    await browser.close();
  }
}

testCommunity();
