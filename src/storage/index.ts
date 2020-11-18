import { v4 as uuidV4 } from 'uuid';
import {
  MicroflowStorage,
  Task,
  TaskInput,
  Workflow,
  WorkflowInput,
  WorkflowInstance,
  WorkflowInstanceInput,
} from '../types';

interface LocalMemory {
  workflows: Map<string, Workflow>;
  tasks: Map<string, Task>;
  instances: Map<string, WorkflowInstance>;
}

export class DefaultStorage implements MicroflowStorage {
  public memory: LocalMemory;
  constructor() {
    this.memory = {
      workflows: new Map(),
      tasks: new Map(),
      instances: new Map(),
    };
  }

  async createWorkflow(data: WorkflowInput):Promise<Workflow> {
    const { workflows } = this.memory;
    const genUUID = uuidV4();
    workflows.set(genUUID, { id: genUUID, ...data });
    return workflows.get(genUUID);
  }

  async getWorkflow(id: string):Promise<Workflow> {
    const { workflows } = this.memory;
    if (!workflows.has(id))
      throw new Error(`Workflow with id = ${id} not found`);
    return workflows.get(id);
  }

  async updateWorkflow(data: Workflow):Promise<Workflow> {
    const { workflows } = this.memory;
    const { id } = data;
    if (!workflows.has(id))
      throw new Error(`Workflow with id = ${id} not found`);
    workflows.set(id, data);
    return workflows.get(id);
  }

  async deleteWorkflow(id: string):Promise<boolean> {
    const { workflows } = this.memory;
    if (!workflows.has(id))
      throw new Error(`Workflow with id = ${id} not found`);
    return workflows.delete(id);
  }

  async createTask(data: TaskInput) :Promise<Task>{
    const { tasks } = this.memory;
    const genUUID = uuidV4();
    tasks.set(genUUID, { id: genUUID, ...data });
    return tasks.get(genUUID);
  }

  async getTask(id: string) :Promise<Task>{
    const { tasks } = this.memory;
    if (!tasks.has(id))
      throw new Error(`Task with id = ${id} not found`);
    return tasks.get(id);
  }

  async updateTask(data: Task) :Promise<Task>{
    const { tasks } = this.memory;
    const { id } = data;
    if (!tasks.has(id))
      throw new Error(`Task with id = ${id} not found`);
      tasks.set(id, data);
    return tasks.get(id);
  }

  async deleteTask(id: string) :Promise<boolean>{
    const { tasks } = this.memory;
    if (!tasks.has(id))
      throw new Error(`Task with id = ${id} not found`);
    return tasks.delete(id);
  }

  //Workflow Instances

  async createWorkflowInstance(data: WorkflowInstanceInput):Promise<WorkflowInstance> {
    const { instances } = this.memory;
    const genUUID = uuidV4();
    instances.set(genUUID, { id: genUUID, ...data });
    return instances.get(genUUID);
  }

  async getWorkflowInstance(id: string):Promise<WorkflowInstance> {
    const { instances } = this.memory;
    if (!instances.has(id))
      throw new Error(`Task with id = ${id} not found`);
    return instances.get(id);
  }

  async updateWorkflowInstance(data: WorkflowInstance):Promise<WorkflowInstance> {
    const { instances } = this.memory;
    const { id } = data;
    if (!instances.has(id))
      throw new Error(`Task with id = ${id} not found`);
      instances.set(id, data);
    return instances.get(id);
  }

  async deleteWorkflowInstance(id: string):Promise<boolean> {
    const { instances } = this.memory;
    if (!instances.has(id))
      throw new Error(`Task with id = ${id} not found`);
    return instances.delete(id);
  }

}
