import React from "react";
import { useGameContext } from "../../context/GameContext";
import styles from "./FieldDiamond.module.css";

const FieldDiamond: React.FC = () => {
  const { runnersOnBase } = useGameContext();

  // Group runners by base
  const runnersByBase = {
    first: runnersOnBase.filter((runner) => runner.baseIndex === 0),
    second: runnersOnBase.filter((runner) => runner.baseIndex === 1),
    third: runnersOnBase.filter((runner) => runner.baseIndex === 2),
  };

  return (
    <div className={styles.fieldDiamond}>
      <h3>Field Status</h3>
      <div className={styles.diamond}>
        <div className={styles.homePlate}>
          <span>H</span>
        </div>

        <div className={styles.firstBase}>
          <span>1</span>
          {runnersByBase.first.length > 0 && (
            <div className={styles.runnerNames}>
              {runnersByBase.first.map((runner) => (
                <div key={runner.id} className={styles.runnerName}>
                  {runner.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.secondBase}>
          <span>2</span>
          {runnersByBase.second.length > 0 && (
            <div className={styles.runnerNames}>
              {runnersByBase.second.map((runner) => (
                <div key={runner.id} className={styles.runnerName}>
                  {runner.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.thirdBase}>
          <span>3</span>
          {runnersByBase.third.length > 0 && (
            <div className={styles.runnerNames}>
              {runnersByBase.third.map((runner) => (
                <div key={runner.id} className={styles.runnerName}>
                  {runner.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldDiamond;
