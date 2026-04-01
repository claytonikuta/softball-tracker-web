import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useGameSession } from "../../context/GameSessionContext";
import { RunnerOnBase } from "../../types/Player";
import Button from "../shared/Button";
import Modal from "../shared/Modal";
import styles from "./RunnersList.module.css";

const RunnersList: React.FC = () => {
  const { runnersOnBase, dispatch } = useGameSession();
  const [showRunScoredModal, setShowRunScoredModal] = useState(false);
  const [runnerScoring, setRunnerScoring] = useState<RunnerOnBase | null>(null);
  const [showOutModal, setShowOutModal] = useState(false);
  const [runnerBeingOut, setRunnerBeingOut] = useState<RunnerOnBase | null>(null);
  const { id } = useParams();

  const getBaseName = (baseIndex: number): string => {
    if (baseIndex === 0) return "1st";
    if (baseIndex === 1) return "2nd";
    if (baseIndex === 2) return "3rd";
    return "Unknown";
  };

  const saveRunnersToDb = (excludeRunnerId?: string) => {
    const gameId = id ? (Array.isArray(id) ? id[0] : id) : null;
    if (!gameId) return;

    const remaining = excludeRunnerId
      ? runnersOnBase.filter((r) => r.id !== excludeRunnerId)
      : runnersOnBase;

    const validRunners = remaining
      .map((runner) => {
        const baseId = runner.id.split("-")[0];
        const numericId = parseInt(baseId);
        if (!isNaN(numericId) && numericId > 0 && numericId <= 2147483647) {
          return { player_id: numericId, base_index: runner.baseIndex };
        }
        return null;
      })
      .filter(Boolean);

    fetch(`/api/games/${gameId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runners: validRunners }),
    }).catch(() => {});
  };

  const handleMoveForward = (runner: RunnerOnBase) => {
    if (runner.baseIndex < 0 || runner.baseIndex > 2) {
      dispatch({ type: "MOVE_RUNNER", runnerId: runner.id, direction: "backward" });
      return;
    }

    if (runner.baseIndex === 2) {
      setRunnerScoring(runner);
      setShowRunScoredModal(true);
    } else {
      dispatch({ type: "MOVE_RUNNER", runnerId: runner.id, direction: "forward" });
    }
  };

  const handleMoveBackward = (runner: RunnerOnBase) => {
    if (runner.baseIndex > 0) {
      dispatch({ type: "MOVE_RUNNER", runnerId: runner.id, direction: "backward" });
    }
  };

  const confirmRunnerOut = (runner: RunnerOnBase) => {
    setRunnerBeingOut(runner);
    setShowOutModal(true);
  };

  const handleRunnerOut = () => {
    if (!runnerBeingOut) return;
    dispatch({ type: "RUNNER_OUT", runnerId: runnerBeingOut.id });
    saveRunnersToDb(runnerBeingOut.id);
    setShowOutModal(false);
    setRunnerBeingOut(null);
  };

  const handleRunScored = () => {
    if (!runnerScoring) return;
    dispatch({ type: "RUNNER_SCORED", runnerId: runnerScoring.id });
    saveRunnersToDb(runnerScoring.id);
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
