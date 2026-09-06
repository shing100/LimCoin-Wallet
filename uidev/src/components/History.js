import React from "react";
import styled from "styled-components";
import { Card, CardTitle, Mono, Empty } from "../ui";

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
  self: { text: "본인 이체", sign: "", icon: "↻" }
};

const formatTime = seconds => {
  if (typeof seconds !== "number") {
    return "";
  }
  return new Date(seconds * 1000).toLocaleString();
};

const History = ({ items, loading }) => (
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
          return (
            <Row key={`${item.id}-${item.blockIndex}`}>
              <Icon kind={item.kind}>{label.icon}</Icon>
              <Detail>
                <Kind>{label.text}</Kind>
                <Meta title={item.counterparty || item.id}>
                  블록 #{item.blockIndex} · {formatTime(item.timestamp)}
                </Meta>
              </Detail>
              <Amount kind={item.kind}>
                {label.sign}
                {item.amount} LIM
              </Amount>
            </Row>
          );
        })}
      </List>
    )}
  </Wrap>
);

export default History;
