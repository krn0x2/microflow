import {
  Interpreter,
  StateSchema,
  EventData,
  Typestate,
  State,
  AnyEventObject,
} from 'xstate';
import _ from 'lodash';
import { transform, setOnPath } from '../utils';
import { WorkflowEvent } from '../types';

export class WorkflowInterpreter extends Interpreter<
  any,
  StateSchema,
  AnyEventObject,
  Typestate<any>
> {
  mSend(
    event: WorkflowEvent,
    payload?: EventData
  ): State<any, AnyEventObject, StateSchema, Typestate<any>> {
    const { type } = event;
    const data = _.get(event, 'data', {});
    const lastEventData = _.get(this.state.event, 'data', {});
    const { transitions } = this.machine.transition(this.state, event);
    const transition = _.head(transitions);
    const resultSelector = _.get(transition, 'resultSelector');
    const resultPath = _.get(transition, 'resultPath');
    const resultSelected = transform(resultSelector, data);
    const result = setOnPath(lastEventData, resultPath, resultSelected);
    return this.send({ type, data: result }, payload);
  }
}
