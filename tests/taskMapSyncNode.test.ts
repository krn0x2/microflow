import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.request.mockResolvedValue({});
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
        conf: {
          actualData: '$.data',
          token: '$.token',
          envKey: '$.envKey',
          executionId: '$.executionId'
        }
      },
      method: 'post'
    }
  });

  const { id: taskId } = await task.data();

  // Create a workflow
  const workflow = await flow.workflow.create({
    id: 'sample',
    config: {
      initial: 'auto_test_1',
      states: {
        auto_test_1: {
          type: 'taskMapSync',
          taskId,
          itemsPath: '$.iterateOn',
          parameters: {
            dagId: 'dag1',
            data: '$._',
            token: '$._task.token',
            envKey: '$._env.myKey1',
            executionId: '$._task.executionId'
          },
          onDone: {
            target: 'ready_for_approval',
            resultSelector: {
              a: 'a',
              b: 'b',
              out: '$._'
            },
            resultPath: '$.pipeline1.success'
          },
          onError: {
            target: 'failed',
            resultSelector: {
              c: 'c',
              d: 'd',
              out: '$._'
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
          type: 'taskSync',
          taskId,
          parameters: {
            dagId: 'dag2',
            data: '$._',
            token: '$._task.token',
            envKey: '$._env.myKey1',
            executionId: '$._task.executionId'
          },
          onDone: {
            target: 'done',
            resultSelector: {
              e: 'e',
              out: '$._'
            },
            resultPath: '$.pipeline2.success'
          },
          onError: {
            target: 'failed',
            resultSelector: {
              f: 'f',
              out: '$._'
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
    }
  });

  // start an execution with initial data
  const execution = await workflow.start({
    input1: 'val1',
    input2: 'val2',
    iterateOn: [1, 2, 3]
  });

  await execution.send({
    type: 'approve',
    data: {
      message: 'The acceptance test was fine'
    }
  });

  const { completed, output } = await execution.data();
  expect(completed).toBe(true);
  expect(output).toMatchObject({
    input1: 'val1',
    input2: 'val2',
    pipeline1: {
      success: [
        {
          a: 'a',
          b: 'b',
          out: {}
        },
        {
          a: 'a',
          b: 'b',
          out: {}
        },
        {
          a: 'a',
          b: 'b',
          out: {}
        }
      ]
    },
    approval: { data: { message: 'The acceptance test was fine' } },
    pipeline2: {
      success: {
        e: 'e',
        out: {}
      }
    }
  });
});
