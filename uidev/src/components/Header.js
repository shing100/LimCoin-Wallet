import React from "react";
import styled from "styled-components";
import { PORT } from "../api";
import ThemeToggle from "./ThemeToggle";

const Bar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  height: 56px;
  flex: none;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
`;

const Coin = styled.span`
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accentText);
  font-size: 13px;
  font-weight: 800;
`;

const Status = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--textMuted);
`;

const Dot = styled.span`
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 7px;
  border-radius: 50%;
  background: ${props =>
    props.online ? "var(--positive)" : "var(--negative)"};
  box-shadow: 0 0 0 3px
    ${props =>
      props.online ? "rgba(63,185,80,.18)" : "rgba(248,81,73,.18)"};
`;

const Header = ({ online, peers }) => (
  <Bar>
    <Brand>
      <Coin>L</Coin>
      LimCoin Wallet
    </Brand>
    <Status>
      <span>
        <Dot online={online} />
        {online ? `노드 :${PORT}` : "노드 연결 끊김"}
      </span>
      <span>피어 {peers}</span>
      <ThemeToggle />
    </Status>
  </Bar>
);

export default Header;
