import { Microflow } from '../src/microflow';

const flow = new Microflow({
  jwt: {
    secretOrPublicKey: 'shhhhh',
    sign: {
      expiresIn: '24h'
    }
  }
});

test('test transitions', async () => {
  const task = await flow.task.create({
    id: 'airflow',
    type: 'http',
    config: {
      url: 'http://localhost:1000/api/experimental/dags/{{dagId}}/dag_runs',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      },
      data: {
        actualData: '$.data',
        token: '$$.task.token'
      },
      method: 'post'
    }
  });

  const { id: taskId } = await task.data();

  const workflow = await flow.workflow.create({
    id: 'sample',
    config: {
      initial: 'waiting',
      states: {
        waiting: {
          type: 'atomic',
          on: {
            start_test: {
              target: 'auto_test_1'
            }
          }
        },
        auto_test_1: {
          type: 'task',
          taskId: 'airflow',
          parameters: {
            dagId: 'dag1',
            data: '$'
          },
          resultSelector: {
            foo: 'bar',
            baz: 'har',
            message: '$.message',
            dag_execution_date: '$.execution_date'
          },
          resultPath: '$.pipeline1.apiResponse',
          onDone: {
            target: 'ready_for_approval',
            resultSelector: {
              a: 'a',
              b: 'b',
              out: '$'
            },
            resultPath: '$.pipeline1.success'
          },
          onError: {
            target: 'failed',
            resultSelector: {
              c: 'c',
              d: 'd',
              out: '$'
            },
            resultPath: '$.pipeline1.error'
          }
        },
        ready_for_approval: {
          type: 'atomic',
          on: {
            reject: {
              target: 'failed',
              resultPath: '$.reject.data'
            },
            approve: {
              target: 'auto_test_2',
              resultPath: '$.approval.data'
            }
          }
        },
        auto_test_2: {
          type: 'task',
          taskId: taskId,
          parameters: {
            dagId: 'dag2',
            data: '$'
          },
          resultSelector: {
            foo: 'bar',
            baz: 'har',
            message: '$.message',
            dag_execution_date: '$.execution_date'
          },
          resultPath: '$.pipeline2.apiResponse',
          onDone: {
            target: 'done',
            resultSelector: {
              e: 'e',
              out: '$'
            },
            resultPath: '$.pipeline2.success'
          },
          onError: {
            target: 'failed',
            resultSelector: {
              f: 'f',
              out: '$'
            },
            resultPath: '$.pipeline2.error'
          }
        },
        done: {
          type: 'final'
        },
        failed: {
          type: 'final'
        }
      }
    },
    definition: {}
  });

  const execution = await workflow.start();

  await execution.send({
    type: 'start_test',
    data: { a: 1, b: 2 }
  });

  await execution.send({
    type: 'success-auto_test_1',
    data: {
      ok: 'cupid'
    }
  });

  await execution.send({
    type: 'approve',
    data: {
      notok: 'cupido'
    }
  });

  const { completed, currentState } = await execution.send({
    type: 'success-auto_test_2',
    data: {
      c: 'wee'
    }
  });

  console.log(currentState, completed);
  // there will be no TS error here, and you'll have completion in modern IDEs

  // same here
  expect(completed).toBe(true);
});
