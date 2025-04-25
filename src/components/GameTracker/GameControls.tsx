import React from "react";
import { useLineup } from "../../context/LineupContext";
import { useGameContext } from "../../context/GameContext";
import { Player } from "../../types/Player";
import Button from "../shared/Button";
import styles from "./GameControls.module.css";

const GameControls: React.FC = () => {
  const { greenLineup, orangeLineup, updatePlayer } = useLineup();
  const {
    currentBatter,
    onDeckBatter,
    runnersOnBase,
    lastGreenIndex,
    lastOrangeIndex,
    setCurrentBatter,
    setOnDeckBatter,
    setRunnersOnBase,
    setLastGreenIndex,
    setLastOrangeIndex,
  } = useGameContext();

  // Function to find next batter of specified group
  const getNextBatter = (group: "orange" | "green"): Player | null => {
    const lineup = group === "orange" ? orangeLineup : greenLineup;
    if (!lineup.length) return null;

    // Get current index for this group
    const currentIndex = group === "orange" ? lastOrangeIndex : lastGreenIndex;

    // Special case: If we're looking for the same group as current batter (orange-orange rule)
    if (currentBatter?.group === group) {
      const currentBatterIndex = lineup.findIndex(
        (p) => p.id === currentBatter.id
      );
      if (currentBatterIndex !== -1) {
        const nextIndex = (currentBatterIndex + 1) % lineup.length;
        // Update last index for this group
        if (group === "orange") {
          setLastOrangeIndex(nextIndex);
        } else {
          setLastGreenIndex(nextIndex);
        }
        return lineup[nextIndex];
      }
    }

    // Regular case: get next player in rotation
    const nextIndex = (currentIndex + 1) % lineup.length;

    // Update last index for this group
    if (group === "orange") {
      setLastOrangeIndex(nextIndex);
    } else {
      setLastGreenIndex(nextIndex);
    }

    return lineup[nextIndex];
  };

  // Handle batter hit
  const handleHit = () => {
    if (!currentBatter) return;

    // Generate a unique ID for the runner
    const uniqueId = `${currentBatter.id}-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;

    // Create a proper RunnerOnBase object (on first base)
    const newRunner = {
      ...currentBatter,
      id: uniqueId,
      baseIndex: 0,
    };

    // Move current batter to first base
    const updatedRunners = [...runnersOnBase, newRunner];
    setRunnersOnBase(updatedRunners);

    // First, determine the next-next batter (who will be on deck after this action)
    const nextNextGroup = onDeckBatter?.group === "orange" ? "green" : "orange";
    const nextNextBatter = getNextBatter(nextNextGroup);

    // Update current batter and on deck
    setCurrentBatter(onDeckBatter);
    setOnDeckBatter(nextNextBatter);
  };

  // Handle batter out
  const handleOut = () => {
    if (!currentBatter) return;

    // Update player stats
    const updatedPlayer = { ...currentBatter, outs: currentBatter.outs + 1 };
    updatePlayer(currentBatter.id, updatedPlayer);

    // First, determine the next-next batter (who will be on deck after this action)
    const nextNextGroup = onDeckBatter?.group === "orange" ? "green" : "orange";
    const nextNextBatter = getNextBatter(nextNextGroup);

    // Update current batter and on deck
    setCurrentBatter(onDeckBatter);
    setOnDeckBatter(nextNextBatter);
  };

  // Rest of the code remains the same...

  // Handle run scored (runner crosses home plate)
  const handleRunScored = () => {
    if (!runnersOnBase.length) return;

    // Runner at third (last in array) scores
    const scoringRunner = runnersOnBase[runnersOnBase.length - 1];
    const updatedPlayer = { ...scoringRunner, runs: scoringRunner.runs + 1 };

    // Update player stats
    updatePlayer(scoringRunner.id, updatedPlayer);

    // Remove runner from bases
    const updatedRunners = runnersOnBase.slice(0, -1);
    setRunnersOnBase(updatedRunners);
  };

  // Handle runner out
  const handleRunnerOut = () => {
    if (!runnersOnBase.length) return;

    // Runner at third (last in array) is out
    const outRunner = runnersOnBase[runnersOnBase.length - 1];
    const updatedPlayer = { ...outRunner, outs: outRunner.outs + 1 };

    // Update player stats
    updatePlayer(outRunner.id, updatedPlayer);

    // Remove runner from bases
    const updatedRunners = runnersOnBase.slice(0, -1);
    setRunnersOnBase(updatedRunners);
  };

  // Allow for a special case of orange-orange batting
  const handleSiameseBatters = () => {
    if (!currentBatter || currentBatter.group !== "orange") return;

    // Get next orange batter
    const nextOrangeBatter = getNextBatter("orange");

    // Update on-deck batter to be orange
    setOnDeckBatter(nextOrangeBatter);
  };

  return (
    <div className={styles["game-controls"]}>
      <h3>Game Controls</h3>

      <div className={styles["control-section"]}>
        <h4>Batter Actions</h4>
        <div className={styles["buttons-row"]}>
          <Button onClick={handleHit} className={styles["hit-button"]}>
            Hit
          </Button>
          <Button onClick={handleOut} className={styles["out-button"]}>
            Out
          </Button>
        </div>
      </div>

      <div className={styles["control-section"]}>
        <h4>Runner Actions</h4>
        <div className={styles["buttons-row"]}>
          <Button onClick={handleRunScored} className={styles["run-button"]}>
            Score Run
          </Button>
          <Button onClick={handleRunnerOut} className={styles["out-button"]}>
            Runner Out
          </Button>
        </div>
      </div>

      <div className={styles["control-section"]}>
        <h4>Special Rules</h4>
        <Button
          onClick={handleSiameseBatters}
          className={styles["special-button"]}
        >
          Orange-Orange (Siamese) Batters
        </Button>
      </div>
    </div>
  );
};

export default GameControls;
