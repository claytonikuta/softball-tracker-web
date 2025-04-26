import React from "react";
import { useGameContext } from "../../context/GameContext";
import styles from "./InTheHoleDisplay.module.css";

const InTheHoleDisplay: React.FC = () => {
  const { inTheHoleBatter } = useGameContext();

  if (!inTheHoleBatter) {
    return (
      <div className={styles["in-the-hole-display"]}>
        <h3>In The Hole</h3>
        <div className={styles["in-the-hole-name"]}>None</div>
      </div>
    );
  }

  return (
    <div className={styles["in-the-hole-display"]}>
      <h3>In The Hole</h3>
      <div className={styles["in-the-hole-name"]}>{inTheHoleBatter.name}</div>
      <div className={styles["in-the-hole-group"]}>{inTheHoleBatter.group}</div>
      <div className={styles["in-the-hole-stats"]}>
        <span>R: {inTheHoleBatter.runs || 0}</span>
        <span>O: {inTheHoleBatter.outs || 0}</span>
      </div>
    </div>
  );
};

export default InTheHoleDisplay;
