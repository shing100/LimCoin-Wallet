import styled, { css, injectGlobal } from "styled-components";
import theme, { radius, mono, sans, space, tap, breakpoint } from "./theme";

// 다크를 기본으로 두고, OS 가 밝기를 원하면 토큰만 갈아 끼운다.
const vars = palette =>
  Object.keys(palette)
    .map(key => `--${key}: ${palette[key]};`)
    .join("\n    ");

/*
 * 밝기는 세 갈래 — 자동(OS 를 따름) · 라이트 · 다크.
 *
 * 예전에는 OS 설정만 따랐다. 지갑은 종일 띄워 두는 창이라, OS 는 다크로 두고
 * 이 창만 밝게(또는 그 반대로) 쓰고 싶은 경우가 실제로 있다.
 *
 * 규칙의 순서가 곧 우선순위다. 익스플로러(globalStyles.js)와 뒤집힌 모양인
 * 것에 주의 — 이쪽은 **다크가 바탕값**이라 :not() 이 붙는 곳도 반대다.
 *   1. :root                          → 다크가 바탕값
 *   2. @media light, [data-theme] 없음 → OS 가 라이트면 라이트 (자동)
 *   3. :root[data-theme="light"]       → 사람이 고른 라이트가 OS 를 이긴다
 */
export const baseStyles = () => injectGlobal`
  :root {
    ${vars(theme.dark)}
    color-scheme: dark;
  }

  @media (prefers-color-scheme: light) {
    :root:not([data-theme="dark"]) {
      ${vars(theme.light)}
      color-scheme: light;
    }
  }

  :root[data-theme="light"] {
    ${vars(theme.light)}
    color-scheme: light;
  }

  *, *::before, *::after { box-sizing: border-box; }

  html, body, #root { height: 100%; }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: ${sans};
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    /* 데스크톱 앱이므로 본문 텍스트 드래그 선택은 막고, 값만 선택하게 한다 */
    user-select: none;
    cursor: default;
  }

  button { font-family: inherit; }
  input { font-family: inherit; }
`;

export const Card = styled.section`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: ${radius.lg};
  box-shadow: var(--shadow);
`;

export const CardTitle = styled.h2`
  margin: 0;
  padding: ${space.md} ${space.lg};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--textMuted);
  border-bottom: 1px solid var(--border);
`;

export const CardBody = styled.div`
  padding: ${space.lg};

  @media (max-width: ${breakpoint.sm}) {
    padding: ${space.md};
  }
`;

export const Label = styled.label`
  display: block;
  margin-bottom: ${space.xs};
  font-size: 12px;
  font-weight: 600;
  color: var(--textMuted);
`;

const field = css`
  width: 100%;
  /* 입력칸도 손가락으로 눌러 커서를 놓는다 */
  min-height: ${tap.mouse};
  padding: ${space.sm} ${space.md};
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: ${radius.sm};
  color: var(--text);
  font-size: 13px;
  user-select: text;
  cursor: text;
  transition: border-color .15s, box-shadow .15s;

  &::placeholder { color: var(--textFaint); }

  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accentSoft);
  }

  &:disabled { opacity: .5; cursor: not-allowed; }
`;

export const Input = styled.input`
  ${field};
  ${props => props.mono && `font-family: ${mono}; font-size: 12px;`}
`;

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${space.sm};
  /*
   * 마우스로는 28px 도 눌리지만 손가락으로는 아니다. 좁은 창에서만 키워
   * 데스크톱이 헐거워 보이지 않게 한다.
   */
  min-height: ${tap.mouse};
  padding: ${space.sm} ${space.lg};
  border: 1px solid var(--borderStrong);
  border-radius: ${radius.sm};
  background: var(--surfaceRaised);
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, border-color .15s, transform .05s;

  &:hover:not(:disabled) { border-color: var(--accent); }
  &:active:not(:disabled) { transform: translateY(1px); }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--accentSoft);
  }
  &:disabled { opacity: .45; cursor: not-allowed; }

  @media (max-width: ${breakpoint.sm}) {
    min-height: ${tap.touch};
  }

  ${props =>
    props.primary &&
    css`
      background: var(--accent);
      border-color: var(--accent);
      color: var(--accentText);
      &:hover:not(:disabled) { filter: brightness(1.08); }
    `};
`;

// 해시나 주소처럼 길고 복사해야 하는 값
export const Mono = styled.span`
  font-family: ${mono};
  font-size: 12px;
  user-select: text;
  cursor: text;
  word-break: break-all;
`;

export const Notice = styled.p`
  margin: ${space.md} 0 0;
  padding: ${space.sm} ${space.md};
  border-radius: ${radius.sm};
  font-size: 12.5px;
  background: ${props =>
    props.tone === "error"
      ? "rgba(248, 81, 73, .12)"
      : "rgba(63, 185, 80, .12)"};
  color: ${props =>
    props.tone === "error" ? "var(--negative)" : "var(--positive)"};
  border: 1px solid
    ${props =>
      props.tone === "error"
        ? "rgba(248, 81, 73, .3)"
        : "rgba(63, 185, 80, .3)"};
`;

export const Empty = styled.p`
  margin: 0;
  padding: ${space.xxl} ${space.lg};
  text-align: center;
  color: var(--textFaint);
  font-size: 13px;
`;
