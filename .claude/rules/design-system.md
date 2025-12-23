# 디자인 시스템 규칙 (Design System Rules)

> **핵심 원칙**: 기본기(Hierarchy)와 접근성(Accessibility)을 최우선으로 한다.

---

## 1. 가독성 중심의 위계 (Hierarchy)

정보성 사이트에서 가장 중요한 것은 색상이 아니라 **'정보'가 잘 보이는 것**이다.

### 타이포그래피 규칙

| 요소 | 크기 | 용도 |
|------|------|------|
| Title (제목) | 24~28px | 페이지/섹션 제목 |
| Body (본문) | 14~16px | 일반 텍스트 |
| Caption (캡션) | 12px | 보조 정보, 힌트 |

**3단계 위계를 넘지 않는다.**

```css
/* Design Tokens - Typography */
--font-size-title: 24px;
--font-size-body: 15px;
--font-size-caption: 12px;

--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-bold: 700;

--line-height-body: 1.6;  /* 본문 행간: 폰트 크기의 1.5~1.6배 */
```

### 강조 전략

- 중요 정보는 **폰트 크기를 키우기보다 '두께(Weight)'를 조절**
- 시각적 부피를 줄이면서도 눈에 띄게 함

```css
/* Good */
.important { font-weight: 600; }

/* Bad - 크기 변경은 위계 혼란 유발 */
.important { font-size: 18px; }
```

---

## 2. 명도 대비 및 접근성 (Color Accessibility)

### 4.5:1 마지노선

- **모든 읽기용 텍스트**: 배경과 명도 대비 4.5:1 이상
- **비활성화 상태**: 최소 3:1 유지
- 화이트 배경에서 `#767676`이 최저 마지노선

```css
/* Design Tokens - Colors */
--color-text-primary: #1a1a1a;      /* 주 텍스트 - 충분한 대비 */
--color-text-secondary: #666666;    /* 보조 텍스트 - 4.5:1 이상 */
--color-text-tertiary: #767676;     /* 최저 마지노선 */
--color-text-disabled: #9ca3af;     /* 비활성화 - 3:1 이상 */

--color-background: #ffffff;
--color-surface: #f8fafc;
--color-border: #e2e8f0;
```

### 컬러 통일

- 브랜드 컬러(Point Color) **1~2개로 제한**
- 시선 분산 방지

```css
--color-primary: #3B82F6;           /* 주 강조색 */
--color-primary-hover: #2563EB;
--color-secondary: #10B981;         /* 보조 강조색 (성공/확인) */
--color-error: #EF4444;             /* 에러 */
--color-warning: #F59E0B;           /* 경고 */
```

---

## 3. 컴포넌트 및 레이아웃 (Layout & Components)

### 8px 그리드 시스템

모든 간격은 **8의 배수**를 사용한다.

```css
/* Design Tokens - Spacing */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

### 여백의 그룹화

- **관련 요소**: 가깝게 (8px, 12px)
- **다른 그룹**: 멀게 (32px, 40px)
- 눈이 정보의 덩어리를 즉각 인식하게 함

### 버튼 표준화

| 요소 | 크기 | 비고 |
|------|------|------|
| 버튼 높이 | 최소 48~54px | 모바일 터치 대응 |
| 터치 타겟 | 최소 44x44pt | 실수 없는 클릭 |
| 체크박스/토글 | 20px 내외 | 정교한 느낌 |

```css
/* Button Tokens */
--button-height-sm: 36px;
--button-height-md: 44px;
--button-height-lg: 52px;

--button-padding-sm: 12px 16px;
--button-padding-md: 12px 24px;
--button-padding-lg: 16px 32px;

--border-radius-sm: 6px;
--border-radius-md: 8px;
--border-radius-lg: 12px;
```

### 레이아웃 원칙

- **불필요한 테두리/박스 제거** → 심플함 유지
- **카드 내부의 카드 지양** → 시각적 피로도 감소
- 면(Fill) 위주 디자인, 스트로크 최소화

---

## 4. 성능 최적화 (Performance)

### 이미지 포맷

| 용도 | 포맷 | 비고 |
|------|------|------|
| 아이콘 | SVG | 필수 |
| 배경/사진 | WebP | 기본 포맷 |
| 폴백 | PNG/JPG | 호환성 |

### 레이지 로딩

```jsx
// 스크롤 도달 시 로딩
<img loading="lazy" src="image.webp" alt="..." />
```

---

## 5. 상태별 디자인 (State Design)

모든 인터랙티브 요소에 다음 상태를 **필수 정의**:

| 상태 | 설명 | CSS 예시 |
|------|------|----------|
| Default | 기본 상태 | `.btn { }` |
| Hover | 마우스 오버 | `.btn:hover { }` |
| Active | 클릭 중 | `.btn:active { }` |
| Focus | 포커스 | `.btn:focus { }` |
| Disabled | 비활성화 | `.btn:disabled { }` |
| Loading | 로딩 중 | `.btn.loading { }` |

### Empty State

데이터 없음 상태는 **사용자 이탈 방지의 핵심**

```jsx
// Empty State 필수 요소
<div className="empty-state">
  <span className="empty-icon">📭</span>
  <p className="empty-title">데이터가 없습니다</p>
  <p className="empty-description">새로운 항목을 추가해보세요.</p>
  <button className="empty-action">추가하기</button>
</div>
```

---

## 6. 반응형 설계 (Responsiveness)

### 브레이크포인트

```css
/* Breakpoints */
--breakpoint-sm: 640px;   /* 모바일 */
--breakpoint-md: 768px;   /* 태블릿 */
--breakpoint-lg: 1024px;  /* 데스크탑 */
--breakpoint-xl: 1280px;  /* 대형 화면 */
```

### 모바일 우선 (Mobile First)

```css
/* 기본: 모바일 */
.container { padding: 16px; }

/* 태블릿 이상 */
@media (min-width: 768px) {
  .container { padding: 24px; }
}

/* 데스크탑 이상 */
@media (min-width: 1024px) {
  .container { padding: 32px; }
}
```

---

## 7. 디자인 토큰 파일

모든 디자인 값은 `/frontend/src/styles/tokens.css`에서 관리:

```css
:root {
  /* Typography */
  --font-size-title: 24px;
  --font-size-body: 15px;
  --font-size-caption: 12px;
  --line-height-body: 1.6;

  /* Colors */
  --color-primary: #3B82F6;
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #666666;
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-border: #e2e8f0;

  /* Spacing (8px grid) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Components */
  --button-height-md: 44px;
  --border-radius-md: 8px;
}
```

---

## 체크리스트

### 새 컴포넌트 개발 시

- [ ] 타이포그래피 3단계 이내인가?
- [ ] 명도 대비 4.5:1 이상인가?
- [ ] 8px 그리드를 따르는가?
- [ ] 버튼 높이 44px 이상인가?
- [ ] 모든 상태(Hover, Active, Disabled 등) 정의했는가?
- [ ] Empty State 디자인이 있는가?
- [ ] 이미지는 적절한 포맷(SVG, WebP)인가?
- [ ] 불필요한 테두리/중첩 카드가 없는가?
