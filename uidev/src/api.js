// 이 렌더러가 붙을 LimCoin 노드를 찾는다.
//
// Electron 안에서는 메인 프로세스가 빈 포트를 잡아 global.sharedPort 로 넘겨준다.
// 브라우저에서 `yarn startReact` 로만 띄우는 경우에는 Electron 이 없으므로
// REACT_APP_NODE_PORT 또는 3000 으로 떨어진다.
const fromMain = key => {
  try {
    if (typeof window !== "undefined" && window.require) {
      const { remote } = window.require("electron");
      return remote.getGlobal(key);
    }
  } catch (e) {
    // Electron 밖에서 실행 중
  }
  return undefined;
};

const resolvePort = () =>
  fromMain("sharedPort") || process.env.REACT_APP_NODE_PORT || 3000;

/*
 * 노드의 지갑 API 는 토큰을 요구한다. 메인 프로세스가 노드를 띄우면서
 * 토큰을 넘겨준다. 브라우저로만 띄운 경우에는 REACT_APP_WALLET_TOKEN 을
 * 쓰거나, 노드를 LIMCOIN_WALLET_TOKEN=none 으로 띄운다.
 */
const resolveToken = () =>
  fromMain("sharedWalletToken") ||
  // 브라우저로 띄워 시험할 때 콘솔에서 넣어 줄 수 있게 열어 둔다
  (typeof window !== "undefined" && window.LIMCOIN_WALLET_TOKEN) ||
  process.env.REACT_APP_WALLET_TOKEN ||
  "";

export const PORT = resolvePort();
export const API_URL = `http://localhost:${PORT}`;

const WALLET_TOKEN = resolveToken();

const request = async (path, options) => {
  const headers = { "Content-Type": "application/json" };
  if (WALLET_TOKEN) {
    headers.Authorization = `Bearer ${WALLET_TOKEN}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...((options && options.headers) || {}) }
  });
  const text = await res.text();
  if (!res.ok) {
    // 노드는 실패 시 본문에 사람이 읽을 메시지를 담아 준다.
    throw new Error(text || `요청이 실패했습니다 (HTTP ${res.status})`);
  }
  return text ? JSON.parse(text) : null;
};

export const getAddress = async () => {
  const headers = WALLET_TOKEN ? { Authorization: `Bearer ${WALLET_TOKEN}` } : {};
  const res = await fetch(`${API_URL}/me/address`, { headers });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.text();
};

export const getBalance = () => request("/me/balance");
export const getAddresses = () => request("/me/addresses");

// 백업용 니모닉. 이 단어들만 있으면 지갑을 통째로 되살릴 수 있다.
export const getMnemonic = () => request("/me/mnemonic");

export const createAddress = () => request("/me/address", { method: "POST" });

/*
 * 주소의 트랜잭션 내역.
 *
 * 예전에는 블록을 500개씩 받아다 여기서 훑었다. 그래서 내역이 "최근
 * 500블록"으로 잘렸다. 이제 노드가 주소별로 색인해 두므로 그대로 받는다.
 */
export const getAddressTransactions = (address, limit = 50) =>
  request(`/address/${address}/transactions?limit=${limit}`);
export const getPeers = () => request("/peers");
export const getMempool = () => request("/transactions");
export const getInfo = () => request("/info");

export const mineBlock = () => request("/blocks", { method: "POST" });

// amount 와 fee 는 최소 단위(lm) 정수다. 1 LIM = 100,000,000 lm.
export const sendCoins = (address, amount, fee) =>
  request("/transactions", {
    method: "POST",
    body: JSON.stringify({ address, amount, fee })
  });

export const connectPeer = peer =>
  request("/peers", { method: "POST", body: JSON.stringify({ peer }) });

export const getMining = () => request("/mining");

export const setMining = enabled =>
  request("/mining", { method: "POST", body: JSON.stringify({ enabled }) });
