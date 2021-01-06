import _ from 'lodash';
import { Promise as BluebirdPromise } from 'bluebird';
import { State } from 'xstate';
import { WorkflowInterpreter } from '../interpreter';
import { IExecution, WorkflowEvent } from '../types';
import { getMachine } from '../utils/xstate';
import { EntityController } from '.';

export class Execution extends EntityController<IExecution> {
  async send(event: WorkflowEvent): Promise<Execution> {
    const { definition, currentJson } = await this.data();
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
    const { nextEvents } = resolvedState;
    const { type } = event;
    if (resolvedState.done || !_.includes(nextEvents, type)) return this;

    const service = new WorkflowInterpreter(fetchMachine).start(resolvedState);
    return new BluebirdPromise<Execution>((res) => {
      service
        .onTransition(async (state) => {
          if (state.changed && _.isEmpty(state.children)) {
            await this.update({
              currentJson: state,
              state: state.value,
              output: state.event.data,
              completed: state.done
            });
            res(this);
          }
        })
        .send(event);
    })
      .timeout(10000)
      .catch(() => {
        return this;
      })
      .finally(() => service.stop());
  }
}
