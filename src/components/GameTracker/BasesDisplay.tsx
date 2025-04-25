import React, { useState } from "react";
import { useGameContext } from "../../context/GameContext";
import { useLineup } from "../../context/LineupContext";
import { Player } from "../../types/Player";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import styles from "./BasesDisplay.module.css";

const BasesDisplay: React.FC = () => {
  const { runnersOnBase, setRunnersOnBase } = useGameContext();
  const { updatePlayer } = useLineup();
  const [selectedRunner, setSelectedRunner] = useState<Player | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Helper function to find a runner on a specific base
  const getRunnerOnBase = (baseNumber: number): Player | undefined => {
    if (!runnersOnBase || runnersOnBase.length === 0) return undefined;

    // Assuming first runner is on first base, second on second, etc.
    if (
      baseNumber >= 1 &&
      baseNumber <= 3 &&
      runnersOnBase.length >= baseNumber
    ) {
      return runnersOnBase[baseNumber - 1];
    }

    return undefined;
  };

  const handleRunnerClick = (runner: Player) => {
    setSelectedRunner(runner);
    setShowModal(true);
  };

  const handleRunScored = () => {
    if (!selectedRunner) return;

    // Update the player's runs
    const updatedPlayer = { ...selectedRunner, runs: selectedRunner.runs + 1 };
    updatePlayer(selectedRunner.id, updatedPlayer);

    // Remove runner from bases
    const updatedRunners = runnersOnBase.filter(
      (r) => r.id !== selectedRunner.id
    );
    setRunnersOnBase(updatedRunners);

    setShowModal(false);
  };

  const handleRunnerOut = () => {
    if (!selectedRunner) return;

    // Update the player's outs
    const updatedPlayer = { ...selectedRunner, outs: selectedRunner.outs + 1 };
    updatePlayer(selectedRunner.id, updatedPlayer);

    // Remove runner from bases
    const updatedRunners = runnersOnBase.filter(
      (r) => r.id !== selectedRunner.id
    );
    setRunnersOnBase(updatedRunners);

    setShowModal(false);
  };

  return (
    <>
      <div className={styles["bases-display"]}>
        <h3>Bases</h3>
        <div className={styles["diamond"]}>
          <div className={styles["base home-plate"]}>
            <span>Home</span>
          </div>
          <div className={styles["base first-base"]}>
            <span>1st</span>
            {getRunnerOnBase(1) && (
              <div
                className={styles["runner"]}
                onClick={() => handleRunnerClick(getRunnerOnBase(1)!)}
              >
                {getRunnerOnBase(1)?.name}
              </div>
            )}
          </div>
          <div className={styles["base second-base"]}>
            <span>2nd</span>
            {getRunnerOnBase(2) && (
              <div
                className={styles["runner"]}
                onClick={() => handleRunnerClick(getRunnerOnBase(2)!)}
              >
                {getRunnerOnBase(2)?.name}
              </div>
            )}
          </div>
          <div className={styles["base third-base"]}>
            <span>3rd</span>
            {getRunnerOnBase(3) && (
              <div
                className={styles["runner"]}
                onClick={() => handleRunnerClick(getRunnerOnBase(3)!)}
              >
                {getRunnerOnBase(3)?.name}
              </div>
            )}
          </div>
        </div>
        <div className={styles["runners-hint"]}>
          {runnersOnBase.length > 0
            ? "Click on a runner to record an out or run"
            : "No runners on base"}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Runner: ${selectedRunner?.name || ""}`}
      >
        <div className={styles["runner-actions"]}>
          <p>What happened to this runner?</p>
          <div className={styles["modal-actions"]}>
            <Button onClick={handleRunScored} className={styles["run-button"]}>
              Scored Run
            </Button>
            <Button onClick={handleRunnerOut} className={styles["out-button"]}>
              Out
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BasesDisplay;
