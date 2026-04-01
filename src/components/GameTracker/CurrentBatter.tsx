import React, { useState } from "react";
import { useGameSession } from "../../context/GameSessionContext";
import { useParams } from "next/navigation";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import styles from "./CurrentBatter.module.css";

const CurrentBatter: React.FC = () => {
  const params = useParams();
  const id = params?.id;
  const { currentBatter, lastGreenIndex, lastOrangeIndex, dispatch } =
    useGameSession();
  const [showModal, setShowModal] = useState(false);

  const handleBatterResult = (
    result: "single" | "double" | "triple" | "homerun" | "out"
  ) => {
    if (!currentBatter) return;

    dispatch({ type: "RECORD_AT_BAT", result });

    // Persist indices to DB immediately
    const gameId = id ? (Array.isArray(id) ? id[0] : id) : null;
    if (gameId) {
      const newGreenIndex =
        currentBatter.group === "green"
          ? lastGreenIndex + 1
          : lastGreenIndex;
      const newOrangeIndex =
        currentBatter.group === "orange"
          ? lastOrangeIndex + 1
          : lastOrangeIndex;

      fetch(`/api/games/${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          last_green_index: newGreenIndex,
          last_orange_index: newOrangeIndex,
        }),
      }).catch(() => {});
    }

    setShowModal(false);
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
