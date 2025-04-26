import React, { useEffect, useState, useRef } from "react";
import CurrentBatter from "./CurrentBatter";
import OnDeckDisplay from "./OnDeckDisplay";
import InTheHoleDisplay from "./InTheHoleDisplay";
import RunnersList from "./RunnersList";
import Scoreboard from "./ScoreBoard";
import FieldDiamond from "./FieldDiamond";
import { useLineup } from "../../context/LineupContext";
import { useGameContext } from "../../context/GameContext";
import { useParams } from "next/navigation";
import styles from "./GameTracker.module.css";
import LineupManager from "../LineupManager/LineupManager";
import SafeRender from "../shared/SafeRender";

const GameTracker: React.FC = () => {
  const { greenLineup, orangeLineup } = useLineup();
  const [isSaving, setIsSaving] = useState(false);
  const {
    currentBatter,
    onDeckBatter,
    inTheHoleBatter,
    runnersOnBase,
    setCurrentBatter,
    setOnDeckBatter,
    setInTheHoleBatter,
    setRunnersOnBase,
    setLastGreenIndex,
    setLastOrangeIndex,
  } = useGameContext();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string>("");

  const { id } = useParams();

  useEffect(() => {
    if (greenLineup.length > 0 && orangeLineup.length > 0 && !currentBatter) {
      setCurrentBatter(greenLineup[0]);
      setOnDeckBatter(orangeLineup[0]);

      const inTheHolePlayer =
        greenLineup.length > 1 ? greenLineup[1] : greenLineup[0];
      setInTheHoleBatter(inTheHolePlayer);

      setLastGreenIndex(0);
      setLastOrangeIndex(0);
    }
  }, [
    greenLineup,
    orangeLineup,
    currentBatter,
    setCurrentBatter,
    setOnDeckBatter,
    setInTheHoleBatter,
    setLastGreenIndex,
    setLastOrangeIndex,
  ]);

  console.log("GameTracker render - props:", {
    greenLineup,
    orangeLineup,
    runnersOnBase,
    currentBatter,
    onDeckBatter,
    inTheHoleBatter,
  });

  // Clean up removed players
  useEffect(() => {
    console.log("Cleanup effect running");

    // Ensure arrays are valid before spreading
    if (!Array.isArray(greenLineup) || !Array.isArray(orangeLineup)) {
      console.warn("Lineup arrays not ready yet");
      return;
    }

    // All available players
    const allPlayers = [...greenLineup, ...orangeLineup];
    const allPlayerIds = allPlayers.map((p) => p.id);
    console.log("Current player IDs in lineup:", allPlayerIds);

    // Clean up current batter if removed
    if (currentBatter && !allPlayers.some((p) => p.id === currentBatter.id)) {
      // Find next available batter of same group if possible
      const group = currentBatter.group;
      const lineup = group === "green" ? greenLineup : orangeLineup;

      if (lineup.length > 0) {
        setCurrentBatter(lineup[0]);
      } else {
        // If no players of that group, try to find any player
        const anyLineup = greenLineup.length > 0 ? greenLineup : orangeLineup;
        setCurrentBatter(anyLineup.length > 0 ? anyLineup[0] : null);
      }
    }

    // Clean up on-deck batter if removed
    if (onDeckBatter && !allPlayers.some((p) => p.id === onDeckBatter.id)) {
      // Find next available batter of same group if possible
      const group = onDeckBatter.group;
      const lineup = group === "green" ? greenLineup : orangeLineup;

      if (lineup.length > 0) {
        setOnDeckBatter(lineup[0]);
      } else {
        // If no players of that group, try to find any player
        const anyLineup = greenLineup.length > 0 ? greenLineup : orangeLineup;
        setOnDeckBatter(anyLineup.length > 0 ? anyLineup[0] : null);
      }
    }

    if (
      inTheHoleBatter &&
      !allPlayers.some((p) => p.id === inTheHoleBatter.id)
    ) {
      // Find next available batter of same group if possible
      const group = inTheHoleBatter.group;
      const lineup = group === "green" ? greenLineup : orangeLineup;

      if (lineup.length > 0) {
        setInTheHoleBatter(lineup[0]);
      } else {
        // If no players of that group, try to find any player
        const anyLineup = greenLineup.length > 0 ? greenLineup : orangeLineup;
        setInTheHoleBatter(anyLineup.length > 0 ? anyLineup[0] : null);
      }
    }

    // Store a ref to previous players for comparison
    if (runnersOnBase.length > 0 && allPlayers.length > 0) {
      // NEW APPROACH: Check if ANY runners reference deleted players
      let anyRunnersToRemove = false;

      // For each runner, check if the base player still exists
      const updatedRunners = runnersOnBase.filter((runner) => {
        // Extract the ORIGINAL player ID (first segment)
        const originalId = runner.id.split("-")[0];

        // Check if this original player ID exists in the lineup
        const playerExists = allPlayerIds.includes(originalId);

        if (!playerExists) {
          console.log(`Runner references deleted player: ${originalId}`);
          anyRunnersToRemove = true;
        }

        return playerExists;
      });

      // Only update if we actually need to remove runners
      if (
        anyRunnersToRemove &&
        updatedRunners.length !== runnersOnBase.length
      ) {
        console.log("Removing runners for deleted players");
        setRunnersOnBase(updatedRunners);
      }
    }
  }, [
    greenLineup,
    orangeLineup,
    currentBatter,
    onDeckBatter,
    inTheHoleBatter,
    runnersOnBase,
    setCurrentBatter,
    setOnDeckBatter,
    setInTheHoleBatter,
    setRunnersOnBase,
  ]);

  useEffect(() => {
    if (!id || isSaving) return;

    // Create a string representation of current state to compare
    const gameState = JSON.stringify({
      currentBatter,
      onDeckBatter,
      inTheHoleBatter,
      runnersOnBase,
    });

    // Skip if state hasn't changed
    if (gameState === lastSavedStateRef.current) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a new timeout for 800ms
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      console.log("Debounced game state save triggered");

      const gameId = Array.isArray(id) ? id[0] : id;

      // Only save game-related data, not players
      fetch(`/api/games/${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_inning: 1,
          is_home_team_batting: true,
          runners: runnersOnBase.map((runner) => ({
            player_id: runner.id,
            base_index: runner.baseIndex,
          })),
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
    currentBatter,
    onDeckBatter,
    inTheHoleBatter,
    runnersOnBase,
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
