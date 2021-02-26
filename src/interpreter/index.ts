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
      const isMapNode = _.get(
        this.state,
        'activities.task.activity.src.isMap',
        false
      );
      const { context: ctx } = this.state;
      const { transitions } = this.machine.transition(this.state, event);
      const transition = _.head(transitions);
      const resultSelector = _.get(transition, 'resultSelector');
      const resultPath = _.get(transition, 'resultPath');
      const resultSelected = isMapNode
        ? data.map((value, index) =>
            transform(
              resultSelector,
              {
                _: data,
                _task: {
                  executionId: ctx.wfid,
                  name: ctx.name,
                  item: { value, index }
                },
                _env: process.env
              },
              value
            )
          )
        : transform(resultSelector, {
            _: data,
            _env: process.env
          });
      const result = setOnPath(lastEventData, resultPath, resultSelected);
      _.set(event, isSCXML ? 'data.data' : 'data', result);
      return this.oldSend(event, payload);
    };
  }
}
