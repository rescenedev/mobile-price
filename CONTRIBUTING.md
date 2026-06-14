# Contributing

이 프로젝트에 기여해줘서 고마워요. 아래는 PR이 빠르게 머지되기 위한 최소 규칙입니다.

## 개발 흐름

1. 이슈로 변경 의도를 먼저 공유 (사소한 수정은 생략 가능)
2. `main`에서 브랜치 분기: `feature/*` 또는 `fix/*`
3. 변경 구현 → 아래 게이트 통과 → PR 생성

```
main      <- Production
  ^
feature/* <- Feature branches
```

## 커밋 규칙 (Conventional Commits)

```
<type>: <description>
```

`type`: `feat` · `fix` · `refactor` · `docs` · `test` · `chore` · `perf` · `ci`

## 머지 전 필수 게이트 (Hard Threshold)

이 리포는 정량 게이트로 품질을 강제한다. PR 전 **반드시** 통과해야 한다. 생성앱 작업 시:

```bash
cd apps/ratsaver        # 또는 templates/app-skeleton
npm run typecheck       # 오류 0
npm run lint            # 에러 0, any 0
npm run test            # 전건 통과
```

추가로 [`CLAUDE.md`](CLAUDE.md)의 Hard Threshold 5종(코드 품질·렌더링/CF·인증/보안·성능·관측)을 위반하지 않아야 한다.

- 새 라우트는 `_workspace/arch/rendering-matrix.md`에 렌더링/캐시 전략을 선언한 뒤 구현
- 바인딩 접근은 `@/shared/env`, 데이터 호출은 `@/shared/perf` 단일 통로
- Feature-Sliced Design 의존성 방향 준수: `app → widgets → features → entities → shared`

## PR 체크리스트

- [ ] `typecheck` / `lint` / `test` 통과
- [ ] `any` 타입 미사용
- [ ] 새 라우트 렌더링 전략 선언 (해당 시)
- [ ] 시크릿/토큰 노출 없음
- [ ] 커밋 메시지 컨벤션 준수

보안 이슈는 PR이 아니라 [`SECURITY.md`](SECURITY.md) 절차로 신고해주세요.
