import React, { Component } from "react";
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
  gap: 16px;
  padding: 18px 22px 22px;
  overflow-y: auto;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
    grid-template-rows: none;
  }
`;

const Left = styled.div`
  grid-column: 1;
  grid-row: 1 / span 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;

  @media (max-width: 780px) {
    grid-column: auto;
    grid-row: auto;
  }
`;

const Right = styled.div`
  grid-column: 2;
  grid-row: 1 / span 2;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 780px) {
    grid-column: auto;
    grid-row: auto;
  }
`;

const OfflineNotice = styled(Notice)`
  margin: 18px 22px 0;
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
              recommendedFee={info ? info.recommendedFeePerInput : null}
              congested={info ? info.mempoolSize >= info.maxTxsPerBlock - 1 : false}
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
