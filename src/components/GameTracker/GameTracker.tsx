import React, { useEffect, useState, useRef } from "react";
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
    isInitialDataLoaded,
    dispatch,
  } = useGameSession();

  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string>("");
  const hasFetchedRef = useRef(false);
  const lineupsRef = useRef({ green: greenLineup, orange: orangeLineup });
  const { id } = useParams();

  // Startup log so we can confirm new code is loaded
  useEffect(() => {
    console.warn("[GameTracker] Component mounted — refactored version loaded");
  }, []);

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

        const loadedGreenIndex = gameData.game?.last_green_index ?? 0;
        const loadedOrangeIndex = gameData.game?.last_orange_index ?? 0;
        const runnersFromDB = gameData.game?.runners ?? [];

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

          console.log("[GameTracker] Initial load from DB", {
            loadedGreenIndex,
            loadedOrangeIndex,
            runners: loadedRunners.map((r) => `${r.name}@${r.baseIndex}`),
          });

          dispatch({
            type: "LOAD_GAME_STATE",
            lastGreenIndex: loadedGreenIndex,
            lastOrangeIndex: loadedOrangeIndex,
            runners: loadedRunners,
          });
        };

        if (runnersFromDB.length > 0) {
          processRunners();
        } else {
          console.log("[GameTracker] Initial load from DB (no runners)", {
            loadedGreenIndex,
            loadedOrangeIndex,
          });
          dispatch({
            type: "LOAD_GAME_STATE",
            lastGreenIndex: loadedGreenIndex,
            lastOrangeIndex: loadedOrangeIndex,
            runners: [],
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
    if (!id || isSaving || !isInitialDataLoaded) return;

    const gameState = JSON.stringify({
      currentBatter,
      onDeckBatter,
      inTheHoleBatter,
      runnersOnBase,
    });

    if (gameState === lastSavedStateRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true);

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

      fetch(`/api/games/${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_inning: currentInning,
          is_home_team_batting: isHomeTeamBatting,
          runners: validRunners,
          last_green_index: lastGreenIndex,
          last_orange_index: lastOrangeIndex,
        }),
      })
        .then(() => {
          lastSavedStateRef.current = gameState;
          setIsSaving(false);
          saveTimeoutRef.current = null;
        })
        .catch(() => {
          setIsSaving(false);
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
    isSaving,
    isInitialDataLoaded,
    currentBatter,
    onDeckBatter,
    inTheHoleBatter,
    runnersOnBase,
    lastGreenIndex,
    lastOrangeIndex,
    currentInning,
    isHomeTeamBatting,
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

      <div className={styles["game-tracker-container"]}>
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
