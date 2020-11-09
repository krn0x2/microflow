const { State, Machine, interpret } = require("xstate");
const _ = require("lodash");
const { delay } = require("bluebird");
const { v4: uuidv4 } = require("uuid");
const sampleDef = require("./input.json");
const { JSONPath } = require("jsonpath-plus");
const { transform } = require("./utils");
const getMachine = (def) => Machine(def, { services: { http, fake } });

const memory = {};

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

class Stepflow {
  constructor(config) {}

  registerTask(taskConfig) {}

  registerWorkflow() {}

  startWorkflow() {
    const fetchMachine = getMachine(sampleDef);
    const { initialState } = fetchMachine;
    const id = uuidv4();
    memory[id] = JSON.stringify(initialState);
    return id;
  }

  async sendEvent(id, event) {
    const current_wf_json = JSON.parse(memory[id]);
    const fetchMachine = getMachine(sampleDef);
    // console.log(fetchMachine)
    // Use State.create() to restore state from a plain object
    const previousState = State.create(current_wf_json);
    // console.log(previousState)
    // Use machine.resolveState() to resolve the state definition to a new State instance relative to the machine
    const resolvedState = fetchMachine.resolveState(previousState);
    // console.log(resolvedState)
    //   const nextState = fetchMachine.transition(resolvedState, machineEvent);
    const service = interpret(fetchMachine).start(resolvedState);
    return new Promise((res) => {
      service
        .onTransition(async (state, event) => {
          //   console.log(state, event);
          if (state.changed && _.isEmpty(state.children)) {
            memory[id] = JSON.stringify(state);
            res({
              currentState: state.value,
              completed: state.done,
              nextEvents: state.nextEvents,
            });
          }
        })
        .send(event);
    });
  }

  describeWorkflow() {}

  describeWorkflowExecution() {}
}

module.exports = Stepflow;
