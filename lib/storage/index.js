"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultStorage = void 0;
const uuid_1 = require("uuid");
class DefaultStorage {
    constructor() {
        this.memory = {
            workflows: new Map(),
            tasks: new Map(),
            instances: new Map(),
        };
    }
    async createWorkflow(data) {
        const { workflows } = this.memory;
        const genUUID = uuid_1.v4();
        workflows.set(genUUID, { id: genUUID, ...data });
        return workflows[genUUID];
    }
    async getWorkflow(id) {
        const { workflows } = this.memory;
        if (!workflows.has(id))
            throw new Error(`Workflow with id = ${id} not found`);
        return workflows.get(id);
    }
    async updateWorkflow(data) {
        const { workflows } = this.memory;
        const { id } = data;
        if (!workflows.has(id))
            throw new Error(`Workflow with id = ${id} not found`);
        workflows.set(id, data);
        return workflows.get(id);
    }
    async deleteWorkflow(id) {
        const { workflows } = this.memory;
        if (!workflows.has(id))
            throw new Error(`Workflow with id = ${id} not found`);
        return workflows.delete(id);
    }
    async createTask(data) {
        const { tasks } = this.memory;
        const genUUID = uuid_1.v4();
        tasks.set(genUUID, { id: genUUID, ...data });
        return tasks[genUUID];
    }
    async getTask(id) {
        const { tasks } = this.memory;
        if (!tasks.has(id))
            throw new Error(`Task with id = ${id} not found`);
        return tasks.get(id);
    }
    async updateTask(data) {
        const { tasks } = this.memory;
        const { id } = data;
        if (!tasks.has(id))
            throw new Error(`Task with id = ${id} not found`);
        tasks.set(id, data);
        return tasks.get(id);
    }
    async deleteTask(id) {
        const { tasks } = this.memory;
        if (!tasks.has(id))
            throw new Error(`Task with id = ${id} not found`);
        return tasks.delete(id);
    }
    //Workflow Instances
    async createWorkflowInstance(data) {
        const { instances } = this.memory;
        const genUUID = uuid_1.v4();
        instances.set(genUUID, { id: genUUID, ...data });
        return instances[genUUID];
    }
    async getWorkflowInstance(id) {
        const { instances } = this.memory;
        if (!instances.has(id))
            throw new Error(`Task with id = ${id} not found`);
        return instances.get(id);
    }
    async updateWorkflowInstance(data) {
        const { instances } = this.memory;
        const { id } = data;
        if (!instances.has(id))
            throw new Error(`Task with id = ${id} not found`);
        instances.set(id, data);
        return instances.get(id);
    }
    async deleteWorkflowInstance(id) {
        const { instances } = this.memory;
        if (!instances.has(id))
            throw new Error(`Task with id = ${id} not found`);
        return instances.delete(id);
    }
}
exports.DefaultStorage = DefaultStorage;
