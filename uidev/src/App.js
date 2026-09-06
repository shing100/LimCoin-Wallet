import React, { Component } from "react";
import styled from "styled-components";
import Header from "./components/Header";
import BalanceCard from "./components/BalanceCard";
import SendForm from "./components/SendForm";
import MineCard from "./components/MineCard";
import History from "./components/History";
import { buildHistory } from "./history";
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

  /* 창을 좁히면 한 줄로 */
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
    address: null,
    balance: null,
    blocks: [],
    peers: 0,
    mempool: 0,
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
      // 주소는 노드가 살아 있는 한 바뀌지 않으므로 한 번만 받는다.
      const [address, balance, blocks, peers, mempool] = await Promise.all([
        this.state.address || api.getAddress(),
        api.getBalance(),
        api.getBlocks(),
        api.getPeers(),
        api.getMempool()
      ]);
      if (this.unmounted) {
        return;
      }
      this.setState({
        address,
        balance: balance.balance,
        blocks,
        peers: peers.length,
        mempool: mempool.length,
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

  _send = async (address, amount) => {
    await api.sendCoins(address, amount);
    await this._refresh();
  };

  _mine = async () => {
    const block = await api.mineBlock();
    await this._refresh();
    return block;
  };

  render() {
    const {
      address, balance, blocks, peers, mempool, online, error, loading
    } = this.state;

    const newest = blocks.length > 0 ? blocks[blocks.length - 1] : null;
    const history = buildHistory(blocks, address);

    return (
      <Shell>
        <Header online={online} peers={peers} />
        {error && <OfflineNotice tone="error">{error}</OfflineNotice>}
        <Main>
          <Left>
            <BalanceCard
              balance={balance}
              address={address}
              pending={mempool}
            />
            <History items={history} loading={loading} />
          </Left>
          <Right>
            <SendForm onSend={this._send} disabled={!online} />
            <MineCard
              onMine={this._mine}
              height={newest ? newest.index : null}
              difficulty={newest ? newest.difficulty : null}
              mempoolSize={mempool}
              disabled={!online}
            />
          </Right>
        </Main>
      </Shell>
    );
  }
}

export default App;
