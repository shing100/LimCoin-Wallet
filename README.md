# LimCoin Wallet

LimCoin 용 Electron 데스크톱 지갑 (Windows / Linux / macOS).

Electron 메인 프로세스가 LimCoin 노드를 빈 포트에 직접 띄우고,
React 렌더러가 `global.sharedPort` 로 그 포트를 읽어 붙는다.

## 시작하기

```bash
yarn install
cd uidev && yarn install && cd ..

yarn dev          # React 개발서버 + Electron 을 같이 띄운다
```

따로 띄우려면:

```bash
yarn startReact   # http://localhost:3000
yarn start        # ENV=dev 로 Electron 실행
```

배포용 빌드:

```bash
yarn build        # uidev/build 생성
yarn start:prod   # 빌드된 파일을 로드
```

테스트:

```bash
yarn test         # LimCoin 노드의 검증 로직 테스트
```

## 금액 단위

노드와 주고받는 값은 전부 최소 단위(lm) 정수다. **1 LIM = 100,000,000 lm** —
비트코인의 사토시에 해당한다. 화면에서만 LIM 으로 환산하며 부동소수점을
거치지 않는다 (`src/units.js`).

송금할 때 수수료를 지정할 수 있다. 수수료는 별도 출력이 아니라
"입력합 - 출력합" 의 차액이고, 그 트랜잭션을 담은 블록의 채굴자가 가져간다.

## 노드와의 연결

Electron 메인 프로세스가 노드를 띄우면서 두 가지를 렌더러에 넘긴다.

- `sharedPort` — 노드가 잡은 빈 포트
- `sharedWalletToken` — 지갑 API 토큰

노드의 지갑 엔드포인트(`/me/*`, 송금, 채굴)는 토큰을 요구한다. 이게 없으면
그 포트에 닿는 누구나 코인을 빼갈 수 있다. 토큰은 메인 프로세스 밖으로
나가지 않는다.

체인은 `app.getPath("userData")/chain` 에 저장된다. 포트는 뜰 때마다
달라지므로 포트별 기본 경로를 쓰면 재시작할 때마다 새 체인이 된다.

브라우저로만 띄워 시험할 때는 노드를 `LIMCOIN_WALLET_TOKEN=none` 으로
띄우거나, 콘솔에서 `window.LIMCOIN_WALLET_TOKEN` 에 토큰을 넣으면 된다.

## 내역의 범위

노드에 주소별 색인이 없어서 내역은 최근 500블록을 훑어 만든다. 그보다
오래된 거래는 여기서 보이지 않는다.

## 개인키

노드 지갑의 개인키는 `LimCoin/src/privateKey` 에 저장되며 첫 실행 시 자동 생성된다.
**`.gitignore` 대상이고 절대 커밋하면 안 된다.**

> 과거 버전은 제네시스 주소의 개인키를 저장소에 함께 커밋했다.
> 그 주소는 폐기되었고 해당 키는 더 이상 사용해서는 안 된다.

## `LimCoin/` 디렉터리에 대하여

`LimCoin/` 은 [shing100/LimCoin](https://github.com/shing100/LimCoin) 의
소스를 그대로 복사해 둔 것이다(서브모듈이 아니다).

이 때문에 원본과 조용히 어긋난다 — 실제로 한동안 원본보다 오래된 스냅샷이
들어 있었다. 원본이 바뀌면 `LimCoin/src`, `LimCoin/scripts`,
`LimCoin/test`, `LimCoin/package.json` 을 직접 맞춰 줘야 한다.

같은 체인에 붙으려면 **`LimCoin/src/genesis.json` 이 접속하려는 노드와
동일해야 한다.**

> TODO: git submodule 이나 `file:` 의존성으로 바꿔서 복사본을 없앨 것.
