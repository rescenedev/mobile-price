# 사이트 검수 보고서 (Phase 5b) — ratsaver

> 검수자: site-inspector · 검수일: 2026-06-14 · 환경: `npm run dev` (localhost:3001), gstack `/browse` 헤드리스 Chromium
> Web Vitals 주의: **dev 빌드 측정값** (preview/Workers 빌드 아님). LCP/CLS는 dev HMR 오버헤드 제외 후 측정. 절대 판정은 perf-engineer Phase 5.5(preview)에서 재확인 필요.

## 종합 점수: 82 / 100

깎인 사유: 플랜 상세 링크 **84%(101/120)가 404** — Korean-slug + `dynamicParams=false` 매칭 실패(HIGH, -15). recommend 프리셋 URL 미직렬화(MEDIUM, -3). 그 외 핵심 기능·UX·a11y·Web Vitals·보안 전부 통과.

> 주의: 검수 초반 dev 서버의 `.next` 캐시가 손상(`Cannot find module './611.js'`, 클라 청크 전수 404, 하이드레이션 실패)되어 모든 인터랙션이 죽어 있었음. `.next` 삭제 + dev 재기동으로 복구 후 정상 검수 진행. **이는 환경(dev cache drift) 문제이며 소스 결함 아님** — 재기동 후 모든 인터랙션 정상.

---

## 기능: 7 / 8 P0 유저 스토리 (US-008만 부분 실패)

| US-ID | 기능 | 상태 | 증거 |
|-------|------|------|------|
| US-001 | 조건 필터(망/데이터/가격) | **PASS** | price_max=10000 → 29건. 04b-plans-top.png |
| US-002 | 필터 결과 URL 공유 | **PASS** | `?chips=mvno_only` 새로고침 시 칩 active+99건 복원 |
| US-003 | 퀵칩 4종 원클릭 | **PASS** | 알뜰폰만→99건, +데이터무제한 AND→5건. data-state=on, aria-pressed |
| US-004 | 2~3개 비교 테이블 | **PASS** | sticky 첫열, 최저가 ✓, 종료후정가 ⚠. 06-compare.png |
| US-005 | 정직성 가격 병기 | **PASS** | 카드/상세/비교 모두 프로모가+⚠종료후정가 병기. 04b/06 |
| US-006 | 사용량 프리셋 5종→추천 | **PASS** | 매일영상→12 추천카드(점수순). 07b-recommend-result.png |
| US-007 | 절약액 계산기 | **PASS** | 45000원→월41,400/연496,800 절약(green). CLS 0. 08-calculator.png |
| US-008 | 요금제 상세(전체 스펙) | **부분 FAIL** | ASCII-slug(KT 1.5G) 정상 / **Korean-slug 101건 404** (HIGH 이슈). 05-detail.png |
| US-010 | 모바일 빠른 로딩·필터 | **PASS** | 375 단일컬럼, 칩 wrap, sticky 필터. 09-mobile-plans.png |

P0 8개 중 7개 완전 통과, US-008은 ASCII id에서만 동작(소수) → **Hard Threshold "P0 100% 동작" 위반**.

---

## Web Vitals (dev 빌드 측정 — preview 재확인 필요)

| 라우트 | LCP | INP* | CLS | 예산(PRD) | 판정 |
|--------|-----|------|-----|-----------|------|
| `/` | 232ms | 인터랙션 즉시 | 0 | LCP≤1.2s/CLS≤0.05 | **PASS** |
| `/plans` | 372ms | 칩/필터 즉시 | 0 | LCP≤1.5s/CLS≤0.1 | **PASS** |
| `/plans/[id]` | 76ms | — | 0 | LCP≤1.2s/CLS≤0.05 | **PASS** (ASCII id) |
| `/compare` | 476ms | 즉시 | 0.006 | LCP≤1.5s/CLS≤0.1 | **PASS** |
| `/recommend` | 440ms | 프리셋 즉시 | 0 | LCP≤1.5s/CLS≤0.1 | **PASS** |
| `/calculator` | 468ms | 계산 즉시 | **0 (계산 전후)** | LCP≤1.5s/CLS≤0.1 | **PASS** |

*INP: dev 환경 정밀 측정 불가. 모든 인터랙션(칩/필터/프리셋/계산) 체감 즉시 반응(클라 순수함수). preview 정밀 측정 권장.
CLS 0 달성 근거: 텍스트 로고(이미지 LCP 회피), 고정높이 결과영역(calc/recommend), next/image 미사용 정적 카드. PRD CLS 가드 설계대로 동작.

---

## 보안 / PII (Hard Threshold ③ 교차확인 — PASS)

| 항목 | 결과 |
|------|------|
| localStorage 토큰/PII | **0** — `ratsaver:seen=1`(UI플래그)만 |
| sessionStorage 토큰/PII | **0** — `ratsaver:session-started=1`만 |
| 인증 쿠키 | **0** (`[]`) — 무인증 PRD 일치 |
| 현재요금 네트워크 유출 | **0** — fee `88888` 입력 후 전 network req 검색, 노출 없음(클라 계산) |
| 보호 라우트 미보호 | **N/A** — 인증 없음, 전 페이지 공개 |

---

## 관측 (Hard Threshold ⑤ 교차확인 — PASS)

- Web Vitals 비콘: `POST /api/vitals → 204` 정상 수신.
- 이벤트 비콘: `/api/events` 배선 확인(view/apply/toggle 이벤트).

---

## 상태 표면 (loading/empty/error 3종 — PASS)

| 상태 | 존재 | 증거 |
|------|------|------|
| loading(skeleton) | ✓ | `app/plans/loading.tsx` (카드 동일높이 스켈레톤) |
| empty | ✓ **라이브 확인** | `?price_max=1`→"0개의 결과 / 조건에 맞는 요금제가 없어요 / 필터 완화" |
| error 바운더리 | ✓ | `app/plans/error.tsx` — "재시도/다시 시도" + reset onClick |
| 404 | ✓ **라이브 확인** | bad id → "페이지를 찾을 수 없습니다" + 목록 복귀 링크 |
| compare empty | ✓ | ids 없음 → "요금제를 담아 비교하세요" + 목록 링크 |

---

## 접근성 (라이브 — PASS)

- 랜드마크: `main`/`nav`/`header`/`footer`/`h1` 전부 존재(JS 확인).
- 키보드: Tab 포커스 이동 정상, focus 시 `outline: solid` + ring 클래스(focus-visible) 가시.
- 칩 `aria-pressed`, 결과 카운트 `aria-live="polite"`, 폼 `label htmlFor` 연결, 아이콘 버튼 aria-label.
- 망 badge는 텍스트(색 코드화 0) — 디자인 규칙 준수.

---

## 깨진 링크 — **FAIL (101건)**

| 유형 | 개수 | 상태 |
|------|------|------|
| 라우트 200 (/, /plans, /compare, /recommend, /calculator) | 5 | ✓ |
| ASCII-slug 상세 | 19 | ✓ (예: kt-1-5g-kt-25 → "KT 1.5G") |
| **Korean-slug 상세** | **101 / 120** | ✗ **404** (예: `uplus유모바일-100g-lgu-98` → 404) |

`/plans` 카드의 84%가 클릭 시 404 → **Hard Threshold "깨진 링크 0" 위반**. recommend/calculator의 "상세 보기" CTA도 Korean-slug 대상이면 동일 404.

---

## 이슈

### HIGH
- **[app/plans/[id] · seed-data] 플랜 상세 링크 84%(101/120) 404.**
  - 증상: `/plans` 카드 클릭 시 Korean 슬러그(`uplus유모바일-100g-lgu-98`) 상세가 "페이지를 찾을 수 없습니다"(404). ASCII 슬러그(`kt-1-5g-kt-25`)만 정상.
  - 근본 원인: `src/shared/db/seed-data.ts:105` `slugify`가 `[^a-z0-9가-힣]+`로 **한글을 슬러그에 보존** → `plan.id`에 한글 포함. `app/plans/[id]/page.tsx:15` `dynamicParams=false` + `generateStaticParams`가 한글 id를 프리렌더하지만, 요청 URL의 퍼센트 인코딩(`%EC%9C%A0...`) 디코딩 결과가 `seedPlans.find(p => p.id === id)`의 strict 비교와 불일치 → `notFound()`. (dev 로그: 한글 URL은 200 응답이나 not-found UI 렌더.)
  - 수정: (택1) ① `slugify`에서 한글 제거하고 carrier를 ASCII로 매핑(로마자/약어) → 전 id ASCII화. ② 상세 페이지에서 `id`를 `decodeURIComponent` 후 비교하거나 슬러그를 정규화(`normalize('NFC')`)해 인코딩 차이 흡수. ①을 권장(URL 안정성·공유성).
  - 담당: **edge-data-integrator**(seed id 생성) + **route-builder**([id] 라우트 param 매칭/검증).

### MEDIUM
- **[app/recommend · features/plan-recommend] 프리셋 선택이 URL searchParams에 미직렬화.**
  - 증상: "매일 영상" 프리셋 선택 → 결과는 정상이나 `location.search` 빈 값(`?preset=` 미반영). PRD §4/layouts.md는 `/recommend?preset=` 딥링크 진입을 명시.
  - 영향: 추천 결과를 URL로 공유 불가(US-002 정신과 불일치), 새로고침 시 선택 소실.
  - 수정: 프리셋 토글 시 `router.replace(?preset=video)` 직렬화 + 진입 시 `?preset=` 파싱해 초기 선택. (filter-bar 패턴 재사용)
  - 담당: **ui-developer** + **route-builder**.

### LOW
- **[/api/plans · /api/plans/[id]] dev 환경에서 500 (정보).**
  - 원인: `getCloudflareContext()`(D1/KV 바인딩)가 `next dev`에 없음 → 500. **단, 어떤 페이지도 이 API를 소비하지 않음**(전 페이지 `seedPlans` 직접 import) → 사용자 플로우 무영향. `/api/vitals`(204) 등 바인딩 불요 엔드포인트는 정상.
  - 조치: 별도 수정 불요. **API p95/렌더링 전략 검증은 `npm run preview`(Workers 런타임)에서 perf-engineer Phase 5.5가 수행**해야 함(dev에서 측정 불가).
- **[dev 환경] `.next` 캐시 손상으로 인터랙션 전체 마비 1회 발생.**
  - HMR drift로 클라 청크 전수 404 → 하이드레이션 실패. `.next` 삭제+재기동으로 복구. 소스 결함 아님이나, 재현 시 동일 복구 필요. CI/preview 빌드는 클린 빌드라 무관.

---

## 디자인 Grading (4축 — 통과)

| 축 | 점수 | 근거 |
|----|------|------|
| Design Quality (≥7) | 8 | 일관 레이아웃, sticky 필터, green 절약 강조, amber 정직성 띠. 토큰 일관. |
| Originality (≥6) | 7 | 절약 히어로·정직성 가격 병기(프로모가+종료후정가)·North Star 동선 내장. |
| Craft (≥7) | 8 | 스페이싱/타이포 정연, CLS 0, 반응형 매끄러움, 망 badge 텍스트화. |
| Functionality (≥8) | 7 | 핵심 인터랙션 전부 동작하나 상세 링크 84% 404로 감점. |

가중 ≈ 7.5 — 통과(단 Functionality는 HIGH 이슈 해결 후 9로 상향 예상).

---

## 스크린샷 (`_workspace/qa/shots/`)
- 01-landing.png · 02-calc-result.png · 04b-plans-top.png(필터+정직성카드) · 05-detail.png(상세 ASCII) · 06-compare.png(비교 테이블) · 07b-recommend-result.png · 08-calculator.png(절약 green) · 09-mobile-plans.png(375) · 03-plans-error.png(초기 .next 손상 증거)

---

## 재검수 트리거
1. HIGH(상세 링크 404) 수정 후 → Korean-slug 카드 클릭 전수 200 + h1=플랜명 재확인.
2. perf-engineer Phase 5.5: **preview 빌드**에서 LCP/INP/CLS 재측정 + `/api/plans` p95 벤치(현재 dev 측정 불가분).
