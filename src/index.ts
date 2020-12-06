import { State, Machine, MachineConfig, StateMachine, Typestate } from 'xstate';
import * as _ from 'lodash';
import axios from 'axios';
import { Promise } from 'bluebird';
import { transform, setOnPath } from './utils';
import { WorkflowInterpreter } from './interpreter';
import { DefaultStorage } from './storage';
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
  StartWorkflowResponse
} from './types';

interface MicroflowConfig {
  storage?: MicroflowStorage;
}

export class Microflow {
  public storage: MicroflowStorage;
  constructor(config: MicroflowConfig | null) {
    const { storage } = config || {};
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
        task: async (_context, { data }, { src }) => {
          const { taskId, config } = src;
          const { parameters, resultSelector, resultPath } = config;
          const resolvedParameters = transform(parameters, data);
          const task = await this.storage.getTask(taskId);
          const taskResolved = transform(task.config, resolvedParameters);
          const response = await axios(taskResolved).then((res) => res.data);
          const resultSelected = transform(resultSelector, response);
          const result = setOnPath(data, resultPath, resultSelected);
          return result;
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
    return this.storage.createWorkflow(data);
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
    const fetchMachine = this._getMachine(definition);
    const { initialState } = fetchMachine;
    const { id: instanceId } = await this.storage.createWorkflowInstance({
      currentJson: initialState,
      definition
    });
    return { id: instanceId };
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
    return new Promise<SendEventSuccess>((res) => {
      service
        .onTransition(async (state) => {
          if (state.changed && _.isEmpty(state.children)) {
            await this.storage.updateWorkflowInstance({
              id: instanceId,
              currentJson: state,
              definition: {}
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
