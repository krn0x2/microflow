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

export class Workflow extends EntityController<IWorkflow, string> {
  private getTask: (id: string) => Promise<ITask>;
  private execution: MicroflowCore<IExecution, string, Execution>;

  constructor(
    model: IWorkflow,
    store: ICrudable<IWorkflow, string>,
    storage: IMicroflowStorage,
    jwt: IJwt
  ) {
    super(model, store, storage, jwt);
    this.getTask = storage.task.read.bind(storage.task);
    this.execution = new MicroflowCore(
      Execution,
      storage.execution,
      storage,
      this.jwt
    );
    this.execution.create = this.execution.create.bind(this.execution);
    this.execution.update = this.execution.update.bind(this.execution);
  }

  async start(): Promise<Execution> {
    const { config } = await this.data();
    const definition = await transformConfig(config, this.getTask);
    const instanceId = Math.random().toString();
    await this.execution.create({
      id: instanceId,
      currentJson: {},
      definition
    });
    const fetchMachine = getMachine(
      {
        ...definition,
        context: { wfid: instanceId }
      },
      this.jwt.secretOrPublicKey,
      this.jwt.sign
    );
    const { initialState } = fetchMachine;
    return this.execution.update(instanceId, {
      currentJson: initialState
    });
  }
}
