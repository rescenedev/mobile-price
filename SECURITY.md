# Security Policy

## 지원 범위

이 리포는 하네스(`templates/`, `.claude/`, `_workspace/`)와 생성앱(`apps/ratsaver`)을 포함한다. 보안 보고는 `main` 브랜치의 최신 코드를 기준으로 한다.

## 취약점 신고

취약점을 발견하면 **공개 이슈로 올리지 말고** 비공개로 알려주세요.

- 이메일: zihado@gmail.com
- 또는 GitHub **Security Advisory** (Security 탭 → "Report a vulnerability")

신고 시 아래를 포함해주면 분류가 빠릅니다.
- 영향받는 경로/엔드포인트 (예: `apps/ratsaver/app/api/plans/route.ts`)
- 재현 절차와 PoC
- 예상 영향 (데이터 노출 / 인증 우회 / SSRF 등)

가능하면 **48시간 내 1차 응답**, 유효한 취약점은 합의된 일정에 맞춰 패치한다.

## 보안 기준 (코드 레벨)

이 프로젝트는 [`CLAUDE.md`](CLAUDE.md)의 Hard Threshold ③(인증·보안)을 게이트로 강제한다.

- 세션은 **httpOnly + Secure + SameSite** 쿠키만 사용 (토큰을 클라이언트 스토리지에 저장 금지)
- 시크릿은 `NEXT_PUBLIC_*`/클라이언트 번들에 노출 금지 — 바인딩은 `@/shared/env` 단일 통로
- Server Action / 변경 POST 핸들러는 origin/CSRF 검증
- 토큰·PII를 `console.log`/analytics 파라미터에 노출 금지

위 기준 위반은 보안 결함으로 간주한다.
