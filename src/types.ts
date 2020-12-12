import { EventObject, StateValue } from 'xstate';

export interface WorkflowInput {
  id: string;
  config: MicroflowDefinition;
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
  config: any;
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

export interface TaskTokenClaims {
  workflowInstanceId: string;
  taskEventSuffix: string;
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

export type MicroflowStateTypes = 'task' | 'generic';

export interface TransitionConfig {
  target: string;
  resultSelector?: Record<string, any>;
  resultPath?: string;
}

export interface StateNodeConfig {
  type: MicroflowStateTypes;
  taskId?: string;
  parameters?: Record<string, any>;
  resultSelector?: Record<string, any>;
  resultPath?: string;
  onDone?: TransitionConfig;
  onError?: TransitionConfig;
  meta?: Record<string, any>;
  on?: Record<string, TransitionConfig>;
}

export interface MicroflowDefinition {
  initial: string;
  states: Record<string, StateNodeConfig>;
}

export abstract class MicroflowStorage {
  abstract async createWorkflow(workflowInput: Workflow): Promise<Workflow>;
  abstract async createTask(taskInput: TaskInput): Promise<Task>;
  abstract async createWorkflowInstance(
    workflowInstanceInput: WorkflowInstanceInput
  ): Promise<WorkflowInstance>;

  abstract async getWorkflow(id: string): Promise<Workflow | null>;
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
