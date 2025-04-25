import { Player } from "../types/Player";

export const enforceAlternatingGroup = (lineup: Player[]) => {
  const green = lineup.filter((player) => player.group === "green");
  const orange = lineup.filter((player) => player.group === "orange");

  const alternatingLineup: Player[] = [];
  const maxLength = Math.max(green.length, orange.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < green.length) {
      alternatingLineup.push(green[i]);
    }
    if (i < orange.length) {
      alternatingLineup.push(orange[i]);
    }
  }

  return alternatingLineup;
};
