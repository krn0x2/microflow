import { MachineConfig, StateMachine, Typestate } from 'xstate';
import { MicroflowStorage, TaskInput, Task, WorkflowInput, Workflow, WorkflowEvent, WorkflowInstance, SendEventResponse, StartWorkflowResponse } from './types';
interface MicroflowConfig {
    storage?: MicroflowStorage;
}
export declare class Microflow {
    storage: MicroflowStorage;
    constructor(config: MicroflowConfig);
    _getMachine(config: MachineConfig<any, any, WorkflowEvent>): StateMachine<any, any, WorkflowEvent, Typestate<any>>;
    createTask(data: TaskInput): Promise<Task>;
    getTask(id: string): Promise<Task>;
    updateTask(data: Task): Promise<Task>;
    deleteTask(id: string): Promise<boolean>;
    createWorkflow(data: WorkflowInput): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow>;
    updateWorkflow(data: Workflow): Promise<Workflow>;
    deleteWorkflow(id: string): Promise<boolean>;
    startWorkflow(workflowId: string): Promise<StartWorkflowResponse>;
    sendEvent(instanceId: string, event: WorkflowEvent): Promise<SendEventResponse>;
    getWorkflowInstance(id: string): Promise<WorkflowInstance>;
}
export {};
