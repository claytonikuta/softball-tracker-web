import React from "react";
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
  const { updatePlayer } = useLineup();
  const [showRunScoredModal, setShowRunScoredModal] = React.useState(false);
  const [runnerScoring, setRunnerScoring] = React.useState<RunnerOnBase | null>(
    null
  );
  // Add new state for out confirmation
  const [showOutModal, setShowOutModal] = React.useState(false);
  const [runnerBeingOut, setRunnerBeingOut] =
    React.useState<RunnerOnBase | null>(null);

  // Get base name for display
  const getBaseName = (baseIndex: number): string => {
    if (baseIndex === 0) return "1st";
    if (baseIndex === 1) return "2nd";
    if (baseIndex === 2) return "3rd";
    return "Unknown";
  };

  // Handle increasing runner's base
  const handleMoveForward = (runner: RunnerOnBase) => {
    if (runner.baseIndex === 2) {
      // Runner is at 3rd base, show run scored modal
      setRunnerScoring(runner);
      setShowRunScoredModal(true);
    } else {
      // Move runner forward one base
      setRunnersOnBase((prevRunners) =>
        prevRunners.map((r) =>
          r.id === runner.id ? { ...r, baseIndex: r.baseIndex + 1 } : r
        )
      );
    }
  };

  // Handle decreasing runner's base
  const handleMoveBackward = (runner: RunnerOnBase) => {
    if (runner.baseIndex > 0) {
      // Only move back if not on first base
      setRunnersOnBase((prevRunners) =>
        prevRunners.map((r) =>
          r.id === runner.id ? { ...r, baseIndex: r.baseIndex - 1 } : r
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

    // Update the player's outs
    const basePlayerId = runnerBeingOut.id.split("-")[0];
    const updatedPlayer = {
      ...runnerBeingOut,
      outs: runnerBeingOut.outs + 1,
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

    // Remove from runners list
    setRunnersOnBase((prevRunners) =>
      prevRunners.filter((r) => r.id !== runnerBeingOut.id)
    );

    // Close the modal
    setShowOutModal(false);
    setRunnerBeingOut(null);
  };

  // Handle run scored from modal
  const handleRunScored = () => {
    if (!runnerScoring) return;

    const basePlayerId = runnerScoring.id.split("-")[0];

    // Create an updated player with incremented runs
    const updatedPlayer = {
      ...runnerScoring,
      runs: runnerScoring.runs + 1,
    };

    // Update player stats using the BASE ID, not compound ID
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

    // Remove from runners list
    setRunnersOnBase((prevRunners) =>
      prevRunners.filter((r) => r.id !== runnerScoring.id)
    );

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
