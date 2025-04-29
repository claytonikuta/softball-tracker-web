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

  const { updatePlayer, getNextBatter, greenLineup, orangeLineup } =
    useLineup();
  const [showModal, setShowModal] = useState(false);

  const handleBatterResult = (result: string) => {
    if (!currentBatter) return;

    // Store currentBatter in a temporary variable before we change state
    const batterWhoHit = { ...currentBatter };

    // Update batting indices for the lineup
    if (batterWhoHit.group === "green") {
      const currentIndex = greenLineup.findIndex(
        (p) => p.id === batterWhoHit.id
      );
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % greenLineup.length;
        setLastGreenIndex(nextIndex);

        // Force the index to be saved to database immediately
        saveIndicesToDatabase(nextIndex, lastOrangeIndex);
      }
    } else {
      const currentIndex = orangeLineup.findIndex(
        (p) => p.id === batterWhoHit.id
      );
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % orangeLineup.length;
        setLastOrangeIndex(nextIndex);

        // Force the index to be saved to database immediately
        saveIndicesToDatabase(lastGreenIndex, nextIndex);
      }
    }

    // ENFORCED ALTERNATING BATTING ORDER
    // Always alternate green/orange regardless of what's currently on-deck
    const currentGroup = batterWhoHit.group;
    const oppositeGroup = currentGroup === "green" ? "orange" : "green";

    // Next batter must be from the opposite group
    const nextCurrentGroup = oppositeGroup;
    // On-deck must be from the original group again
    const nextOnDeckGroup = currentGroup;
    // In-hole must be from the opposite group again
    const nextInHoleGroup = oppositeGroup;

    // Get the next batters based on strict alternating pattern
    const nextCurrentBatter = getNextBatter(nextCurrentGroup);
    const nextOnDeckBatter = getNextBatter(nextOnDeckGroup);
    const nextInTheHoleBatter = getNextBatter(nextInHoleGroup);

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
