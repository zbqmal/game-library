export enum Result {
  UP = "UP",
  DOWN = "DOWN",
  CORRECT = "CORRECT",
}

export type HistoryItem = { guess: number; result: Result };
