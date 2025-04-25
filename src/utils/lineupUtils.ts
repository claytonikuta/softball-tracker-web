import { Player } from "../types/Player";

// Function to add a player to the lineup
export const addPlayerToLineup = (
  lineup: Player[],
  player: Player
): Player[] => {
  return [...lineup, player];
};

// Function to calculate total runs in the lineup
export const calculateTotalRuns = (lineup: Player[]): number => {
  return lineup.reduce((total, player) => total + player.runs, 0);
};

// Function to calculate total outs in the lineup
export const calculateTotalOuts = (lineup: Player[]): number => {
  return lineup.reduce((total, player) => total + player.outs, 0);
};

// Function to get players by group
export const getPlayersByGroup = (
  lineup: Player[],
  group: "orange" | "green"
): Player[] => {
  return lineup.filter((player) => player.group === group);
};

// In utils/lineupUtils.ts
export const reorderPlayers = (
  list: Player[],
  startIndex: number,
  endIndex: number
): Player[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};
