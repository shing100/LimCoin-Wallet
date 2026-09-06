/**
 * 지갑 내역.
 *
 * 예전에는 블록을 500개씩 받아다 여기서 훑어 만들었다. 그래서 내역이
 * "최근 500블록"으로 잘렸고, 노드가 이미 아는 것을 다시 계산했다.
 *
 * 이제 노드가 주소별로 색인해 두므로 주소마다 받아서 합치기만 하면 된다.
 * 한 트랜잭션이 내 주소를 여럿 건드릴 수 있으므로(보낸 주소 + 거스름돈
 * 주소) txId 로 묶는다.
 */

// 지갑 전체 기준으로 이 트랜잭션이 무엇이었는지 가린다.
const classify = entry => {
  const { coinbase, outputTotal, received, spent } = entry;

  if (coinbase) {
    return { kind: "mined", amount: received };
  }
  if (spent === 0) {
    return { kind: "received", amount: received };
  }
  // 출력이 전부 내 주소로 돌아왔다면 본인 이체다.
  // 이때 실제로 줄어드는 것은 수수료뿐이다.
  if (received === outputTotal) {
    return { kind: "self", amount: spent - received };
  }
  if (spent > received) {
    return { kind: "sent", amount: spent - received };
  }
  return { kind: "received", amount: received - spent };
};

export const mergeHistory = (perAddress, pending = []) => {
  const byTx = new Map();

  for (const entries of perAddress) {
    for (const entry of entries) {
      const merged = byTx.get(entry.txId) || {
        txId: entry.txId,
        blockIndex: entry.blockIndex,
        timestamp: entry.timestamp,
        coinbase: entry.coinbase,
        outputTotal: entry.outputTotal,
        received: 0,
        spent: 0
      };
      merged.received += entry.received;
      merged.spent += entry.spent;
      byTx.set(entry.txId, merged);
    }
  }

  const confirmed = Array.from(byTx.values())
    .map(entry => ({
      id: entry.txId,
      blockIndex: entry.blockIndex,
      timestamp: entry.timestamp,
      pending: false,
      ...classify(entry)
    }))
    .sort((a, b) => b.blockIndex - a.blockIndex);

  /*
   * 아직 담기지 않은 것은 위에 붙인다.
   *
   * 노드가 /me/pending 으로 색인과 같은 모양으로 내주므로 classify 를
   * 그대로 쓴다. 블록이 없으니 높이도 시각도 없다.
   */
  const waiting = pending.map(entry => ({
    id: entry.txId,
    blockIndex: null,
    timestamp: null,
    pending: true,
    fee: entry.fee,
    ...classify(entry)
  }));

  return [...waiting, ...confirmed];
};
