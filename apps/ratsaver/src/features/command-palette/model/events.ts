/**
 * 팔레트 오픈 신호 — 헤더 힌트 버튼(가벼운 leaf)과 전역 메뉴(state 소유)를 DOM 이벤트로 디커플.
 * 매직 스트링 0(이벤트명 단일 출처).
 */
export const OPEN_PALETTE_EVENT = 'ratsaver:open-command-palette' as const;

/** 팔레트 열기 요청을 전역으로 디스패치(헤더 버튼 → 전역 메뉴). */
export const requestOpenPalette = (): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT));
};
