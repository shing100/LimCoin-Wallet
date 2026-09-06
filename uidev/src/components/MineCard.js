import React, { Component } from "react";
import styled from "styled-components";
import { Card, CardTitle, CardBody, Button, Notice } from "../ui";
import { formatLim } from "../units";

const Stats = styled.dl`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 10px;
  margin: 0 0 18px;
`;

const Stat = styled.div`
  min-width: 0;
`;

const Key = styled.dt`
  margin: 0 0 2px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--textMuted);
`;

const Value = styled.dd`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
`;

const Hint = styled.p`
  margin: 0 0 14px;
  font-size: 12px;
  color: var(--textFaint);
`;

class MineCard extends Component {
  state = { busy: false, result: null };

  _mine = async () => {
    this.setState({ busy: true, result: null });
    try {
      const block = await this.props.onMine();
      const reward = block.data[0].txOuts[0].amount;
      this.setState({
        busy: false,
        result: {
          tone: "ok",
          text: `블록 #${block.index} 를 채굴했습니다. +${formatLim(reward)} LIM`
        }
      });
    } catch (e) {
      this.setState({ busy: false, result: { tone: "error", text: e.message } });
    }
  };

  render() {
    const { height, difficulty, mempoolSize, subsidy, pendingFees, disabled } = this.props;
    const { busy, result } = this.state;
    return (
      <Card>
        <CardTitle>채굴</CardTitle>
        <CardBody>
          <Stats>
            <Stat>
              <Key>블록 높이</Key>
              <Value>{height === null ? "—" : height}</Value>
            </Stat>
            <Stat>
              <Key>난이도</Key>
              <Value>{difficulty === null ? "—" : difficulty}</Value>
            </Stat>
            <Stat>
              <Key>블록 보조금</Key>
              <Value>{subsidy === null ? "—" : formatLim(subsidy)}</Value>
            </Stat>
            <Stat>
              <Key>대기 수수료</Key>
              <Value>{formatLim(pendingFees)}</Value>
            </Stat>
          </Stats>
          <Hint>
            {mempoolSize > 0
              ? `대기 중인 트랜잭션 ${mempoolSize}건이 함께 담기고, 수수료는 채굴자가 가져갑니다.`
              : "대기 중인 트랜잭션이 없습니다. 코인베이스만 담깁니다."}
          </Hint>
          <Button primary onClick={this._mine} disabled={busy || disabled}>
            {busy ? "채굴 중…" : "블록 채굴"}
          </Button>
          {result && <Notice tone={result.tone}>{result.text}</Notice>}
        </CardBody>
      </Card>
    );
  }
}

export default MineCard;
