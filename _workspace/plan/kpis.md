# KPI — ratsaver · Analytics Engine 매핑

> Phase 2 산출물. 모든 측정은 **Cloudflare Analytics Engine(AE)** 으로 수집한다 (Firebase 아님).
> 이벤트는 `@/shared/perf`/관측 래퍼를 경유하며, perf-engineer(Phase 4d)가 Web Vitals 비콘과 함께 배선한다.
> 이벤트명 규칙: **snake_case · 동사_명사 · 상수 정의(매직 스트링 금지)**.
> **PII 금지** (Hard Threshold ③·⑤): 이메일·전화·실명·정확한 위치·현재요금 절대값 파라미터 0. 수치는 버킷화만 허용.

---

## North Star Metric
- **추천→결정 도달률** = `(추천 또는 절약계산기를 사용한 세션 중 비교 또는 상세 페이지로 이동한 세션 비율)` **목표 ≥ 40%**
- 정의 근거: ratsaver의 핵심 가치는 "빠른 의사결정". 추천/계산이 실제로 사용자를 비교·상세(=결정 직전)로 이끄는지가 제품 성패의 단일 지표.
- AE 측정: 세션 단위로 `recommend_run`/`saving_calc` 발생 ∩ `view_compare`/`view_plan_detail` 발생 교집합 / 분모 세션.

---

## 4축 기본 세트 (무인증 → 가입/구독 대신 세션·행동 기반 대체 지표)

| 축 | 지표 | 정의 | 목표 | AE 이벤트 | 파라미터 |
|----|------|------|------|-----------|----------|
| 획득 | 신규 세션 진입 | 첫 페이지뷰 세션 (랜딩/검색/추천 진입) | 일 N (성장) | `session_start` | entry_route, referrer_kind |
| 활성 | 핵심행동 완료율 | 세션 중 필터 적용 OR 추천 OR 계산기 중 1+ 수행 비율 | ≥ 60% | `core_action` | action_kind |
| 유지 | 재방문(D7 프록시) | 7일 내 동일 클라이언트 재진입 (무인증 → 익명 클라이언트 ID, PII 아님) | ≥ 15% | `session_start` | returning(bool) |
| 수익화 | 외부 전환 의향(프록시) | 제휴 CTA 자리 클릭 (MVP는 자리만, 이벤트 스텁) | (베이스라인 수집) | `cta_click` | cta_slot |

> 무인증·MVP라 "가입/구독" 직접 지표 없음 → **세션·핵심행동·재방문·CTA 의향**으로 대체. 수익화는 2차(제휴 CTA) 대비 베이스라인만 수집.

---

## 커스텀 이벤트 카탈로그

| 이벤트 (상수명) | 트리거 | 파라미터 (PII 0) | 매핑 기능 |
|----------------|--------|------------------|----------|
| `session_start` | 세션 첫 페이지뷰 | `entry_route`, `referrer_kind`, `returning` | 전역/획득·유지 |
| `view_plan_list` | `/plans` 진입 | `result_count_bucket`, `has_filter` | F-1 |
| `apply_filter` | 필터 변경 확정 | `filter_keys`(적용된 필터축 목록), `sort` | F-1 |
| `toggle_quickchip` | 퀵칩 토글 | `chip_id`(price_under_10k\|data_unlimited\|mvno_only\|no_contract), `active` | F-1.1 |
| `view_plan_detail` | `/plans/[id]` 진입 | `network`, `price_bucket`, `is_mvno`, `has_promo` | F-2 |
| `add_compare` | 비교 대상 추가 | `compare_count`(1~3) | F-3 |
| `view_compare` | `/compare` 렌더 | `compare_count` | F-3 |
| `open_usage_preset` | 사용량 프리셋 모달 열기 | (없음) | F-4 |
| `select_usage_preset` | 프리셋 선택 | `preset_id`(call_only\|web_7g\|commute_15g\|video_71g\|unlimited_100g) | F-4 |
| `recommend_run` | 추천 스코어링 실행 | `input_kind`(preset\|manual), `data_bucket`, `call_bucket` | F-4 |
| `saving_calc` | 절약액 계산 실행 | `saving_bucket`(절약액 구간: none\|under_5k\|5k_15k\|over_15k), `period`(monthly\|yearly) | F-5 |
| `core_action` | 필터/추천/계산기 중 첫 핵심행동 | `action_kind`(filter\|recommend\|calc) | 활성 |
| `cta_click` | 제휴 CTA 자리 클릭 (2차 스텁) | `cta_slot` | 수익화 |
| `disclaimer_view` | 면책 고지 노출 | `surface`(footer\|detail) | F-6 |

### 파라미터 버킷화 규칙 (PII·절대값 차단)
- **현재요금/절약액**: 절대값 금지 → `saving_bucket` 등 구간 버킷만. (F-5 사용자 입력 보호)
- **가격**: `price_bucket`(under_10k\|10k_25k\|25k_40k\|over_40k) — data-model-notes 가격대 버킷 재사용.
- **데이터/통화**: `data_bucket`/`call_bucket` — 구간만.
- **referrer**: `referrer_kind`(direct\|search\|social\|other) — 원본 URL·쿼리 금지.
- **클라이언트 식별**: AE 익명 집계만. 개인 식별·역추적 가능한 ID 저장 0.

---

## Web Vitals 비콘 (perf-engineer 배선 대상)
- LCP/INP/CLS를 AE로 비콘 전송. 이벤트 `web_vital` (파라미터: `metric`, `value`, `route`, `rating`).
- §PRD 9 라우트별 차등 예산을 rating 기준선으로 사용 → Phase 5.5 게이트가 동일 수치로 벤치.

---

## 관측 계약 (Hard Threshold ⑤)
- 모든 AE 이벤트는 `@/shared/perf` 관측 래퍼 경유 (직접 AE 호출 0).
- 이벤트명은 `shared/perf`의 상수(예: `EVENTS.RECOMMEND_RUN`)로 정의 — 매직 스트링 0.
- 모든 데이터/외부 호출은 `trackFetch()` 래핑 → latency 자동 계측.
