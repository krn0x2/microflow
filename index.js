const { State, Machine, interpret } = require("xstate");
const _ = require("lodash");
const Promise = require("bluebird");
const { delay } = Promise;
const { transform } = require("./utils");

const getMachine = (def) => Machine(def, { services: { http, fake } });

const http = async (context, event, { src }) => {
  const { parameters, resultSelector, taskId } = src;
  const resolvedParameters = transform(parameters, event);
  console.log(resolvedParameters);
  const taskDef = taskDefs[taskId];
  console.log(taskDef);
  const taskDefResolved = transform(taskDef, resolvedParameters);
  console.log(taskDefResolved);
  return taskDefResolved;
  // const response = await axios(taskDefResolved).then(res => res.data);
};

const fake = async () => {
  console.log("running");
  await delay(3000);
  return { fileUrl: "https://aws.com" };
};

const taskDefs = {
  airflow: {
    url: `http://localhost:1000/api/experimental/dags/{{dagId}}/dag_runs`,
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
    },
    data: "$.data",
    method: "post",
  },
};

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

  registerTask(taskConfig) {}

  async putWorkflow(data) {
    return this.storage.putWorkflow(data);
  }

  async getWorkflow(workflow_id) {
    return this.storage.getWorkflow(workflow_id);
  }

  async startWorkflow(workflow_id) {
    const { definition } = await this.storage.getWorkflow(workflow_id);
    const fetchMachine = getMachine(definition);
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
    const fetchMachine = getMachine(definition);
    // console.log(fetchMachine)
    const previousState = State.create(current_json);
    // console.log(previousState)
    const resolvedState = fetchMachine.resolveState(previousState);
    // console.log(resolvedState)
    if (resolvedState.done)
      return { message: `The workflow instance id : ${instance_id} has already ended` };

    const { nextEvents } = resolvedState;
    const { type } = event;
    if (!_.includes(nextEvents, type))
      return { message: `The event of type : ${type} is not allowed` };
    const service = interpret(fetchMachine).start(resolvedState);
    return new Promise((res) => {
      service
        .onTransition(async (state, event) => {
          console.log(state, event);
          if (state.changed && _.isEmpty(state.children)) {
            await this.storage.putWorkflowInstance({
              id: instance_id,
              current_json: state,
            });
            res({
              currentState: state.value,
              completed: state.done,
              nextEvents: state.nextEvents,
            });
          }
        })
        .send(event);
    })
      .timeout(50000)
      .catch((err) => {
        return {
          message:
            "The workflow failed to respond within express timeout limit of 50 seconds",
        };
      });
  }

  async getWorkflowInstance(id) {
    return this.storage.getWorkflowInstance(id);
  }

  describeWorkflowExecution() {}
}

module.exports = Microflow;
