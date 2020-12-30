import _ from 'lodash';
// import { nanoid } from 'nanoid';
import {
  AtomicNodeConfig,
  FinalNodeConfig,
  ITask,
  MicroflowDefinition,
  TaskNodeConfig,
  WorkflowEvent
} from '../types';
import { MachineConfig, StateNodeConfig as XStateNodeConfig } from 'xstate';
import { MICROFLOW } from '../constants';
import { map } from 'bluebird';

export async function transformConfig(
  config: MicroflowDefinition,
  getTask: (id: string) => Promise<ITask>
): Promise<MachineConfig<any, any, WorkflowEvent>> {
  const states = _.get(config, 'states', {});
  const uniqueTaskIds = _.chain(states)
    .filter(['type', MICROFLOW.STATES.TASK])
    .map('taskId')
    .uniq()
    .value();
  const tasks = await map(uniqueTaskIds, getTask, {
    concurrency: MICROFLOW.CONCURRENCY
  });
  const taskMap = _.keyBy(tasks, 'id');
  return microflowToXstateCofig(config, taskMap);
}

export async function microflowToXstateCofig(
  microflowConfig: MicroflowDefinition,
  taskDictionary: _.Dictionary<ITask>
): Promise<MachineConfig<any, any, WorkflowEvent>> {
  const { states } = microflowConfig;

  const newStates = _.chain(states)
    .mapValues(
      (s: TaskNodeConfig | AtomicNodeConfig | FinalNodeConfig, name) => {
        if (s.type === 'task') {
          // const taskEventSuffix = nanoid();
          const taskEventSuffix = name;
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
                    task: taskDictionary[s.taskId],
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
        } else if (s.type === 'atomic') {
          return {
            type: 'atomic',
            meta: s.meta,
            on: s.on
          };
        } else {
          return {
            type: 'final',
            meta: s.meta
          };
        }
      }
    )
    .value() as Record<string, XStateNodeConfig<any, any, WorkflowEvent>>;
  return { id: 'main', states: newStates, initial: microflowConfig.initial };
}
