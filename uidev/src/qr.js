/*
 * QR 코드 만들기 (byte 모드, 오류정정 M, 버전 1~6).
 *
 * 왜 직접 쓰는가: 주소를 휴대폰이나 다른 기계로 옮기는 가장 확실한 방법이
 * QR 인데, 이걸 위해 라이브러리를 하나 더 매달고 싶지 않았다. 더 중요한
 * 이유는 **주소를 바깥으로 보내지 않기 위해서**다. QR 이미지를 만들어 주는
 * 웹 서비스에 받을 주소를 넘기면 그 서비스는 내 주소를 알게 된다. 지갑은
 * 아예 오프라인에서도 떠야 하는 물건이라 더더욱 밖에 물을 일이 아니다.
 *
 * 익스플로러(LimCoin-Explorer/src/qr.js)와 같은 파일이다. 고칠 일이 있으면
 * 두 곳을 같이 고칠 것.
 *
 * 범위를 좁게 잡았다 — byte 모드, 오류정정 M, 버전 6 까지. 버전 6-M 은
 * 106 바이트를 담는다. LimCoin 주소는 34자 안팎이라 충분하고, 버전 7 부터
 * 필요한 "버전 정보 블록"을 구현하지 않아도 된다.
 *
 * 규격은 ISO/IEC 18004. 배치 순서와 마스크 벌점은 표준 그대로다.
 */

// ── GF(256) ────────────────────────────────────────────────────────────
// 원시 다항식 0x11D. 오류정정 부호(Reed-Solomon)가 이 체 위에서 돈다.
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    EXP[i] = EXP[i - 255];
  }
})();

const mul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

// 생성 다항식 (x-α⁰)(x-α¹)…(x-α^(n-1)) 의 계수
export const rsGenerator = degree => {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= mul(poly[j], EXP[i]);
    }
    poly = next;
  }
  // 최고차항 계수 1 은 나눗셈에 쓰지 않는다
  return poly.slice(1);
};

const rsEncode = (data, degree) => {
  const gen = rsGenerator(degree);
  const rest = new Uint8Array(degree);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rest[0];
    rest.copyWithin(0, 1);
    rest[degree - 1] = 0;
    for (let j = 0; j < degree; j++) {
      rest[j] ^= mul(gen[j], factor);
    }
  }
  return rest;
};

// ── 버전별 용량 (오류정정 M) ────────────────────────────────────────────
const SPEC = {
  1: { total: 26, ecPerBlock: 10, blocks: 1 },
  2: { total: 44, ecPerBlock: 16, blocks: 1 },
  3: { total: 70, ecPerBlock: 26, blocks: 1 },
  4: { total: 100, ecPerBlock: 18, blocks: 2 },
  5: { total: 134, ecPerBlock: 24, blocks: 2 },
  6: { total: 172, ecPerBlock: 16, blocks: 4 }
};

export const MAX_VERSION = 6;

const dataCapacity = version => {
  const spec = SPEC[version];
  return spec.total - spec.ecPerBlock * spec.blocks;
};

// ── 비트 쌓기 ──────────────────────────────────────────────────────────
const utf8Bytes = text => {
  // 주소는 ASCII 지만, 라벨이 붙은 URI 를 담을 수도 있으므로 UTF-8 로 넣는다
  const out = [];
  for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const low = text.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00);
        i++;
      }
    }
    if (code < 0x80) {
      out.push(code);
    } else if (code < 0x800) {
      out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      out.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return out;
};

const codewordsFor = (bytes, version) => {
  const capacity = dataCapacity(version);
  const bits = [];
  const push = (value, count) => {
    for (let i = count - 1; i >= 0; i--) {
      bits.push((value >> i) & 1);
    }
  };

  push(0b0100, 4); // byte 모드
  push(bytes.length, 8); // 버전 1~9 는 길이 8비트
  bytes.forEach(b => push(b, 8));

  // 종료자 0000 (남는 자리만큼만)
  const limit = capacity * 8;
  for (let i = 0; i < 4 && bits.length < limit; i++) {
    bits.push(0);
  }
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const words = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    words.push(byte);
  }
  // 남는 자리는 0xEC, 0x11 을 번갈아 채운다 (규격에 정해진 값)
  for (let i = 0; words.length < capacity; i++) {
    words.push(i % 2 === 0 ? 0xec : 0x11);
  }
  return words;
};

/*
 * 블록으로 쪼개 각각 오류정정 부호를 붙이고, 규격이 정한 순서로 섞는다.
 * 섞는 이유: 코드 한 귀퉁이가 가려져도 손실이 여러 블록에 나뉘어 복구된다.
 */
const interleave = (words, version) => {
  const { blocks, ecPerBlock } = SPEC[version];
  const perBlock = words.length / blocks;
  const data = [];
  const ec = [];
  for (let b = 0; b < blocks; b++) {
    const chunk = words.slice(b * perBlock, (b + 1) * perBlock);
    data.push(chunk);
    ec.push(rsEncode(chunk, ecPerBlock));
  }

  const out = [];
  for (let i = 0; i < perBlock; i++) {
    data.forEach(block => out.push(block[i]));
  }
  for (let i = 0; i < ecPerBlock; i++) {
    ec.forEach(block => out.push(block[i]));
  }
  return out;
};

// ── 격자 그리기 ────────────────────────────────────────────────────────
const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  x => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
];

// 15비트 형식 정보: BCH(15,5) 뒤 0x5412 로 뒤섞는다
export const formatBits = (ecBits, mask) => {
  const data = (ecBits << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ ((rem >> 9) * 0x537);
  }
  return (((data << 10) | rem) ^ 0x5412) & 0x7fff;
};

const build = (version, codewords, mask) => {
  const size = version * 4 + 17;
  const modules = [];
  const fixed = [];
  for (let y = 0; y < size; y++) {
    modules.push(new Array(size).fill(false));
    fixed.push(new Array(size).fill(false));
  }

  const set = (x, y, on) => {
    modules[y][x] = on;
    fixed[y][x] = true;
  };

  // 세 귀퉁이의 큰 눈 — 스캐너가 방향과 크기를 잡는 표식
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) {
          const d = Math.max(Math.abs(dx), Math.abs(dy));
          set(x, y, d !== 2 && d <= 3);
        }
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);

  // 가운데 작은 눈 (버전 2 부터). 큰 코드가 휘어도 좌표를 잡아 준다.
  if (version >= 2) {
    const c = size - 7;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        set(c + dx, c + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  // 타이밍 — 모듈 크기를 세는 눈금
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  // 형식 정보가 들어갈 자리를 미리 막아 둔다 (값은 마지막에)
  for (let i = 0; i < 9; i++) {
    if (!fixed[i][8]) set(8, i, false);
    if (!fixed[8][i]) set(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    if (!fixed[8][size - 1 - i]) set(size - 1 - i, 8, false);
    if (!fixed[size - 1 - i][8]) set(8, size - 1 - i, false);
  }
  set(8, size - 8, true); // 언제나 검은 모듈

  // 데이터: 오른쪽 아래에서 두 칸씩 왼쪽으로, 위아래로 지그재그
  let bit = 0;
  const totalBits = codewords.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    const col = right === 6 ? 5 : right;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = col - j;
        const upward = ((col + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!fixed[y][x] && bit < totalBits) {
          const on = ((codewords[bit >> 3] >> (7 - (bit & 7))) & 1) === 1;
          modules[y][x] = on;
          bit++;
        }
      }
    }
  }

  // 마스크는 데이터 칸에만 건다
  const fn = MASKS[mask];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!fixed[y][x] && fn(x, y)) {
        modules[y][x] = !modules[y][x];
      }
    }
  }

  // 형식 정보 (오류정정 M = 0b00)
  const bits = formatBits(0b00, mask);
  const at = i => ((bits >> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) modules[i][8] = at(i);
  modules[7][8] = at(6);
  modules[8][8] = at(7);
  modules[8][7] = at(8);
  for (let i = 9; i < 15; i++) modules[8][14 - i] = at(i);
  for (let i = 0; i < 8; i++) modules[8][size - 1 - i] = at(i);
  for (let i = 8; i < 15; i++) modules[size - 15 + i][8] = at(i);

  return modules;
};

/*
 * 마스크 벌점 — 규격이 정한 네 가지.
 *
 * 어느 마스크를 쓰든 읽히기는 하지만, 같은 색이 길게 이어지거나 눈 모양을
 * 닮은 무늬가 생기면 스캐너가 헷갈린다. 여덟 개를 다 만들어 보고 벌점이
 * 가장 낮은 것을 고른다.
 */
const penalty = modules => {
  const size = modules.length;
  let score = 0;

  // 눈(finder)을 닮은 무늬. 이게 데이터 칸에 생기면 스캐너가 방향을 잘못 잡는다.
  const FINDER = [true, false, true, true, true, false, true];
  const LIGHT4 = [false, false, false, false];
  const looksLikeFinder = (get, at) => {
    for (let i = 0; i < 7; i++) {
      if (get(at + i) !== FINDER[i]) return false;
    }
    // 한쪽에 흰 네 칸이 붙어 있어야 규격이 말하는 그 무늬다
    const before = LIGHT4.every((_, i) => get(at - 4 + i) === false);
    const after = LIGHT4.every((_, i) => get(at + 7 + i) === false);
    return before || after;
  };

  const scan = get => {
    // 코드 밖은 흰 여백으로 친다
    const safe = i => (i < 0 || i >= size ? false : get(i));

    let run = 1;
    for (let i = 1; i < size; i++) {
      if (safe(i) === safe(i - 1)) {
        run++;
      } else {
        if (run >= 5) score += 3 + (run - 5);
        run = 1;
      }
    }
    if (run >= 5) score += 3 + (run - 5);

    for (let i = 0; i <= size - 7; i++) {
      if (looksLikeFinder(safe, i)) score += 40;
    }
  };

  for (let i = 0; i < size; i++) {
    scan(j => modules[i][j]); // 가로
    scan(j => modules[j][i]); // 세로
  }

  // 2×2 같은 색 덩어리
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const v = modules[y][x];
      if (v === modules[y][x + 1] && v === modules[y + 1][x] && v === modules[y + 1][x + 1]) {
        score += 3;
      }
    }
  }

  // 검은 비율이 50% 에서 멀수록 벌점
  let dark = 0;
  modules.forEach(row =>
    row.forEach(v => {
      if (v) dark++;
    })
  );
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
};

/**
 * 문자열 하나를 QR 격자로. 여백(quiet zone)은 넣지 않는다 — 그리는 쪽에서
 * 붙인다. 담을 수 없이 길면 null 을 돌려준다(그림 대신 글자를 보여 주면 된다).
 *
 * @returns {boolean[][]|null} modules[행][열], true 가 검은 칸
 */
export const qrMatrix = text => {
  const bytes = utf8Bytes(String(text));
  let version = 0;
  for (let v = 1; v <= MAX_VERSION; v++) {
    // 4비트 모드 + 8비트 길이 = 2바이트를 머리에 쓴다
    if (bytes.length + 2 <= dataCapacity(v)) {
      version = v;
      break;
    }
  }
  if (version === 0) {
    return null;
  }

  const codewords = interleave(codewordsFor(bytes, version), version);

  let best = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const modules = build(version, codewords, mask);
    const score = penalty(modules);
    if (score < bestScore) {
      bestScore = score;
      best = modules;
    }
  }
  return best;
};
