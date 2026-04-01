import React from "react";
import { useGameSession } from "../../context/GameSessionContext";
import Button from "../shared/Button";
import styles from "./ScoreBoard.module.css";

const Scoreboard: React.FC = () => {
  const {
    currentInning,
    homeTeam,
    awayTeam,
    isHomeTeamBatting,
    isOurTurnToBat,
    homeTeamName,
    awayTeamName,
    ourTeam,
    dispatch,
  } = useGameSession();

  const isTop = !isHomeTeamBatting;
  const halfLabel = isTop ? "Top" : "Bot";

  const advanceHalf = () => {
    if (isHomeTeamBatting) {
      if (currentInning < 9) {
        dispatch({ type: "SET_INNING", inning: currentInning + 1 });
        dispatch({ type: "SET_HOME_TEAM_BATTING", isHome: false });
      }
    } else {
      dispatch({ type: "SET_HOME_TEAM_BATTING", isHome: true });
    }
  };

  const retreatHalf = () => {
    if (!isHomeTeamBatting) {
      if (currentInning > 1) {
        dispatch({ type: "SET_INNING", inning: currentInning - 1 });
        dispatch({ type: "SET_HOME_TEAM_BATTING", isHome: true });
      }
    } else {
      dispatch({ type: "SET_HOME_TEAM_BATTING", isHome: false });
    }
  };

  const toggleHalf = () => {
    dispatch({ type: "SET_HOME_TEAM_BATTING", isHome: !isHomeTeamBatting });
  };

  const updateRuns = (team: "home" | "away", increment: boolean) => {
    dispatch({
      type: "UPDATE_INNING_SCORE",
      team,
      inning: currentInning,
      runsDelta: increment ? 1 : -1,
      outsDelta: 0,
    });
  };

  const updateOuts = (team: "home" | "away", increment: boolean) => {
    dispatch({
      type: "UPDATE_INNING_SCORE",
      team,
      inning: currentInning,
      runsDelta: 0,
      outsDelta: increment ? 1 : -1,
    });
  };

  const getCellClass = (
    team: "home" | "away",
    inningIndex: number
  ): string => {
    if (inningIndex + 1 !== currentInning) return "";
    const isActiveTeam =
      (team === "home" && isHomeTeamBatting) ||
      (team === "away" && !isHomeTeamBatting);
    return isActiveTeam ? styles["active-cell"] : styles["inactive-cell"];
  };

  const isAwayBatting = !isHomeTeamBatting;

  return (
    <div className={styles["scoreboard"]}>
      <div className={styles["scoreboard-header"]}>
        <h3>Scoreboard</h3>
        <div className={styles["inning-controls"]}>
          <Button
            onClick={retreatHalf}
            className={styles["small-btn"]}
          >
            &minus;
          </Button>
          <div className={styles["inning-label"]}>
            <span className={styles["half-indicator"]}>{halfLabel}</span>
            <span className={styles["inning-number"]}>{currentInning}</span>
          </div>
          <Button
            onClick={advanceHalf}
            className={styles["small-btn"]}
          >
            +
          </Button>
          <Button
            onClick={toggleHalf}
            className={`${styles["half-toggle-btn"]} ${isTop ? styles["top-half"] : styles["bot-half"]}`}
          >
            {isTop ? "Top \u25B2" : "Bot \u25BC"}
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
                      ? styles["current-inning-header"]
                      : ""
                  }
                >
                  {index + 1}
                </th>
              ))}
              <th>R</th>
            </tr>
          </thead>
          <tbody>
            <tr className={styles["away-row"]}>
              <td>
                {awayTeamName}
                {ourTeam === "away" && (
                  <span className={styles["us-indicator"]}> *</span>
                )}
              </td>
              {awayTeam.innings.map((inning, index) => (
                <td key={index + 1} className={getCellClass("away", index)}>
                  {inning.runs}
                </td>
              ))}
              <td className={styles["total-cell"]}>{awayTeam.totalRuns}</td>
            </tr>
            <tr className={styles["home-row"]}>
              <td>
                {homeTeamName}
                {ourTeam === "home" && (
                  <span className={styles["us-indicator"]}> *</span>
                )}
              </td>
              {homeTeam.innings.map((inning, index) => (
                <td key={index + 1} className={getCellClass("home", index)}>
                  {inning.runs}
                </td>
              ))}
              <td className={styles["total-cell"]}>{homeTeam.totalRuns}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles["team-controls"]}>
        {/* Away team controls — enabled when away is batting */}
        <div
          className={`${styles["team-section"]} ${
            isAwayBatting ? styles["active-section"] : styles["disabled-section"]
          }`}
        >
          <h4>
            {awayTeamName}
            {ourTeam === "away" && <span className={styles["us-tag"]}>US</span>}
            {isAwayBatting && <span className={styles["batting-tag"]}>BATTING</span>}
          </h4>
          <div className={styles["team-scores"]}>
            <div className={styles["score-control"]}>
              <span>Runs: {awayTeam.innings[currentInning - 1]?.runs || 0}</span>
              <div className={styles["score-buttons"]}>
                <Button
                  onClick={() => updateRuns("away", false)}
                  className={styles["small-btn"]}
                  disabled={!isAwayBatting}
                >
                  &minus;
                </Button>
                <Button
                  onClick={() => updateRuns("away", true)}
                  className={styles["small-btn"]}
                  disabled={!isAwayBatting}
                >
                  +
                </Button>
              </div>
            </div>
            <div className={styles["score-control"]}>
              <span>Outs: {awayTeam.innings[currentInning - 1]?.outs || 0}</span>
              <div className={styles["score-buttons"]}>
                <Button
                  onClick={() => updateOuts("away", false)}
                  className={styles["small-btn"]}
                  disabled={!isAwayBatting}
                >
                  &minus;
                </Button>
                <Button
                  onClick={() => updateOuts("away", true)}
                  className={styles["small-btn"]}
                  disabled={!isAwayBatting}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Home team controls — enabled when home is batting */}
        <div
          className={`${styles["team-section"]} ${
            isHomeTeamBatting ? styles["active-section"] : styles["disabled-section"]
          }`}
        >
          <h4>
            {homeTeamName}
            {ourTeam === "home" && <span className={styles["us-tag"]}>US</span>}
            {isHomeTeamBatting && <span className={styles["batting-tag"]}>BATTING</span>}
          </h4>
          <div className={styles["team-scores"]}>
            <div className={styles["score-control"]}>
              <span>Runs: {homeTeam.innings[currentInning - 1]?.runs || 0}</span>
              <div className={styles["score-buttons"]}>
                <Button
                  onClick={() => updateRuns("home", false)}
                  className={styles["small-btn"]}
                  disabled={!isHomeTeamBatting}
                >
                  &minus;
                </Button>
                <Button
                  onClick={() => updateRuns("home", true)}
                  className={styles["small-btn"]}
                  disabled={!isHomeTeamBatting}
                >
                  +
                </Button>
              </div>
            </div>
            <div className={styles["score-control"]}>
              <span>Outs: {homeTeam.innings[currentInning - 1]?.outs || 0}</span>
              <div className={styles["score-buttons"]}>
                <Button
                  onClick={() => updateOuts("home", false)}
                  className={styles["small-btn"]}
                  disabled={!isHomeTeamBatting}
                >
                  &minus;
                </Button>
                <Button
                  onClick={() => updateOuts("home", true)}
                  className={styles["small-btn"]}
                  disabled={!isHomeTeamBatting}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isOurTurnToBat && (
        <div className={styles["opponent-batting-notice"]}>
          Opponent at bat &mdash; batting &amp; base running disabled
        </div>
      )}
    </div>
  );
};

export default Scoreboard;
