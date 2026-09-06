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

const SmallButton = styled(Button)`
  flex: none;
  padding: 6px 12px;
  font-size: 12px;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
`;

const Toggle = styled.button`
  padding: 0;
  border: none;
  background: none;
  color: var(--textMuted);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  &:hover { color: var(--accent); }
`;

const AddressList = styled.ul`
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: ${radius.sm};
`;

const AddressItem = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  &:last-child { border-bottom: none; }
`;

const ItemAddress = styled(Mono)`
  flex: 1;
  min-width: 0;
  color: var(--textFaint);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemAmount = styled.span`
  flex: none;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${props => (props.zero ? "var(--textFaint)" : "var(--text)")};
`;

class BalanceCard extends Component {
  state = { copied: false, expanded: false, busy: false };

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  _copy = () => {
    const { address } = this.props;
    if (!address || !navigator.clipboard) {
      return;
    }
    navigator.clipboard.writeText(address).then(() => {
      this.setState({ copied: true });
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.setState({ copied: false }), 1600);
    }, () => {});
  };

  _newAddress = async () => {
    this.setState({ busy: true });
    try {
      await this.props.onNewAddress();
    } finally {
      this.setState({ busy: false });
    }
  };

  render() {
    const { balance, address, addresses, pending, disabled } = this.props;
    const { copied, expanded, busy } = this.state;

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
          <SmallButton onClick={this._copy} disabled={!address}>
            {copied ? "복사됨" : "주소 복사"}
          </SmallButton>
        </AddressRow>

        <Footer>
          {/*
            거스름돈을 새 주소로 받으므로 지갑은 주소를 여럿 갖게 된다.
            "내 주소"가 하나뿐이라는 전제가 더는 성립하지 않는다.
          */}
          <Toggle onClick={() => this.setState({ expanded: !expanded })}>
            주소 {addresses.length}개 {expanded ? "접기" : "보기"}
          </Toggle>
          <SmallButton onClick={this._newAddress} disabled={busy || disabled}>
            {busy ? "만드는 중…" : "새 주소"}
          </SmallButton>
        </Footer>

        {expanded && (
          <AddressList>
            {addresses.map(entry => (
              <AddressItem key={entry.address}>
                <ItemAddress title={entry.address}>{entry.address}</ItemAddress>
                <ItemAmount zero={entry.balance === 0}>
                  {formatLim(entry.balance)}
                </ItemAmount>
              </AddressItem>
            ))}
          </AddressList>
        )}
      </Wrap>
    );
  }
}

export default BalanceCard;
