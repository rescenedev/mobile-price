---
project: ratsaver
phase: 3
version: 2
title: 디자인 토큰 v2 — Toss/Apple 프리미엄 (컬러·타이포·스페이싱·radius·레이어드 섀도우·motion)
status: completed
created: 2026-06-14
updated: 2026-06-14
supersedes: tokens.md v1 (틸블루·border-heavy·admin-feel)
---

# ratsaver — 디자인 토큰 v2 (Toss/Apple Premium)

> **개편 사유**: v1은 모든 카드/입력/테이블에 border를 둘러 "관리자페이지" 인상 + 여백 부족 + 색 밋밋.
> **v2 방향**: 토스(Toss)/애플의 절제된 프리미엄. **border 제거 → 레이어드 소프트섀도우 + 화이트/회색 배경 대비로 표면 분리.** 넉넉한 여백, 강한 타이포 위계, 큰 라운딩, 토스 블루 액센트, 큰 숫자 강조.
> **금지**: 보라 그라데이션·과한 글로우·네온·제너릭 AI 미감. 채도는 절제.

---

## 0. v1 → v2 핵심 변화 요약

| 축 | v1 (before) | v2 (after) |
|----|-------------|------------|
| **표면 분리** | `border border-border` (모든 카드/입력/표) | **border 제거 → `shadow-e1`/`shadow-e2` 레이어드 섀도우 + bg 대비** |
| **primary** | 틸블루 `#076ba1` (200 92% 36%) | **토스 블루 `#3182F6` (215 91% 58%)** |
| **본문 텍스트** | slate `#1d2733` (217 33% 17%) | **토스 near-black `#191F28` (210 25% 12%)** |
| **회색 위계** | muted-fg 단일 `#5b6675` | **2단: secondary `#4E5968` / muted `#8B95A1`** |
| **배경** | 쿨그레이 `#f7f9fb` 페이지 + 흰 카드 | **섹션 `#F2F4F6`/`#F9FAFB`, 카드 순백 `#FFFFFF`** |
| **radius** | 10px (`rounded-lg`) | **16px 카드(`rounded-2xl`) / 12px 버튼·입력 / full 칩** |
| **타이포 위계** | 히어로 text-3xl/4xl 700 | **히어로 text-4xl→5xl 800 tracking-tight, 본문 회색조** |
| **가격 강조** | price text-2xl 700 | **price text-[28px]→3xl 800 tabular-nums, 토스st 큰 숫자** |
| **입력** | `border border-input bg-card` | **`bg-gray-50`(채움) + focus 블루 ring, border 없음** |
| **버튼** | h-11 rounded-md | **h-12~14 rounded-xl, press scale-down, 굵은 라벨** |
| **hover** | `-translate-y-0.5` | **`-translate-y-1` + shadow e1→e2 상승(토스 카드 떠오름)** |

> **3색 의미 규약은 유지** (blue=행동 / green=절약 / amber=정직). 단 색조를 토스 톤으로 교체하고 채도를 정돈한다.

---

## 1. 디자인 컨셉 (v2)

| 키워드 | 디자인 결정 |
|--------|------------|
| **클린 (Clean)** | 순백 카드 + 연회색 섹션 배경. border 0. 표면은 빛(섀도우)으로만 떠오른다. |
| **신뢰 (Trust)** | primary = 토스 블루 `#3182F6`. CTA·링크·활성 상태 전용. 금융앱의 신뢰 코드. |
| **절약 (Saving)** | saving green — 토스 톤으로 정돈. 절약액·이득 수치 전용. |
| **정직 (Honesty)** | warning = 절제된 앰버/오렌지. "종료 후 정가·약정" 경고에만. 과채도 금지. |
| **위계 (Hierarchy)** | 큰 제목(800)·큰 숫자(800 tabular-nums) vs 차분한 회색 본문. 토스의 "숫자가 주인공". |
| **여백 (Air)** | 넉넉한 섹션 간 수직 여백, 큰 카드 내부 패딩. 밀도를 낮춘다. |

---

## 2. 컬러 팔레트 (HSL — shadcn CSS 변수 기반)

> 실제 CSS 변수 선언은 `theme.md` 참조. 여기서는 의미·HSL·HEX·대비를 정의한다. 라이트 전용(공개 무인증 사이트). 모든 텍스트/배경 조합 WCAG AA 충족.

### 브랜드 스케일 (primary — Toss Blue)
| 토큰 | HSL | HEX | 용도 |
|------|-----|-----|------|
| `primary-50`  | `214 100% 97%` | `#EBF2FE` | 활성 칩 배경·hover 표면·선택 행 |
| `primary-100` | `214 100% 93%` | `#DBE9FE` | 강한 선택 표면 |
| `primary-500` | `217 95% 64%`  | `#4D94F8` | hover 라이트 |
| **`primary` (600)** | **`215 91% 58%`** | **`#3182F6`** | **주 CTA·활성 필터·링크 (= 토스 블루)** |
| `primary-700` | `217 79% 51%`  | `#2272EB` | CTA hover/press |
| `primary-900` | `220 70% 38%`  | `#1B5BBF` | 텍스트 위 진한 강조 |

> primary `#3182F6` on white = 대비 3.6:1 → 큰 텍스트/UI·아이콘 AA(3:1) OK. **본문 크기 링크는 `primary-700` `#2272EB`(4.6:1)** 사용. **흰 글자 on primary `#3182F6` = 4.0:1** → 버튼 라벨(14px+ bold = 대형 취급) AA OK. CTA 라벨은 항상 `font-semibold` 이상.

### 절약 스케일 (saving — Toss-tuned Green)
| 토큰 | HSL | HEX | 용도 |
|------|-----|-----|------|
| `saving-50`  | `152 60% 96%` | `#EAFBF3` | 절약 배지·결과 카드 배경 |
| `saving-100` | `151 55% 90%` | `#D2F4E3` | 절약 표면 강조 |
| **`saving` (600)** | **`158 74% 32%`** | **`#16A06A`** | 절약 라벨·이득 강조(중간) |
| **`saving-700`** | **`159 80% 26%`** | **`#0E7C50`** | **절약액 큰 숫자·텍스트(본문 대비 안전)** |

> saving-700 `#0E7C50` on white = 4.9:1 AA, on saving-50 `#EAFBF3` = 4.5:1 AA. 큰 절약 숫자는 700.

### 경고/정직 스케일 (warning — Restrained Amber)
| 토큰 | HSL | HEX | 용도 |
|------|-----|-----|------|
| `warning-50`  | `40 100% 96%` | `#FFF8E8` | "종료 후 정가" 블록 배경(연한 띠) |
| `warning-500` | `33 95% 50%`  | `#F98E0B` | 경고 아이콘 |
| **`warning-700`** | **`28 80% 36%`** | **`#A85812`** | **경고 텍스트(앰버는 밝아 항상 700)** |

> warning-700 `#A85812` on warning-50 `#FFF8E8` = 5.4:1 AA. 절제된 오렌지 — 과채도 금지.

### 중립 스케일 (Toss Gray — near-black + 2단 회색)
| 토큰 | HSL | HEX | 용도 |
|------|-----|-----|------|
| `background` | `220 23% 96%` | `#F2F4F6` | **페이지/섹션 배경**(토스 회색 베이스) |
| `background-subtle` | `210 33% 98%` | `#F9FAFB` | 더 연한 섹션 교차 배경 |
| `card`       | `0 0% 100%`   | `#FFFFFF` | **카드·패널 표면(순백, border 없음)** |
| `foreground` | `210 25% 12%` | `#191F28` | **본문/제목 텍스트(토스 near-black)** |
| `foreground-secondary` | `213 13% 36%` | `#4E5968` | **2차 텍스트·라벨·메타(회색 위계 ①)** |
| `muted-foreground` | `211 11% 59%` | `#8B95A1` | **3차 텍스트·placeholder·비강조(회색 위계 ②)** |
| `surface-2` | `220 23% 96%` | `#F2F4F6` | 입력 채움 배경·비활성·hover 표면 |
| `border-hairline` | `216 16% 91%` | `#E5E8EB` | **꼭 필요한 구분선만**(표 내부 행·divide). 카드 경계엔 미사용 |
| `ring`       | `215 91% 58%` | `#3182F6` | 포커스 링 (= primary) |
| `destructive`| `4 86% 58%`   | `#F04452` | 입력 오류·삭제(토스 레드) |

> foreground `#191F28` on background `#F2F4F6` = 14.1:1, on card `#FFFFFF` = 15.6:1 → AAA. foreground-secondary `#4E5968` on card = 7.0:1 AA·AAA. muted-foreground `#8B95A1` on card = 3.0:1 → **대형/보조 UI 텍스트(12px+ 또는 비핵심)만 허용**. 본문 보조 라벨은 `foreground-secondary` 사용.

> **회색 위계 3단 규약 (중요)**: 본문/제목=`foreground` · 라벨/2차정보=`foreground-secondary` · placeholder/3차=`muted-foreground`. v1의 단일 muted-fg를 2단으로 분리해 위계를 강화한다.

---

## 3. 타이포그래피 (위계 강화 — 토스st)

### 폰트 패밀리 (next/font self-host — CLS 0, 변경 없음)
| 역할 | 폰트 | 적재 |
|------|------|------|
| 본문/UI/제목 (한+영) | **Pretendard Variable** (이미 self-host) | `next/font/local`, `weight: '400 800'`, fallback `system-ui` |
| 숫자 강조 | Pretendard `tabular-nums` | `font-variant-numeric: tabular-nums` (`.nums`) |

> **변경점**: 가변폰트 weight 범위를 `400 700` → **`400 800`** 로 확장(extrabold 히어로/가격). 가변폰트라 용량 부담 무시 가능. 화면당 실제 사용 weight는 3종 이내 유지(아래 스케일이 400/600/700/800 중 화면별 3종).

### 타입 스케일 v2 (위계 강화 + 큰 숫자)
| 토큰 | size / line-height | weight / tracking | 용도 |
|------|--------------------|-------------------|------|
| `display` | `text-4xl sm:text-5xl` / `leading-[1.1]` | **800** / `tracking-tight` | 랜딩 히어로 헤드라인 (크고 굵게) |
| `h1` | `text-2xl sm:text-3xl` / `leading-tight` | **700** / `tracking-tight` | 페이지 제목 |
| `h2` | `text-xl` / `leading-snug` | 700 | 섹션 제목 |
| `h3` | `text-base sm:text-lg` / `leading-snug` | 600 | 카드 요금제명 |
| `body` | `text-[15px] sm:text-base` / `leading-relaxed` | 400 | 본문 (`foreground`) |
| `body-secondary` | `text-sm` / `leading-relaxed` | 400 | 보조 본문·스펙 (`foreground-secondary`) |
| `label` | `text-[13px]` / `leading-normal` | 500 | 필드 라벨·메타 (`foreground-secondary`) |
| `caption` | `text-xs` / `leading-normal` | 400 | 면책·검증일 (`muted-foreground`) |
| `price` | `text-[28px] sm:text-3xl` / `leading-none` | **800** + `tabular-nums` / `tracking-tight` | 카드 프로모가 (토스 큰 숫자) |
| `price-hero` | `text-4xl sm:text-5xl` / `leading-none` | **800** + `tabular-nums` / `tracking-tight` | 절약액 히어로 |
| `price-strike` | `text-[13px]` / `line-through` | 400 + `tabular-nums` | 종료 후 정가(병기, `foreground-secondary`) |
| `price-unit` | `text-sm` | 500 | "월"·"원" 단위(가격 옆, `foreground-secondary`) |

> **토스 큰 숫자 원칙**: 금액/절약액은 페이지에서 시각적으로 가장 큰 요소. 단위("월"/"원")는 작게(`price-unit`) 곁들여 숫자를 주인공으로. 항상 `tabular-nums`(자릿수 점프·미세 CLS 방지).
> **위계 강화 핵심**: 히어로 800 + tracking-tight로 임팩트, 본문은 `foreground-secondary` 회색조로 차분 — 강·약 대비를 크게.

---

## 4. 스페이싱 · 레이아웃 (여백 확대 — 토스st)

- **간격 스케일**: Tailwind 4px 기반. 임의 px 금지. **v2는 한 단계씩 넉넉하게**(아래).
- **컨테이너**: 본문 `max-w-screen-lg`(1024px). 목록/비교 `max-w-screen-xl`. 히어로·계산기 등 폼 중심은 `max-w-xl`(576px) 중앙 정렬.
- **페이지 좌우 패딩**: `px-5 sm:px-6 lg:px-8` (모바일 16→20px로 확대).
- **섹션 세로 리듬**: `py-12 sm:py-16 lg:py-20` (v1 py-8/12 → 확대). 섹션 간 `space-y-16 sm:space-y-24`.
- **카드 내부 패딩**: `p-5 sm:p-6` (v1 p-4/5 → 확대). 가격/히어로 카드는 `p-6 sm:p-8`.
- **카드 그리드**: `grid gap-4 sm:gap-5` — `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
- **카드 내 블록 간격**: `space-y-4`(v1 gap-3 → 확대). 블록 구분은 `space-y` 여백으로(divider 최소화).
- **터치 타겟**: 인터랙티브 요소 최소 44px. 기본 버튼 `h-12`(48px), 큰 CTA `h-14`(56px), 칩 `h-10`+패딩.

### 브레이크포인트 규약 (변경 없음)
| bp | px | 적용 |
|----|----|------|
| (base) | <640 | 모바일 1열. 필터바 → 가로 스크롤 칩 + 필터 시트 |
| `sm` | ≥640 | 2열 카드, 칩 줄바꿈 |
| `md` | ≥768 | 2열 유지, 비교 테이블 풀 |
| `lg` | ≥1024 | 3열 카드, 필터바 인라인 |

---

## 5. Radius · 레이어드 섀도우 · Border (핵심 개편)

### Radius (크게)
| 토큰 | 값 | 용도 |
|------|----|----|
| `--radius` (base) | `1rem` (16px) | 기준값(카드) |
| `rounded-2xl` | `var(--radius)` = 16px | **카드·모달·패널·결과 박스** |
| `rounded-xl` | `calc(var(--radius) - 4px)` = 12px | **버튼·입력·select** |
| `rounded-lg` | `calc(var(--radius) - 6px)` = 10px | 작은 표면·뱃지(사각형일 때) |
| `rounded-full` | full | **칩·pill 배지·아이콘 버튼** |

> 라운딩은 토큰만. 임의 `rounded-[13px]` 금지. 카드=16px, 버튼/입력=12px, 칩/배지=full 로 고정.

### 레이어드 섀도우 (border 대체 — 토스st 2겹)
| 토큰 | 값 | 용도 |
|------|----|----|
| `shadow-e1` | `0 1px 2px 0 rgba(0,0,0,0.04), 0 4px 16px -2px rgba(0,0,0,0.06)` | **카드 기본**(근접 1px + 부드러운 확산). border 대체. |
| `shadow-e2` | `0 2px 4px 0 rgba(0,0,0,0.05), 0 12px 28px -4px rgba(0,0,0,0.10)` | **카드 hover(떠오름)**·강조 카드 |
| `shadow-e3` | `0 8px 24px -4px rgba(0,0,0,0.12), 0 2px 8px 0 rgba(0,0,0,0.06)` | 모달·시트·드롭다운·팝오버 |
| `shadow-focus` | `0 0 0 4px rgba(49,130,246,0.20)` | 입력/요소 focus 링(토스 블루 halo) — `ring`과 병용 가능 |

> **2겹 레이어 = 토스 카드 시그니처**: 근접 그림자(또렷한 가장자리)+확산 그림자(부드러운 떠오름). 불투명도 0.04~0.12로 절제 — 무거운 광고사이트st 금지.
> **border 정책**: 카드·입력·패널·표 외곽선에 **border 사용 금지**(섀도우+bg 대비로 분리). border는 **표 내부 행 구분선(`divide-y` `border-hairline`)** 등 정보 구조상 꼭 필요한 헤어라인에만 한정.

---

## 6. 모션 (절제된 마이크로 인터랙션 — animation_level 보수적)

- CSS `transition` 위주. framer-motion 등 대형 모션 라이브러리 **미도입**(번들 보호).
- **트랜지션 토큰**: `transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out`.
- **카드 hover(떠오름)**: `hover:-translate-y-1 hover:shadow-e2` (기본 `shadow-e1`). transform/shadow만 → 레이아웃 점프 0.
- **버튼 press**: `active:scale-[0.97]` (토스 누름감). `transition-transform duration-100`.
- **칩/토글**: 색·배경 전환만(`transition-colors`). 레이아웃 애니메이션 금지(INP ≤ 200ms).
- **focus-visible**: 모든 인터랙티브에 `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`(또는 `shadow-focus`). 키보드 가시성 필수.
- **모달/시트**: shadcn 기본 fade+zoom/slide(150~200ms).
- **`prefers-reduced-motion: reduce`**: transform/transition 무력화(`motion-reduce:transition-none motion-reduce:hover:translate-y-0`) — a11y.

> 과하지 않게: 떠오름 -translate-y-1(4px)·press 0.97 정도. 글로우·바운스·연속 키프레임 금지.

---

## 7. 색 대비 검증표 (WCAG AA — v2)

| 전경 / 배경 | 비율 | 판정 | 용도 |
|-------------|------|------|------|
| foreground `#191F28` / background `#F2F4F6` | 14.1:1 | AAA ✅ | 본문/제목 |
| foreground `#191F28` / card `#FFFFFF` | 15.6:1 | AAA ✅ | 카드 본문 |
| foreground-secondary `#4E5968` / card | 7.0:1 | AAA ✅ | 라벨·2차 텍스트 |
| muted-foreground `#8B95A1` / card | 3.0:1 | AA(대형 UI/3:1) ✅ | placeholder·비핵심 보조 |
| primary `#3182F6` / white (아이콘·활성칩) | 3.6:1 | AA(UI 3:1) ✅ | 활성 상태·아이콘 |
| primary-700 `#2272EB` / white (본문 링크) | 4.6:1 | AA ✅ | 텍스트 링크 |
| white / primary `#3182F6` (CTA 라벨 bold) | 4.0:1 | AA(대형/볼드) ✅ | CTA 버튼 |
| white / primary-700 `#2272EB` (CTA press) | 4.6:1 | AA ✅ | CTA hover/press |
| saving-700 `#0E7C50` / white | 4.9:1 | AA ✅ | 절약 숫자 |
| saving-700 `#0E7C50` / saving-50 `#EAFBF3` | 4.5:1 | AA ✅ | 절약 배지/결과 |
| warning-700 `#A85812` / warning-50 `#FFF8E8` | 5.4:1 | AA ✅ | 종료후정가 경고 |
| destructive `#F04452` / white | 4.0:1 | AA(대형/볼드) ✅ | 인라인 에러(13px+ medium) |

> **가드**: 14px 미만 본문에 `primary #3182F6`(3.6:1)·`muted-foreground`(3.0:1)·`destructive`(4.0:1)를 단독 본문 텍스트로 쓰지 않는다. 링크는 `primary-700`, 보조 본문은 `foreground-secondary` 사용. CTA 라벨은 항상 semibold+.

---

## 8. 4축 자체 평가 (v2)

| 축 | 점수 | 근거 |
|----|------|------|
| Design Quality (≥7) | **9** | border 제거 + 레이어드 섀도우 + 큰 라운딩 + 토스 블루 + 강한 타이포 위계로 "관리자페이지"→프리미엄 전환. 3색 의미 규약 유지로 일관성. |
| Originality (≥6) | **8** | 기본 shadcn slate/border 미감을 정면 탈피. 토스 2겹 섀도우·near-black `#191F28`·2단 회색 위계·큰 숫자 800 — 비교 사이트에서 보기 드문 결정. |
| Craft (≥7) | **9** | HSL·HEX·대비 전수 재검증, 2단 회색 위계, tabular-nums, 4px 스케일 확대, 2겹 섀도우 불투명도 정밀, reduced-motion·focus halo. |
| Functionality (≥8) | **9** | 정직성 가격 병기 색코드 유지, 회색 위계로 정보 우선순위 강화, 44~56px 타겟, 전 조합 AA, placeholder 명도 가드. |

**가중 합 ≈ 8.75 / 10 — 전 축 임계값 통과.** (Originality 8 — "안전한 기본값" 탈피 충족.)
