# Fix Loop 1 — Phase 6 Iteration (QA 결함 수정)

날짜: 2026-06-14. 입력: `qa/inspection.md`(5b, 82/100 CONDITIONAL PASS), `qa/code-review.md`(5a, PASS + WARNING 2).

## 수정한 결함

### HIGH — 요금제 상세 링크 84% 404 (차단 결함) ✅ FIXED
- **근본원인**: `src/shared/db/seed-data.ts`의 `slugify`가 `[^a-z0-9가-힣]+` 정규식으로 한글을 id에 보존. id는 `/plans/[id]` 라우트 파라미터인데, 한글 슬러그가 `dynamicParams=false`+`generateStaticParams`의 퍼센트인코딩 매칭에 실패 → 404.
- **수정**: id 생성을 ASCII 안정 식별자로 변경 — `${network.toLowerCase()}-${tech.toLowerCase()}-${seq}` (예: `skt-lte-0`, `kt-5g-16`). seq(0~119 유일)가 유일성 보장. 표시용 한글은 `name` 필드가 담당. 미사용이 된 `slugify` 함수 제거. `seed.sql` 재생성(120건 새 ASCII id).
- **검증**: 실제 카드 링크 `/plans/lgu-lte-98` → 200, 존재하지 않는 id → 404 정상. 렌더된 href 전수 ASCII, 한글 누출 0. 120 id 유일.

### MEDIUM — /recommend 프리셋 URL 미직렬화 ✅ FIXED
- **근본원인**: `recommend-panel`이 `?preset=`를 읽기(`readInitialUsage`)는 했으나, 프리셋/사용량 선택 시 URL에 쓰지 않아 공유/새로고침 시 상태 소실.
- **수정**: `useRouter`+`usePathname` 추가, `syncUrl()` 콜백으로 프리셋 선택→`?preset=key`, 수동입력→`?data=&call=` 직렬화. `router.replace(scroll:false)`로 히스토리 스팸/스크롤 점프 방지. PII 0(GB/분만, 금액 0).

### 사소 — /api/vitals dynamic 선언 누락 (5a WARNING) ✅ FIXED
- `app/api/vitals/route.ts`에 `export const dynamic = 'force-dynamic';` 추가 → rendering-matrix 계약과 1:1 정합(다른 3 API와 동일).

## 비수정(의도적)
- LOW: `/api/plans` dev 500 — `next dev`에 CF 바인딩(D1/KV) 부재 탓. 어떤 페이지도 미소비(전부 seedPlans 직접 import) → 사용자 영향 0. API는 `npm run preview`(workerd)에서 Phase 5.5 perf-gate가 검증.
- LOW: `.next` 캐시 손상(검수 중 transient) — 소스 결함 아님.

## 재검증 결과
typecheck 0 · lint 0 · test **146/146 pass** · 상세 라우트 라이브 200 확인.
