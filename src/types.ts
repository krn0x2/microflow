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

export type SingleOrArray<T> = T[] | T;

export type ITransform =
  | SingleOrArray<string>
  | SingleOrArray<number>
  | SingleOrArray<Record<string, any>>;

export interface IMicroflowConfig {
  storage?: IMicroflowStorage;
  timeout?: number;
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
  name?: string;
  config: MicroflowDefinition;
  definition: MachineConfig<any, any, WorkflowEvent>;
  currentJson?: State<any, WorkflowEvent, StateSchema<any>, Typestate<any>>;
  state: StateValue;
  output?: Record<string, any>;
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

export type MicroflowStateTypes =
  | 'task'
  | 'taskSync'
  | 'taskMapSync'
  | 'pass'
  | 'atomic'
  | 'final';

export interface TransitionConfig {
  target: string;
  meta?: Record<string, any>;
  resultSelector?: Record<string, any>;
  resultPath?: string;
}

export interface StateNodeConfig {
  type: MicroflowStateTypes;
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

export interface PassNodeConfig extends StateNodeConfig {
  type: 'pass';
  onDone?: TransitionConfig;
  onError?: TransitionConfig;
}

export interface TaskNodeConfig extends StateNodeConfig {
  type: 'task';
  taskId: string;
  parameters?: Record<string, any>;
  onDone?: TransitionConfig;
  onError?: TransitionConfig;
}

export interface TaskNodeSyncConfig extends StateNodeConfig {
  type: 'taskSync';
  taskId: string;
  parameters?: Record<string, any>;
  onDone?: TransitionConfig;
  onError?: TransitionConfig;
}

export interface TaskMapNodeSyncConfig extends StateNodeConfig {
  type: 'taskMapSync';
  taskId: string;
  itemsPath: string;
  parameters?: Record<string, any>;
  onDone?: TransitionConfig;
  onError?: TransitionConfig;
}

export type TMicroflowNode =
  | TaskNodeConfig
  | TaskNodeSyncConfig
  | TaskMapNodeSyncConfig
  | PassNodeConfig
  | AtomicNodeConfig
  | FinalNodeConfig;

export interface MicroflowDefinition {
  initial: string;
  meta?: Record<string, any>;
  states: Record<string, TMicroflowNode>;
  context?: Record<string, any>;
}

export interface IMicroflowStorage {
  workflow: ICrudable<IWorkflow>;
  task: ICrudable<ITask>;
  execution: ICrudable<IExecution>;
}
