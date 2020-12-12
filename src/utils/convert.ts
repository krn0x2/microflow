import _ from 'lodash';
import { nanoid } from 'nanoid';
import { MICROFLOW } from '../constants';
import { map } from 'bluebird';
import { MicroflowDefinition, MicroflowStorage } from '../types';

export async function microflowToXstateCofig(
  microflowConfig: MicroflowDefinition,
  store: MicroflowStorage
) {
  const { states } = microflowConfig;
  const taskStates = _.filter(states, ['type', MICROFLOW.STATES.TASK]);
  const taskIds = _.chain(taskStates).map('taskId').uniq().value();

  const tasks = await map(taskIds, store.getTask, {
    concurrency: MICROFLOW.CONCURRENCY
  });

  const newStates = _.chain(states)
    .mapValues((s) => {
      if (s.type === 'task') {
        const taskEventSuffix = nanoid();
        return {
          type: 'compound',
          initial: 'starting',
          meta: s.meta,
          states: {
            starting: {
              invoke: {
                src: {
                  type: s.type,
                  taskId: s.taskId,
                  task: tasks.find((t) => t.id === s.taskId),
                  config: {
                    parameters: s.parameters,
                    resultSelector: s.resultSelector,
                    resultPath: s.resultPath
                  },
                  taskEventSuffix
                },
                onDone: {
                  target: 'started'
                },
                onError: {
                  target: 'failed_to_start'
                }
              }
            },
            started: {
              on: {
                [`success-${taskEventSuffix}`]: {
                  ...s.onDone,
                  target: '#main.' + s.onDone.target
                },
                [`failure-${taskEventSuffix}`]: {
                  ...s.onError,
                  target: '#main.' + s.onError.target
                }
              }
            },
            failed_to_start: {}
          },
          on: s.on
        };
      }
      return s;
    })
    .value();
  return { ...microflowConfig, id: 'main', states: newStates };
}
