import { EventObject, StateValue } from 'xstate';

export interface WorkflowInput {
  id: string;
  definition: any;
}

export interface TaskInput {
  id: string;
  type: 'http' | 'other';
  config: any;
}

export interface WorkflowInstanceInput {
  definition: any;
  currentJson: any;
}

export interface Workflow {
  id: string;
  definition: any;
}

export interface Task {
  id: string;
  type: 'http' | 'other';
  config: any;
}

export interface WorkflowInstance {
  id: string;
  definition: any;
  currentJson: any;
}

export interface WorkflowEvent extends EventObject {
  data: any;
}
export type SendEventError = {
  message: string;
};

export type SendEventSuccess = {
  currentState: StateValue;
  completed: boolean;
  nextEvents: string[];
};

export type StartWorkflowResponse = {
  id: string;
};

export type SendEventResponse = SendEventSuccess | SendEventError;

export abstract class MicroflowStorage {
  abstract async createWorkflow(
    workflowInput: WorkflowInput
  ): Promise<Workflow>;
  abstract async createTask(taskInput: TaskInput): Promise<Task>;
  abstract async createWorkflowInstance(
    workflowInstanceInput: WorkflowInstanceInput
  ): Promise<WorkflowInstance>;

  abstract async getWorkflow(id: string): Promise<Workflow>;
  abstract async getTask(id: string): Promise<Task>;
  abstract async getWorkflowInstance(id: string): Promise<WorkflowInstance>;

  abstract async updateWorkflow(workflow: Workflow): Promise<Workflow>;
  abstract async updateTask(task: Task): Promise<Task>;
  abstract async updateWorkflowInstance(
    workflowInstance: WorkflowInstance
  ): Promise<WorkflowInstance>;

  abstract async deleteWorkflow(id: string): Promise<boolean>;
  abstract async deleteTask(id: string): Promise<boolean>;
  abstract async deleteWorkflowInstance(id: string): Promise<boolean>;
}
