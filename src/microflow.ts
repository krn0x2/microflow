import jwt from 'jsonwebtoken';
import { DefaultStorage } from './storage';
import { Task } from './controllers/task';
import { Workflow } from './controllers/workflow';
import { Execution } from './controllers/execution';
import {
  IMicroflowStorage,
  IMicroflowConfig,
  TaskTokenClaims,
  SendEventResponse,
  IWorkflow,
  ITask,
  IExecution
} from './types';
import { MicroflowCore } from './core';

export class Microflow {
  private secret: jwt.Secret;
  private signOptions: jwt.SignOptions;
  private verifyOptions: jwt.VerifyOptions;

  public storage: IMicroflowStorage;

  public workflow: MicroflowCore<IWorkflow, string, Workflow>;
  public task: MicroflowCore<ITask, string, Task>;
  public execution: MicroflowCore<IExecution, string, Execution>;

  constructor(config: IMicroflowConfig) {
    const { storage, jwt } = config;
    const { secretOrPublicKey, sign, verify } = jwt;
    this.secret = secretOrPublicKey;
    this.signOptions = sign;
    this.verifyOptions = verify;
    if (!storage) {
      this.storage = new DefaultStorage();
    } else {
      this.storage = storage;
    }
    this.workflow = new MicroflowCore(
      Workflow,
      this.storage.workflow,
      this.storage,
      { secretOrPublicKey: this.secret, sign: this.signOptions }
    );
    this.task = new MicroflowCore(Task, this.storage.task);
    this.execution = new MicroflowCore(
      Execution,
      this.storage.execution,
      this.storage,
      { secretOrPublicKey: this.secret, sign: this.signOptions }
    );
  }

  private claimsFromTaskToken(token): TaskTokenClaims {
    return jwt.verify(
      token,
      this.secret,
      this.verifyOptions
    ) as TaskTokenClaims;
  }

  async sendTaskSuccess(
    token: string,
    data: Record<string, any>
  ): Promise<SendEventResponse> {
    try {
      const { taskEventSuffix, workflowInstanceId } = this.claimsFromTaskToken(
        token
      );
      const execution = await this.execution.read(workflowInstanceId);
      return execution.send({
        type: `success-${taskEventSuffix}`,
        data
      });
    } catch (ex) {
      throw {
        message: 'Task token invalid'
      };
    }
  }

  async sendTaskFailure(
    token: string,
    data: Record<string, any>
  ): Promise<SendEventResponse> {
    try {
      const { taskEventSuffix, workflowInstanceId } = this.claimsFromTaskToken(
        token
      );
      const execution = await this.execution.read(workflowInstanceId);
      return execution.send({
        type: `failure-${taskEventSuffix}`,
        data
      });
    } catch (ex) {
      throw {
        message: 'Task token invalid'
      };
    }
  }
}