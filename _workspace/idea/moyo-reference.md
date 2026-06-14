# 모요(moyoplan.com) 레퍼런스 분석

사용자 제공 레퍼런스. ratsaver 설계의 UX/데이터모델 벤치마크. 2026-06-14 라이브 캡처.
URL: `/plans?sort=RECOMMEND&page.page=0&page.size=10&filters.data.ranges.0.min=0&filters.data.ranges.0.max=0&filters.data.includeUnlimited=true`

## 1. URL 쿼리 = 필터 상태 모델 (그대로 차용 가치 높음)
- `sort=RECOMMEND` — 정렬 키 (추천순/가격순/데이터순)
- `page.page`, `page.size` — 페이지네이션
- `filters.data.ranges[].min/max` — 데이터 범위 필터 (배열 = 다중 구간)
- `filters.data.includeUnlimited=true` — 무제한 포함 토글
→ **교훈**: 필터/정렬/페이지를 URL searchParams에 직렬화 → 공유가능 URL + SSR/ISR 친화. 우리도 동일 패턴 채택.

## 2. 요금제 카드 표시 필드 (우리 plan 스키마와 1:1 매핑)
| 모요 표시 | ratsaver 필드 |
|----------|--------------|
| 요금제명 `[모요핫딜] 6월 쉐이크 LTE 100GB+밀리` | `name` |
| `월 100GB + 5Mbps` | `dataGb` + `throttleKbps` (소진 후 속도) |
| `통화 무제한` / `문자 무제한` | `callUnlimited`/`smsUnlimited` (or 분/건) |
| `KT망` / `LG U+망` / SKT | `network` (SKT/KT/LGU+) |
| `LTE` / 5G | `tech` (LTE/5G) |
| `월 15,300원` | `monthlyPrice` (프로모션가) |
| `7개월 이후 43,000원` | `regularPrice` + `promoMonths` ← **정직성 wedge 핵심** |
| `31,552명이 선택` | (우리는 시드라 생략 or `popularity` 고정값) |
| `사은품 최대 6개` | `notes`/`giftCount` (optional) |
| 별점 `4.3` | (UGC 리뷰 — MVP 비범위) |
| ♡ 하트 | 즐겨찾기 (MVP 비범위, 무인증) |

→ data-model-notes.md의 18필드 설계가 모요 실데이터로 검증됨. 특히 `regularPrice`/`promoMonths`/`throttleKbps`는 모요도 핵심 표시 → 우리 wedge 정당.

## 3. 필터 UX 구성요소
- 상단 필터바: `월 데이터`(슬라이더) · `모든 용량` · `필터`(상세 패널) · `추천순`(정렬 드롭다운)
- **퀵 필터 칩**: `혜택가 0원` · `평생 만 원 이하` · `LG 자회사` · `KT 자회사` · `지금 HOT`
  → ratsaver 차용: `1만원 이하` · `데이터 무제한` · `알뜰폰만` · `약정없음` 같은 원클릭 프리셋 칩
- **데이터 사용량 선택 모달** (추천 기능의 씨앗):
  - 프리셋: `📞 1GB 주로 통화만` · `🔎 7GB 웹서핑/카톡` · `🚆 15GB 출퇴근 영상` · `🎬 71GB 매일 3시간 영상` · `♾️ 100GB 맘껏`
  → ratsaver **맞춤 추천** 기능에 이 프리셋 UX를 거의 그대로 채택 (사용량 입력 진입장벽 낮춤)
- 결과 카운트 상시 표시 `2,442개의 결과`
- 페이지네이션 1~10

## 4. ratsaver 차별화(wedge) 재확인
모요는 가입 깔때기 → 별점/사은품/HOT/마이페이지/로그인 등 무겁다.
ratsaver = **무인증 · 시드데이터 기반 초고속(SSG/ISR) · 정직한 가격 병기 · 절약액 우선 · 광고 0**.
모요에 없는 우리만의 1급 기능: **절약액 계산기**(현재요금 입력 → 연간 절약액), 비교 테이블.

## 5. 후속 Phase 반영 지시
- **Phase 2 (PRD)**: 필터=URL searchParams 모델, 퀵필터칩 4종, 사용량 프리셋 5종을 기능명세에 포함.
- **Phase 3 (Design)**: 카드 레이아웃은 모요처럼 "데이터+속도 / 통화·문자 / 망·세대 / 프로모가 + 종료후정가" 4블록. 단 더 가볍고 광고 없는 톤.
- **Phase 3.5 (Rendering)**: searchParams 필터 → 목록은 서버 필터(edge) 또는 클라이언트 필터(150건이면 클라 가능). 상세는 SSG/ISR.
