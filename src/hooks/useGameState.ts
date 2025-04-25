import { useState } from "react";
import { Player } from "../types/Player";

const useGameState = () => {
  const [currentBatterIndex, setCurrentBatterIndex] = useState(0);
  const [onDeckIndex, setOnDeckIndex] = useState(1);
  const [runnersOnBase, setRunnersOnBase] = useState<number[]>([]);
  const [outs, setOuts] = useState(0);
  const [runs, setRuns] = useState(0);

  const nextBatter = (totalPlayers: Player[]) => {
    setCurrentBatterIndex((prevIndex) => (prevIndex + 1) % totalPlayers.length);
    setOnDeckIndex((prevIndex) => (prevIndex + 1) % totalPlayers.length);
  };

  const addRunner = (runnerIndex: number) => {
    setRunnersOnBase((prevRunners) => [...prevRunners, runnerIndex]);
  };

  const removeRunner = (runnerIndex: number) => {
    setRunnersOnBase((prevRunners) =>
      prevRunners.filter((index) => index !== runnerIndex)
    );
  };

  const markOut = () => {
    setOuts((prevOuts) => prevOuts + 1);
  };

  const scoreRun = () => {
    setRuns((prevRuns) => prevRuns + 1);
  };

  return {
    currentBatterIndex,
    onDeckIndex,
    runnersOnBase,
    outs,
    runs,
    nextBatter,
    addRunner,
    removeRunner,
    markOut,
    scoreRun,
  };
};

export default useGameState;
