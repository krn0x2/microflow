import { MicroflowStorage, Task, TaskInput, Workflow, WorkflowInput, WorkflowInstance, WorkflowInstanceInput } from '../types';
interface LocalMemory {
    workflows: Map<string, Workflow>;
    tasks: Map<string, Task>;
    instances: Map<string, WorkflowInstance>;
}
export declare class DefaultStorage implements MicroflowStorage {
    memory: LocalMemory;
    constructor();
    createWorkflow(data: WorkflowInput): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow>;
    updateWorkflow(data: Workflow): Promise<Workflow>;
    deleteWorkflow(id: string): Promise<boolean>;
    createTask(data: TaskInput): Promise<Task>;
    getTask(id: string): Promise<Task>;
    updateTask(data: Task): Promise<Task>;
    deleteTask(id: string): Promise<boolean>;
    createWorkflowInstance(data: WorkflowInstanceInput): Promise<WorkflowInstance>;
    getWorkflowInstance(id: string): Promise<WorkflowInstance>;
    updateWorkflowInstance(data: WorkflowInstance): Promise<WorkflowInstance>;
    deleteWorkflowInstance(id: string): Promise<boolean>;
}
export {};
