"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Microflow = void 0;
const xstate_1 = require("xstate");
const _ = require("lodash");
const axios_1 = require("axios");
const Bluebird = require("bluebird");
const { delay, Promise } = Bluebird;
const utils_1 = require("./utils");
const interpreter_1 = require("./interpreter");
const storage_1 = require("./storage");
class Microflow {
    constructor(config) {
        const { storage } = config;
        if (!storage) {
            this.storage = new storage_1.DefaultStorage();
        }
        else {
            this.storage = storage;
        }
    }
    _getMachine(config) {
        return xstate_1.Machine(config, {
            services: {
                task: async (_context, { data }, { src }) => {
                    try {
                        const { taskId, config } = src;
                        const { parameters, resultSelector, resultPath } = config;
                        const resolvedParameters = utils_1.transform(parameters, data);
                        const task = await this.storage.getTask(taskId);
                        const taskResolved = utils_1.transform(task.config, resolvedParameters);
                        const response = await axios_1.default(taskResolved).then((res) => res.data);
                        const resultSelected = utils_1.transform(resultSelector, response);
                        const result = utils_1.setOnPath(data, resultPath, resultSelected);
                        return result;
                    }
                    catch (err) {
                        console.log(err);
                        throw err;
                    }
                },
                fake: async () => {
                    await delay(2000);
                    return { fileUrl: 'https://aws.com' };
                }
            }
        });
    }
    // Task CRUD methods
    async createTask(data) {
        return this.storage.createTask(data);
    }
    async getTask(id) {
        return this.storage.getTask(id);
    }
    async updateTask(data) {
        return this.storage.updateTask(data);
    }
    async deleteTask(id) {
        return this.storage.deleteTask(id);
    }
    // Workflow CRUD methods
    async createWorkflow(data) {
        return this.storage.createWorkflow(data);
    }
    async getWorkflow(id) {
        return this.storage.getWorkflow(id);
    }
    async updateWorkflow(data) {
        return this.storage.updateWorkflow(data);
    }
    async deleteWorkflow(id) {
        return this.storage.deleteWorkflow(id);
    }
    async startWorkflow(workflowId) {
        const { definition } = await this.storage.getWorkflow(workflowId);
        const fetchMachine = this._getMachine(definition);
        const { initialState } = fetchMachine;
        const { id: instanceId } = await this.storage.createWorkflowInstance({
            currentJson: initialState,
            definition
        });
        return { id: instanceId };
    }
    async sendEvent(instanceId, event) {
        const { definition, currentJson } = await this.storage.getWorkflowInstance(instanceId);
        const fetchMachine = this._getMachine(definition);
        const previousState = xstate_1.State.create(currentJson);
        const resolvedState = fetchMachine.resolveState(previousState);
        if (resolvedState.done)
            return {
                message: `The workflow instance id : ${instanceId} has already ended`
            };
        const { nextEvents } = resolvedState;
        const { type } = event;
        if (!_.includes(nextEvents, type))
            return { message: `The event of type : ${type} is not allowed` };
        const service = new interpreter_1.WorkflowInterpreter(fetchMachine).start(resolvedState);
        return new Promise((res) => {
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
            .catch((err) => {
            console.log(err);
            return {
                message: 'The workflow failed to respond within express timeout limit of 50 seconds'
            };
        });
    }
    async getWorkflowInstance(id) {
        return this.storage.getWorkflowInstance(id);
    }
}
exports.Microflow = Microflow;
