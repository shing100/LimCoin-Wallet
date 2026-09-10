/*
 * 밝기 고르기 — 자동 / 라이트 / 다크.
 *
 * 고른 값은 <html data-theme> 에 얹고 localStorage 에 남긴다. CSS 쪽 규칙은
 * ui.js 의 baseStyles 에 있다. "자동"은 속성을 아예 지우는 것으로 표현한다 —
 * 값을 "auto" 로 넣어 두면 미디어 쿼리 조건을 하나 더 써야 하고, 그러면
 * OS 를 따르는 기본 동작이 CSS 두 곳에 흩어진다.
 *
 * 첫 칠 이전에 속성을 붙이는 일은 public/index.html 의 작은 스크립트가
 * 한다. 여기서만 하면 React 가 뜨는 사이 화면이 한 번 번쩍인다.
 *
 * 익스플로러(LimCoin-Explorer/src/themeMode.js)와 같은 파일이되 isDark 의
 * "자동"만 다르다 — 지갑은 다크가 바탕값이다.
 */
const KEY = "limcoin.wallet.theme";

export const MODES = ["auto", "light", "dark"];

export const LABEL = { auto: "자동", light: "라이트", dark: "다크" };

const root = () =>
  typeof document === "undefined" ? null : document.documentElement;

const read = () => {
  try {
    return window.localStorage.getItem(KEY);
  } catch (e) {
    // 사파리 비공개 모드 등. 저장은 못 해도 이번 방문 동안은 바꿀 수 있어야 한다.
    return null;
  }
};

const write = mode => {
  try {
    if (mode === "auto") {
      window.localStorage.removeItem(KEY);
    } else {
      window.localStorage.setItem(KEY, mode);
    }
  } catch (e) {
    /* 저장이 막혀 있으면 이번 방문에만 적용된다 */
  }
};

export const getMode = () => {
  const el = root();
  const attr = el && el.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") {
    return attr;
  }
  const saved = read();
  return saved === "light" || saved === "dark" ? saved : "auto";
};

export const setMode = mode => {
  const el = root();
  if (el) {
    if (mode === "auto") {
      el.removeAttribute("data-theme");
    } else {
      el.setAttribute("data-theme", mode);
    }
  }
  write(mode);
  return mode;
};

// 버튼 한 개로 돌려 쓴다 — 자동 → 라이트 → 다크 → 자동
export const nextMode = mode => MODES[(MODES.indexOf(mode) + 1) % MODES.length];

/*
 * 지금 실제로 어두운 화면인가. "자동"일 때는 OS 에 물어봐야 안다.
 * 아이콘(해/달)을 고르는 데만 쓴다.
 */
export const isDark = mode => {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  // 자동일 때 지갑의 바탕값은 다크다. OS 가 라이트라고 말할 때만 밝다.
  return !(
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  );
};
