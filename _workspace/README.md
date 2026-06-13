# _workspace — 에이전트 블랙보드

에이전트 간 컨텍스트는 대화가 아니라 **이 디렉토리의 파일**로 전달된다(블랙보드 패턴). 각 Phase는 이전 Phase의 산출물을 Read하고 이어서 작업한다.

## 구조
```
_workspace/
├── pipeline-status.md          # 7-Phase 진행추적 (단일 상태표)
├── spec.md                     # Phase 0 — 콘셉트·타깃·제약
├── idea/                       # Phase 1 — idea-researcher
├── plan/                       # Phase 2 — prd.md · kpis.md (perf 예산) · fsd-map.md
├── spec/                       # Phase 2.5 — 모듈별 task 분해
├── design/                     # Phase 3 — shadcn 토큰·테마·레이아웃
├── arch/                       # Phase 3.5 — cf-architect (핵심 계약)
│   ├── rendering-matrix.md     # ★ 라우트별 렌더링/캐시 단일 출처
│   ├── bindings.md             # D1/KV/R2/AE 바인딩 계획
│   └── cache-topology.md       # 캐시 계층 설계
├── impl/                       # Phase 4 — 구현 노트 (routes-built.md · data-layer.md)
├── qa/                         # Phase 5+ — code-review · inspection · perf-gate · fix-loop-N
└── deploy/                     # Phase 7 — deploy-report.md (리소스 ID·배포 URL·헬스)
```

## 규칙
- 한 Phase가 끝나면 `pipeline-status.md`의 해당 행을 갱신한다 (status·agent·notes).
- `arch/rendering-matrix.md`는 모든 구현 에이전트(4a~4d)가 반드시 읽고 따르는 **계약**이다.
- 산출물은 덮어쓰지 말고 누적/버전 관리한다 (qa fix-loop-1, -2, -3).
