import React from "react";
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
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border);

  &:last-child { border-bottom: none; }
`;

const TONES = {
  mined: { bg: "rgba(63,185,80,.14)", fg: "var(--positive)" },
  received: { bg: "rgba(63,185,80,.14)", fg: "var(--positive)" },
  sent: { bg: "rgba(248,81,73,.14)", fg: "var(--negative)" },
  self: { bg: "var(--accentSoft)", fg: "var(--textMuted)" }
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
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--accentSoft);
  color: var(--accent);
  font-size: 10px;
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

const formatTime = seconds => {
  if (typeof seconds !== "number") {
    return "";
  }
  return new Date(seconds * 1000).toLocaleString();
};

// 이 트랜잭션 위에 블록이 몇 개 쌓였는가. 담긴 블록 자신도 한 번으로 센다.
const confirmationsOf = (item, height) =>
  typeof height === "number" ? height - item.blockIndex + 1 : null;

const History = ({ items, loading, height }) => (
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
          return (
            <RowTag key={item.id}>
              <Icon kind={item.kind}>{label.icon}</Icon>
              <Detail>
                <Kind>
                  {item.pending && <Badge>대기 중</Badge>}
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
