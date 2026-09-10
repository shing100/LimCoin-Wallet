import React, { Component } from "react";
import styled from "styled-components";
import { radius, tap } from "../theme";
import { getMode, setMode, nextMode, isDark, LABEL } from "../themeMode";

/*
 * 밝기 전환 단추.
 *
 * 자동 → 라이트 → 다크 → 자동 으로 돈다. 익스플로러와 같은 물건이지만
 * 바탕값이 반대다 — 지갑은 다크가 기본이라 "자동"은 대개 어둡다.
 */
const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  min-width: ${tap.mouse};
  min-height: ${tap.mouse};
  padding: 0;
  border: 1px solid transparent;
  border-radius: ${radius.sm};
  background: none;
  color: var(--textMuted);
  cursor: pointer;
  transition: background .12s, color .12s;

  &:hover { background: var(--surfaceSunken); color: var(--text); }

  &:focus-visible {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accentSoft);
  }

  /* 사람이 직접 고른 상태는 눌려 있는 것처럼 보이게 */
  &[data-mode="light"], &[data-mode="dark"] {
    background: var(--accentSoft);
    color: var(--accent);
  }
`;

const Sun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeWidth="2" />
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2.6v2.4M12 19v2.4M2.6 12h2.4M19 12h2.4" />
      <path d="M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M18.6 5.4l-1.7 1.7M7.1 16.9l-1.7 1.7" />
    </g>
  </svg>
);

const Moon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20 14.2A8.4 8.4 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

// 자동: 반은 해, 반은 달 — "지금은 OS 를 따라간다"는 뜻
const Auto = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="2" />
    <path d="M12 3.6a8.4 8.4 0 0 1 0 16.8z" fill="currentColor" />
  </svg>
);

class ThemeToggle extends Component {
  state = { mode: "auto", dark: true };

  componentDidMount() {
    const mode = getMode();
    this.setState({ mode, dark: isDark(mode) });

    // "자동"인 동안 OS 설정이 바뀌면 아이콘도 따라 바뀌어야 한다
    if (typeof window.matchMedia === "function") {
      this._query = window.matchMedia("(prefers-color-scheme: light)");
      this._onSystem = () => this.setState(prev => ({ dark: isDark(prev.mode) }));
      if (this._query.addEventListener) {
        this._query.addEventListener("change", this._onSystem);
      } else if (this._query.addListener) {
        this._query.addListener(this._onSystem);
      }
    }
  }

  componentWillUnmount() {
    if (this._query && this._onSystem) {
      if (this._query.removeEventListener) {
        this._query.removeEventListener("change", this._onSystem);
      } else if (this._query.removeListener) {
        this._query.removeListener(this._onSystem);
      }
    }
  }

  _cycle = () => {
    const mode = setMode(nextMode(this.state.mode));
    this.setState({ mode, dark: isDark(mode) });
  };

  render() {
    const { mode, dark } = this.state;
    const icon = mode === "auto" ? <Auto /> : dark ? <Moon /> : <Sun />;
    const title = `화면 밝기: ${LABEL[mode]}${
      mode === "auto" ? " (OS 설정을 따름)" : ""
    } — 눌러서 ${LABEL[nextMode(mode)]}(으)로`;

    return (
      <Button
        type="button"
        onClick={this._cycle}
        data-mode={mode}
        title={title}
        aria-label={title}
      >
        {icon}
      </Button>
    );
  }
}

export default ThemeToggle;
