import React, { Component } from "react";
import { space, breakpoint } from "./theme";
import styled from "styled-components";
import Header from "./components/Header";
import BalanceCard from "./components/BalanceCard";
import SendForm from "./components/SendForm";
import MineCard from "./components/MineCard";
import History from "./components/History";
import Backup from "./components/Backup";
import { mergeHistory } from "./history";
import { Notice } from "./ui";
import * as api from "./api";

const POLL_INTERVAL = 4000;

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Main = styled.main`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(300px, 380px);
  grid-template-rows: auto 1fr;
  gap: ${space.lg};
  padding: ${space.lg} ${space.xl} ${space.xl};
  overflow-y: auto;

  @media (max-width: ${breakpoint.stack}) {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    padding: ${space.lg};
  }

  @media (max-width: ${breakpoint.sm}) {
    gap: ${space.md};
    padding: ${space.md};
  }
`;

/*
 * 왼쪽 칸(잔액 + 내역).
 *
 * `min-height: 0` 은 넓은 화면에서 필요하다 — 내역 목록이 남는 높이만큼만
 * 차지하고 스스로 스크롤하게 하려면 flex 항목의 기본 최소 높이를 풀어야 한다.
 *
 * 그런데 좁은 화면(한 줄 배치)에서는 이 값이 그대로 남아 **칸 자체가 높이
 * 0 으로 접혔다.** 잔액 카드와 내역이 칸 밖으로 흘러나와 오른쪽 칸 위에
 * 겹쳐 그려졌다 — 잔액이 보이지 않고 "내역" 글자만 다른 카드 뒤에 깔렸다.
 * 한 줄로 쌓을 때는 내용만큼 높이를 갖게 되돌린다.
 */
const Left = styled.div`
  grid-column: 1;
  grid-row: 1 / span 2;
  display: flex;
  flex-direction: column;
  gap: ${space.lg};
  min-height: 0;

  @media (max-width: ${breakpoint.stack}) {
    grid-column: auto;
    grid-row: auto;
    min-height: auto;
  }

  @media (max-width: ${breakpoint.sm}) {
    gap: ${space.md};
  }
`;

const Right = styled.div`
  grid-column: 2;
  grid-row: 1 / span 2;
  display: flex;
  flex-direction: column;
  gap: ${space.lg};

  @media (max-width: ${breakpoint.stack}) {
    grid-column: auto;
    grid-row: auto;
  }

  @media (max-width: ${breakpoint.sm}) {
    gap: ${space.md};
  }
`;

const OfflineNotice = styled(Notice)`
  margin: ${space.lg} ${space.xl} 0;

  @media (max-width: ${breakpoint.stack}) {
    margin: ${space.lg} ${space.lg} 0;
  }
`;

class App extends Component {
  state = {
    addresses: [],
    receiveAddress: null,
    balance: null,
    spendable: null,
    immature: null,
    history: [],
    peers: 0,
    mempool: 0,
    info: null,
    online: true,
    error: null,
    loading: true
  };

  componentDidMount() {
    this._refresh();
    this.timer = setInterval(this._refresh, POLL_INTERVAL);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    this.unmounted = true;
  }

  _refresh = async () => {
    try {
      const [receiveAddress, balance, addresses, peers, mempool, info, pending] =
        await Promise.all([
          api.getAddress(),
          api.getBalance(),
          api.getAddresses(),
          api.getPeers(),
          api.getMempool(),
          api.getInfo(),
          api.getPending()
        ]);

      /*
       * 내역은 노드의 주소별 색인에서 받는다. 지갑이 주소를 여럿 갖게
       * 되었으므로 주소마다 받아서 합친다 — 한 트랜잭션이 보낸 주소와
       * 거스름돈 주소를 함께 건드릴 수 있다.
       */
      const perAddress = await Promise.all(
        addresses.map(entry => api.getAddressTransactions(entry.address))
      );

      if (this.unmounted) {
        return;
      }
      this.setState({
        receiveAddress,
        balance: balance.balance,
        // 이미 보낸 것까지 반영한, 지금 실제로 쓸 수 있는 금액
        spendable: balance.spendable,
        // 아직 묻히지 않아 쓸 수 없는 채굴 보상
        immature: balance.immature,
        addresses,
        history: mergeHistory(perAddress, pending),
        peers: peers.length,
        mempool: mempool.length,
        info,
        online: true,
        error: null,
        loading: false
      });
    } catch (e) {
      if (this.unmounted) {
        return;
      }
      this.setState({
        online: false,
        loading: false,
        error: `LimCoin 노드(${api.API_URL})에 연결할 수 없습니다.`
      });
    }
  };

  _send = async (address, amount, fee) => {
    await api.sendCoins(address, amount, fee);
    await this._refresh();
  };

  _mine = async () => {
    const block = await api.mineBlock();
    await this._refresh();
    return block;
  };

  _toggleAuto = async enabled => {
    await api.setMining(enabled);
    await this._refresh();
  };

  _newAddress = async () => {
    await api.createAddress();
    await this._refresh();
  };

  render() {
    const {
      receiveAddress, addresses, balance, spendable, immature, history, peers,
      mempool, info, online, error, loading
    } = this.state;

    return (
      <Shell>
        <Header online={online} peers={peers} />
        {error && <OfflineNotice tone="error">{error}</OfflineNotice>}
        <Main>
          <Left>
            <BalanceCard
              balance={balance}
              spendable={spendable}
              immature={immature}
              address={receiveAddress}
              addresses={addresses}
              pending={mempool}
              onNewAddress={this._newAddress}
              disabled={!online}
            />
            <History
              items={history}
              loading={loading}
              height={info ? info.height : null}
              coinbaseMaturity={info ? info.coinbaseMaturity : null}
            />
          </Left>
          <Right>
            <SendForm
              onSend={this._send}
              disabled={!online}
              feePerByte={info ? info.recommendedFeePerByte : null}
              congested={
                info ? info.mempoolBytes >= info.maxBlockBytes : false
              }
            />
            <MineCard
              onMine={this._mine}
              height={info ? info.height : null}
              difficulty={info ? info.difficulty : null}
              mempoolSize={mempool}
              subsidy={info ? info.currentSubsidy : null}
              pendingFees={info ? info.mempoolFees : 0}
              autoMining={info ? info.mining : false}
              onToggleAuto={this._toggleAuto}
              disabled={!online}
            />
            <Backup disabled={!online} />
          </Right>
        </Main>
      </Shell>
    );
  }
}

export default App;
