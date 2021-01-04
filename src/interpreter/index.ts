import {
  Interpreter,
  StateSchema,
  EventData,
  Typestate,
  State,
  InterpreterOptions,
  StateMachine
} from 'xstate';
import _ from 'lodash';
import { transform, setOnPath } from '../utils';
import { WorkflowEvent } from '../types';

export class WorkflowInterpreter extends Interpreter<
  any,
  StateSchema,
  WorkflowEvent,
  Typestate<any>
> {
  oldSend: any;
  constructor(
    machine: StateMachine<any, any, WorkflowEvent, Typestate<any>>,
    options?: Partial<InterpreterOptions>
  ) {
    super(machine, options);
    this.oldSend = this.send.bind(this);
    this.send = (
      event: WorkflowEvent,
      payload?: EventData
    ): State<any, WorkflowEvent, StateSchema, Typestate<any>> => {
      const { type } = event;
      const data = _.get(event, 'data', {});
      const lastEventData = _.get(this.state.event, 'data', {});
      const { transitions } = this.machine.transition(this.state, event);
      const transition = _.head(transitions);
      // console.log('transition', transition);
      const resultSelector = _.get(transition, 'resultSelector');
      const resultPath = _.get(transition, 'resultPath');
      if (event.type !== 'external') {
        const resultSelected = transform(resultSelector, data);
        // console.log('resultSelected', resultSelected);
        const result = setOnPath(lastEventData, resultPath, resultSelected);
        // console.log('result', result);
        return this.oldSend({ type, data: result }, payload);
      }
      return this.oldSend(event, payload);
    };
  }
}
