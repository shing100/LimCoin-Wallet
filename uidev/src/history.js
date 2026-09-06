// 노드에는 "내 트랜잭션" 엔드포인트가 없다.
// 전체 블록을 훑어서 내 주소가 얽힌 것만 골라 낸다.

const isCoinbase = tx =>
  tx.txIns.length === 1 && tx.txIns[0].txOutId === "";

// txIn 은 (txOutId, txOutIndex) 로 이전 출력을 가리킬 뿐 주소를 갖고 있지 않다.
// 보낸 금액을 알려면 그 출력을 되짚어야 하므로 색인을 만든다.
const indexOutputs = blocks => {
  const index = new Map();
  blocks.forEach(block =>
    (block.data || []).forEach(tx =>
      tx.txOuts.forEach((txOut, i) => index.set(`${tx.id}:${i}`, txOut))
    )
  );
  return index;
};

// 내 주소로 들어온 금액과 내 주소에서 나간 금액을 견줘 종류를 정한다.
// 거스름돈이 나에게 되돌아오므로 단순히 txOuts 합을 쓰면 안 된다.
const classify = (tx, received, spent, address) => {
  if (isCoinbase(tx)) {
    return { kind: "mined", amount: received };
  }
  if (spent === 0) {
    return { kind: "received", amount: received };
  }
  // 출력이 전부 내 주소면 본인 이체다. 이때 실제로 줄어드는 것은 수수료뿐이다.
  // (수수료가 생기기 전에는 received === spent 로 판별했지만, 이제는 그
  //  차액이 곧 수수료라 같아지지 않는다)
  if (tx.txOuts.every(txOut => txOut.address === address)) {
    return { kind: "self", amount: spent - received };
  }
  if (spent > received) {
    return { kind: "sent", amount: spent - received };
  }
  return { kind: "received", amount: received - spent };
};

/*
 * mempool 에 쌓인 수수료 합. 다음 블록을 채굴하면 채굴자가 가져갈 금액이다.
 * txIn 은 금액을 갖고 있지 않으므로 여기서도 이전 출력을 되짚어야 한다.
 */
export const sumMempoolFees = (blocks, mempool) => {
  const outputs = indexOutputs(blocks);
  return mempool.reduce((total, tx) => {
    const inputs = tx.txIns.reduce((sum, txIn) => {
      const source = outputs.get(`${txIn.txOutId}:${txIn.txOutIndex}`);
      return source ? sum + source.amount : sum;
    }, 0);
    const outputsSum = tx.txOuts.reduce((sum, txOut) => sum + txOut.amount, 0);
    return total + Math.max(0, inputs - outputsSum);
  }, 0);
};

export const buildHistory = (blocks, address) => {
  if (!address) {
    return [];
  }
  const outputs = indexOutputs(blocks);
  const history = [];

  blocks.forEach(block =>
    (block.data || []).forEach(tx => {
      const received = tx.txOuts
        .filter(txOut => txOut.address === address)
        .reduce((sum, txOut) => sum + txOut.amount, 0);

      const spent = tx.txIns.reduce((sum, txIn) => {
        const source = outputs.get(`${txIn.txOutId}:${txIn.txOutIndex}`);
        return source && source.address === address ? sum + source.amount : sum;
      }, 0);

      if (received === 0 && spent === 0) {
        return; // 나와 무관한 트랜잭션
      }

      const { kind, amount } = classify(tx, received, spent, address);

      history.push({
        id: tx.id,
        kind,
        amount,
        blockIndex: block.index,
        timestamp: block.timestamp,
        counterparty:
          kind === "sent"
            ? (tx.txOuts.find(txOut => txOut.address !== address) || {}).address
            : null
      });
    })
  );

  // 최신 블록이 위로
  return history.sort((a, b) => b.blockIndex - a.blockIndex);
};
