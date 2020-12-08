export interface State {
  type: string;
  on: Map<string, TransitionConfig>;
}

export interface TransitionConfig {
  meta: any;
  target: string;
}
