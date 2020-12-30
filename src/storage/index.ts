import { ICrudable } from '../crudable';
import { LocalCrud } from '../localCrud';
import { ITask, IWorkflow, IExecution, IMicroflowStorage } from '../types';

export class DefaultStorage implements IMicroflowStorage {
  private memory = {
    workflows: new Map(),
    tasks: new Map(),
    executions: new Map()
  };
  workflow: ICrudable<IWorkflow, string>;
  task: ICrudable<ITask, string>;
  execution: ICrudable<IExecution, string>;

  constructor() {
    this.workflow = new LocalCrud<IWorkflow, string>(this.memory.workflows);
    this.task = new LocalCrud<ITask, string>(this.memory.tasks);
    this.execution = new LocalCrud<IExecution, string>(this.memory.executions);
  }
}
