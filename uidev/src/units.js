/**
 * 화폐 단위. 노드의 src/units.js 와 같은 규칙이어야 한다.
 *
 * 프로토콜과 API 는 최소 단위(lm) 정수로만 주고받는다.
 * 1 LIM = 100,000,000 lm — 비트코인의 사토시에 해당한다.
 * 화면에 보여 줄 때만 LIM 으로 환산하며, 부동소수점을 거치지 않는다.
 */
export const DECIMALS = 8;
export const COIN = 100000000;

// 사용자가 입력한 "1.5" 를 최소 단위 정수로.
export const parseLim = value => {
  const text = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(text)) {
    throw new Error("금액 형식이 올바르지 않습니다");
  }
  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > DECIMALS) {
    throw new Error(`소수점 아래는 ${DECIMALS}자리까지만 쓸 수 있습니다`);
  }
  const padded = (fraction + "0".repeat(DECIMALS)).slice(0, DECIMALS);
  return Number(whole) * COIN + Number(padded);
};

// 최소 단위 정수를 사람이 읽는 문자열로. 뒤따르는 0 은 떼어 낸다.
export const formatLim = amount => {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "—";
  }
  const negative = amount < 0;
  const abs = Math.abs(amount);
  const whole = Math.floor(abs / COIN);
  const fraction = String(abs % COIN).padStart(DECIMALS, "0").replace(/0+$/, "");
  const text = fraction
    ? `${whole.toLocaleString()}.${fraction}`
    : whole.toLocaleString();
  return negative ? `-${text}` : text;
};
