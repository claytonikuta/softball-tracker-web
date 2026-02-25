import React, { useState } from "react";
import { useGameContext } from "../../context/GameContext";
import { useLineup } from "../../context/LineupContext";
import { RunnerOnBase } from "../../types/Player";
import { useParams } from "next/navigation";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import styles from "./CurrentBatter.module.css";

const CurrentBatter: React.FC = () => {
  const params = useParams();
  const id = params?.id;
  const {
    currentBatter,
    setCurrentBatter,
    setOnDeckBatter,
    setInTheHoleBatter,
    setRunnersOnBase,
    runnersOnBase,
    currentInning,
    isHomeTeamBatting,
    updateHomeInningScore,
    updateAwayInningScore,
    setLastGreenIndex,
    setLastOrangeIndex,
    lastOrangeIndex,
    lastGreenIndex,
    alternatingTurn,
    setAlternatingTurn,
  } = useGameContext();

  const { updatePlayer, greenLineup, orangeLineup } = useLineup();
  const [showModal, setShowModal] = useState(false);

  const handleBatterResult = (result: string) => {
    if (!currentBatter) return;

    // Store currentBatter in a temporary variable before we change state
    const batterWhoHit = { ...currentBatter };

    // Use stored indices instead of findIndex to avoid issues with reordered lineups
    let newGreenIndex = lastGreenIndex;
    let newOrangeIndex = lastOrangeIndex;

    // Advance the index for the group that just batted
    if (batterWhoHit.group === "green") {
      if (greenLineup.length > 0) {
        newGreenIndex = (lastGreenIndex + 1) % greenLineup.length;
        setLastGreenIndex(newGreenIndex);
      }
    } else {
      if (orangeLineup.length > 0) {
        newOrangeIndex = (lastOrangeIndex + 1) % orangeLineup.length;
        setLastOrangeIndex(newOrangeIndex);
      }
    }

    // Save indices to database immediately
    saveIndicesToDatabase(newGreenIndex, newOrangeIndex);

    // ENFORCED ALTERNATING BATTING ORDER
    // Pattern: Green -> Orange -> Green -> Orange...
    const currentGroup = batterWhoHit.group;
    const oppositeGroup = currentGroup === "green" ? "orange" : "green";

    // Use the UPDATED indices (not the stale state values)
    // The opposite group's index hasn't changed, but we need to use the current stored values
    // The group that just batted has been advanced (newGreenIndex/newOrangeIndex)
    const oppositeGroupIndex = oppositeGroup === "green" 
      ? lastGreenIndex 
      : lastOrangeIndex;
    const oppositeGroupLineup = oppositeGroup === "green" 
      ? greenLineup 
      : orangeLineup;
    
    // Next current batter is from the opposite group (at its current index)
    const nextCurrentBatter = oppositeGroupLineup.length > 0 && oppositeGroupIndex < oppositeGroupLineup.length
      ? oppositeGroupLineup[oppositeGroupIndex]
      : null;

    // On-deck is the NEXT batter from the group that just batted
    // (the one after the batter who just finished - using the newly advanced index)
    const nextOnDeckIndex = batterWhoHit.group === "green" 
      ? newGreenIndex 
      : newOrangeIndex;
    const nextOnDeckLineup = batterWhoHit.group === "green" 
      ? greenLineup 
      : orangeLineup;
    const nextOnDeckBatter = nextOnDeckLineup.length > 0 && nextOnDeckIndex < nextOnDeckLineup.length
      ? nextOnDeckLineup[nextOnDeckIndex] 
      : null;

    // In-the-hole is the NEXT batter from the opposite group
    // (after the one that's about to bat - current + 1)
    const nextInTheHoleIndex = oppositeGroupLineup.length > 0
      ? (oppositeGroupIndex + 1) % oppositeGroupLineup.length
      : 0;
    const nextInTheHoleBatter = oppositeGroupLineup.length > 0
      ? oppositeGroupLineup[nextInTheHoleIndex]
      : null;

    // Set the batters in their new positions
    setCurrentBatter(nextCurrentBatter);
    setOnDeckBatter(nextOnDeckBatter);
    setInTheHoleBatter(nextInTheHoleBatter);

    // Process the actual hit result
    if (result === "out") {
      // Batter is out
      const updatedPlayer = {
        ...batterWhoHit,
        outs: batterWhoHit.outs + 1,
      };
      updatePlayer(batterWhoHit.id, updatedPlayer);

      // Update inning outs for current team
      if (isHomeTeamBatting) {
        updateHomeInningScore(
          currentInning,
          (runs) => runs, // keep runs the same
          (outs) => outs + 1
        );
      } else {
        updateAwayInningScore(
          currentInning,
          (runs) => runs, // keep runs the same
          (outs) => outs + 1
        );
      }
    } else if (result === "homerun") {
      // Home run - batter scores directly
      const updatedPlayer = {
        ...batterWhoHit,
        runs: batterWhoHit.runs + 1,
      };
      updatePlayer(batterWhoHit.id, updatedPlayer);

      // Update inning runs for current team
      if (isHomeTeamBatting) {
        updateHomeInningScore(
          currentInning,
          (runs) => runs + 1,
          (outs) => outs
        );
      } else {
        updateAwayInningScore(
          currentInning,
          (runs) => runs + 1,
          (outs) => outs
        );
      }
    } else {
      // Batter got a hit (single, double, triple)
      const baseIndex =
        result === "single"
          ? 0
          : result === "double"
          ? 1
          : result === "triple"
          ? 2
          : 0;

      // Generate a truly unique ID with timestamp AND random number
      const uniqueId = `${batterWhoHit.id}-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}`;

      // Create a proper RunnerOnBase object with the unique ID
      const newRunner: RunnerOnBase = {
        ...batterWhoHit,
        id: uniqueId,
        baseIndex,
      };

      // Get the current runners from context first
      const updatedRunners = [...runnersOnBase, newRunner];

      // Set the state directly
      setRunnersOnBase(updatedRunners);
    }

    setShowModal(false);
    setAlternatingTurn(alternatingTurn === "green" ? "orange" : "green");
  };

  const saveIndicesToDatabase = (greenIndex: number, orangeIndex: number) => {
    const gameId = id ? (Array.isArray(id) ? id[0] : id) : null;
    if (!gameId) return;

    fetch(`/api/games/${gameId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        last_green_index: greenIndex,
        last_orange_index: orangeIndex,
      }),
    });
  };

  return (
    <>
      <div
        className={styles["current-batter"]}
        onClick={() => setShowModal(true)}
      >
        <h3>Current Batter</h3>
        {currentBatter ? (
          <div className={styles["batter-card"]}>
            <div className={styles["batter-name"]}>{currentBatter.name}</div>
            <div className={styles["batter-group"]}>
              Group: {currentBatter.group === "green" ? "Green" : "Orange"}
            </div>
            <div className={styles["batter-stats"]}>
              <span>Runs: {currentBatter.runs} </span>
              <span>Outs: {currentBatter.outs}</span>
            </div>
            <div className={styles["click-hint"]}>
              Click to record at-bat result
            </div>
          </div>
        ) : (
          <p className={styles["no-batter"]}>No current batter</p>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`At-Bat: ${currentBatter?.name || "Batter"}`}
      >
        <div className={styles["batter-actions"]}>
          <p>Record the result of this at-bat:</p>
          <div className={styles["hit-options"]}>
            <Button
              onClick={() => handleBatterResult("single")}
              className={styles["hit-button"]}
            >
              Single
            </Button>
            <Button
              onClick={() => handleBatterResult("double")}
              className={styles["hit-button"]}
            >
              Double
            </Button>
            <Button
              onClick={() => handleBatterResult("triple")}
              className={styles["hit-button"]}
            >
              Triple
            </Button>
            <Button
              onClick={() => handleBatterResult("homerun")}
              className={styles["hit-button"]}
            >
              Home Run
            </Button>
            <Button
              onClick={() => handleBatterResult("out")}
              className={styles["out-button"]}
            >
              Out
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CurrentBatter;
