import styled, { css, injectGlobal } from "styled-components";
import theme, { radius, mono, sans } from "./theme";

// 다크를 기본으로 두고, OS 가 밝기를 원하면 토큰만 갈아 끼운다.
const vars = palette =>
  Object.keys(palette)
    .map(key => `--${key}: ${palette[key]};`)
    .join("\n    ");

export const baseStyles = () => injectGlobal`
  :root {
    ${vars(theme.dark)}
    color-scheme: dark;
  }

  @media (prefers-color-scheme: light) {
    :root {
      ${vars(theme.light)}
      color-scheme: light;
    }
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
  padding: 14px 18px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--textMuted);
  border-bottom: 1px solid var(--border);
`;

export const CardBody = styled.div`
  padding: 18px;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--textMuted);
`;

const field = css`
  width: 100%;
  padding: 10px 12px;
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
  gap: 8px;
  padding: 10px 16px;
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
  margin: 12px 0 0;
  padding: 10px 12px;
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
  padding: 32px 18px;
  text-align: center;
  color: var(--textFaint);
  font-size: 13px;
`;
