import React from "react";
import styles from "./LineupStats.module.css";

interface LineupStatsProps {
  totalRuns: number;
  totalOuts: number;
}

const LineupStats: React.FC<LineupStatsProps> = ({ totalRuns, totalOuts }) => {
  return (
    <div className={styles["lineup-stats"]}>
      <h3>Game Statistics</h3>
      <div className={styles["stats-grid"]}>
        <div className={styles["stat-item"]}>
          <div className={styles["stat-label"]}>Total Runs</div>
          <div className={styles["stat-value runs"]}>{totalRuns}</div>
        </div>
        <div className={styles["stat-item"]}>
          <div className={styles["stat-label"]}>Total Outs</div>
          <div className={styles["stat-value outs"]}>{totalOuts}</div>
        </div>
      </div>
    </div>
  );
};

export default LineupStats;
