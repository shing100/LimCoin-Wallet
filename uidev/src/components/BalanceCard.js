import React, { Component } from "react";
import styled from "styled-components";
import { Card, Mono, Button } from "../ui";
import { formatLim } from "../units";
import { radius } from "../theme";

const Wrap = styled(Card)`
  padding: 24px 22px 20px;
  background: linear-gradient(
    145deg,
    var(--surfaceRaised) 0%,
    var(--surface) 62%
  );
`;

const Caption = styled.p`
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--textMuted);
`;

const Amount = styled.p`
  margin: 0;
  font-size: 40px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
`;

const Unit = styled.span`
  margin-left: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--accent);
`;

const Pending = styled.p`
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--textMuted);
`;

const AddressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding: 10px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: ${radius.sm};
`;

const AddressText = styled(Mono)`
  flex: 1;
  min-width: 0;
  color: var(--textMuted);
  /* 주소는 130자라 그대로 두면 카드를 밀어낸다 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CopyButton = styled(Button)`
  flex: none;
  padding: 6px 12px;
  font-size: 12px;
`;

class BalanceCard extends Component {
  state = { copied: false };

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  _copy = () => {
    const { address } = this.props;
    if (!address) {
      return;
    }
    // Electron 렌더러에도 표준 클립보드 API 가 있다.
    const done = () => {
      this.setState({ copied: true });
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.setState({ copied: false }), 1600);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address).then(done, () => {});
    }
  };

  render() {
    const { balance, address, pending } = this.props;
    return (
      <Wrap>
        <Caption>잔액</Caption>
        <Amount>
          {balance === null ? "—" : formatLim(balance)}
          <Unit>LIM</Unit>
        </Amount>
        {pending > 0 && (
          <Pending>전송 대기 중인 트랜잭션 {pending}건</Pending>
        )}
        <AddressRow>
          <AddressText title={address || ""}>
            {address || "주소를 불러오는 중…"}
          </AddressText>
          <CopyButton onClick={this._copy} disabled={!address}>
            {this.state.copied ? "복사됨" : "주소 복사"}
          </CopyButton>
        </AddressRow>
      </Wrap>
    );
  }
}

export default BalanceCard;
