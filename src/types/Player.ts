export interface Player {
  id: string;
  name: string;
  group: "green" | "orange";
  runs: number;
  outs: number;
}

export interface RunnerOnBase extends Player {
  baseIndex: number;
}

export type BasePosition = "first" | "second" | "third" | "home";

export interface Runner extends Player {
  onBase: BasePosition;
}
