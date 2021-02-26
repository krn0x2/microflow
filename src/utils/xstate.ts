import jwt from 'jsonwebtoken';
import {
  AnyEventObject,
  Machine,
  MachineConfig,
  StateMachine,
  Typestate
} from 'xstate';
import { WorkflowEvent } from '../types';
import { taskCreator, transformerInvoke } from './task';

export function getMachine(
  config: MachineConfig<any, any, WorkflowEvent>,
  secret: jwt.Secret,
  signOptions: jwt.SignOptions
): StateMachine<any, any, AnyEventObject, Typestate<any>> {
  return Machine(config, {
    services: {
      task: taskCreator(secret, signOptions),
      transform: transformerInvoke
    }
  });
}
