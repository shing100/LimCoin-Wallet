import React, { Component } from "react";
import styled from "styled-components";
import { Card, CardTitle, CardBody, Button, Notice, Mono } from "../ui";
import { radius } from "../theme";
import * as api from "../api";

const Warning = styled.p`
  margin: 0 0 14px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--textMuted);
`;

const Words = styled.ol`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px 12px;
  margin: 0 0 14px;
  padding: 14px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: ${radius.sm};
  list-style: none;
  counter-reset: word;
`;

const Word = styled.li`
  counter-increment: word;
  font-size: 12.5px;

  &::before {
    content: counter(word);
    display: inline-block;
    width: 20px;
    color: var(--textFaint);
    font-variant-numeric: tabular-nums;
  }
`;

const WordText = styled(Mono)`
  color: var(--text);
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
`;

/*
 * 씨앗을 24단어로 보관한다(BIP39).
 *
 * 이 단어들만 있으면 지갑을 통째로 되살릴 수 있다. 곧 화면에 띄우는 것은
 * 지갑을 여는 것과 같으므로, 기본은 가려 두고 눌러야 보이게 한다.
 */
class Backup extends Component {
  state = { mnemonic: null, shown: false, copied: false, error: null, busy: false };

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  _reveal = async () => {
    if (this.state.mnemonic !== null) {
      this.setState({ shown: !this.state.shown });
      return;
    }
    this.setState({ busy: true, error: null });
    try {
      const { mnemonic } = await api.getMnemonic();
      this.setState({ mnemonic, shown: true, busy: false });
    } catch (e) {
      this.setState({ busy: false, error: e.message });
    }
  };

  _copy = () => {
    if (!this.state.mnemonic || !navigator.clipboard) {
      return;
    }
    navigator.clipboard.writeText(this.state.mnemonic).then(() => {
      this.setState({ copied: true });
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.setState({ copied: false }), 1600);
    }, () => {});
  };

  render() {
    const { mnemonic, shown, copied, error, busy } = this.state;
    const { disabled } = this.props;

    return (
      <Card>
        <CardTitle>백업</CardTitle>
        <CardBody>
          <Warning>
            아래 단어를 순서대로 안전한 곳에 적어 두세요. 이 단어들만 있으면
            지갑을 되살릴 수 있고, 잃으면 되살릴 방법이 없습니다.
            <br />
            남에게 보여 주면 코인을 가져갈 수 있습니다.
          </Warning>

          {shown && mnemonic && (
            <Words>
              {mnemonic.split(" ").map((word, i) => (
                <Word key={i}>
                  <WordText>{word}</WordText>
                </Word>
              ))}
            </Words>
          )}

          <Actions>
            <Button onClick={this._reveal} disabled={busy || disabled}>
              {busy ? "불러오는 중…" : shown ? "가리기" : "니모닉 보기"}
            </Button>
            {shown && mnemonic && (
              <Button onClick={this._copy}>
                {copied ? "복사됨" : "복사"}
              </Button>
            )}
          </Actions>

          {error && <Notice tone="error">{error}</Notice>}
        </CardBody>
      </Card>
    );
  }
}

export default Backup;
