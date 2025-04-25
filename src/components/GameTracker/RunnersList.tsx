import React, { useState } from "react";
import { useGameContext } from "../../context/GameContext";
import { useLineup } from "../../context/LineupContext";
import { RunnerOnBase } from "../../types/Player";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import styles from "./RunnersList.module.css";

const RunnersList: React.FC = () => {
  // Add the new context values
  const {
    runnersOnBase,
    setRunnersOnBase,
    currentInning,
    isHomeTeamBatting,
    updateHomeInningScore,
    updateAwayInningScore,
  } = useGameContext();

  const { updatePlayer } = useLineup();
  const [selectedRunner, setSelectedRunner] = useState<RunnerOnBase | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  // Get base name for display based on baseIndex, not array position
  const getBaseName = (baseIndex: number): string => {
    if (baseIndex === 0) return "1st Base";
    if (baseIndex === 1) return "2nd Base";
    if (baseIndex === 2) return "3rd Base";
    return "Unknown";
  };

  const handleRunnerClick = (runner: RunnerOnBase) => {
    console.log("Runner clicked:", runner);
    setSelectedRunner(runner);
    setShowModal(true);
  };

  const handleRunnerAction = (action: string) => {
    if (!selectedRunner) return;
    console.log(`Runner action for ${selectedRunner.name}: ${action}`);

    if (action === "home") {
      // Runner scored
      const updatedPlayer = {
        ...selectedRunner,
        runs: selectedRunner.runs + 1,
      };

      // Extract the base player ID (without the timestamp/random elements)
      const basePlayerId = selectedRunner.id.split("-")[0];
      console.log(`Updating player ${basePlayerId} stats for scoring`);
      updatePlayer(basePlayerId, updatedPlayer);

      // NEW CODE: Update inning runs for current team
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

      // Remove from runners list using the full unique ID
      console.log(`Removing runner with ID ${selectedRunner.id}`);
      setRunnersOnBase((prevRunners) =>
        prevRunners.filter((r) => r.id !== selectedRunner.id)
      );
    } else if (action === "out") {
      // Runner is out
      const updatedPlayer = {
        ...selectedRunner,
        outs: selectedRunner.outs + 1,
      };

      // Extract the base player ID (without the timestamp/random elements)
      const basePlayerId = selectedRunner.id.split("-")[0];
      console.log(`Updating player ${basePlayerId} stats for out`);
      updatePlayer(basePlayerId, updatedPlayer);

      // NEW CODE: Update inning outs for current team
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

      // Remove from runners list using the full unique ID
      console.log(`Removing runner with ID ${selectedRunner.id}`);
      setRunnersOnBase((prevRunners) =>
        prevRunners.filter((r) => r.id !== selectedRunner.id)
      );
    } else {
      // Move runner to a different base
      const baseIndex =
        action === "first"
          ? 0
          : action === "second"
          ? 1
          : action === "third"
          ? 2
          : 0;

      console.log(`Moving runner ${selectedRunner.name} to base ${baseIndex}`);
      setRunnersOnBase((prevRunners) =>
        prevRunners.map((r) =>
          r.id === selectedRunner.id ? { ...r, baseIndex } : r
        )
      );
    }

    setShowModal(false);
    setSelectedRunner(null);
  };

  return (
    <>
      <div className={styles["runners-list"]}>
        <h3>Runners On Base</h3>
        {runnersOnBase.length === 0 ? (
          <p className={styles["no-runners"]}>No runners on base</p>
        ) : (
          <div className={styles["runners-container"]}>
            {runnersOnBase.map((runner) => (
              <div
                key={runner.id}
                className={styles["runner-item"]}
                onClick={() => handleRunnerClick(runner)}
              >
                <div className={styles["runner-name"]}>{runner.name}</div>
                <div className={styles["runner-details"]}>
                  <span className={styles["runner-base"]}>
                    {getBaseName(runner.baseIndex)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedRunner(null);
        }}
        title={`Runner: ${selectedRunner?.name || ""}`}
      >
        <div className={styles["runner-actions"]}>
          <p>What happened to this runner?</p>
          <div className={styles["modal-actions"]}>
            <h4>Move To:</h4>
            <div className={styles["base-options"]}>
              <Button
                onClick={() => handleRunnerAction("first")}
                className={styles["base-button"]}
              >
                1st Base
              </Button>
              <Button
                onClick={() => handleRunnerAction("second")}
                className={styles["base-button"]}
              >
                2nd Base
              </Button>
              <Button
                onClick={() => handleRunnerAction("third")}
                className={styles["base-button"]}
              >
                3rd Base
              </Button>
            </div>
            <div className={styles["outcome-options"]}>
              <Button
                onClick={() => handleRunnerAction("home")}
                className={styles["run-button"]}
              >
                Scored Run
              </Button>
              <Button
                onClick={() => handleRunnerAction("out")}
                className={styles["out-button"]}
              >
                Out
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RunnersList;
