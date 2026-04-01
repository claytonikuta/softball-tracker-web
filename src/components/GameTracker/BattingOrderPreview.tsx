import React, { useMemo, useState, useRef, useEffect } from "react";
import { useGameSession } from "../../context/GameSessionContext";
import { Player } from "../../types/Player";
import Modal from "../shared/Modal";
import styles from "./BattingOrderPreview.module.css";

const BattingOrderPreview: React.FC = () => {
  const {
    greenLineup,
    orangeLineup,
    lastGreenIndex,
    lastOrangeIndex,
    alternatingTurn,
    currentBatter,
  } = useGameSession();

  const [showModal, setShowModal] = useState(false);
  const activeRef = useRef<HTMLDivElement>(null);

  const upcomingBatters: Player[] = useMemo(() => {
    if (greenLineup.length === 0 && orangeLineup.length === 0) return [];

    // Show enough so every player from both groups appears at least once
    const count =
      greenLineup.length > 0 && orangeLineup.length > 0
        ? 2 * Math.max(greenLineup.length, orangeLineup.length)
        : greenLineup.length + orangeLineup.length;

    const result: Player[] = [];
    let turn = alternatingTurn;
    let gIdx = lastGreenIndex;
    let oIdx = lastOrangeIndex;

    for (let i = 0; i < count; i++) {
      const lineup = turn === "green" ? greenLineup : orangeLineup;
      const idx = turn === "green" ? gIdx : oIdx;

      if (lineup.length > 0) {
        result.push(lineup[idx % lineup.length]);
      }

      if (turn === "green") {
        gIdx = greenLineup.length > 0 ? (gIdx + 1) % greenLineup.length : 0;
      } else {
        oIdx = orangeLineup.length > 0 ? (oIdx + 1) % orangeLineup.length : 0;
      }

      if (greenLineup.length > 0 && orangeLineup.length > 0) {
        turn = turn === "green" ? "orange" : "green";
      }
    }

    return result;
  }, [greenLineup, orangeLineup, lastGreenIndex, lastOrangeIndex, alternatingTurn]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }, [currentBatter]);

  if (upcomingBatters.length === 0) return null;

  return (
    <>
      <div
        className={styles["batting-order-preview"]}
        onClick={() => setShowModal(true)}
      >
        <h3 className={styles["preview-title"]}>Batting Order</h3>
        <div className={styles["horizontal-list"]}>
          {upcomingBatters.map((player, index) => {
            const isActive = index === 0;
            const groupClass =
              player.group === "green"
                ? styles["green-player"]
                : styles["orange-player"];
            return (
              <div
                key={`${player.id}-${index}`}
                ref={isActive ? activeRef : null}
                className={`${styles["order-chip"]} ${groupClass} ${
                  isActive ? styles["active-chip"] : ""
                }`}
              >
                <span className={styles["chip-name"]}>{player.name}</span>
              </div>
            );
          })}
        </div>
        <div className={styles["tap-hint"]}>Tap to expand</div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Upcoming Batters"
      >
        <div className={styles["modal-list"]}>
          {upcomingBatters.map((player, index) => {
            const isActive = index === 0;
            const groupClass =
              player.group === "green"
                ? styles["modal-green"]
                : styles["modal-orange"];
            const label =
              index === 0
                ? "NOW"
                : index === 1
                  ? "On Deck"
                  : index === 2
                    ? "In Hole"
                    : `#${index + 1}`;
            return (
              <div
                key={`modal-${player.id}-${index}`}
                className={`${styles["modal-row"]} ${groupClass} ${
                  isActive ? styles["modal-active"] : ""
                }`}
              >
                <span className={styles["modal-number"]}>{label}</span>
                <span className={styles["modal-name"]}>{player.name}</span>
                <span className={styles["modal-group"]}>
                  {player.group === "green" ? "Green" : "Orange"}
                </span>
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
};

export default BattingOrderPreview;
