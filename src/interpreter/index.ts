import {
  Interpreter,
  StateSchema,
  EventData,
  Typestate,
  State,
  InterpreterOptions,
  StateMachine,
  SCXML
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
      event: WorkflowEvent | SCXML.Event<WorkflowEvent>,
      payload?: EventData
    ): State<any, WorkflowEvent, StateSchema, Typestate<any>> => {
      const isSCXML = _.get(event, '$$type') === 'scxml';
      const data = isSCXML
        ? _.get(event, 'data.data', {})
        : _.get(event, 'data', {});
      const lastEventData = _.get(this.state.event, 'data', {});
      const { transitions } = this.machine.transition(this.state, event);
      const transition = _.head(transitions);
      const resultSelector = _.get(transition, 'resultSelector');
      const resultPath = _.get(transition, 'resultPath');
      const resultSelected = transform(resultSelector, data);
      const result = setOnPath(lastEventData, resultPath, resultSelected);
      // console.log('==================');
      // console.log('state => ', this.state.value);
      // console.log('resultSelector => ', resultSelector);
      // console.log('data => ', data);
      // console.log('resultSelected => ', resultSelected);
      // console.log('lastEventData => ', lastEventData);
      // console.log('resultPath => ', resultPath);
      // console.log('result =>', result);
      // console.log('==================');
      _.set(event, isSCXML ? 'data.data' : 'data', result);
      return this.oldSend(event, payload);
    };
  }
}
