/*
 * 지갑 전역 디자인 토큰.
 *
 * 익스플로러(LimCoin-Explorer/src/theme.js)와 **같은 값**을 쓴다. 두 앱이
 * 같은 체인의 두 얼굴이라 색이 조금씩 어긋나면 다른 제품처럼 보인다.
 * 예전에는 "같은 디자인 언어를 쓴다"고 적어 두고 실제로는 배경·테두리·
 * 그림자가 미묘하게 달랐다. 값을 바꿀 때는 두 파일을 같이 고칠 것.
 *
 * 다른 것은 기본 밝기뿐이다 — 데스크톱 지갑은 다크가 기본, 웹 익스플로러는
 * 라이트가 기본이고, 둘 다 OS 설정을 따른다.
 *
 * 색은 눈으로 고르지 않았다. 본문·보조·흐림·강조가 각자 얹히는 모든 배경에서
 * WCAG AA(4.5:1)를 넘는 값을 계산해서 잡았다. 특히 —
 *
 *   accent 라이트  #b8801a → #936615
 *     흰 카드 위 3.42:1 이라 글자로 못 읽었다. 버튼 바탕으로 쓸 때
 *     흰 라벨도 같은 3.42:1 이었다 — 주 버튼 글자가 안 보이는 셈이다.
 *     지금은 글자로 5.06:1, 흰 라벨을 얹어도 5.06:1.
 *   textFaint 라이트 #8b949e → #666f7a (3.08 → 5.10:1)
 *   textFaint 다크   #6e7681 → #808892 (3.77 → 4.82:1)
 *     타임스탬프와 수수료가 12.5px 로 이 색이다. 작은 글자일수록 더 지켜야 한다.
 */
const shared = {
  radius: { sm: "6px", md: "10px", lg: "14px" }
};

const dark = {
  bg: "#0d1117",
  surface: "#161b22",
  surfaceRaised: "#1c2129",
  surfaceSunken: "#0d1117",
  border: "#272e39",
  borderStrong: "#39424f",
  text: "#e6edf3",
  textMuted: "#8b949e",
  textFaint: "#808892",
  accent: "#e0a82e",
  accentText: "#1a1206",
  accentSoft: "rgba(224, 168, 46, 0.14)",
  accentBadge: "#363224",
  accentBadgeText: "#e0a82e",
  positive: "#3fb950",
  negative: "#f85149",
  positiveSoft: "rgba(63, 185, 80, 0.12)",
  negativeSoft: "rgba(248, 81, 73, 0.10)",
  shadow: "0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.28)"
};

const light = {
  bg: "#f4f5f7",
  surface: "#ffffff",
  surfaceRaised: "#ffffff",
  surfaceSunken: "#f0f2f5",
  border: "#e3e6ea",
  borderStrong: "#cfd4da",
  text: "#1a1f26",
  textMuted: "#5c6672",
  textFaint: "#666f7a",
  accent: "#936615",
  accentText: "#ffffff",
  // 배지 바탕. 0.12 면 그 위의 accent 글자가 4.33:1 로 살짝 모자랐다.
  accentSoft: "rgba(147, 102, 21, 0.09)",
  /*
   * 배지 바탕은 **불투명**하다. 반투명이면 무엇 위에 얹히느냐에 따라 밝기가
   * 달라져, 카드 위에서는 통과하던 배지가 페이지 배경 위에서 4.1:1 로 떨어졌다.
   * 바탕을 고정하고 그 바탕에 맞는 글자색을 따로 둔다.
   */
  accentBadge: "#f2ede3",
  accentBadgeText: "#8f6314",
  positive: "#1a7f37",
  negative: "#cf222e",
  // 아이콘 배지 바탕. 이 위에 positive/negative 글자가 얹히므로 함께 잡는다.
  positiveSoft: "rgba(26, 127, 55, 0.08)",
  negativeSoft: "rgba(207, 34, 46, 0.08)",
  shadow: "0 1px 2px rgba(16,22,26,.06), 0 8px 24px rgba(16,22,26,.08)"
};

export const radius = shared.radius;

export const mono =
  '"SF Mono", "JetBrains Mono", "Fira Code", Menlo, Consolas, "D2Coding", monospace';

/*
 * 웹폰트를 받아오지 않는다. 로컬 노드를 보는 도구가 네트워크에 매달릴 이유가 없다.
 *
 * 한글은 플랫폼마다 이름이 다르다. 예전 목록에는 **Malgun Gothic(맑은 고딕)이
 * 빠져 있었다** — 윈도우에서 Segoe UI 는 한글 글리프가 없으므로, Noto Sans KR
 * 을 따로 깔지 않은 윈도우 사용자는 굴림 같은 옛 글꼴로 떨어졌다.
 * 리눅스는 fontconfig 이름이 "Noto Sans CJK KR" 이라 웹폰트 이름으로는 안 잡힌다.
 */
export const sans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ' +
  '"Apple SD Gothic Neo", "Noto Sans KR", "Noto Sans CJK KR", "Malgun Gothic", ' +
  '"맑은 고딕", Helvetica, Arial, sans-serif';

export default { dark, light };
