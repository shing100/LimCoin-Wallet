import React, { Component } from "react";
import styled from "styled-components";
import { Card, CardTitle, CardBody, Button, Notice } from "../ui";
import { formatLim, formatDifficulty } from "../units";

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

// 잔액 카드와 같은 모양의 단위 꼬리표
const Unit = styled.span`
  margin-left: 5px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
`;

const Hint = styled.p`
  margin: 0 0 14px;
  font-size: 12px;
  color: var(--textFaint);
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Auto = styled.p`
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--textMuted);
`;

class MineCard extends Component {
  state = { busy: false, result: null };

  // 블록이 꾸준히 나와야 난이도 조절이 의미를 갖는다.
  // 손으로 채굴 버튼을 누르는 속도로는 잴 수 없다.
  _toggleAuto = async () => {
    this.setState({ busy: true, result: null });
    try {
      await this.props.onToggleAuto(!this.props.autoMining);
      this.setState({ busy: false });
    } catch (e) {
      this.setState({ busy: false, result: { tone: "error", text: e.message } });
    }
  };

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
    const {
      height, difficulty, mempoolSize, subsidy, pendingFees, autoMining, disabled
    } = this.props;
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
              <Value>{formatDifficulty(difficulty)}</Value>
            </Stat>
            <Stat>
              <Key>블록 보조금</Key>
              <Value>
                {subsidy === null ? "—" : formatLim(subsidy)}
                {subsidy === null ? null : <Unit>LIM</Unit>}
              </Value>
            </Stat>
            <Stat>
              <Key>대기 수수료</Key>
              <Value>
                {formatLim(pendingFees)}
                <Unit>LIM</Unit>
              </Value>
            </Stat>
          </Stats>
          <Hint>
            {mempoolSize > 0
              ? `대기 중인 트랜잭션 ${mempoolSize}건이 함께 담기고, 수수료는 채굴자가 가져갑니다.`
              : "대기 중인 트랜잭션이 없습니다. 코인베이스만 담깁니다."}
          </Hint>
          <Actions>
            <Button primary onClick={this._mine} disabled={busy || disabled || autoMining}>
              {busy && !autoMining ? "채굴 중…" : "블록 채굴"}
            </Button>
            <Button onClick={this._toggleAuto} disabled={busy || disabled}>
              {autoMining ? "자동 채굴 끄기" : "자동 채굴"}
            </Button>
          </Actions>
          {autoMining && <Auto>자동으로 계속 채굴하는 중입니다.</Auto>}
          {result && <Notice tone={result.tone}>{result.text}</Notice>}
        </CardBody>
      </Card>
    );
  }
}

export default MineCard;
