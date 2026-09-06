import React, { Component } from "react";
import styled from "styled-components";
import { Card, CardTitle, CardBody, Label, Input, Button, Notice } from "../ui";

const Field = styled.div`
  margin-bottom: 14px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const initialState = { address: "", amount: "", busy: false, result: null };

class SendForm extends Component {
  state = { ...initialState };

  _change = key => event =>
    this.setState({ [key]: event.target.value, result: null });

  _submit = async event => {
    event.preventDefault();
    const address = this.state.address.trim();
    const amount = Number(this.state.amount);

    if (!address) {
      this.setState({ result: { tone: "error", text: "받는 주소를 입력하세요." } });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      this.setState({ result: { tone: "error", text: "금액은 0보다 큰 숫자여야 합니다." } });
      return;
    }

    this.setState({ busy: true, result: null });
    try {
      await this.props.onSend(address, amount);
      this.setState({
        ...initialState,
        result: { tone: "ok", text: `${amount} LIM 을 mempool 에 넣었습니다. 다음 블록에 담깁니다.` }
      });
    } catch (e) {
      this.setState({ busy: false, result: { tone: "error", text: e.message } });
    }
  };

  render() {
    const { address, amount, busy, result } = this.state;
    const { disabled } = this.props;
    return (
      <Card>
        <CardTitle>보내기</CardTitle>
        <CardBody>
          <form onSubmit={this._submit}>
            <Field>
              <Label htmlFor="send-address">받는 주소</Label>
              <Input
                id="send-address"
                mono
                autoComplete="off"
                spellCheck="false"
                placeholder="04 로 시작하는 130자 주소"
                value={address}
                onChange={this._change("address")}
                disabled={busy || disabled}
              />
            </Field>
            <Field>
              <Label htmlFor="send-amount">금액 (LIM)</Label>
              <Input
                id="send-amount"
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={amount}
                onChange={this._change("amount")}
                disabled={busy || disabled}
              />
            </Field>
            <Actions>
              <Button primary type="submit" disabled={busy || disabled}>
                {busy ? "보내는 중…" : "보내기"}
              </Button>
            </Actions>
          </form>
          {result && <Notice tone={result.tone}>{result.text}</Notice>}
        </CardBody>
      </Card>
    );
  }
}

export default SendForm;
