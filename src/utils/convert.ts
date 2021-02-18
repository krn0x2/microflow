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
  TransitionConfig,
  TaskNodeSyncConfig,
  TMicroflowNode,
  TaskMapNodeSyncConfig,
  PassNodeConfig
} from '../types';
import { MICROFLOW } from '../constants';
import { nanoid } from 'nanoid';

export async function transformConfig(
  config: MicroflowDefinition,
  getTask: (id: string) => Promise<ITask>
): Promise<MachineConfig<any, any, WorkflowEvent>> {
  const states = _.get(config, 'states', {});
  const uniqueTaskIds = _.chain(states)
    .mapValues()
    .filter((s) => {
      const type = _.get(s, 'type');
      return (
        type === MICROFLOW.STATES.TASK ||
        type === MICROFLOW.STATES.TASK_SYNC ||
        type === MICROFLOW.STATES.TASK_MAP_SYNC
      );
    })
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
  const newStates = _.mapValues(states, (s: TMicroflowNode, name) => {
    if (s.type === 'task')
      return microflowTaskToXstateNode(s, taskDictionary[s.taskId], name);
    else if (s.type === 'taskSync')
      return microflowTaskSyncToXstateNode(s, taskDictionary[s.taskId]);
    else if (s.type === 'taskMapSync')
      return microflowTaskMapSyncToXstateNode(s, taskDictionary[s.taskId]);
    else if (s.type === 'atomic') return microflowAtomicToXstateNode(s);
    else if (s.type === 'pass') return microflowPassToXstateNode(s);
    else return microflowFinalToXstateNode(s);
  }) as Record<string, XStateNodeConfig<any, any, WorkflowEvent>>;

  const initialNodeName = nanoid();
  return {
    id: 'main',
    initial: initialNodeName,
    meta: microflowConfig.meta,
    states: {
      [initialNodeName]: {
        on: {
          data: {
            target: microflowConfig.initial,
            resultPath: '$'
          } as TransitionConfig
        }
      },
      ...newStates
    }
  };
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
            parameters: s.parameters,
            taskEventSuffix
          },
          onDone: {
            target: 'started'
          },
          onError: {
            target: 'failed_to_start',
            resultPath: `$.errors.${taskEventSuffix}`
          } as TransitionConfig
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

export function microflowTaskSyncToXstateNode(
  s: TaskNodeSyncConfig,
  task: ITask
): XStateNodeConfig<any, any, WorkflowEvent> {
  return {
    type: 'atomic',
    meta: s.meta,
    invoke: {
      src: {
        type: 'task',
        taskId: s.taskId,
        task,
        parameters: s.parameters
      },
      onDone: s.onDone,
      onError: s.onError
    },
    on: s.on
  };
}

export function microflowTaskMapSyncToXstateNode(
  s: TaskMapNodeSyncConfig,
  task: ITask
): XStateNodeConfig<any, any, WorkflowEvent> {
  return {
    type: 'atomic',
    meta: s.meta,
    invoke: {
      src: {
        type: 'task',
        taskId: s.taskId,
        task,
        isMap: true,
        itemsPath: s.itemsPath ? s.itemsPath : '$',
        parameters: s.parameters
      },
      onDone: s.onDone,
      onError: s.onError
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

export function microflowPassToXstateNode(
  s: PassNodeConfig
): XStateNodeConfig<any, any, WorkflowEvent> {
  return {
    type: 'atomic',
    meta: s.meta,
    invoke: {
      src: {
        type: 'transform'
      },
      onDone: s.onDone,
      onError: s.onError
    }
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
