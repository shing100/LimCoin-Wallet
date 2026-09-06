import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { baseStyles } from "./ui";

// 예전에는 여기서 window.require("electron") 을 무조건 불러서
// 브라우저(yarn startReact)로 띄우면 즉시 죽었다.
// 노드 포트 해석은 api.js 가 Electron 유무를 보고 처리한다.
baseStyles();

ReactDOM.render(<App />, document.getElementById("root"));
