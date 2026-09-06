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
  blockchainServer = LimCoin.start(port);
  global.sharedPort = port;
  console.log(`Running blockchain node on: http://localhost:${port}`);
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1040,
    height: 720,
    minWidth: 720,
    minHeight: 560,
    // 첫 페인트까지 흰 화면이 번쩍이는 것을 막는다
    backgroundColor: "#0d1117",
    title: "LimCoin Wallet"
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
