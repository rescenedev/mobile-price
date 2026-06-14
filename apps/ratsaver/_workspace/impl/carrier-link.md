# 상세 페이지 통신사 행 → 외부 검색 링크

## 요청
상세 페이지(`app/plans/[id]/page.tsx`) "통신사" 행의 carrier 값을, 클릭 시 그 통신사로 넘어가는 외부 링크로 만든다. 다크 슬레이트 테마 + emerald(price) 액센트 일관.

## 구현
carrier 데이터에 공식 URL이 없으므로 모든 통신사에 안전한 **네이버 통합검색 링크**로 연결.

### 1) 도메인 헬퍼 신설 — 매직 URL 격리 (entities/plan)
- `src/entities/plan/carrier.ts` 신규
  - `carrierSearchUrl(carrier: string): string`
  - `https://search.naver.com/search.naver?query=${encodeURIComponent(carrier + ' 요금제')}`
  - 베이스 URL/쿼리 접미사를 모듈 상수(`NAVER_SEARCH_BASE`, `CARRIER_QUERY_SUFFIX`)로 분리 → 매직값 0.
- `src/entities/plan/index.ts` 배럴에 `carrierSearchUrl` export 추가.

### 2) 상세 페이지 통신사 행 (app/plans/[id]/page.tsx)
- `specs` 항목 타입을 `desc: string` → `desc: ReactNode`로 확장(기존 문자열 행 그대로 동작, `<dd>{spec.desc}`는 변경 불필요).
- "통신사" 행을 `<a>`(외부라 next `<Link>` 불필요)로 교체:
  - `href={carrierSearchUrl(plan.carrier)}`, `target="_blank"`, `rel="noopener noreferrer"`.
  - 표시: `{plan.carrier}` 텍스트 + lucide `ExternalLink`(`size-3.5`, `aria-hidden`) 인라인. 밑줄 0(globals `a{text-decoration:none}` 유지).
  - 색: 기본 `text-foreground` / 아이콘 `text-foreground-secondary`, hover 시 둘 다 `text-price`(emerald)로 `transition-colors`. 그룹 호버(`group/carrier`)로 텍스트·아이콘 동시 반응.
  - a11y: `aria-label="<통신사> 통신사 검색(새 창)"` + `<span className="sr-only">새 창에서 열림</span>`. `focus-visible:ring-2 ring-ring`(price 액센트 토큰) + `ring-offset-card`로 카드 배경 대비 확보.

## 제약 준수
- 매직값 0 — 검색 URL은 도메인 헬퍼/상수.
- 밑줄 0 — 색 + 외부링크 아이콘으로만 표시.
- CLS 0 — 아이콘 크기 고정(`size-3.5`), 이미지/레이아웃 시프트 요소 없음.
- a11y — aria-label·sr-only·focus-visible 링.
- 다크테마 일관 — `text-foreground`/`text-price`/`ring`/`ring-offset-card` 토큰만 사용, 매직 hex 0.
- `any` 0, FSD 단방향(`app → entities` 정방향), 배럴 경유.
- Server Component 유지(`'use client'` 미도입) — 번들 영향 없음.
- 데이터/캐시/API 미변경. 렌더링 전략 SSG 유지(rendering-matrix 일치).
- 카드(eyebrow)는 미변경 — 사용자가 가리킨 상세 페이지만.

## 게이트 결과
- `bun run typecheck` — 0 에러
- `bun run lint` — 0 에러
- `bun run test` — 147 passed (25 files)
- `bun run build` — 성공. `/plans/[id]` SSG(●) 유지, First Load JS 181 kB (< 200 KB 예산)

## 변경 파일
- `src/entities/plan/carrier.ts` (신규)
- `src/entities/plan/index.ts` (배럴 export 1줄 추가)
- `app/plans/[id]/page.tsx` (import + 통신사 행)
