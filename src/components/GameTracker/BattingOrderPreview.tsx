import React, { useMemo, useState, useRef, useEffect } from "react";
import { useLineup } from "../../context/LineupContext";
import { useGameContext } from "../../context/GameContext";
import { Player } from "../../types/Player";
import Modal from "../shared/Modal";
import styles from "./BattingOrderPreview.module.css";

interface BattingOrderEntry {
  player: Player;
  groupIndex: number; // index within the player's own group
}

const BattingOrderPreview: React.FC = () => {
  const { greenLineup, orangeLineup } = useLineup();
  const { currentBatter, alternatingTurn } = useGameContext();
  const [showModal, setShowModal] = useState(false);
  const activeRef = useRef<HTMLDivElement>(null);

  // Build the full alternating batting order until every player has appeared at least once
  const battingOrder: BattingOrderEntry[] = useMemo(() => {
    if (greenLineup.length === 0 && orangeLineup.length === 0) return [];

    // Determine which group bats first based on alternatingTurn
    // If alternatingTurn is "green", green bats on odd slots; if "orange", orange bats on odd slots
    const firstGroup = alternatingTurn === "green" ? greenLineup : orangeLineup;
    const secondGroup = alternatingTurn === "green" ? orangeLineup : greenLineup;

    if (firstGroup.length === 0 && secondGroup.length === 0) return [];

    // Need enough entries so every player appears at least once
    // That's 2 * max(firstGroup.length, secondGroup.length)
    const maxGroupLen = Math.max(firstGroup.length, secondGroup.length);
    const totalEntries = maxGroupLen * 2;

    const order: BattingOrderEntry[] = [];

    // Handle edge case: one group is empty
    if (firstGroup.length === 0) {
      for (let i = 0; i < secondGroup.length; i++) {
        order.push({ player: secondGroup[i], groupIndex: i });
      }
      return order;
    }
    if (secondGroup.length === 0) {
      for (let i = 0; i < firstGroup.length; i++) {
        order.push({ player: firstGroup[i], groupIndex: i });
      }
      return order;
    }

    let firstIdx = 0;
    let secondIdx = 0;

    for (let i = 0; i < totalEntries; i++) {
      if (i % 2 === 0) {
        // First group's turn
        order.push({
          player: firstGroup[firstIdx % firstGroup.length],
          groupIndex: firstIdx % firstGroup.length,
        });
        firstIdx++;
      } else {
        // Second group's turn
        order.push({
          player: secondGroup[secondIdx % secondGroup.length],
          groupIndex: secondIdx % secondGroup.length,
        });
        secondIdx++;
      }
    }

    return order;
  }, [greenLineup, orangeLineup, alternatingTurn]);

  // Scroll the active batter into view in the horizontal list
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentBatter, battingOrder]);

  if (battingOrder.length === 0) return null;

  return (
    <>
      <div
        className={styles["batting-order-preview"]}
        onClick={() => setShowModal(true)}
      >
        <h3 className={styles["preview-title"]}>Batting Order</h3>
        <div className={styles["horizontal-list"]}>
          {battingOrder.map((entry, index) => {
            const isActive = currentBatter?.id === entry.player.id;
            const groupClass =
              entry.player.group === "green"
                ? styles["green-player"]
                : styles["orange-player"];
            return (
              <div
                key={`${entry.player.id}-${index}`}
                ref={isActive ? activeRef : null}
                className={`${styles["order-chip"]} ${groupClass} ${
                  isActive ? styles["active-chip"] : ""
                }`}
              >
                <span className={styles["chip-number"]}>{index + 1}</span>
                <span className={styles["chip-name"]}>{entry.player.name}</span>
              </div>
            );
          })}
        </div>
        <div className={styles["tap-hint"]}>Tap to expand</div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Full Batting Order"
      >
        <div className={styles["modal-list"]}>
          {battingOrder.map((entry, index) => {
            const isActive = currentBatter?.id === entry.player.id;
            const groupClass =
              entry.player.group === "green"
                ? styles["modal-green"]
                : styles["modal-orange"];
            return (
              <div
                key={`modal-${entry.player.id}-${index}`}
                className={`${styles["modal-row"]} ${groupClass} ${
                  isActive ? styles["modal-active"] : ""
                }`}
              >
                <span className={styles["modal-number"]}>{index + 1}</span>
                <span className={styles["modal-name"]}>
                  {entry.player.name}
                </span>
                <span className={styles["modal-group"]}>
                  {entry.player.group === "green" ? "Green" : "Orange"}
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
