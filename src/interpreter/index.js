const { Interpreter } = require("xstate");
const _ = require("lodash");
const { transform, setOnPath } = require("../utils");

module.exports = class MyInterpreter extends Interpreter {
  mSend(event, payload) {
    const { type } = event;
    const data = _.get(event, "data", {});
    const lastEventData = _.get(this._state.event, "data", {});
    const { transitions } = this.machine.transition(this._state, event);
    const transition = _.head(transitions);
    const { resultPath, resultSelector } = _.get(transition, "meta.config", {});
    const resultSelected = transform(resultSelector, data);
    const result = setOnPath(lastEventData, resultPath, resultSelected);
    return this.send({ type, data: result }, payload);
  }
};
