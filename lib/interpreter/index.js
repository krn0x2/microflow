"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowInterpreter = void 0;
const xstate_1 = require("xstate");
const _ = require("lodash");
const utils_1 = require("../utils");
class WorkflowInterpreter extends xstate_1.Interpreter {
    mSend(event, payload) {
        const { type } = event;
        const data = _.get(event, 'data', {});
        const lastEventData = _.get(this.state.event, 'data', {});
        const { transitions } = this.machine.transition(this.state, event);
        const transition = _.head(transitions);
        const { resultPath, resultSelector } = _.get(transition, 'meta.config', {});
        const resultSelected = utils_1.transform(resultSelector, data);
        const result = utils_1.setOnPath(lastEventData, resultPath, resultSelected);
        return this.send({ type, data: result }, payload);
    }
}
exports.WorkflowInterpreter = WorkflowInterpreter;
