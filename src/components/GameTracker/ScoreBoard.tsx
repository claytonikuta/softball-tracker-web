import React from "react";
import { useGameContext } from "../../context/GameContext";
import Button from "../shared/Button";
import styles from "./ScoreBoard.module.css";

const Scoreboard: React.FC = () => {
  const {
    currentInning,
    homeTeam,
    awayTeam,
    isHomeTeamBatting,
    setCurrentInning,
    setIsHomeTeamBatting,
    updateHomeInningScore,
    updateAwayInningScore,
  } = useGameContext();

  // Helper function to increment or decrement a value with a minimum of 0
  const updateValue = (
    current: number,
    increment: boolean,
    max: number = 999,
    min: number = 0
  ): number => {
    if (increment) {
      return current < max ? current + 1 : current;
    } else {
      return current > min ? current - 1 : min;
    }
  };

  // Handle inning change
  const changeInning = (increment: boolean) => {
    const newInning = increment
      ? currentInning < 9
        ? currentInning + 1
        : currentInning // Max 9 innings
      : currentInning > 1
      ? currentInning - 1
      : 1; // Min 1 inning (prevent going to 0)
    setCurrentInning(newInning);
  };

  // Toggle batting team
  const toggleBattingTeam = () => {
    setIsHomeTeamBatting(!isHomeTeamBatting);
  };

  // Update runs for current batting team in current inning
  const updateRuns = (team: "home" | "away", increment: boolean) => {
    const updateFn =
      team === "home" ? updateHomeInningScore : updateAwayInningScore;
    updateFn(
      currentInning,
      (prev) => updateValue(prev, increment),
      (outs) => outs // keep outs the same
    );
  };

  // Update outs for current batting team in current inning
  const updateOuts = (team: "home" | "away", increment: boolean) => {
    const updateFn =
      team === "home" ? updateHomeInningScore : updateAwayInningScore;
    updateFn(
      currentInning,
      (runs) => runs, // keep runs the same
      (prev) => updateValue(prev, increment, 3) // Max 3 outs per inning
    );
  };

  return (
    <div className={styles["scoreboard"]}>
      <div className={styles["scoreboard-header"]}>
        <h3>Scoreboard</h3>
        <div className={styles["inning-controls"]}>
          <span>Inning:</span>
          <Button
            onClick={() => changeInning(false)}
            className={styles["small-btn"]}
          >
            -
          </Button>
          <span className={styles["current-inning"]}>{currentInning}</span>
          <Button
            onClick={() => changeInning(true)}
            className={styles["small-btn"]}
          >
            +
          </Button>
          <Button
            onClick={toggleBattingTeam}
            className={styles["toggle-team-btn"]}
          >
            {isHomeTeamBatting ? "Home" : "Away"} Batting
          </Button>
        </div>
      </div>

      <div className={styles["innings-display"]}>
        <table>
          <thead>
            <tr>
              <th>Team</th>
              {homeTeam.innings.map((_, index) => (
                <th
                  key={index + 1}
                  className={
                    currentInning === index + 1
                      ? styles["current-inning-col"]
                      : ""
                  }
                >
                  {index + 1}
                </th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className={styles["home-team"]}>
              <td>Xiballba</td>
              {homeTeam.innings.map((inning, index) => (
                <td
                  key={index + 1}
                  className={
                    currentInning === index + 1
                      ? styles["current-inning-col"]
                      : ""
                  }
                >
                  {inning.runs}
                </td>
              ))}
              <td>{homeTeam.totalRuns}</td>
            </tr>
            <tr className={styles["away-team"]}>
              <td>Opponent</td>
              {awayTeam.innings.map((inning, index) => (
                <td
                  key={index + 1}
                  className={
                    currentInning === index + 1
                      ? styles["current-inning-col"]
                      : ""
                  }
                >
                  {inning.runs}
                </td>
              ))}
              <td>{awayTeam.totalRuns}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles["team-controls"]}>
        <div className={styles["team-section"]}>
          <h4>Xiballba</h4>
          <div className={styles["team-scores"]}>
            <div className={styles["score-control"]}>
              <span>
                Runs: {homeTeam.innings[currentInning - 1]?.runs || 0}
              </span>
              <div className={styles["score-buttons"]}>
                <Button
                  onClick={() => updateRuns("home", false)}
                  className={styles["small-btn"]}
                >
                  -
                </Button>
                <Button
                  onClick={() => updateRuns("home", true)}
                  className={styles["small-btn"]}
                >
                  +
                </Button>
              </div>
            </div>
            <div className={styles["score-control"]}>
              <span>
                Outs: {homeTeam.innings[currentInning - 1]?.outs || 0}
              </span>
              <div className={styles["score-buttons"]}>
                <Button
                  onClick={() => updateOuts("home", false)}
                  className={styles["small-btn"]}
                >
                  -
                </Button>
                <Button
                  onClick={() => updateOuts("home", true)}
                  className={styles["small-btn"]}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles["team-section"]}>
          <h4>Opponent</h4>
          <div className={styles["team-scores"]}>
            <div className={styles["score-control"]}>
              <span>
                Runs: {awayTeam.innings[currentInning - 1]?.runs || 0}
              </span>
              <div className={styles["score-buttons"]}>
                <Button
                  onClick={() => updateRuns("away", false)}
                  className={styles["small-btn"]}
                >
                  -
                </Button>
                <Button
                  onClick={() => updateRuns("away", true)}
                  className={styles["small-btn"]}
                >
                  +
                </Button>
              </div>
            </div>
            <div className={styles["score-control"]}>
              <span>
                Outs: {awayTeam.innings[currentInning - 1]?.outs || 0}
              </span>
              <div className={styles["score-buttons"]}>
                <Button
                  onClick={() => updateOuts("away", false)}
                  className={styles["small-btn"]}
                >
                  -
                </Button>
                <Button
                  onClick={() => updateOuts("away", true)}
                  className={styles["small-btn"]}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
