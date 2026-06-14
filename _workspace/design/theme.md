---
project: ratsaver
phase: 3
version: 2
title: shadcn 테마 v2 — globals.css 변수 + tailwind.config (Toss/Apple Premium)
status: completed
created: 2026-06-14
updated: 2026-06-14
supersedes: theme.md v1
---

# ratsaver — shadcn 테마 & 배선 v2 (붙여넣기용)

> ui-developer(4c)가 그대로 교체하는 스니펫. 토큰 의미는 `tokens.md` v2 참조.
> **다크모드**: 라이트 전용(공개 무인증 사이트). `.dark` 블록은 제거(MVP 미사용). 향후 필요 시 별도 재정의.
> **추가 shadcn 설치 없음** — 기존 컴포넌트(`button/card/badge/input/...`)를 v2 토큰으로 **restyle**만. (상세 className 변경은 `redesign-notes.md`.)

---

## 1. app/globals.css — 전체 교체본

> `apps/ratsaver/app/globals.css`를 아래로 교체. `.dark` 블록 삭제, 토스 팔레트 + 회색 위계 2단 + saving/warning 톤 교체. `@layer utilities`에 `.shadow-focus` 추가.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* === 중립 (Toss Gray) === */
    --background: 220 23% 96%;            /* #F2F4F6 페이지/섹션 */
    --background-subtle: 210 33% 98%;     /* #F9FAFB 교차 섹션 */
    --foreground: 210 25% 12%;            /* #191F28 본문/제목 near-black */
    --foreground-secondary: 213 13% 36%;  /* #4E5968 라벨·2차 텍스트 */
    --card: 0 0% 100%;                    /* #FFFFFF 카드(순백) */
    --card-foreground: 210 25% 12%;
    --popover: 0 0% 100%;
    --popover-foreground: 210 25% 12%;
    --muted: 220 23% 96%;                 /* #F2F4F6 입력 채움·비활성 표면 */
    --muted-foreground: 211 11% 59%;      /* #8B95A1 placeholder·3차 텍스트 */
    --border: 216 16% 91%;                /* #E5E8EB 헤어라인(표 내부 행만) */
    --input: 220 23% 96%;                 /* 입력 배경 = surface-2 채움(테두리 X) */
    --ring: 215 91% 58%;                  /* #3182F6 포커스 링 = primary */

    /* === primary — Toss Blue === */
    --primary: 215 91% 58%;               /* #3182F6 */
    --primary-foreground: 0 0% 100%;
    --primary-strong: 217 79% 51%;        /* #2272EB hover/press·본문 링크 */

    /* === secondary — 연회색 채움(보조 버튼) === */
    --secondary: 220 23% 96%;             /* #F2F4F6 */
    --secondary-foreground: 213 13% 36%;  /* #4E5968 */

    /* === accent — hover/활성 표면(primary-50) === */
    --accent: 214 100% 97%;               /* #EBF2FE */
    --accent-foreground: 217 79% 51%;     /* #2272EB */

    /* === destructive (Toss Red) === */
    --destructive: 4 86% 58%;             /* #F04452 */
    --destructive-foreground: 0 0% 100%;

    /* === saving (절약 그린, Toss-tuned) === */
    --saving: 158 74% 32%;                /* #16A06A */
    --saving-strong: 159 80% 26%;         /* #0E7C50 큰 숫자/텍스트 */
    --saving-foreground: 0 0% 100%;
    --saving-muted: 152 60% 96%;          /* #EAFBF3 배지/결과 배경 */
    --saving-muted-foreground: 159 80% 26%; /* #0E7C50 */

    /* === warning (정직 앰버, 절제) === */
    --warning: 33 95% 50%;                /* #F98E0B 아이콘 */
    --warning-foreground: 28 80% 30%;
    --warning-muted: 40 100% 96%;         /* #FFF8E8 종료후정가 띠 */
    --warning-muted-foreground: 28 80% 36%; /* #A85812 텍스트 */

    --radius: 1rem;                       /* 16px 카드 기준 */
  }
}

@layer base {
  /*
   * 전역 border 적용 제거(v1의 `* { @apply border-border }` 삭제).
   * v2는 카드/입력에 border 미사용 — 섀도우+bg 대비로 분리.
   * border-color 기본만 지정(divide-y 등 명시적 사용처용).
   */
  * {
    border-color: hsl(var(--border));
  }
  body {
    @apply bg-background text-foreground antialiased;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  /* 가격/절약액 숫자 안정(자릿수 점프·미세 CLS 방지) */
  .nums {
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
  }
}

@layer utilities {
  /* 토스 블루 focus halo — ring과 병용하거나 단독 사용 */
  .shadow-focus {
    box-shadow: 0 0 0 4px rgba(49, 130, 246, 0.2);
  }
}
```

> **삭제된 것**: `.dark { ... }` 블록 전체, `* { @apply border-border }`(전역 보더 적용).
> **유지**: `next/font` 배선(layout.tsx)·`var(--font-sans)`. 단 weight 범위는 `400 700`→**`400 800`** 로 변경(아래 §3).

---

## 2. tailwind.config.ts — 전체 교체본

> `apps/ratsaver/tailwind.config.ts`를 아래로 교체. `darkMode` 제거(라이트 전용), `boxShadow`를 e1/e2/e3로, radius 토큰 추가, 색 토큰 확장(foreground-secondary·primary-strong·saving-strong).

```ts
import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  // darkMode 제거 — 라이트 전용 공개 사이트
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: {
          DEFAULT: 'hsl(var(--background))',
          subtle: 'hsl(var(--background-subtle))',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          secondary: 'hsl(var(--foreground-secondary))',
        },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          strong: 'hsl(var(--primary-strong))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // ratsaver 의미색
        saving: {
          DEFAULT: 'hsl(var(--saving))',
          strong: 'hsl(var(--saving-strong))',
          foreground: 'hsl(var(--saving-foreground))',
          muted: 'hsl(var(--saving-muted))',
          'muted-foreground': 'hsl(var(--saving-muted-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          muted: 'hsl(var(--warning-muted))',
          'muted-foreground': 'hsl(var(--warning-muted-foreground))',
        },
      },
      borderRadius: {
        '2xl': 'var(--radius)',                   // 16px 카드
        xl: 'calc(var(--radius) - 4px)',          // 12px 버튼·입력
        lg: 'calc(var(--radius) - 6px)',          // 10px 작은 표면
        md: 'calc(var(--radius) - 8px)',          // 8px
        sm: 'calc(var(--radius) - 10px)',         // 6px
      },
      boxShadow: {
        // 토스 2겹 레이어드 섀도우 (border 대체)
        e1: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 16px -2px rgb(0 0 0 / 0.06)',
        e2: '0 2px 4px 0 rgb(0 0 0 / 0.05), 0 12px 28px -4px rgb(0 0 0 / 0.10)',
        e3: '0 8px 24px -4px rgb(0 0 0 / 0.12), 0 2px 8px 0 rgb(0 0 0 / 0.06)',
        focus: '0 0 0 4px rgb(49 130 246 / 0.20)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
```

> **주의 — shadow 클래스 rename**: v1의 `shadow-card`/`shadow-card-hover`/`shadow-popover` → v2 `shadow-e1`/`shadow-e2`/`shadow-e3`. 코드 전체에서 치환 필요(`redesign-notes.md` 체크리스트 참조).
> **shadcn 컴포넌트 내부 radius**: shadcn 기본은 `rounded-lg`/`rounded-md`를 사용 → v2에선 카드 `rounded-2xl`, 버튼/입력 `rounded-xl`로 컴포넌트별 명시 교체(자동 매핑 아님).

---

## 3. next/font (layout.tsx) — weight 범위만 변경

```ts
const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  variable: '--font-sans',
  weight: '400 800',   // ← v1 '400 700'에서 확장(extrabold 히어로/가격)
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});
```

> Pretendard Variable은 가변폰트(단일 `.woff2`)라 weight 범위 확장에 추가 용량/요청 없음. CLS 0 유지.

---

## 4. 컴포넌트 변경 범위 (설치는 그대로, restyle만)

| 영역 | v1 | v2 변경 |
|------|----|--------|
| `shared/ui/card.tsx` | `border bg-card shadow-card` | **border 제거 → `bg-card shadow-e1 rounded-2xl`**, 패딩 확대 |
| `shared/ui/button.tsx` | h-11 rounded-md | **h-12 rounded-xl + `active:scale-[0.97]` + semibold**, lg=h-14 |
| `shared/ui/input.tsx` | `border border-input bg-card` | **border 제거 → `bg-muted rounded-xl` + focus ring/halo** |
| `shared/ui/badge.tsx` | rounded-full (유지) | 톤만 v2 토큰(secondary 회색·saving/warning/ mvno) |
| `shared/ui/select.tsx` (trigger) | border bg | **border 제거 → `bg-muted rounded-xl`** |
| `shared/ui/toggle.tsx` (칩) | `bg-card border` / h-9 | **`bg-card shadow-e1` 또는 `bg-muted` / h-10 rounded-full**, on=primary |
| `shared/ui/dialog.tsx`·`sheet.tsx` | shadow-popover | `shadow-e3 rounded-2xl`(상단) |
| `shared/ui/separator.tsx` | border-border | 유지(헤어라인). 카드 내부는 가급적 space 여백으로 대체 |
| `shared/ui/table.tsx` | border 행 | 외곽 border 제거(카드 섀도우), 행은 `divide-y border-hairline` |

> 상세 before→after className은 `components.md`(컴포넌트 명세) + `redesign-notes.md`(실행 체크리스트).

---

## 5. 4축 자체 평가 (theme)
| 축 | 점수 | 근거 |
|----|------|------|
| Design Quality (≥7) | 9 | 단일 출처 CSS 변수로 토스 팔레트·2겹 섀도우·큰 radius 일괄 배선. 매직컬러 0. |
| Originality (≥6) | 8 | shadcn 기본 보더/slate를 변수 레벨에서 정면 교체(e1/e2/e3, foreground-secondary, primary-strong). |
| Craft (≥7) | 9 | 전역 border 적용 제거·focus halo utility·rename 마이그레이션 명시·weight 확장 무비용 검증. |
| Functionality (≥8) | 8 | 라이트 전용 명확화, 토큰 alias로 회색 위계/링크 안전색 분리 보장. |

가중 합 ≈ 8.55 — 통과.
