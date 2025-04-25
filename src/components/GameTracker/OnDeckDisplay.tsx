import React from "react";
import { useGameContext } from "../../context/GameContext";
import styles from "./OnDeckDisplay.module.css";

const OnDeckDisplay: React.FC = () => {
  const { onDeckBatter } = useGameContext();

  return (
    <div className={styles["on-deck-display"]}>
      <h3>On Deck</h3>
      {onDeckBatter ? (
        <div className={styles["on-deck-card"]}>
          <div className={styles["on-deck-name"]}>{onDeckBatter.name}</div>
          <div className={styles["on-deck-group"]}>
            Group: {onDeckBatter.group === "green" ? "Green" : "Orange"}
          </div>
          <div className={styles["on-deck-stats"]}>
            <span>Runs: {onDeckBatter.runs}</span>
            <span>Outs: {onDeckBatter.outs}</span>
          </div>
        </div>
      ) : (
        <p className={styles["no-batter"]}>No batter on deck</p>
      )}
    </div>
  );
};

export default OnDeckDisplay;
