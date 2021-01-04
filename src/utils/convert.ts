import _ from 'lodash';
import { map } from 'bluebird';
import { MachineConfig, StateNodeConfig as XStateNodeConfig } from 'xstate';

import {
  AtomicNodeConfig,
  FinalNodeConfig,
  ITask,
  MicroflowDefinition,
  TaskNodeConfig,
  WorkflowEvent,
  TransitionConfig
} from '../types';
import { MICROFLOW } from '../constants';

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
  return microflowToXstateConfig(config, taskMap);
}

export function microflowToXstateConfig(
  microflowConfig: MicroflowDefinition,
  taskDictionary: _.Dictionary<ITask>
): MachineConfig<any, any, WorkflowEvent> {
  const { states } = microflowConfig;
  const newStates = _.chain(states)
    .mapValues(
      (s: TaskNodeConfig | AtomicNodeConfig | FinalNodeConfig, name) => {
        if (s.type === 'task')
          return microflowTaskToXstateNode(s, taskDictionary[s.taskId], name);
        else if (s.type === 'atomic') return microflowAtomicToXstateNode(s);
        else return microflowFinalToXstateNode(s);
      }
    )
    .mapValues((s: XStateNodeConfig<any, any, WorkflowEvent>, name) => {
      if (name === microflowConfig.initial) return transformInitialNode(s);
      else return s;
    })
    .value() as Record<string, XStateNodeConfig<any, any, WorkflowEvent>>;
  return { id: 'main', states: newStates, initial: microflowConfig.initial };
}

export function microflowTaskToXstateNode(
  s: TaskNodeConfig,
  task: ITask,
  name?: string
): XStateNodeConfig<any, any, WorkflowEvent> {
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
            task,
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
      success: {
        type: 'final'
      },
      error: {},
      failed_to_start: {}
    },
    on: s.on
  };
}

export function microflowAtomicToXstateNode(
  s: AtomicNodeConfig
): XStateNodeConfig<any, any, WorkflowEvent> {
  return {
    type: 'atomic',
    meta: s.meta,
    on: s.on
  };
}

export function microflowFinalToXstateNode(
  s: FinalNodeConfig
): XStateNodeConfig<any, any, WorkflowEvent> {
  return {
    type: 'final',
    meta: s.meta
  };
}

export function transformInitialNode(
  stateNode: XStateNodeConfig<any, any, WorkflowEvent>
): XStateNodeConfig<any, any, WorkflowEvent> {
  return {
    type: 'compound',
    initial: 'waiting_for_data',
    states: {
      ...stateNode.states,
      waiting_for_data: {
        on: {
          data: {
            target: 'data_received'
          }
        }
      },
      data_received: {
        always: stateNode.type === 'compound' ? stateNode.initial : undefined,
        on:
          stateNode.type === 'atomic'
            ? _.mapValues(stateNode.on, (trans) => {
                const transitionConfig = trans as TransitionConfig;
                return {
                  ...transitionConfig,
                  target: `#main.${transitionConfig.target}`
                };
              })
            : undefined
      }
    }
  } as XStateNodeConfig<any, any, WorkflowEvent>;
}
