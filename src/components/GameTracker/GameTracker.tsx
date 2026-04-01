import React, { useEffect, useRef } from "react";
import CurrentBatter from "./CurrentBatter";
import OnDeckDisplay from "./OnDeckDisplay";
import InTheHoleDisplay from "./InTheHoleDisplay";
import RunnersList from "./RunnersList";
import Scoreboard from "./ScoreBoard";
import FieldDiamond from "./FieldDiamond";
import { useGameSession } from "../../context/GameSessionContext";
import { useParams } from "next/navigation";
import styles from "./GameTracker.module.css";
import LineupManager from "../LineupManager/LineupManager";
import BattingOrderPreview from "./BattingOrderPreview";
import SafeRender from "../shared/SafeRender";
import { RunnerOnBase } from "@/types";

const GameTracker: React.FC = () => {
  const {
    greenLineup,
    orangeLineup,
    runnersOnBase,
    currentBatter,
    onDeckBatter,
    inTheHoleBatter,
    lastGreenIndex,
    lastOrangeIndex,
    currentInning,
    isHomeTeamBatting,
    homeTeam,
    awayTeam,
    isInitialDataLoaded,
    isOurTurnToBat,
    dispatch,
  } = useGameSession();

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedStateRef = useRef<string>("");
  const hasFetchedRef = useRef(false);
  const lineupsRef = useRef({ green: greenLineup, orange: orangeLineup });
  const { id } = useParams();

  // Keep the lineups ref current so the polling callback can read fresh data
  // without being a dependency of the fetch effect
  lineupsRef.current = { green: greenLineup, orange: orangeLineup };

  // Fetch game data ONCE on mount — loads indices and runners from DB
  useEffect(() => {
    if (hasFetchedRef.current) return;
    const fetchGameData = async () => {
      if (!id) return;
      hasFetchedRef.current = true;

      try {
        const gameId = Array.isArray(id) ? id[0] : id;
        const response = await fetch(`/api/games/${gameId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch game data: ${response.status}`);
        }

        const gameData = await response.json();

        const game = gameData.game;
        const loadedGreenIndex = game?.last_green_index ?? 0;
        const loadedOrangeIndex = game?.last_orange_index ?? 0;
        const loadedInning = game?.current_inning ?? 1;
        const loadedIsHomeBatting = game?.is_home_team_batting ?? false;
        const runnersFromDB = game?.runners ?? [];
        const inningsFromDB = game?.innings ?? [];

        dispatch({
          type: "SET_GAME_META",
          ourTeam: game?.our_team === "away" ? "away" : "home",
          homeTeamName: game?.home_team_name ?? "Home",
          awayTeamName: game?.away_team_name ?? "Away",
        });

        const processRunners = () => {
          const { green, orange } = lineupsRef.current;
          if (green.length === 0 && orange.length === 0) {
            setTimeout(processRunners, 500);
            return;
          }

          const allPlayers = [...green, ...orange];
          const loadedRunners = runnersFromDB
            .map((runner: { player_id: string; base_index: number }) => {
              const player = allPlayers.find(
                (p) => p.id.toString() === runner.player_id.toString()
              );
              if (player) {
                return {
                  ...player,
                  id: `${player.id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                  baseIndex: runner.base_index,
                };
              }
              return null;
            })
            .filter(Boolean) as RunnerOnBase[];

          dispatch({
            type: "LOAD_GAME_STATE",
            lastGreenIndex: loadedGreenIndex,
            lastOrangeIndex: loadedOrangeIndex,
            runners: loadedRunners,
            currentInning: loadedInning,
            isHomeTeamBatting: loadedIsHomeBatting,
            innings: inningsFromDB,
          });
        };

        if (runnersFromDB.length > 0) {
          processRunners();
        } else {
          dispatch({
            type: "LOAD_GAME_STATE",
            lastGreenIndex: loadedGreenIndex,
            lastOrangeIndex: loadedOrangeIndex,
            runners: [],
            currentInning: loadedInning,
            isHomeTeamBatting: loadedIsHomeBatting,
            innings: inningsFromDB,
          });
        }
      } catch (error) {
        console.error("Error loading game data:", error);
        dispatch({ type: "MARK_INITIAL_DATA_LOADED" });
      }
    };

    fetchGameData();
  }, [id, dispatch]);

  // Auto-save game state (debounced)
  useEffect(() => {
    if (!id || !isInitialDataLoaded) return;

    const fingerprint = JSON.stringify({
      runnersOnBase,
      lastGreenIndex,
      lastOrangeIndex,
      currentInning,
      isHomeTeamBatting,
      homeInnings: homeTeam.innings,
      awayInnings: awayTeam.innings,
      greenStats: greenLineup.map((p) => ({ id: p.id, runs: p.runs, outs: p.outs })),
      orangeStats: orangeLineup.map((p) => ({ id: p.id, runs: p.runs, outs: p.outs })),
    });

    if (fingerprint === lastSavedStateRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      const gameId = Array.isArray(id) ? id[0] : id;

      const validRunners = runnersOnBase
        .map((runner) => {
          const baseId = runner.id.split("-")[0];
          const numericId = parseInt(baseId);
          if (!isNaN(numericId) && numericId > 0 && numericId <= 2147483647) {
            return { player_id: numericId, base_index: runner.baseIndex };
          }
          return null;
        })
        .filter(Boolean);

      const inningsPayload = homeTeam.innings.map((hi, idx) => ({
        inning_number: idx + 1,
        home_runs: hi.runs,
        home_outs: hi.outs,
        away_runs: awayTeam.innings[idx]?.runs ?? 0,
        away_outs: awayTeam.innings[idx]?.outs ?? 0,
      }));

      const playersPayload = [
        ...greenLineup.map((p, idx) => {
          const numericId = parseInt(p.id);
          const hasDbId = !isNaN(numericId) && p.id.length < 10;
          return {
            ...(hasDbId ? { id: numericId } : {}),
            name: p.name,
            group_name: p.group,
            runs: p.runs ?? 0,
            outs: p.outs ?? 0,
            position: 1,
            index_in_group: idx,
          };
        }),
        ...orangeLineup.map((p, idx) => {
          const numericId = parseInt(p.id);
          const hasDbId = !isNaN(numericId) && p.id.length < 10;
          return {
            ...(hasDbId ? { id: numericId } : {}),
            name: p.name,
            group_name: p.group,
            runs: p.runs ?? 0,
            outs: p.outs ?? 0,
            position: 2,
            index_in_group: idx,
          };
        }),
      ];

      fetch(`/api/games/${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_inning: currentInning,
          is_home_team_batting: isHomeTeamBatting,
          runners: validRunners,
          last_green_index: lastGreenIndex,
          last_orange_index: lastOrangeIndex,
          innings: inningsPayload,
          players: playersPayload,
        }),
      })
        .then(() => {
          lastSavedStateRef.current = fingerprint;
          isSavingRef.current = false;
          saveTimeoutRef.current = null;
        })
        .catch(() => {
          isSavingRef.current = false;
          saveTimeoutRef.current = null;
        });
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    id,
    isInitialDataLoaded,
    runnersOnBase,
    lastGreenIndex,
    lastOrangeIndex,
    currentInning,
    isHomeTeamBatting,
    homeTeam,
    awayTeam,
    greenLineup,
    orangeLineup,
  ]);

  const lineupReady = Array.isArray(greenLineup) && Array.isArray(orangeLineup);

  if (!lineupReady) {
    return <div className={styles["loading"]}>Loading lineup data...</div>;
  }

  return (
    <div className={styles["game-tracker"]}>
      <h2>Game Tracker</h2>

      <SafeRender>
        <Scoreboard />
      </SafeRender>

      <div
        className={`${styles["game-tracker-container"]} ${!isOurTurnToBat ? styles["opponent-at-bat"] : ""}`}
      >
        {!isOurTurnToBat && (
          <div className={styles["opponent-overlay"]}>
            <span>Opponent at bat</span>
          </div>
        )}
        <div className={styles["batter-info"]}>
          <div className={styles["batter-section"]}>
            <div className={styles["current-batter-container"]}>
              <CurrentBatter />
            </div>
            <div className={styles["on-deck-container"]}>
              <OnDeckDisplay />
            </div>
            <div className={styles["in-the-hole-container"]}>
              <InTheHoleDisplay />
            </div>
          </div>
        </div>
        <div className={styles["game-status"]}>
          <SafeRender>
            <div className={styles["field-status-container"]}>
              <div className={styles["runners-container"]}>
                <RunnersList />
              </div>
              <div className={styles["field-diagram-container"]}>
                <FieldDiamond />
              </div>
            </div>
          </SafeRender>
        </div>
      </div>

      <SafeRender>
        <BattingOrderPreview />
      </SafeRender>

      <div className={styles["lineup-section"]}>
        <SafeRender fallback={<div>Error loading lineup manager</div>}>
          {Array.isArray(greenLineup) && Array.isArray(orangeLineup) ? (
            <LineupManager />
          ) : (
            <div>Waiting for lineup data to be available...</div>
          )}
        </SafeRender>
      </div>
    </div>
  );
};

export default GameTracker;
