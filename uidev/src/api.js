// 이 렌더러가 붙을 LimCoin 노드를 찾는다.
//
// Electron 안에서는 메인 프로세스가 빈 포트를 잡아 global.sharedPort 로 넘겨준다.
// 브라우저에서 `yarn startReact` 로만 띄우는 경우에는 Electron 이 없으므로
// REACT_APP_NODE_PORT 또는 3000 으로 떨어진다.
const resolvePort = () => {
  try {
    if (typeof window !== "undefined" && window.require) {
      const { remote } = window.require("electron");
      const shared = remote.getGlobal("sharedPort");
      if (shared) {
        return shared;
      }
    }
  } catch (e) {
    // Electron 밖에서 실행 중. 아래 기본값을 쓴다.
  }
  return process.env.REACT_APP_NODE_PORT || 3000;
};

export const PORT = resolvePort();
export const API_URL = `http://localhost:${PORT}`;

const request = async (path, options) => {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const text = await res.text();
  if (!res.ok) {
    // 노드는 실패 시 본문에 사람이 읽을 메시지를 담아 준다.
    throw new Error(text || `요청이 실패했습니다 (HTTP ${res.status})`);
  }
  return text ? JSON.parse(text) : null;
};

export const getAddress = () =>
  fetch(`${API_URL}/me/address`).then(res => res.text());

export const getBalance = () => request("/me/balance");
export const getBlocks = () => request("/blocks");
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
