import { EventObject, StateValue } from 'xstate';
export interface WorkflowInput {
    definition: any;
}
export interface TaskInput {
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
export declare type SendEventError = {
    message: string;
};
export declare type SendEventSuccess = {
    currentState: StateValue;
    completed: boolean;
    nextEvents: string[];
};
export declare type StartWorkflowResponse = {
    id: string;
};
export declare type SendEventResponse = SendEventSuccess | SendEventError;
export declare abstract class MicroflowStorage {
    abstract createWorkflow(workflowInput: WorkflowInput): Promise<Workflow>;
    abstract createTask(taskInput: TaskInput): Promise<Task>;
    abstract createWorkflowInstance(workflowInstanceInput: WorkflowInstanceInput): Promise<WorkflowInstance>;
    abstract getWorkflow(id: string): Promise<Workflow>;
    abstract getTask(id: string): Promise<Task>;
    abstract getWorkflowInstance(id: string): Promise<WorkflowInstance>;
    abstract updateWorkflow(workflow: Workflow): Promise<Workflow>;
    abstract updateTask(task: Task): Promise<Task>;
    abstract updateWorkflowInstance(workflowInstance: WorkflowInstance): Promise<WorkflowInstance>;
    abstract deleteWorkflow(id: string): Promise<boolean>;
    abstract deleteTask(id: string): Promise<boolean>;
    abstract deleteWorkflowInstance(id: string): Promise<boolean>;
}
