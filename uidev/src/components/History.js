import React from "react";
import { space, breakpoint } from "../theme";
import styled from "styled-components";
import { Card, CardTitle, Mono, Empty } from "../ui";
import { formatLim } from "../units";

const Wrap = styled(Card)`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  /*
   * 한 줄로 쌓이는 좁은 창에서는 목록이 내용만큼 늘어난다. 그대로 두면
   * 내역 수백 건을 지나야 아래의 보내기·채굴 카드에 닿는다. 여기서도
   * 스스로 스크롤하게 높이를 묶어 둔다.
   */
  @media (max-width: ${breakpoint.stack}) {
    max-height: 60vh;
  }
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  gap: ${space.md};
  padding: ${space.md} ${space.lg};
  border-bottom: 1px solid var(--border);

  @media (max-width: ${breakpoint.sm}) {
    padding: ${space.md};
  }

  &:last-child { border-bottom: none; }
`;

/*
 * 아이콘 배지의 바탕과 글자.
 *
 * 예전에는 바탕을 rgba 로 직접 적었다. 밝기가 테마와 따로 놀아, 그 위의
 * 아이콘이 4.4:1 언저리로 AA 를 못 넘겼다(작은 13px 글자다). 이제 테마
 * 토큰을 쓴다 — 라이트·다크가 각자 자기 바탕에 맞는 농도를 갖는다.
 * self 는 accentSoft 위라 textMuted 로는 모자라서 본문색을 쓴다.
 */
const TONES = {
  mined: { bg: "var(--positiveSoft)", fg: "var(--positive)" },
  received: { bg: "var(--positiveSoft)", fg: "var(--positive)" },
  sent: { bg: "var(--negativeSoft)", fg: "var(--negative)" },
  self: { bg: "var(--accentSoft)", fg: "var(--text)" }
};

/*
 * 아직 블록에 담기지 않은 것은 흐리게 둔다.
 *
 * 예전에는 확정된 것만 보여 줬다. 보내고 나면 블록이 나올 때까지 아무
 * 흔적도 없어서, 보내진 건지 알 수 없었다.
 */
const PendingRow = styled(Row)`
  background: var(--surfaceRaised);
  /* 밝은 테마에서는 카드와 배경색이 같으므로 왼쪽에 선을 하나 둔다 */
  box-shadow: inset 3px 0 0 var(--accent);
`;

const Badge = styled.span`
  display: inline-block;
  margin-right: 6px;
  padding: 1px ${space.sm};
  border-radius: 999px;
  /* 바탕을 불투명하게 — 반투명이면 뒤에 뭐가 오느냐에 따라 대비가 달라진다 */
  background: var(--accentBadge);
  color: var(--accentBadgeText);
  /* 10px 은 읽기에 너무 작다. 11px 아래로는 내려가지 않는다. */
  font-size: 11px;
  font-weight: 700;
  vertical-align: 1px;
`;

const Icon = styled.span`
  display: grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  background: ${props => TONES[props.kind].bg};
  color: ${props => TONES[props.kind].fg};
`;

const Detail = styled.div`
  flex: 1;
  min-width: 0;
`;

const Kind = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
`;

const Meta = styled(Mono)`
  display: block;
  color: var(--textFaint);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Amount = styled.p`
  flex: none;
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${props => TONES[props.kind].fg};
`;

const LABELS = {
  mined: { text: "채굴 보상", sign: "+", icon: "+" },
  received: { text: "받음", sign: "+", icon: "↓" },
  sent: { text: "보냄", sign: "−", icon: "↑" },
  self: { text: "본인 이체", sign: "−", icon: "↻" }
};

/*
 * 예전에는 `toLocaleString()` 만 불러 브라우저 로케일에 맡겼다. 화면 문구는
 * 한국어인데 시각은 "9/10/2026, 12:21:32 AM" 처럼 미국식으로 나왔고,
 * 기계마다 달랐다. 익스플로러와 같은 표기로 고정한다.
 */
const formatTime = seconds => {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) {
    return "";
  }
  return new Date(seconds * 1000).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false
  });
};

// 이 트랜잭션 위에 블록이 몇 개 쌓였는가. 담긴 블록 자신도 한 번으로 센다.
const confirmationsOf = (item, height) =>
  typeof height === "number" ? height - item.blockIndex + 1 : null;

/*
 * 채굴 보상은 바로 쓸 수 없다. 체인이 갈라져 그 블록이 밀려나면
 * 코인베이스는 통째로 사라지므로, 충분히 묻힐 때까지 기다린다.
 * 잔액에는 보이는데 못 쓰는 이유를 여기서 알려 준다.
 */
const blocksUntilMature = (item, height, maturity) => {
  if (!item.coinbase || typeof height !== "number" || typeof maturity !== "number") {
    return 0;
  }
  return Math.max(0, maturity - (height - item.blockIndex));
};

const History = ({ items, loading, height, coinbaseMaturity }) => (
  <Wrap>
    <CardTitle>내역</CardTitle>
    {items.length === 0 ? (
      <Empty>
        {loading ? "불러오는 중…" : "아직 거래가 없습니다. 블록을 채굴해 보세요."}
      </Empty>
    ) : (
      <List>
        {items.map(item => {
          const label = LABELS[item.kind];
          const RowTag = item.pending ? PendingRow : Row;
          const confirmations = item.pending ? null : confirmationsOf(item, height);
          const ripening = item.pending
            ? 0
            : blocksUntilMature(item, height, coinbaseMaturity);
          return (
            <RowTag key={item.id}>
              <Icon kind={item.kind}>{label.icon}</Icon>
              <Detail>
                <Kind>
                  {item.pending && <Badge>대기 중</Badge>}
                  {ripening > 0 && <Badge>{ripening}블록 뒤 사용 가능</Badge>}
                  {label.text}
                </Kind>
                <Meta title={item.id}>
                  {item.pending
                    ? "블록에 담기기를 기다리는 중입니다"
                    : `블록 #${item.blockIndex} · 확인 ${confirmations}회 · ${formatTime(item.timestamp)}`}
                </Meta>
              </Detail>
              <Amount kind={item.kind}>
                {item.amount === 0 ? "" : label.sign}
                {formatLim(item.amount)} LIM
              </Amount>
            </RowTag>
          );
        })}
      </List>
    )}
  </Wrap>
);

export default History;
