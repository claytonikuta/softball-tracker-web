import React from "react";
import { useGameContext } from "../../context/GameContext";
import styles from "./InTheHoleDisplay.module.css";

const InTheHoleDisplay: React.FC = () => {
  const { inTheHoleBatter } = useGameContext();

  return (
    <div className={styles["in-the-hole-display"]}>
      <h3>In The Hole</h3>
      {inTheHoleBatter ? (
        <div className={styles["in-the-hole-card"]}>
          <div className={styles["in-the-hole-name"]}>
            {inTheHoleBatter.name}
          </div>
          {/* <div className={styles["in-the-hole-group"]}>
            Group: {inTheHoleBatter.group === "green" ? "Green" : "Orange"}
          </div> */}
          {/* <div className={styles["in-the-hole-stats"]}>
            <span>Runs: {inTheHoleBatter.runs}</span>
            <span>Outs: {inTheHoleBatter.outs}</span>
          </div> */}
        </div>
      ) : (
        <p className={styles["no-batter"]}>No batter in the hole</p>
      )}
    </div>
  );
};

export default InTheHoleDisplay;
