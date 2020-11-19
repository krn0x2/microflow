<h1 align="center">Welcome to microflow 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/microflow" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/microflow.svg">
  </a>
  <a href="https://github.com/krn0x2/microflow#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/krn0x2/microflow/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/krn0x2/microflow/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/krn0x2/microflow" />
  </a>
</p>

> Finite state machine based HTTP microservice orchestration

### 🏠 [Homepage](https://github.com/krn0x2/microflow#readme)

## Purpose

Microflow helps you build and run complex workflows which are composed of HTTP microservices and manual (human moderator) stages, all by definiing a JSON workflow blueprint. It is built on robust concepts of __finite state machine__, and allows you to control input/output data as template variables (think jsonpath, handlebars).
A workflow consists of manual states and __task__ states (aka HTTP workers which could be sync/async).

<img alt="License: MIT" src="img/workflow.png" />

## Install
npm
```sh
npm i --save microflow
```

## Documentation

The `Microflow` class provides various methods to author/execute/infer workflow and workflow instances

```javascript
import { Microflow } from "microflow";
const flow = new Microflow();
const {
  // create task
  createTask,
  // create/put workflow
  createWorkflow,
  // get task
  getTask,
  // get workflow
  getWorkflow,

  // start workflow instance
  startWorkflow,
  // send event to workflow instance
  sendEvent,
  // get workflow instance details (useful for UI)
  getWorkflowInstance,

  // update task
  updateTask
  // update workflow
  updateWorkflow
  // delete task
  deleteTask
  // delete workflow
  deleteWorkflow
} = flow;
```

## Usage

```javascript
import { Microflow } from "microflow";

const flow = new Microflow({
  // bring your own storage connector for persistence
  storage: null
});

// Authoring task and workflow

// Register a task
const task = await flow.createTask({
  // type of task (only 'http' supported right now)
  type: "http",
  //  <AxiosRequestConfig> supported (https://github.com/axios/axios/blob/master/index.d.ts#L44)
  config: {
    url: "http://localhost:1000/api/experimental/dags/{{dagId}}/dag_runs",
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/json"
    },
    data: "$.data",
    method: "post"
  }
});

// Register a workflow
const workflow = await flow.createWorkflow({
  definition: {
    initial: "waiting",
    states: {
      waiting: {
        on: {
          start_pipeline: {
            target: "start_dag",
          },
        },
      },
      start_dag: {
        invoke: {
          src: {
            type: "task",
            taskId: task.id,
            config: {
              parameters: {
                dagId: "dag1",
                data: "$",
              },
              resultSelector: {
                foo: "bar",
                baz: "har",
                message: "$.message",
                dag_execution_date: "$.execution_date",
              },
              resultPath: "$.pipeline.startDetails",
            },
          },
          onDone: {
            target: "pipeline_running",
          },
          onError: {
            target: "failed",
          },
        },
      },
      pipeline_running: {
        on: {
          test_complete: {
            target: "ready_for_approval",
            meta: {
              config: {
                resultPath: "$.pipeline.output",
              },
            },
          },
        },
      },
      ready_for_approval: {
        on: {
          approve: {
            target: "done",
          },
          reject: {
            target: "failed",
          },
        },
      },
      done: {
        type: "final",
      },
      failed: {
        type: "final",
      },
    },
  },
});

// Executing workflow aka "workflow instances"

const { id } = await flow.startWorkflow(workflow.id);

// Sending events to workflow instance
const response1 = await flow.sendEvent(id, {
    type: "start_pipeline"
});

// The above event will automatically fire the HTTP request configured in the task
/*
response1 = {
    "currentState": "pipeline_running",
    "completed": false,
    "nextEvents": [
        "test_complete"
    ]
}
*/

// Sending events to workflow instance
const response2 = await flow.sendEvent(id, {
    type: "test_complete",
    data: {
      kfold: 0.76,
      blind : 0.60
    }
});

/*
response2 = {
    "currentState": "ready_for_approval",
    "completed": false,
    "nextEvents": [
        "reject",
        "approve"
    ]
}
*/

const response3 = await flow.sendEvent(id, {
  type: "approve",
  data: {
      comment: "fair enough"
  }
});

/*
response3 = {
    "currentState": "done",
    "completed": true,
    "nextEvents": []
}
*/
```
## Storage

```javascript
import { Microflow } from "microflow";
import { MicroflowStorage } from "microflow/types";

// define your own storage from MicroflowStorage abstract class
class MyStorage implements MicroflowStorage {
  // define CRUD functions
}

const store = new MyStorage();

// create an instance of microflow with custom store injected
const flow = new Microflow({
  storage: store
});
```

## Examples

Navigate to `examples/basic` to run a sample express project with ephemeral storage.

## Run tests

```sh
npm run test
```

## Author

👤 **Karan Chhabra**

* Github: [@krn0x2](https://github.com/krn0x2)
* LinkedIn: [@krn0x2](https://linkedin.com/in/krn0x2)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/krn0x2/microflow/issues). You can also take a look at the [contributing guide](https://github.com/krn0x2/microflow/blob/master/CONTRIBUTING.md).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2020 [Karan Chhabra](https://github.com/krn0x2).<br />
This project is [MIT](https://github.com/krn0x2/microflow/blob/master/LICENSE) licensed.
