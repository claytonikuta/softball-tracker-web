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
import { RunnerOnBase } from "@/types";

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
    lastGreenIndex,
    lastOrangeIndex,
    currentInning,
    isHomeTeamBatting,
    alternatingTurn,
  } = useGameContext();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string>("");
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    // Replace your fetchGameData function with this improved version:
    const fetchGameData = async () => {
      if (!id) return;

      try {
        const gameId = Array.isArray(id) ? id[0] : id;
        const response = await fetch(`/api/games/${gameId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch game data: ${response.status}`);
        }

        const gameData = await response.json();

        // Set the batting order indices if they exist in the response
        if (gameData.game?.last_green_index !== undefined) {
          setLastGreenIndex(gameData.game.last_green_index);
        }

        if (gameData.game?.last_orange_index !== undefined) {
          setLastOrangeIndex(gameData.game.last_orange_index);
        }

        // Store the runners data for processing after players are ready
        if (gameData.game?.runners?.length > 0) {
          // Save the raw runners data temporarily
          const runnersFromDB = gameData.game.runners;

          // Create a delayed function to process runners once players are loaded
          const processRunnersWhenPlayersReady = () => {
            // Check if player data is loaded
            if (greenLineup.length === 0 && orangeLineup.length === 0) {
              // Try again in 500ms
              setTimeout(processRunnersWhenPlayersReady, 500);
              return;
            }

            // Now that players are loaded, process runners
            const allPlayers = [...greenLineup, ...orangeLineup];

            const loadedRunners = runnersFromDB
              .map((runner: { player_id: string; base_index: number }) => {
                // Find the actual player object from lineup
                const player = allPlayers.find(
                  (p) => p.id.toString() === runner.player_id.toString()
                );

                if (player) {
                  return {
                    ...player,
                    id: `${player.id}-${Date.now()}-${Math.floor(
                      Math.random() * 10000
                    )}`,
                    baseIndex: runner.base_index,
                  };
                }
                return null;
              })
              .filter(Boolean) as RunnerOnBase[];

            if (loadedRunners.length > 0) {
              setRunnersOnBase(loadedRunners);
            }
          };

          // Start the process
          processRunnersWhenPlayersReady();
        }

        // Mark initial data as loaded
        setIsInitialDataLoaded(true);
      } catch (error) {
        console.error("Error loading game data:", error);
        setIsInitialDataLoaded(true);
      }
    };

    fetchGameData();
  }, [
    id,
    greenLineup,
    orangeLineup,
    setRunnersOnBase,
    setLastGreenIndex,
    setLastOrangeIndex,
  ]);

  // Add this effect to update batters based on loaded indices
  useEffect(() => {
    // Only run this when we have both lineups and the indices are set
    if (
      greenLineup.length > 0 &&
      orangeLineup.length > 0 &&
      isInitialDataLoaded
    ) {
      // Determine which group is currently batting
      const isGreenBatting = alternatingTurn === "green";

      // Current batter is from the group that's up
      const currentIndex = isGreenBatting ? lastGreenIndex : lastOrangeIndex;
      const currentLineup = isGreenBatting ? greenLineup : orangeLineup;
      const currentBatter = currentLineup.length > 0 && currentIndex < currentLineup.length
        ? currentLineup[currentIndex]
        : null;

      // On-deck batter is the NEXT batter from the opposite group
      // (the one that will bat after current)
      const oppositeGroupIndex = isGreenBatting ? lastOrangeIndex : lastGreenIndex;
      const oppositeGroupLineup = isGreenBatting ? orangeLineup : greenLineup;
      const onDeckBatter = oppositeGroupLineup.length > 0 && oppositeGroupIndex < oppositeGroupLineup.length
        ? oppositeGroupLineup[oppositeGroupIndex]
        : null;

      // In-the-hole batter is the NEXT batter from the current group
      // (after the one currently batting)
      const inTheHoleIndex = currentLineup.length > 0
        ? (currentIndex + 1) % currentLineup.length
        : 0;
      const inTheHoleBatter = currentLineup.length > 0
        ? currentLineup[inTheHoleIndex]
        : null;

      // Set all three batters
      setCurrentBatter(currentBatter);
      setOnDeckBatter(onDeckBatter);
      setInTheHoleBatter(inTheHoleBatter);
    }
  }, [
    greenLineup,
    orangeLineup,
    lastGreenIndex,
    lastOrangeIndex,
    isInitialDataLoaded,
    setCurrentBatter,
    setOnDeckBatter,
    setInTheHoleBatter,
    alternatingTurn,
  ]);

  // Clean up removed players
  useEffect(() => {
    // Ensure arrays are valid before spreading
    if (!Array.isArray(greenLineup) || !Array.isArray(orangeLineup)) {
      console.warn("Lineup arrays not ready yet");
      return;
    }

    // All available players
    const allPlayers = [...greenLineup, ...orangeLineup];
    const allPlayerIds = allPlayers.map((p) => p.id);

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
          anyRunnersToRemove = true;
        }

        return playerExists;
      });

      // Only update if we actually need to remove runners
      if (
        anyRunnersToRemove &&
        updatedRunners.length !== runnersOnBase.length
      ) {
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
    if (!id || isSaving || !isInitialDataLoaded) return;

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

      const gameId = Array.isArray(id) ? id[0] : id;

      // Only save game-related data, not players
      fetch(`/api/games/${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_inning: currentInning,
          is_home_team_batting: isHomeTeamBatting,
          runners: runnersOnBase.map((runner) => ({
            player_id: runner.id.split("-")[0],
            base_index: runner.baseIndex,
          })),
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
