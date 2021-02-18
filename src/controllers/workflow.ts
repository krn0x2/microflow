import {
  IExecution,
  IJwt,
  IMicroflowStorage,
  ITask,
  IWorkflow
} from '../types';
import { Execution } from './execution';
import { transformConfig } from '../utils/convert';
import { getMachine } from '../utils/xstate';
import { ICrudable } from '../crudable';
import { EntityController } from '.';
import { MicroflowCore } from '../core';

export class Workflow extends EntityController<IWorkflow> {
  private getTask: (id: string) => Promise<ITask>;
  private execution: MicroflowCore<IExecution, Execution>;

  constructor(
    model: IWorkflow,
    store: ICrudable<IWorkflow>,
    storage: IMicroflowStorage,
    jwt: IJwt
  ) {
    super(model, store, storage, jwt);
    this.getTask = storage.task.read.bind(storage.task);
    this.execution = new MicroflowCore<IExecution, Execution>(
      Execution,
      storage.execution,
      storage,
      this.jwt
    );
    this.execution.create = this.execution.create.bind(this.execution);
    this.execution.update = this.execution.update.bind(this.execution);
  }

  async start(
    data: Record<string, any> = {},
    name?: string
  ): Promise<Execution> {
    const { config } = await this.data();
    const definition = await transformConfig(config, this.getTask);
    const workflowMachine = getMachine(
      definition,
      this.jwt.secretOrPublicKey,
      this.jwt.sign
    );
    const { initialState } = workflowMachine;
    const execution = await this.execution.create({
      name,
      config,
      definition,
      state: initialState.value,
      completed: initialState.done
    });
    const { id: executionId } = await execution.data();
    const { initialState: currentJson } = workflowMachine.withContext({
      wfid: executionId,
      name
    });
    await this.execution.update(executionId, {
      currentJson
    });
    return execution.send({ type: 'data', data });
  }
}
