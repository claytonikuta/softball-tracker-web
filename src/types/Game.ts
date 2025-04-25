import { Player } from "./Player";

export interface Game {
  currentBatter: Player | null;
  onDeckBatter: Player | null;
  runnersOnBase: Player[];
  totalOuts: number;
}
