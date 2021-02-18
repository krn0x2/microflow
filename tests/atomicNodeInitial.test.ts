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

  const workflow = await flow.workflow.create({
    id: 'sample',
    config: {
      initial: 'waiting',
      states: {
        waiting: {
          type: 'atomic',
          on: {
            start_test: {
              target: 'auto_test_1',
              resultPath: '$.trial'
            }
          }
        },
        auto_test_1: {
          type: 'task',
          taskId,
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
          type: 'task',
          taskId,
          parameters: {
            dagId: 'dag2',
            data: 'karan',
            token: '$._task.token',
            envKey: '$._env.myKey2',
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

  const execution = await workflow.start({
    input1: 'karan',
    input2: 'chhabra'
  });

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

  await execution.send({
    type: 'success-auto_test_2',
    data: {
      c: 'wee'
    }
  });

  const { completed, output } = await execution.data();
  expect(completed).toBe(true);
  expect(output).toMatchObject({
    input1: 'karan',
    input2: 'chhabra',
    trial: { a: 1, b: 2 },
    pipeline1: {
      success: {
        a: 'a',
        b: 'b',
        out: {
          ok: 'cupid'
        }
      }
    },
    approval: {
      data: {
        notok: 'cupido'
      }
    },
    pipeline2: {
      success: {
        e: 'e',
        out: {
          c: 'wee'
        }
      }
    }
  });
});
