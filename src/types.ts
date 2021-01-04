import jwt from 'jsonwebtoken';
import {
  EventObject,
  MachineConfig,
  State,
  StateSchema,
  StateValue,
  Typestate
} from 'xstate';
import { ICrudable, IModel } from './crudable';

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

export interface IWorkflow extends IModel {
  config: MicroflowDefinition;
}

export interface ITask extends IModel {
  type: 'http' | 'other';
  config: any;
}

export interface IExecution extends IModel {
  config: MicroflowDefinition;
  definition: MachineConfig<any, any, WorkflowEvent>;
  currentJson?: State<any, WorkflowEvent, StateSchema<any>, Typestate<any>>;
}

export interface IDescribeExecution {
  id: string;
  config: MicroflowDefinition;
  state: StateValue;
  output: Record<string, any>;
  completed: boolean;
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
  workflow: ICrudable<IWorkflow>;
  task: ICrudable<ITask>;
  execution: ICrudable<IExecution>;
}
