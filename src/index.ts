import { State, Machine, MachineConfig, StateMachine, Typestate } from 'xstate';
import * as _ from 'lodash';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { Promise as BluebirdPromise } from 'bluebird';
import { transform, setOnPath } from './utils';
import { WorkflowInterpreter } from './interpreter';
import { DefaultStorage } from './storage';
import { microflowToXstateCofig } from './utils/convert';
import {
  MicroflowStorage,
  TaskInput,
  Task,
  WorkflowInput,
  Workflow,
  WorkflowEvent,
  WorkflowInstance,
  SendEventResponse,
  SendEventSuccess,
  StartWorkflowResponse,
  TaskTokenClaims
} from './types';

interface MicroflowConfig {
  storage?: MicroflowStorage;
  jwt: {
    secretOrPublicKey: jwt.Secret;
    sign?: jwt.SignOptions;
    verify?: jwt.VerifyOptions;
  };
}

export class Microflow {
  public storage: MicroflowStorage;
  private secret: jwt.Secret;
  private signOptions: jwt.SignOptions;
  private verifyOptions: jwt.VerifyOptions;
  constructor(config: MicroflowConfig) {
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
  }

  _getMachine(
    config: MachineConfig<any, any, WorkflowEvent>
  ): StateMachine<any, any, WorkflowEvent, Typestate<any>> {
    return Machine(config, {
      services: {
        task: async (ctx, { data }, { src }) => {
          try {
            console.log(ctx, data, src);
            const { config, taskEventSuffix, task } = src;
            const { parameters, resultSelector, resultPath } = config;
            const resolvedParameters = transform(parameters, data);
            console.log(resolvedParameters);
            console.log(task);
            const token = jwt.sign(
              { workflowInstanceId: ctx.wfid, taskEventSuffix },
              this.secret,
              this.signOptions
            );
            console.log(token);
            const taskResolved = transform(task.config, resolvedParameters);
            console.log(taskResolved);
            const tokenized = transform(
              taskResolved,
              {
                task: { token }
              },
              '$$'
            );
            console.log(tokenized);
            const response = await axios(tokenized).then((res) => res.data);
            const resultSelected = transform(resultSelector, response);
            const result = setOnPath(data, resultPath, resultSelected);
            console.log(result);
            return result;
          } catch (ex) {
            console.error(ex);
            throw ex;
          }
        }
      }
    });
  }

  // Task CRUD methods
  async createTask(data: TaskInput): Promise<Task> {
    return this.storage.createTask(data);
  }

  async getTask(id: string): Promise<Task> {
    return this.storage.getTask(id);
  }

  async updateTask(data: Task): Promise<Task> {
    return this.storage.updateTask(data);
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.storage.deleteTask(id);
  }

  // Workflow CRUD methods
  async createWorkflow(data: WorkflowInput): Promise<Workflow> {
    const { config } = data;
    const definition = await microflowToXstateCofig(config, this.storage);
    console.log(definition);
    return this.storage.createWorkflow({ ...data, definition });
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return this.storage.getWorkflow(id);
  }

  async updateWorkflow(data: Workflow): Promise<Workflow> {
    return this.storage.updateWorkflow(data);
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.storage.deleteWorkflow(id);
  }

  async startWorkflow(workflowId: string): Promise<StartWorkflowResponse> {
    const { definition } = await this.storage.getWorkflow(workflowId);
    const { id: instanceId } = await this.storage.createWorkflowInstance({
      currentJson: {},
      definition
    });
    const fetchMachine = this._getMachine({
      ...definition,
      context: { wfid: instanceId }
    });
    const { initialState } = fetchMachine;
    await this.storage.updateWorkflowInstance({
      id: instanceId,
      currentJson: initialState,
      definition
    });
    return { id: instanceId };
  }

  async sendTaskSuccess(
    token: string,
    data: Record<string, any>
  ): Promise<SendEventResponse> {
    try {
      const claims = jwt.verify(
        token,
        this.secret,
        this.verifyOptions
      ) as TaskTokenClaims;
      const { taskEventSuffix, workflowInstanceId } = claims;
      return this.sendEvent(workflowInstanceId, {
        type: `success-${taskEventSuffix}`,
        data
      });
    } catch (ex) {
      return {
        message: 'Task token invalid'
      };
    }
  }

  async sendTaskFailure(
    token: string,
    data: Record<string, any>
  ): Promise<SendEventResponse> {
    try {
      const claims = jwt.verify(
        token,
        this.secret,
        this.verifyOptions
      ) as TaskTokenClaims;
      const { taskEventSuffix, workflowInstanceId } = claims;
      return this.sendEvent(workflowInstanceId, {
        type: `failure-${taskEventSuffix}`,
        data
      });
    } catch (ex) {
      return {
        message: 'Task token invalid'
      };
    }
  }

  async sendEvent(
    instanceId: string,
    event: WorkflowEvent
  ): Promise<SendEventResponse> {
    const { definition, currentJson } = await this.storage.getWorkflowInstance(
      instanceId
    );
    const fetchMachine = this._getMachine(definition);
    const previousState = State.create(currentJson) as State<
      any,
      WorkflowEvent
    >;
    const resolvedState = fetchMachine.resolveState(previousState);
    if (resolvedState.done)
      return {
        message: `The workflow instance id : ${instanceId} has already ended`
      };
    const { nextEvents } = resolvedState;
    const { type } = event;
    if (!_.includes(nextEvents, type))
      return { message: `The event of type : ${type} is not allowed` };
    const service = new WorkflowInterpreter(fetchMachine).start(
      resolvedState
    ) as WorkflowInterpreter;
    return new BluebirdPromise<SendEventSuccess>((res) => {
      service
        .onTransition(async (state) => {
          if (state.done)
            console.log(JSON.stringify(_.get(state, 'event.data', {})));
          if (state.changed && _.isEmpty(state.children)) {
            await this.storage.updateWorkflowInstance({
              id: instanceId,
              currentJson: state,
              definition
            });
            res({
              currentState: state.value,
              completed: state.done,
              nextEvents: state.nextEvents
            });
          }
        })
        .mSend(event);
    })
      .timeout(50000)
      .catch(() => {
        return {
          message:
            'The workflow failed to respond within express timeout limit of 50 seconds'
        };
      });
  }

  async getWorkflowInstance(id: string): Promise<WorkflowInstance> {
    return this.storage.getWorkflowInstance(id);
  }
}

export default Microflow;
