const electron = require("electron"),
  path = require("path"),
  url = require("url"),
  getPort = require("get-port"),
  LimCoin = require("./LimCoin/src/server");

const { app, BrowserWindow } = electron;

let mainWindow = null;
let blockchainServer = null;

// 빈 포트를 하나 잡아 블록체인 노드를 띄우고, 렌더러가 읽을 수 있게 공유한다.
const startBlockchainNode = async () => {
  const port = await getPort();

  /*
   * 체인은 앱 데이터 폴더에 저장한다.
   *
   * 포트는 뜰 때마다 달라지므로(getPort) 포트별 기본 경로를 쓰면 재시작할
   * 때마다 새 체인이 된다. 지갑은 같은 체인을 계속 이어 가야 한다.
   */
  const dataDir = path.join(app.getPath("userData"), "chain");

  blockchainServer = LimCoin.start(port, { dataDir });
  global.sharedPort = port;

  /*
   * 노드의 지갑 API 는 토큰을 요구한다(포트에 닿는 아무나 코인을 빼가지
   * 못하게). 우리는 그 노드를 같은 프로세스에서 띄웠으므로 토큰을 알고
   * 있고, 렌더러에 넘겨준다. 토큰은 이 프로세스 밖으로 나가지 않는다.
   */
  global.sharedWalletToken = LimCoin.WALLET_TOKEN;

  console.log(`Running blockchain node on: http://localhost:${port}`);
  console.log(`Chain data: ${dataDir}`);
};

/*
 * 창·작업표시줄 아이콘.
 *
 * 없으면 기본 일렉트론 아이콘(회색 원자 모양)이 뜬다 — 사용자 눈에는 "남의
 * 앱"으로 보인다. macOS 는 이 값을 무시하고 .app 번들의 아이콘을 쓴다.
 *
 * 저장소에 있는 파일을 가리킨다(빌드하지 않아도 있는 자리다).
 * 모양의 원본은 uidev/src/logo.json — uidev/scripts/icons.js 가 만든다.
 */
const WINDOW_ICON = path.join(__dirname, "uidev", "public", "icon-512.png");

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1040,
    height: 720,
    minWidth: 720,
    minHeight: 560,
    // 첫 페인트까지 흰 화면이 번쩍이는 것을 막는다
    backgroundColor: "#0d1117",
    title: "LimCoin Wallet",
    icon: WINDOW_ICON
  });

  if (process.env.ENV === "dev") {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "uidev", "build", "index.html"),
        protocol: "file",
        slashes: true
      })
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

app.on("ready", () => {
  // 노드가 뜬 뒤에 창을 연다. 그래야 렌더러가 sharedPort 를 읽을 수 있다.
  startBlockchainNode()
    .then(createWindow)
    .catch(e => {
      console.error("Failed to start the blockchain node:", e);
      app.quit();
    });
});

app.on("window-all-closed", () => {
  // macOS 는 창을 닫아도 앱이 살아 있는 것이 관례지만,
  // 이 앱은 블록체인 노드를 물고 있으므로 같이 정리한다.
  app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("will-quit", () => {
  if (blockchainServer !== null) {
    blockchainServer.close();
    blockchainServer = null;
  }
});
