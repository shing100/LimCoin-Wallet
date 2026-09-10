#!/usr/bin/env node
/**
 * 브랜드 마크에서 아이콘 파일을 만든다.
 *
 * 모양의 원본은 src/logo.json 하나뿐이다. 화면 안의 로고(components/Logo)와
 * 파비콘·창 아이콘이 같은 좌표를 쓴다 — 헤더의 로고를 고쳤는데 파비콘은
 * 옛 모양으로 남는 일이 없게.
 *
 * 익스플로러(LimCoin-Explorer/scripts/icons.js)와 같은 스크립트다.
 *
 *   node scripts/icons.js         SVG 만 다시 만든다 (의존성 없음)
 *   node scripts/icons.js --png   PNG·ICO 까지 (헤드리스 크로미움이 필요하다)
 *
 * --png 는 playwright-core 와 크로미움을 찾을 수 있을 때만 된다. 아이콘은
 * 자주 바꾸는 것이 아니라 결과물을 저장소에 함께 두고, 마크를 고칠 때만
 * 이 명령을 돌린다.
 *
 *   npm i -D playwright-core && node scripts/icons.js --png
 *   PLAYWRIGHT_CHROMIUM=/경로/chrome node scripts/icons.js --png
 */
const fs = require("fs");
const path = require("path");
const logo = require("../src/logo.json");

const OUT = path.resolve(__dirname, "..", "public");
const { viewBox: V, disc, rx, blocks, gold, ink, backdrop } = logo;

const rects = (fill, scale = 1, cx = V / 2, cy = V / 2) =>
  blocks
    .map(([x, y, w, h]) => {
      const nx = (cx + (x - V / 2) * scale).toFixed(2);
      const ny = (cy + (y - V / 2) * scale).toFixed(2);
      return `<rect x="${nx}" y="${ny}" width="${(w * scale).toFixed(2)}" height="${(h * scale).toFixed(2)}" rx="${(rx * scale).toFixed(2)}" fill="${fill}"/>`;
    })
    .join("");

const open = size =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${V} ${V}">`;

/*
 * 바탕이 비어 있는 판. 브라우저 탭이 밝든 어둡든 금화만 떠 있으면 된다.
 * 예전 판은 #161b22 사각형을 깔아서, 밝은 탭 막대에 검은 네모가 붙었다.
 */
const plain = size => `${open(size)}
  <circle cx="${disc.cx}" cy="${disc.cy}" r="${disc.r}" fill="${gold}"/>
  ${rects(ink)}
</svg>
`;

/*
 * iOS 홈 화면용. 애플이 알아서 모서리를 둥글려 주므로 바탕을 꽉 채운다 —
 * 투명하게 두면 검은 사각형 위에 얹힌다.
 */
const filled = size => `${open(size)}
  <rect width="${V}" height="${V}" fill="${gold}"/>
  ${rects(ink, 0.72)}
</svg>
`;

/*
 * 안드로이드 maskable. 기기마다 원·둥근사각형 등으로 잘라 내므로,
 * 가장자리 20% 안에는 아무것도 두지 않는다(안전 영역 = 지름의 80%).
 */
const maskable = size => `${open(size)}
  <rect width="${V}" height="${V}" fill="${backdrop}"/>
  <circle cx="${disc.cx}" cy="${disc.cy}" r="${disc.r * 0.8}" fill="${gold}"/>
  ${rects(ink, 0.8)}
</svg>
`;

const SVGS = {
  "icon.svg": plain(512),
  "icon-apple.svg": filled(512),
  "icon-maskable.svg": maskable(512)
};

const writeSvgs = () => {
  Object.entries(SVGS).forEach(([name, body]) => {
    fs.writeFileSync(path.join(OUT, name), body);
    console.log(`${name}`);
  });
};

/*
 * PNG 여러 장을 ICO 한 장으로 묶는다.
 *
 * ICO 는 BMP 만 담을 수 있던 옛 형식이지만, 요즘 브라우저는 안에 PNG 가
 * 들어 있어도 읽는다. 그래서 PNG 를 그대로 넣는다 — BMP 인코더를 쓸 이유가 없다.
 */
const packIco = images => {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = 아이콘
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  images.forEach(({ size, data }, i) => {
    const at = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, at); // 0 은 256 을 뜻한다
    dir.writeUInt8(size >= 256 ? 0 : size, at + 1);
    dir.writeUInt8(0, at + 2); // 팔레트 색 수 (PNG 라 0)
    dir.writeUInt8(0, at + 3); // reserved
    dir.writeUInt16LE(1, at + 4); // 색면 수
    dir.writeUInt16LE(32, at + 6); // 비트 깊이
    dir.writeUInt32LE(data.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });

  return Buffer.concat([header, dir, ...images.map(i => i.data)]);
};

const writePngs = async () => {
  let chromium;
  try {
    ({ chromium } = require("playwright-core"));
  } catch (e) {
    console.error(
      "PNG 를 만들려면 playwright-core 가 필요합니다:\n" +
        "  npm i -D playwright-core && node scripts/icons.js --png\n" +
        "SVG 만 다시 만들었습니다."
    );
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {}
  );
  const shoot = async (svg, size) => {
    const ctx = await browser.newContext({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1
    });
    const page = await ctx.newPage();
    await page.setContent(`<style>html,body{margin:0;padding:0}</style>${svg}`);
    await page.waitForTimeout(120);
    const buffer = await page.screenshot({ omitBackground: true });
    await ctx.close();
    return buffer;
  };

  const jobs = [
    ["icon-192.png", plain, 192],
    ["icon-512.png", plain, 512],
    ["icon-maskable-512.png", maskable, 512],
    ["apple-touch-icon.png", filled, 180]
  ];
  for (const [name, make, size] of jobs) {
    fs.writeFileSync(path.join(OUT, name), await shoot(make(size), size));
    console.log(`${name} ${size}x${size}`);
  }

  // 파비콘은 16·32·48 세 장을 한 파일에 담는다 (브라우저가 골라 쓴다)
  const images = [];
  for (const size of [16, 32, 48]) {
    images.push({ size, data: await shoot(plain(size), size) });
  }
  fs.writeFileSync(path.join(OUT, "favicon.ico"), packIco(images));
  console.log("favicon.ico 16/32/48");

  await browser.close();
};

(async () => {
  writeSvgs();
  if (process.argv.includes("--png")) {
    await writePngs();
  }
})();
