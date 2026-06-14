# 시드 데이터 모델 노트 — `plan` 엔티티

스펙의 `plan` 엔티티를 시드 가능한 구체 스키마로 확장. 모든 값 범위는 2026년 국내 실거래 기준 근사치(아래 출처 참고). MVP는 D1 시드 50~150건.

## 제안 스키마 (D1 / Drizzle 기준 필드)

| 필드 | 타입 | 설명 | 현실적 값 범위 / 예시 |
|------|------|------|----------------------|
| `id` | text (slug) | PK, URL용 슬러그 | `hello-15g-lifelong` |
| `carrier` | text | 통신사(브랜드)명 | 헬로모바일, KT엠모바일, SK세븐모바일, U+유모바일, 티플러스, 이지모바일, 리브엠, 모빙, 프리텔레콤 / (MNO) SKT·KT·LGU+ |
| `network` | enum | 임대 망 | `SKT` \| `KT` \| `LGU` |
| `mvno` | boolean | 알뜰폰 여부 | `true`(알뜰폰) / `false`(통신사 직영) |
| `name` | text | 요금제명 | "11G+ 평생 요금제" |
| `monthlyPrice` | integer (원) | **현재(프로모션) 월요금** | 3,300 ~ 89,000. 알뜰폰 다수 8,000~30,000, MNO 무제한 55,000~100,000 |
| `regularPrice` | integer (원) | **프로모션 종료 후 정가** (없으면 = monthlyPrice) | 예: promo 15,300 → regular 43,600 |
| `promoMonths` | integer \| null | 프로모션 유지 개월 | 0(평생), 7(흔함), 12 |
| `dataGb` | real \| null | 월 기본 데이터(GB). 무제한이면 null | 1.5, 7, 11, 15, 71, 100, 110 / 무제한=null |
| `dataUnlimited` | boolean | 데이터 완전 무제한 여부 | 대부분 false; 완전무제한은 주로 MNO |
| `throttleKbps` | integer \| null | 기본 데이터 소진 후 속도(Kbps) | 1000(1Mbps), 3000(3Mbps), 5000(5Mbps), null(차단/추가과금) |
| `callMinutes` | integer \| null | 월 음성통화(분). 무제한이면 null | 100, 200, 300 / 무제한=null |
| `callUnlimited` | boolean | 통화 무제한 | 알뜰폰 중저가도 통화무제한 흔함 → true 비율 높음 |
| `smsCount` | integer \| null | 월 문자(건). 무제한이면 null | 100, 기본제공, null(무제한) |
| `smsUnlimited` | boolean | 문자 무제한 | true 다수 |
| `contract` | enum | 약정 유형 | `none`(무약정) \| `12m` \| `24m` |
| `signupType` | enum | 가입 형태(참고) | `online` \| `offline` \| `both` |
| `tags` | text[] (JSON) | 필터 보조 태그 | ["평생요금제","5G","eSIM지원","청소년"] |
| `notes` | text \| null | 비고/프로모션 조건 | "7개월 후 43,600원, USIM 무료배송" |
| `lastVerifiedAt` | text (ISO date) | **데이터 검증일** (정직성·면책용) | "2026-06-01" — date-fns로 포맷, `.split('T')[0]` 금지 |

> 파생값(절약액·추천점수)은 **저장하지 않고 런타임 계산** — 무인증·읽기중심 유지.

## 현실적 값 분포 가이드 (시드 50~150건 채울 때)

- **가격대 버킷**: ~10,000원(저용량·평생) / 10,000~25,000원(7~15GB, 가장 빽빽한 구간) / 25,000~40,000원(100GB급 프로모션) / 40,000원+(정가·MNO 무제한). 절반 이상을 10,000~30,000원 구간에 배치(실제 시장 밀도 반영).
- **데이터 분포**: 71GB·100GB·110GB가 "데이터 충분" 대표값. 7GB·11GB·15GB가 중용량 핵심. 1.5GB 내외 초저가도 일부.
- **throttle**: 100GB급은 소진 후 3~5Mbps 제공이 표준 → 비교 테이블 핵심 차별 컬럼.
- **망 분포**: SKT/KT/LGU 3망을 고르게(각 ~1/3). 동일 스펙·다른 망 조합을 의도적으로 넣어 "망별 비교" 데모가 살아나게.
- **mvno 비율**: 알뜰폰 80% / 통신사 직영 20% 정도(콘셉트가 알뜰폰 중심).
- **promoMonths**: 약 30~40%는 7개월 프로모션(정가 급등 케이스) → 정직성 wedge 시연용으로 의도 배치.

## 데이터 출처 아이디어 (큐레이션)
- 모요 주간 TOP20 랭킹 / 요금제 목록 (구조·대표 요금제 파악) — moyoplan.com/plans, /ranking
- 알뜰폰허브 공식 요금제 목록 (협회 공인 데이터) — mvnohub.kr/product/products.do
- 우체국 알뜰폰 판매 안내 (공공 채널 대표 요금제) — epost.go.kr
- 알닷(LGU+ MVNO) 요금제 목록 (망별 실값) — uplusmvno.com/plan/plan-list
- 가격 트렌드/프로모션 함정 레퍼런스 — dasaja.co.kr/saja_guide/7
- **수집 방식**: 수동 큐레이션 → SQL/시드 스크립트(스펙대로 관리자 CMS 없음). 50~150건은 1인이 반나절 큐레이션 가능 규모.

## 후속 Phase 신호
- **렌더링**: `plan` 읽기 전용 → 목록/상세 SSG/ISR, KV/Cache 캐시. (Hard Threshold ②)
- **성능**: 읽기 100% → 캐시 적합성 최상. 추천/계산은 클라이언트 또는 edge 순수함수. (④)
- **보안/PII**: 사용자 입력(사용량·현재요금)은 **서버 미저장·클라이언트 계산** 권장 → PII 노출 0. (③)
- **정직성 계약**: `regularPrice`/`promoMonths`/`throttleKbps`/`lastVerifiedAt` 4필드가 product-planner의 비교 테이블·면책 고지 설계 입력.
