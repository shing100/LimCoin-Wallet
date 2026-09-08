import React, { Component } from "react";
import styled from "styled-components";
import { Card, CardTitle, CardBody, Label, Input, Button, Notice } from "../ui";
import { parseLim, formatLim } from "../units";

const Field = styled.div`
  margin-bottom: 14px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Total = styled.p`
  margin: 0;
  font-size: 12px;
  color: var(--textMuted);
  font-variant-numeric: tabular-nums;
`;

const Hint = styled.span`
  font-weight: 400;
  color: var(--textFaint);
`;

const Recommend = styled.button`
  padding: 0;
  border: none;
  background: none;
  color: var(--accent);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;

const initialState = {
  address: "",
  amount: "",
  fee: "",
  feeTouched: false,
  busy: false,
  result: null
};

/*
 * 수수료 기본값은 노드가 권한 값이다.
 *
 * 예전에는 0.001 LIM 고정이었다. mempool 이 비어 있으면 그것도 과하고,
 * 붐비면 그걸로는 담기지 않는다. 노드가 지금 mempool 을 보고 입력 하나당
 * 얼마면 다음 블록에 담기는지 알려 주므로(/info 의 recommendedFeePerInput)
 * 그것을 채워 둔다. 사람이 고치기 전까지만 따라간다.
 */
class SendForm extends Component {
  state = { ...initialState };

  _recommended = () => {
    const { recommendedFee } = this.props;
    return typeof recommendedFee === "number" ? formatLim(recommendedFee) : "0.001";
  };

  // 사람이 손대기 전에는 권장값을 따라간다
  _fee = () => (this.state.feeTouched ? this.state.fee : this._recommended());

  _useRecommended = () => this.setState({ fee: "", feeTouched: false, result: null });

  _change = key => event =>
    this.setState({
      [key]: event.target.value,
      result: null,
      ...(key === "fee" ? { feeTouched: true } : {})
    });

  // 화면에서는 LIM 으로 받고, 노드에는 최소 단위 정수로 보낸다.
  _parsed = () => {
    const address = this.state.address.trim();
    if (!address) {
      throw new Error("받는 주소를 입력하세요.");
    }
    const amount = parseLim(this.state.amount || "0");
    if (amount <= 0) {
      throw new Error("금액은 0보다 커야 합니다.");
    }
    const fee = parseLim(this._fee() || "0");
    return { address, amount, fee };
  };

  _submit = async event => {
    event.preventDefault();

    let parsed;
    try {
      parsed = this._parsed();
    } catch (e) {
      this.setState({ result: { tone: "error", text: e.message } });
      return;
    }

    this.setState({ busy: true, result: null });
    try {
      await this.props.onSend(parsed.address, parsed.amount, parsed.fee);
      this.setState({
        ...initialState,
        result: {
          tone: "ok",
          text: `${formatLim(parsed.amount)} LIM 을 mempool 에 넣었습니다. 다음 블록에 담깁니다.`
        }
      });
    } catch (e) {
      this.setState({ busy: false, result: { tone: "error", text: e.message } });
    }
  };

  // 지갑에서 실제로 빠져나가는 금액 = 보내는 금액 + 수수료
  _total = () => {
    try {
      const { amount, fee } = this._parsed();
      return formatLim(amount + fee);
    } catch (e) {
      return null;
    }
  };

  render() {
    const { address, amount, feeTouched, busy, result } = this.state;
    const fee = this._fee();
    const total = this._total();
    const { disabled, congested } = this.props;
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
            <Row>
              <div>
                <Label htmlFor="send-amount">금액 (LIM)</Label>
                <Input
                  id="send-amount"
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={this._change("amount")}
                  disabled={busy || disabled}
                />
              </div>
              <div>
                <Label htmlFor="send-fee">
                  수수료{" "}
                  <Hint>
                    {feeTouched ? (
                      <Recommend type="button" onClick={this._useRecommended}>
                        권장 {this._recommended()} 으로
                      </Recommend>
                    ) : congested ? (
                      "(붐빔 · 권장값)"
                    ) : (
                      "(권장값)"
                    )}
                  </Hint>
                </Label>
                <Input
                  id="send-fee"
                  inputMode="decimal"
                  placeholder="0"
                  value={fee}
                  onChange={this._change("fee")}
                  disabled={busy || disabled}
                />
              </div>
            </Row>
            <Actions>
              <Total>{total ? `합계 ${total} LIM 차감` : ""}</Total>
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
