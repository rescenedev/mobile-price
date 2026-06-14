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
        'card-elevated': 'hsl(var(--card-elevated))',
        // 유일한 비비드 액센트 — 가격 전용("가격만 튀게")
        price: {
          DEFAULT: 'hsl(var(--price))',
          foreground: 'hsl(var(--price-foreground))',
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
        // 다크 슬레이트 — 흰 글로우 0. 깊은 검정 그림자로만 표면 분리(약하게).
        e1: '0 1px 2px 0 rgb(0 0 0 / 0.30), 0 4px 16px -4px rgb(0 0 0 / 0.36)',
        e2: '0 2px 6px 0 rgb(0 0 0 / 0.36), 0 12px 28px -6px rgb(0 0 0 / 0.48)',
        e3: '0 8px 24px -6px rgb(0 0 0 / 0.55), 0 2px 8px 0 rgb(0 0 0 / 0.36)',
        focus: '0 0 0 4px hsl(158 64% 52% / 0.25)',
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
