const { State, Machine, interpret } = require("xstate");
const _ = require("lodash");
const axios = require("axios");
const Promise = require("bluebird");
const { delay } = Promise;
const { transform, setOnPath } = require("./utils");
const MyInterpreter = require("./custom/interpreter");
class Microflow {
  constructor(config = {}) {
    const { storage } = config;
    if (!storage) {
      const DefaultStorage = require("./storage");
      this.storage = new DefaultStorage();
    } else {
      this.storage = storage;
    }
  }

  _getMachine(config) {
    return Machine(config, {
      services: {
        task: async (context, { data }, { src }) => {
          try {
            const { taskId, config } = src;
            const { parameters, resultSelector, resultPath } = config;
            const resolvedParameters = transform(parameters, data);
            const task = await this.storage.getTask(taskId);
            const taskResolved = transform(task.config, resolvedParameters);
            const response = await axios(taskResolved).then((res) => res.data);
            const resultSelected = transform(resultSelector, response);
            const result = setOnPath(data, resultPath, resultSelected);
            return result;
          } catch (err) {
            console.log(err);
            throw err;
          }
        },
        fake: async () => {
          await delay(2000);
          return { fileUrl: "https://aws.com" };
        },
      },
    });
  }

  async putTask(data) {
    return this.storage.putTask(data);
  }

  async getTask(task_id) {
    return this.storage.getTask(task_id);
  }

  async putWorkflow(data) {
    return this.storage.putWorkflow(data);
  }

  async getWorkflow(workflow_id) {
    return this.storage.getWorkflow(workflow_id);
  }

  async startWorkflow(workflow_id) {
    const { definition } = await this.storage.getWorkflow(workflow_id);
    const fetchMachine = this._getMachine(definition);
    const { initialState } = fetchMachine;
    const { id: instance_id } = await this.storage.putWorkflowInstance({
      current_json: initialState,
      definition,
    });
    return { id: instance_id };
  }

  async sendEvent(instance_id, event) {
    const { definition, current_json } = await this.storage.getWorkflowInstance(
      instance_id
    );
    const fetchMachine = this._getMachine(definition);
    const previousState = State.create(current_json);
    const resolvedState = fetchMachine.resolveState(previousState);
    if (resolvedState.done)
      return {
        message: `The workflow instance id : ${instance_id} has already ended`,
      };
    const { nextEvents } = resolvedState;
    const { type } = event;
    if (!_.includes(nextEvents, type))
      return { message: `The event of type : ${type} is not allowed` };
    const service = new MyInterpreter(fetchMachine).start(resolvedState);
    return new Promise((res) => {
      service
        .onTransition(async (state, event) => {
          // console.log(state, event);
          if (state.changed && _.isEmpty(state.children)) {
            await this.storage.putWorkflowInstance({
              id: instance_id,
              current_json: state,
              definition: {},
            });
            res({
              currentState: state.value,
              completed: state.done,
              nextEvents: state.nextEvents,
            });
          }
        })
        .mySend(event);
    })
      .timeout(50000)
      .catch((err) => {
        console.log(err);
        return {
          message:
            "The workflow failed to respond within express timeout limit of 50 seconds",
        };
      });
  }

  async getWorkflowInstance(id) {
    return this.storage.getWorkflowInstance(id);
  }
}

module.exports = Microflow;
