import React from "react";
import { useGameContext } from "../../context/GameContext";
import styles from "./OnDeckDisplay.module.css";

const OnDeckDisplay: React.FC = () => {
  const { onDeckBatter } = useGameContext();

  if (!onDeckBatter) {
    return (
      <div className={styles["on-deck-display"]}>
        <h3>On Deck</h3>
        <div className={styles["on-deck-name"]}>None</div>
      </div>
    );
  }

  return (
    <div className={styles["on-deck-display"]}>
      <h3>On Deck</h3>
      <div className={styles["on-deck-name"]}>{onDeckBatter.name}</div>
      <div className={styles["on-deck-group"]}>{onDeckBatter.group}</div>
      <div className={styles["on-deck-stats"]}>
        <span>R: {onDeckBatter.runs || 0}</span>
        <span>O: {onDeckBatter.outs || 0}</span>
      </div>
    </div>
  );
};

export default OnDeckDisplay;
