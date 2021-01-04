import { ICrudable } from '../crudable';
import { LocalCrud } from '../localCrud';
import { ITask, IWorkflow, IExecution, IMicroflowStorage } from '../types';

export class DefaultStorage implements IMicroflowStorage {
  private memory = {
    workflows: new Map(),
    tasks: new Map(),
    executions: new Map()
  };
  workflow: ICrudable<IWorkflow>;
  task: ICrudable<ITask>;
  execution: ICrudable<IExecution>;

  constructor() {
    this.workflow = new LocalCrud<IWorkflow>(this.memory.workflows);
    this.task = new LocalCrud<ITask>(this.memory.tasks);
    this.execution = new LocalCrud<IExecution>(this.memory.executions);
  }
}
