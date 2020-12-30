import _ from 'lodash';
import { Promise as BluebirdPromise } from 'bluebird';
import { State } from 'xstate';
import { WorkflowInterpreter } from '../interpreter';
import {
  IExecution,
  SendEventResponse,
  SendEventSuccess,
  WorkflowEvent
} from '../types';
import { getMachine } from '../utils/xstate';
import { EntityController } from '.';

export class Execution extends EntityController<IExecution, string> {
  async send(event: WorkflowEvent): Promise<SendEventResponse> {
    const { definition, currentJson, id } = await this.data();
    const fetchMachine = getMachine(
      definition,
      this.jwt.secretOrPublicKey,
      this.jwt.sign
    );
    const previousState = State.create(currentJson) as State<
      any,
      WorkflowEvent
    >;
    const resolvedState = fetchMachine.resolveState(previousState);
    if (resolvedState.done)
      throw {
        message: `The execution id : ${id} has already ended`
      };
    const { nextEvents } = resolvedState;
    const { type } = event;
    console.log('State=>', resolvedState);
    console.log('Event=>', event);
    if (!_.includes(nextEvents, type))
      throw { message: `The event of type : ${type} is not allowed` };

    const service = new WorkflowInterpreter(fetchMachine).start(
      resolvedState
    ) as WorkflowInterpreter;
    return new BluebirdPromise<SendEventSuccess>((res) => {
      service
        .onTransition(async (state) => {
          if (state.done)
            console.log(JSON.stringify(_.get(state, 'event.data', {})));
          if (state.changed && _.isEmpty(state.children)) {
            await this.update({
              currentJson: state
            });
            res({
              currentState: state.value,
              completed: state.done,
              nextEvents: state.nextEvents
            });
          }
        })
        .mSend(event);
    })
      .timeout(50000)
      .catch(() => {
        service.stop();
        throw {
          message:
            'The workflow failed to respond within express timeout limit of 50 seconds'
        };
      });
  }
}
