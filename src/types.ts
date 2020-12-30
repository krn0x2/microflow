import jwt from 'jsonwebtoken';
import { EventObject, MachineConfig, StateValue } from 'xstate';
import { ICrudable } from './crudable';

export class Error {
  code: number;
  message: string;
  constructor(code: number, message: string) {
    this.code = code;
    this.message = message;
  }
}

export interface IMicroflowConfig {
  storage?: IMicroflowStorage;
  jwt: IJwt;
}

export interface IJwt {
  secretOrPublicKey: jwt.Secret;
  sign?: jwt.SignOptions;
  verify?: jwt.VerifyOptions;
}

export interface IWorkflow {
  id: string;
  config: MicroflowDefinition;
  definition: MachineConfig<any, any, WorkflowEvent>;
}

export interface ITask {
  id: string;
  type: 'http' | 'other';
  config: any;
}

export interface IExecution {
  id: string;
  definition: MachineConfig<any, any, WorkflowEvent>;
  currentJson: any;
}

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

export interface WorkflowEvent extends EventObject {
  data?: Record<string, any>;
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

export type SendEventResponse = SendEventSuccess;

export type MicroflowStateTypes = 'task' | 'atomic' | 'final';

export interface TransitionConfig {
  target: string;
  resultSelector?: Record<string, any>;
  resultPath?: string;
}

export interface StateNodeConfig {
  type: MicroflowStateTypes;
  resultSelector?: Record<string, any>;
  resultPath?: string;
  meta?: Record<string, any>;
  on?: Record<string, TransitionConfig>;
}

export interface AtomicNodeConfig extends StateNodeConfig {
  type: 'atomic';
}

export interface FinalNodeConfig {
  type: 'final';
  meta?: Record<string, any>;
}

export interface TaskNodeConfig extends StateNodeConfig {
  type: 'task';
  taskId: string;
  parameters?: Record<string, any>;
  onDone?: TransitionConfig;
  onError?: TransitionConfig;
}

export interface MicroflowDefinition {
  initial: string;
  states: Record<
    string,
    StateNodeConfig | TaskNodeConfig | FinalNodeConfig | AtomicNodeConfig
  >;
  context?: Record<string, any>;
}

export interface IMicroflowStorage {
  workflow: ICrudable<IWorkflow, string>;
  task: ICrudable<ITask, string>;
  execution: ICrudable<IExecution, string>;
}
