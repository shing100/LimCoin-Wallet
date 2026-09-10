import React from "react";
import logo from "../logo.json";

/*
 * LimCoin 마크.
 *
 * 금화(원) 안에 블록 네 개로 쌓은 L — 세로로 셋, 오른쪽 아래로 뻗은 발 하나.
 * 블록 사이의 틈이 "이어 붙인 블록"을 말하고, 16px 파비콘에서는 그 틈이
 * 사라져 통짜 L 로 뭉친다. 작은 데서 무너지지 않는 것이 이 모양을 고른 이유다.
 *
 * 색은 테마를 따르지 않는다. 라이트/다크 어느 쪽에서도 같은 금화다 —
 * 상표는 배경이 바뀐다고 색이 바뀌는 것이 아니고, 그래야 창 아이콘·파비콘과
 * 화면 속 로고가 같은 물건으로 보인다.
 *
 * 모양의 원본은 src/logo.json 이다. 여기서 좌표를 고치지 말 것 —
 * 창 아이콘과 파비콘이 같은 파일에서 만들어진다(scripts/icons.js).
 * 익스플로러(LimCoin-Explorer/src/Components/Logo)와 같은 마크다.
 */
const Logo = ({ size = 26, disc = logo.gold, ink = logo.ink, title = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox={`0 0 ${logo.viewBox} ${logo.viewBox}`}
    role={title ? "img" : "presentation"}
    aria-label={title || undefined}
    aria-hidden={title ? undefined : "true"}
    style={{ flex: "none", display: "block" }}
  >
    <circle cx={logo.disc.cx} cy={logo.disc.cy} r={logo.disc.r} fill={disc} />
    {logo.blocks.map(([x, y, w, h]) => (
      <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx={logo.rx} fill={ink} />
    ))}
  </svg>
);

export default Logo;
