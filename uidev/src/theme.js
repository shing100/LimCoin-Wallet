// 지갑 전역 디자인 토큰.
// 데스크톱 지갑이라 다크를 기본으로 두고, OS 설정이 밝기를 원하면 따라간다.
const dark = {
  bg: "#0d1117",
  surface: "#161b22",
  surfaceRaised: "#1c2129",
  border: "#272e39",
  borderStrong: "#39424f",
  text: "#e6edf3",
  textMuted: "#8b949e",
  textFaint: "#6e7681",
  accent: "#e0a82e",
  accentText: "#1a1206",
  accentSoft: "rgba(224, 168, 46, 0.14)",
  positive: "#3fb950",
  negative: "#f85149",
  shadow: "0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.28)"
};

const light = {
  bg: "#f4f5f7",
  surface: "#ffffff",
  surfaceRaised: "#ffffff",
  border: "#e3e6ea",
  borderStrong: "#cfd4da",
  text: "#1a1f26",
  textMuted: "#5c6672",
  textFaint: "#8b949e",
  accent: "#b8801a",
  accentText: "#ffffff",
  accentSoft: "rgba(184, 128, 26, 0.12)",
  positive: "#1a7f37",
  negative: "#cf222e",
  shadow: "0 1px 2px rgba(16,22,26,.06), 0 8px 24px rgba(16,22,26,.08)"
};

export const radius = { sm: "6px", md: "10px", lg: "14px" };

export const mono =
  '"SF Mono", "JetBrains Mono", "Fira Code", Menlo, Consolas, monospace';

export const sans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", "Apple SD Gothic Neo", Roboto, sans-serif';

export default { dark, light };
