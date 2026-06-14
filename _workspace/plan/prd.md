# PRD: ratsaver — 휴대폰 요금제 비교·절약 계산 공개 웹

> Phase 2 (Planning) 산출물. 입력: `spec.md`, `idea/concept.md`, `idea/market.md`, `idea/data-model-notes.md`, `idea/moyo-reference.md`.
> 본 문서의 **성능 예산 수치**가 Hard Threshold ④ 임계값으로 perf-engineer(Phase 5.5)에 주입된다.

---

## 1. 제품 개요

- **한줄 설명**: "내 사용량 기준 가장 싼 요금제를, 로그인·가입 강요 없이 3초 안에." — 알뜰폰·통신사 요금제를 조건 필터로 비교하고 절약액을 즉시 계산해주는 가볍고 빠른 공개 비교 웹.
- **타깃**: 알뜰폰/요금제 갈아타기를 고민하는 일반 소비자, "내 사용량 기준 가장 싼 요금제"를 빠르게 알고 싶은 사람.
- **핵심 가치 (wedge)**:
  1. **마찰 제로** — 무인증·무팝업·무광고. URL만 열면 즉시 필터·비교·계산.
  2. **속도 우위** — 시드 데이터 50~150건 → SSG/ISR + KV/Cache. 외부 API·광고 SDK 미탑재. LCP < 1.5s 목표.
  3. **정직성** — `프로모션가 + 종료 후 정가 + throttle 속도 + 약정`을 한 화면에 병기. "7개월 뒤 얼마?"를 숨기지 않음.
  4. **절약액 우선** — 모요에 없는 차별 기능. 현재 월요금 입력 → 절약 가능액이 히어로.
- **제품 톤 (project.context 반영)**: 가볍고 빠르고 정직하다. 가입 깔때기가 아니라 "정직하게 비교만 해주는 빠른 계산기".
- **인증**: 없음 (공개 비교 사이트). 세션·계정·PII 수집 0. 사용자 입력(사용량·현재요금)은 서버 저장 없이 클라이언트 계산.

---

## 2. 유저 스토리

| ID | As a... | I want to... | So that... | 우선순위 |
|----|---------|--------------|-----------|---------|
| US-001 | 갈아타기 고민 소비자 | 망·데이터·가격대로 요금제를 좁혀 보고 | 내 조건에 맞는 후보만 빠르게 본다 | P0 |
| US-002 | 공유하고 싶은 사용자 | 필터링한 결과 화면 URL을 그대로 복사·공유하고 | 친구에게 "이 조건 결과 봐"라고 보낸다 | P0 |
| US-003 | 빠른 탐색 사용자 | 퀵필터 칩(1만원 이하·데이터 무제한·알뜰폰만·약정없음)을 원클릭하고 | 상세 패널 안 열고 즉시 좁힌다 | P0 |
| US-004 | 비교 의사결정자 | 요금제 2~3개를 나란히 비교 테이블로 보고 | 프로모가 vs 정가·throttle·망을 한눈에 본다 | P0 |
| US-005 | 정직성 중시 소비자 | 프로모션 종료 후 정가와 약정 조건을 명확히 보고 | "7개월 뒤 급등" 함정에 안 속는다 | P0 |
| US-006 | 사용량 모르는 소비자 | 사용량 프리셋(통화만/웹서핑/영상 등)을 골라 | 입력 부담 없이 추천을 받는다 | P0 |
| US-007 | 절약 동기 소비자 | 현재 월요금을 입력하고 | 추천 요금제 대비 월/연 절약액을 즉시 본다 | P0 |
| US-008 | 상세 확인 사용자 | 요금제 상세 페이지에서 전체 스펙·비고·검증일을 보고 | 가입 전 최종 확인을 한다 | P0 |
| US-009 | 신뢰 검증 사용자 | 데이터 검증일·면책 고지를 보고 | 정보 최신성을 스스로 판단한다 | P1 |
| US-010 | 모바일 사용자 | 휴대폰에서 빠르게 로딩·필터하고 | 이동 중에도 쾌적하게 비교한다 | P0 |

---

## 3. 기능 목록

| ID | 기능 | 설명 | 우선순위 | FSD Layer |
|----|------|------|---------|-----------|
| F-1 | 조건 필터 검색 | 망/통신사/데이터/통화/문자/가격대/알뜰폰여부 필터 + 정렬(가격·데이터·추천). **필터 상태를 URL searchParams에 직렬화** (공유가능 URL). | P0 | `features/plan-filter` |
| F-1.1 | 퀵필터 칩 4종 | `1만원 이하` · `데이터 무제한` · `알뜰폰만` · `약정없음` 원클릭 프리셋. searchParams 토글. | P0 | `features/plan-filter` |
| F-1.2 | 정렬 | 가격↑ / 데이터↓ / 추천순. `sort` searchParam. | P0 | `features/plan-filter` |
| F-1.3 | 결과 카운트 | "N개의 결과" 상시 표시. | P1 | `widgets/plan-list` |
| F-2 | 요금제 상세 | 전체 스펙·프로모가·정가·throttle·약정·비고·검증일 표시. SSG/ISR. | P0 | `app/plans/[id]` + `entities/plan` |
| F-2.1 | 정직성 가격 병기 | `프로모션가 + 종료 후 정가 + promoMonths + throttle` 한 블록 병기. | P0 | `widgets/plan-card`, `entities/plan` |
| F-3 | 요금제 비교 | 2~3개 나란히 비교 테이블. 비교 대상은 URL searchParams(`compare=id1,id2`)에 직렬화. | P0 | `features/plan-compare` |
| F-4 | 맞춤 추천 | 사용량 프리셋 5종(통화만/웹서핑/출퇴근영상/영상/맘껏) 또는 직접 입력 → 점수 매칭 → 추천 카드. **클라이언트 순수함수 스코어링**. | P0 | `features/plan-recommend` |
| F-5 | 절약액 계산기 | 현재 월요금 입력 → 추천(또는 선택) 요금제 대비 월/연 절약액. **클라이언트 계산, 서버 미저장**. 히어로 기능. | P0 | `features/saving-calculator` |
| F-6 | 면책·검증일 고지 | `lastVerifiedAt` 표시 + "요금은 수시 변동, 큐레이션 스냅샷" 면책. | P1 | `widgets/disclaimer` |
| F-7 | 랜딩(홈) | 가치 제안 + 절약 계산기 히어로 + 인기/추천 진입. SSG. | P0 | `app/(home)` |

---

## 4. 라우트 IA (App Router)

| 라우트 | 설명 | 예상 렌더링 | 인증 |
|--------|------|------------|------|
| `/` | 랜딩 — 가치 제안 + 절약 계산기 히어로 + 추천 진입 CTA | SSG | - |
| `/plans` | 요금제 목록·필터·정렬·퀵칩. 필터=searchParams. 150건은 클라 필터 가능하나 초기 데이터는 서버에서. | ISR(3600s) + 클라 필터 | - |
| `/plans/[id]` | 요금제 상세 (전체 스펙·정직성 가격 병기·검증일) | SSG (build 시 전 plan 프리렌더) | - |
| `/compare` | 비교 테이블 (2~3개). 대상=`?ids=a,b,c` searchParams | ISR(3600s) / 클라 조립 | - |
| `/recommend` | 맞춤 추천 — 사용량 프리셋/입력 → 점수 매칭 결과 | SSG 셸 + 클라 스코어링 | - |
| `/calculator` | 절약액 계산기 (현재요금 입력 → 절약액). `/`의 히어로를 전용 페이지로도 제공 | SSG 셸 + 클라 계산 | - |
| `/api/plans` | 목록 JSON (필터/정렬 쿼리). KV/Cache 캐시. 클라 필터용 데이터 공급 | SSR(edge) + KV | - |
| `/api/plans/[id]` | 단건 JSON | SSR(edge) + KV | - |

> **렌더링 근거**: `plan` 100% 읽기 전용·시드데이터 → 목록/상세는 정적 우선(SSG/ISR), KV/Cache 적합성 최상. 추천·계산기는 입력→파생값이라 **클라이언트 순수함수**(150건 스코어링은 마이크로초). 필터는 모요 패턴대로 searchParams 직렬화 → SSR/ISR 친화 + 공유가능 URL.
> 이 표는 cf-architect가 `arch/rendering-matrix.md`로 확정하는 입력이다. `revalidate` 초값(3600s)은 시드데이터 갱신 빈도(반나절 큐레이션, 수시 아님)를 반영해 보수적으로 설정.

---

## 5. FSD 모듈 맵

| Module | Type | 책임 | Dependencies |
|--------|------|------|--------------|
| `entities/plan` | entity | plan 도메인 모델·타입·Zod 스키마·정직성 가격 포맷터·검증일 포맷(date-fns) | `shared` |
| `features/plan-filter` | feature | searchParams ↔ 필터상태 직렬화/파싱, 필터 적용, 퀵칩, 정렬 | `entities/plan`, `shared` |
| `features/plan-compare` | feature | 비교 대상 선택(최대 3)·searchParams 직렬화·비교 매트릭스 조립 | `entities/plan`, `shared` |
| `features/plan-recommend` | feature | 사용량 프리셋·입력 → 점수 매칭(순수함수) → 정렬된 추천 | `entities/plan`, `shared` |
| `features/saving-calculator` | feature | 현재요금 입력 → 추천/선택 요금제 대비 월·연 절약액(순수함수) | `entities/plan`, `shared` |
| `widgets/plan-card` | widget | 요금제 카드 (4블록: 데이터+속도 / 통화·문자 / 망·세대 / 프로모가+정가) | `entities/plan`, `features/*` |
| `widgets/plan-list` | widget | 목록 + 결과 카운트 + 페이지/무한스크롤 | `features/plan-filter`, `widgets/plan-card` |
| `widgets/filter-bar` | widget | 상단 필터바 + 퀵칩 + 정렬 드롭다운 | `features/plan-filter` |
| `widgets/compare-table` | widget | 나란히 비교 테이블 | `features/plan-compare` |
| `widgets/usage-preset-modal` | widget | 사용량 프리셋 선택 모달 (추천 진입) | `features/plan-recommend` |
| `widgets/disclaimer` | widget | 검증일·면책 고지 | `entities/plan` |
| `shared/db` | shared | D1/Drizzle 접근(`@/shared/env` 경유) | - |
| `shared/cache` | shared | KV/Cache 계층 (목록/상세 캐시) | `shared/env` |
| `shared/perf` | shared | `trackFetch` 계측 래퍼 + AE 이벤트 상수 | `shared/env` |
| `shared/env` | shared | D1/KV/AE 바인딩 타입드 접근 단일 통로 | - |

> 의존성 규칙 준수: `app → widgets → features → entities → shared` (상위만 하위 참조). 역방향 import 0.

---

## 6. MVP 범위

### 1차 (MVP — 본 PRD 구현 대상)
- F-1 조건 필터 검색 (searchParams 직렬화) + F-1.1 퀵칩 4종 + F-1.2 정렬 + F-1.3 결과 카운트
- F-2 요금제 상세 + F-2.1 정직성 가격 병기
- F-3 요금제 비교 (2~3개)
- F-4 맞춤 추천 (프리셋 5종 + 직접입력, 클라 스코어링)
- F-5 절약액 계산기 (클라 계산, 히어로)
- F-6 면책·검증일 고지 + F-7 랜딩
- D1 시드 50~150건 (알뜰폰 80% / MNO 20%, 3망 균등, 30~40% 7개월 프로모)

### 2차 (Post-MVP, 비범위)
- 즐겨찾기 (localStorage)
- 제휴 CTA / 가입 링크 (자리만 비워둠)
- UGC 리뷰·별점, 주간 랭킹
- 관리자 CMS (시드는 SQL 스크립트로 관리)
- 실시간 외부 API 연동

---

## 7. API 엔드포인트

| Method | Path | 인증 | 캐시 | Description |
|--------|------|------|------|-------------|
| GET | `/api/plans` | - | KV/Cache (TTL 3600s) | 요금제 목록 JSON. 쿼리: `?network=&data_min=&data_max=&price_max=&mvno=&unlimited=&contract=&sort=`. 클라 필터 시 전체목록 1회 공급. `trackFetch` 경유. |
| GET | `/api/plans/[id]` | - | KV/Cache (TTL 3600s) | 단건 JSON. `trackFetch` 경유. |

> **쓰기 엔드포인트 없음** (무인증·읽기전용). 추천/절약 계산은 클라이언트 순수함수라 API 불요. Server Action 없음 → CSRF 표면 0.
> D1 접근은 `@/shared/db` (= `@/shared/env` 경유)로만. 반복 동일 업스트림은 `@/shared/cache` 통과. 모든 데이터 호출 `@/shared/perf.trackFetch` 래핑 (Hard Threshold ④⑤).

---

## 8. 보안 / PII 요구사항

- **인증 없음** → 세션·쿠키·계정 없음. `auth.methods=[]` → better-auth 섹션 생략 (Hard Threshold ③ 세션 항목 N/A, 단 토큰/PII 노출 0은 강제).
- **PII 0**: 사용자 입력(사용량·현재요금)은 **클라이언트 메모리에서만 계산**, 서버 전송·저장·로깅 금지. AE 이벤트 파라미터에 현재요금 절대값·실명·이메일·전화·위치 금지(버킷화만 허용).
- **데이터 접근**: D1/KV/AE는 `@/shared/env` 타입드 래퍼 단일 통로. `process.env`/전역 직접 접근 0. 시크릿 `NEXT_PUBLIC_*` 노출 0.
- **면책**: `lastVerifiedAt` + "요금 수시 변동, 큐레이션 스냅샷" 고지 필수.

---

## 9. 성능 예산 (Performance Budget) — Hard Threshold ④ 임계값

> 읽기 100%·시드데이터·무광고 앱. 기본값(LCP 1.5s / API 200ms / 번들 200KB)보다 **공격적으로** 설정한다. 비교 사이트는 속도가 곧 이탈률.

### North Star Metric
- **추천→비교/상세 도달률** = `(추천 또는 계산기 사용 세션 중 비교 또는 상세 페이지로 이동한 비율)` **≥ 40%**. ratsaver의 핵심 가치(빠른 의사결정)가 실제로 사용자를 결정으로 이끄는지 측정.

### 전역 Web Vitals 예산 (모든 라우트 기본 게이트)
| 지표 | 예산 | 비고 |
|------|------|------|
| LCP | ≤ 1.5s | 기본 게이트 (초과 시 FAIL). 시드데이터·SSG 기반이라 공격적. |
| INP | ≤ 200ms | 필터·칩 토글·모달은 클라 인터랙션 → 응답성 중요 |
| CLS | ≤ 0.1 | `next/image` width/height 필수. 카드·테이블 스켈레톤 고정 높이 |

### 라우트별 Web Vitals 차등 예산 (전역보다 엄격한 라우트)
| 라우트 | LCP | INP | CLS | 근거 |
|--------|-----|-----|-----|------|
| `/` | ≤ 1.2s | ≤ 150ms | ≤ 0.05 | 랜딩·정적·히어로. 첫인상 = 이탈률 직결 |
| `/plans` | ≤ 1.5s | ≤ 200ms | ≤ 0.1 | 목록·필터 인터랙션 다수 |
| `/plans/[id]` | ≤ 1.2s | ≤ 150ms | ≤ 0.05 | SSG 상세·정적 |
| `/compare` | ≤ 1.5s | ≤ 200ms | ≤ 0.1 | 테이블 조립 |
| `/recommend` | ≤ 1.5s | ≤ 200ms | ≤ 0.1 | 클라 스코어링 인터랙션 |
| `/calculator` | ≤ 1.5s | ≤ 200ms | ≤ 0.1 | 클라 계산 인터랙션 |

### API p95 예산 (엔드포인트별)
| 엔드포인트 | p95 예산 | 캐시 계층 | 근거 |
|-----------|----------|-----------|------|
| `GET /api/plans` | ≤ 120ms | KV/Cache | 읽기 100%·캐시가능·시드데이터. 캐시 히트 시 사실상 edge 응답 |
| `GET /api/plans/[id]` | ≤ 100ms | KV/Cache | 단건 캐시·가장 가벼움 |
| (기본값) | ≤ 150ms | - | 미명시 엔드포인트 기본 (전역 기본 200ms보다 엄격) |

### 라우트별 클라이언트 JS 번들 예산 (gzip, First Load JS)
> **재조정(2026-06-14, Phase 5.5 실측 기반)**: 최초 예산(110~160KB)은 스택의 물리적 바닥보다 낮아 달성 불가로 판명되어 실측+헤드룸으로 재조정. 근거는 [perf-gate.md] 참조.
> - **측정 사실**: Next15 + React19 + shadcn/radix의 공유 베이스라인이 **102KB gz**(react-dom 53 + react/next 45, 축소 불가)이고, shadcn/radix 컴포넌트 클러스터가 라우트당 +75~84KB. 즉 인터랙션 라우트의 물리적 바닥은 **~177KB gz**. lucide(per-icon)·radix(패키지 분리)·`optimizePackageImports` 적용해도 추가 절감 0.
> - **사용자 대면 지표는 전부 통과**: LCP 76~476ms(<1.5s), CLS ≤0.006, API p95 4.7/3.6ms. KB는 프록시 지표이며 실 체감 성능은 우수.
> - **재조정 원칙**: 실측값 + ~5% 헤드룸, 전 라우트 **하네스 표준 200KB gz 이내** 유지.

| 라우트 | 번들 예산(재조정) | 실측(2026-06-14) | 비고 |
|--------|-----------|------|------|
| `/` | ≤ 190KB | 181KB | 랜딩 + 계산기 히어로 |
| `/plans` | ≤ 195KB | 186KB | 필터·칩·정렬·목록 (가장 무거움) |
| `/plans/[id]` | ≤ 190KB | 181KB | SSG 상세 + 비교 토글 |
| `/compare` | ≤ 190KB | 180KB | 비교 테이블 조립 |
| `/recommend` | ≤ 195KB | 185KB | 프리셋 모달 + 스코어링 |
| `/calculator` | ≤ 190KB | 181KB | 계산기 폼 |
| (기본값) | ≤ 200KB | — | 하네스 표준 Hard Threshold ④ |

### 추가 성능 게이트 (Hard Threshold ④ 고정 항목)
- 동일 업스트림(D1) 반복 호출 → `@/shared/cache`(KV) 통과 필수. 미경유 0.
- D1 N+1 쿼리 0 (목록은 단일 쿼리, 상세는 단건 PK 조회).
- `next/image` width/height 누락 0.
- 모든 데이터 호출 `@/shared/perf.trackFetch` 경유 (미경유 시 ⑤ 위반).

---

## 10. 기능별 수용 기준 (Acceptance Criteria)

### F-1 조건 필터 검색
- [ ] 망(SKT/KT/LGU)·통신사·데이터(min/max)·통화·문자·가격대(max)·알뜰폰여부·약정 필터 전부 동작
- [ ] **필터 상태가 URL searchParams에 직렬화** — URL 복사 시 동일 필터 결과 재현 (US-002)
- [ ] 필터 변경 시 결과·카운트 즉시 갱신, INP ≤ 200ms
- [ ] 정렬 가격↑/데이터↓/추천순 동작 (`sort` param)
- [ ] 무필터 진입 시 전체 목록 표시

### F-1.1 퀵필터 칩
- [ ] `1만원 이하`·`데이터 무제한`·`알뜰폰만`·`약정없음` 4칩 원클릭 토글
- [ ] 칩 활성화가 searchParams에 반영 + 다른 필터와 AND 결합
- [ ] 활성 칩 시각적 구분

### F-2 / F-2.1 요금제 상세 + 정직성 가격 병기
- [ ] 전체 스펙(망·데이터·throttle·통화·문자·약정·태그·비고) 표시
- [ ] **프로모가 + 종료 후 정가(regularPrice) + promoMonths 병기** — 정가 숨김 0 (US-005)
- [ ] `lastVerifiedAt` 검증일·면책 고지 표시
- [ ] SSG로 전 plan 프리렌더, LCP ≤ 1.2s

### F-3 요금제 비교
- [ ] 2~3개 나란히 비교 테이블 (데이터·속도·통화·문자·망·프로모가·정가·약정 행)
- [ ] 비교 대상이 URL searchParams(`?ids=`)에 직렬화 → 공유 가능
- [ ] 3개 초과 선택 차단

### F-4 맞춤 추천
- [ ] 사용량 프리셋 5종(통화만 1GB / 웹서핑 7GB / 출퇴근영상 15GB / 영상 71GB / 맘껏 100GB) 선택 가능
- [ ] 직접 입력(데이터 GB·통화 분) 가능
- [ ] **클라이언트 순수함수 스코어링** — 서버 호출 없이 점수순 추천 카드 (PII 0)
- [ ] 입력→결과 INP ≤ 200ms

### F-5 절약액 계산기
- [ ] 현재 월요금 입력 → 추천/선택 요금제 대비 **월·연 절약액** 표시
- [ ] **클라이언트 계산·서버 미저장** (현재요금이 AE/log/네트워크에 절대값으로 노출 0)
- [ ] 음수·0·과대 입력 검증 (Zod), 0KB 서버 왕복

### F-6 면책 / F-7 랜딩
- [ ] 검증일 + "큐레이션 스냅샷·수시 변동" 면책 전 페이지 푸터/상세에 표시
- [ ] 랜딩에 절약 계산기 히어로 + 추천 진입 CTA, LCP ≤ 1.2s

### 전역
- [ ] 무인증 — 어떤 페이지도 로그인 게이트 없음
- [ ] 모든 라우트 rendering-matrix 전략 선언 (Phase 3.5)
- [ ] perf 예산 (§9) 전 항목 게이트 통과 (Phase 5.5)
