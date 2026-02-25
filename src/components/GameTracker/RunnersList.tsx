import React from "react";
import { useParams } from "next/navigation";
import { useGameContext } from "../../context/GameContext";
import { useLineup } from "../../context/LineupContext";
import { RunnerOnBase } from "../../types/Player";
import Button from "../shared/Button";
import Modal from "../shared/Modal";
import styles from "./RunnersList.module.css";

const RunnersList: React.FC = () => {
  const {
    runnersOnBase,
    setRunnersOnBase,
    currentInning,
    isHomeTeamBatting,
    updateHomeInningScore,
    updateAwayInningScore,
  } = useGameContext();
  const { updatePlayer, greenLineup, orangeLineup } = useLineup();
  const [showRunScoredModal, setShowRunScoredModal] = React.useState(false);
  const [runnerScoring, setRunnerScoring] = React.useState<RunnerOnBase | null>(
    null
  );
  // Add new state for out confirmation
  const [showOutModal, setShowOutModal] = React.useState(false);
  const [runnerBeingOut, setRunnerBeingOut] =
    React.useState<RunnerOnBase | null>(null);
  const { id } = useParams();

  // Get base name for display
  const getBaseName = (baseIndex: number): string => {
    if (baseIndex === 0) return "1st";
    if (baseIndex === 1) return "2nd";
    if (baseIndex === 2) return "3rd";
    return "Unknown";
  };

  // Handle increasing runner's base
  const handleMoveForward = (runner: RunnerOnBase) => {
    // Validate baseIndex is within valid range (0-2)
    if (runner.baseIndex < 0 || runner.baseIndex > 2) {
      console.warn(`Invalid baseIndex ${runner.baseIndex} for runner ${runner.name}. Resetting to 0.`);
      setRunnersOnBase((prevRunners) =>
        prevRunners.map((r) =>
          r.id === runner.id ? { ...r, baseIndex: 0 } : r
        )
      );
      return;
    }

    if (runner.baseIndex === 2) {
      // Runner is at 3rd base, show run scored modal
      setRunnerScoring(runner);
      setShowRunScoredModal(true);
    } else if (runner.baseIndex < 2) {
      // Move runner forward one base (only if not already at max)
      setRunnersOnBase((prevRunners) =>
        prevRunners.map((r) =>
          r.id === runner.id ? { ...r, baseIndex: Math.min(r.baseIndex + 1, 2) } : r
        )
      );
    }
  };

  // Handle decreasing runner's base
  const handleMoveBackward = (runner: RunnerOnBase) => {
    // Validate baseIndex is within valid range (0-2)
    if (runner.baseIndex < 0 || runner.baseIndex > 2) {
      console.warn(`Invalid baseIndex ${runner.baseIndex} for runner ${runner.name}. Resetting to 0.`);
      setRunnersOnBase((prevRunners) =>
        prevRunners.map((r) =>
          r.id === runner.id ? { ...r, baseIndex: 0 } : r
        )
      );
      return;
    }

    if (runner.baseIndex > 0) {
      // Only move back if not on first base
      setRunnersOnBase((prevRunners) =>
        prevRunners.map((r) =>
          r.id === runner.id ? { ...r, baseIndex: Math.max(r.baseIndex - 1, 0) } : r
        )
      );
    }
  };

  // Show confirmation modal for out instead of directly handling out
  const confirmRunnerOut = (runner: RunnerOnBase) => {
    setRunnerBeingOut(runner);
    setShowOutModal(true);
  };

  // Handle marking runner out after confirmation
  const handleRunnerOut = () => {
    if (!runnerBeingOut) return;

    // Extract the base player ID (without timestamp)
    const basePlayerId = runnerBeingOut.id.split("-")[0];
    
    // Find the actual current player from the lineup (not the runner object)
    const allPlayers = [...greenLineup, ...orangeLineup];
    const currentPlayer = allPlayers.find((p) => p.id === basePlayerId);
    
    if (!currentPlayer) {
      console.warn(`Player ${basePlayerId} not found in lineup`);
      return;
    }

    // Create updated player with incremented outs, using current player data
    const updatedPlayer = {
      ...currentPlayer,
      outs: currentPlayer.outs + 1,
    };

    // Update player stats
    updatePlayer(basePlayerId, updatedPlayer);

    // Update inning outs
    if (isHomeTeamBatting) {
      updateHomeInningScore(
        currentInning,
        (runs) => runs,
        (outs) => outs + 1
      );
    } else {
      updateAwayInningScore(
        currentInning,
        (runs) => runs,
        (outs) => outs + 1
      );
    }

    // IMPORTANT: Calculate the updated runner list ONCE and use it for both operations
    const updatedRunners = runnersOnBase.filter(
      (r) => r.id !== runnerBeingOut.id
    );

    // 1. Update local state
    setRunnersOnBase(updatedRunners);

    // 2. Update database immediately with the SAME updated list
    const gameId = id ? (Array.isArray(id) ? id[0] : id) : null;
    if (gameId) {
      fetch(`/api/games/${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runners: updatedRunners.map((runner) => ({
            player_id: runner.id.split("-")[0],
            base_index: runner.baseIndex,
          })),
        }),
      });
    }

    // Close the modal
    setShowOutModal(false);
    setRunnerBeingOut(null);
  };

  // Handle run scored from modal
  const handleRunScored = () => {
    if (!runnerScoring) return;

    // Extract the base player ID (without timestamp)
    const basePlayerId = runnerScoring.id.split("-")[0];
    
    // Find the actual current player from the lineup (not the runner object)
    const allPlayers = [...greenLineup, ...orangeLineup];
    const currentPlayer = allPlayers.find((p) => p.id === basePlayerId);
    
    if (!currentPlayer) {
      console.warn(`Player ${basePlayerId} not found in lineup`);
      return;
    }

    // Create updated player with incremented runs, using current player data
    const updatedPlayer = {
      ...currentPlayer,
      runs: currentPlayer.runs + 1,
    };

    // Update player stats using the BASE ID
    updatePlayer(basePlayerId, updatedPlayer);

    // Update inning runs
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

    // IMPORTANT: Calculate the updated runner list ONCE and use it for both operations
    const updatedRunners = runnersOnBase.filter(
      (r) => r.id !== runnerScoring.id
    );

    // 1. Update local state
    setRunnersOnBase(updatedRunners);

    // 2. Update database immediately with the SAME updated list
    const gameId = id ? (Array.isArray(id) ? id[0] : id) : null;
    if (gameId) {
      fetch(`/api/games/${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runners: updatedRunners.map((runner) => ({
            player_id: runner.id.split("-")[0],
            base_index: runner.baseIndex,
          })),
        }),
      });
    }

    setShowRunScoredModal(false);
    setRunnerScoring(null);
  };

  const safeRunners = Array.isArray(runnersOnBase) ? runnersOnBase : [];

  return (
    <>
      <div className={styles["runners-list"]}>
        <h3>Runners On Base</h3>
        {safeRunners.length === 0 ? (
          <p className={styles["no-runners"]}>No runners on base</p>
        ) : (
          <div className={styles["runners-container"]}>
            {safeRunners.map((runner) => (
              <div
                key={runner?.id || `runner-${Math.random()}`}
                className={styles["runner-item"]}
              >
                <div className={styles["runner-info"]}>
                  <div className={styles["runner-name"]}>
                    {runner?.name || "Unknown"}
                  </div>
                  <div className={styles["runner-base"]}>
                    {getBaseName(runner?.baseIndex || 0)}
                  </div>
                </div>
                <div className={styles["runner-controls"]}>
                  <Button
                    onClick={() => handleMoveBackward(runner)}
                    className={`${styles["base-button"]} ${styles["backward-button"]}`}
                    disabled={runner.baseIndex === 0}
                  >
                    -
                  </Button>
                  <Button
                    onClick={() => handleMoveForward(runner)}
                    className={`${styles["base-button"]} ${styles["forward-button"]}`}
                  >
                    +
                  </Button>
                  <Button
                    onClick={() => confirmRunnerOut(runner)}
                    className={styles["out-button"]}
                  >
                    Out
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Run scored confirmation modal */}
      <Modal
        isOpen={showRunScoredModal}
        onClose={() => {
          setShowRunScoredModal(false);
          setRunnerScoring(null);
        }}
        title="Run Scored?"
      >
        <div className={styles["run-modal-content"]}>
          <p>Did {runnerScoring?.name} score a run?</p>
          <div className={styles["run-modal-buttons"]}>
            <Button onClick={handleRunScored} className={styles["yes-button"]}>
              Yes
            </Button>
            <Button
              onClick={() => {
                setShowRunScoredModal(false);
                setRunnerScoring(null);
              }}
              className={styles["no-button"]}
            >
              No
            </Button>
          </div>
        </div>
      </Modal>

      {/* Out confirmation modal */}
      <Modal
        isOpen={showOutModal}
        onClose={() => {
          setShowOutModal(false);
          setRunnerBeingOut(null);
        }}
        title="Confirm Out"
      >
        <div className={styles["run-modal-content"]}>
          <p>Mark {runnerBeingOut?.name} as out?</p>
          <div className={styles["run-modal-buttons"]}>
            <Button onClick={handleRunnerOut} className={styles["yes-button"]}>
              Yes
            </Button>
            <Button
              onClick={() => {
                setShowOutModal(false);
                setRunnerBeingOut(null);
              }}
              className={styles["no-button"]}
            >
              No
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RunnersList;
