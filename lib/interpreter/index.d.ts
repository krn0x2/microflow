import { Interpreter, StateSchema, EventData, Typestate, State } from 'xstate';
import { WorkflowEvent } from '../types';
export declare class WorkflowInterpreter extends Interpreter<any, StateSchema, WorkflowEvent, Typestate<any>> {
    mSend(event: WorkflowEvent, payload?: EventData): State<any, WorkflowEvent, StateSchema, Typestate<any>>;
}
