import React from "react";
import styled from "styled-components";
import { radius } from "../theme";
import { qrMatrix } from "../qr";

/*
 * 받을 주소 QR.
 *
 * 색을 테마에 맞추지 않고 언제나 검정/흰색으로 그린다. 다크 화면에 맞춰
 * 반전시키면 보기에는 어울리지만, 반전된 QR 을 못 읽는 스캐너가 아직 많다.
 * 주소를 잘못 옮기면 돈이 사라지는 일이라 "예쁘게"보다 "반드시 읽힌다"가
 * 먼저다. 여백(quiet zone) 4칸도 규격이 요구하는 것이다.
 */
const QUIET = 4;

const Box = styled.div`
  flex: none;
  padding: 8px;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: ${radius.md};
  line-height: 0;
`;

const QrCode = ({ value, size = 108, title = "받을 주소 QR" }) => {
  const modules = value ? qrMatrix(value) : null;
  if (modules === null) {
    return null;
  }

  const n = modules.length;
  const span = n + QUIET * 2;

  // 가로로 이어진 칸은 하나로 합쳐 경로 하나에 담는다 (요소 수를 줄인다)
  const parts = [];
  for (let y = 0; y < n; y++) {
    let run = 0;
    for (let x = 0; x <= n; x++) {
      if (x < n && modules[y][x]) {
        run++;
      } else if (run > 0) {
        parts.push(`M${x - run + QUIET},${y + QUIET}h${run}v1h-${run}z`);
        run = 0;
      }
    }
  }

  return (
    <Box>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${span} ${span}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={title}
      >
        <rect width={span} height={span} fill="#ffffff" />
        <path d={parts.join("")} fill="#000000" />
      </svg>
    </Box>
  );
};

export default QrCode;
