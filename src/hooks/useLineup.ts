import { useState } from "react";
import { Player } from "../types/Player";

const useLineup = () => {
  const [lineup, setLineup] = useState<{ green: Player[]; orange: Player[] }>({
    green: [],
    orange: [],
  });

  const addPlayer = (player: Player) => {
    setLineup((prevLineup) => {
      const updatedLineup = { ...prevLineup };
      if (player.group === "green") {
        updatedLineup.green.push(player);
      } else {
        updatedLineup.orange.push(player);
      }
      return updatedLineup;
    });
  };

  const updatePlayerStats = (name: string, runs: number, outs: number) => {
    setLineup((prevLineup) => {
      const updatedLineup = { ...prevLineup };
      const playerList = updatedLineup.green.some((p) => p.name === name)
        ? updatedLineup.green
        : updatedLineup.orange;
      const playerIndex = playerList.findIndex((p) => p.name === name);
      if (playerIndex !== -1) {
        playerList[playerIndex].runs += runs;
        playerList[playerIndex].outs += outs;
      }
      return updatedLineup;
    });
  };

  return {
    lineup,
    addPlayer,
    updatePlayerStats,
  };
};

export default useLineup;
