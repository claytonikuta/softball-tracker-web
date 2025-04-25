import React, { useEffect } from "react";
import CurrentBatter from "./CurrentBatter";
import OnDeckDisplay from "./OnDeckDisplay";
import InTheHoleDisplay from "./InTheHoleDisplay";
import RunnersList from "./RunnersList";
import Scoreboard from "./ScoreBoard";
import { useLineup } from "../../context/LineupContext";
import { useGameContext } from "../../context/GameContext";
import { useParams } from "next/navigation";
import styles from "./GameTracker.module.css";
import LineupManager from "../LineupManager/LineupManager";
import SafeRender from "../shared/SafeRender";

const GameTracker: React.FC = () => {
  const { greenLineup, orangeLineup, saveLineupToDatabase } = useLineup();
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
    if (id && (greenLineup.length > 0 || orangeLineup.length > 0)) {
      const timer = setTimeout(() => {
        if (typeof id === "string" || typeof id === "number") {
          saveLineupToDatabase(id);
        } else {
          console.warn("Invalid game ID:", id);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [greenLineup, orangeLineup, id, saveLineupToDatabase]);

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
          <SafeRender>
            <CurrentBatter />
          </SafeRender>
          <SafeRender>
            <OnDeckDisplay />
          </SafeRender>
          <SafeRender>
            <InTheHoleDisplay />
          </SafeRender>
        </div>
        <div className={styles["game-status"]}>
          <SafeRender>
            <RunnersList />
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
