import React, { createContext, useContext, useEffect, useState } from "react";
import { Player } from "../types/Player";

interface PlayerData {
  id: number;
  name: string;
  position: string;
  group_name?: string;
}

interface LineupContextType {
  greenLineup: Player[];
  orangeLineup: Player[];
  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, updatedPlayer: Player) => void;
  removePlayer: (id: string) => void;
  reorderGreenLineup: (startIndex: number, endIndex: number) => void;
  reorderOrangeLineup: (startIndex: number, endIndex: number) => void;
  getNextBatter: (group: "green" | "orange") => Player | null;
  advanceBatterIndex: (group: "green" | "orange") => void;
  lastGreenIndex: number;
  lastOrangeIndex: number;
  setLastGreenIndex: (index: number) => void;
  setLastOrangeIndex: (index: number) => void;
  saveLineupToDatabase: (gameId: string | number) => Promise<void>;
}

const LineupContext = createContext<LineupContextType | undefined>(undefined);

export const LineupProvider: React.FC<{
  children: React.ReactNode;
  initialData?: PlayerData[] | { players: PlayerData[] };
}> = ({ children, initialData }) => {
  const [greenLineup, setGreenLineup] = useState<Player[]>([]);
  const [orangeLineup, setOrangeLineup] = useState<Player[]>([]);
  const [lastGreenIndex, setLastGreenIndex] = useState<number>(0);
  const [lastOrangeIndex, setLastOrangeIndex] = useState<number>(0);
  const [deletedPlayerIds, setDeletedPlayerIds] = useState<number[]>([]);

  // Initialize lineups from initialData if provided
  useEffect(() => {
    console.log("LineupProvider initialData:", initialData);

    // Defensive check - make sure we have valid data to work with
    if (!initialData) return;

    // Handle both array and object with players property
    const playersArray = Array.isArray(initialData)
      ? initialData
      : "players" in initialData && Array.isArray(initialData.players)
      ? initialData.players
      : null;

    if (!playersArray) {
      console.warn("No valid players array found in initialData:", initialData);
      return;
    }

    // Process the players safely
    const tempGreenLineup: Player[] = [];
    const tempOrangeLineup: Player[] = [];

    playersArray.forEach((playerData: PlayerData) => {
      if (!playerData) return;

      try {
        const player: Player = {
          id: String(playerData.id || Date.now() + Math.random()),
          name: playerData.name || "Unknown Player",
          group: (playerData.group_name || playerData.position || "")
            .toLowerCase()
            .includes("green")
            ? "green"
            : "orange",
          runs: 0,
          outs: 0,
        };

        if (player.group === "green") {
          tempGreenLineup.push(player);
        } else {
          tempOrangeLineup.push(player);
        }
      } catch (error) {
        console.error("Error processing player data:", error);
      }
    });

    // Update state if we have players
    if (tempGreenLineup.length > 0) setGreenLineup(tempGreenLineup);
    if (tempOrangeLineup.length > 0) setOrangeLineup(tempOrangeLineup);
  }, [initialData]);

  const addPlayer = async (player: Player) => {
    try {
      // First add to UI state for immediate feedback
      if (player.group === "green") {
        setGreenLineup((prev) => [...prev, player]);
      } else {
        setOrangeLineup((prev) => [...prev, player]);
      }

      // Extract game ID from URL
      const path = window.location.pathname;
      const gameIdMatch = path.match(/\/games\/(\d+)/);
      if (!gameIdMatch || !gameIdMatch[1]) return;

      // Send to API
      const response = await fetch(`/api/games/${gameIdMatch[1]}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: player.name,
          group_name: player.group,
          runs: player.runs || 0,
          outs: player.outs || 0,
          position: player.group === "green" ? 1 : 2,
        }),
      });

      if (response.ok) {
        const savedPlayer = await response.json();

        // Update the player in state with the real database ID
        const updateWithDbId = (prev: Player[]) =>
          prev.map((p) =>
            p.id === player.id ? { ...p, id: String(savedPlayer.id) } : p
          );

        if (player.group === "green") {
          setGreenLineup(updateWithDbId);
        } else {
          setOrangeLineup(updateWithDbId);
        }
      }
    } catch (error) {
      console.error("Error saving player:", error);
    }
  };

  const updatePlayer = async (id: string, updatedPlayer: Player) => {
    // Extract base ID (without timestamps)
    const baseId = id.includes("-") ? id.split("-")[0] : id;
    console.log(`Updating player with base ID: ${baseId}`);

    // Update the UI first
    const playerToUpdate = {
      ...updatedPlayer,
      id: baseId,
    };

    if (playerToUpdate.group === "green") {
      setGreenLineup((prev) =>
        prev.map((player) => (player.id === baseId ? playerToUpdate : player))
      );
    } else {
      setOrangeLineup((prev) =>
        prev.map((player) => (player.id === baseId ? playerToUpdate : player))
      );
    }

    // Skip API call for non-database players
    const numericId = parseInt(baseId);
    if (isNaN(numericId)) return;

    try {
      // Extract game ID
      const path = window.location.pathname;
      const gameIdMatch = path.match(/\/games\/(\d+)/);
      if (!gameIdMatch || !gameIdMatch[1]) return;

      // Send update request
      await fetch(`/api/games/${gameIdMatch[1]}/players`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: numericId,
          name: updatedPlayer.name,
          group_name: updatedPlayer.group,
          runs: updatedPlayer.runs || 0,
          outs: updatedPlayer.outs || 0,
          position: updatedPlayer.group === "green" ? 1 : 2,
        }),
      });
    } catch (error) {
      console.error("Error updating player:", error);
    }
  };

  const removePlayer = async (id: string) => {
    console.log(`Attempting to remove player with ID: ${id}`);

    // First remove from UI for immediate feedback
    setGreenLineup((prev) => {
      const newLineup = prev.filter((p) => p.id !== id);
      console.log(
        `Green lineup: ${prev.length} -> ${newLineup.length} players`
      );
      return newLineup;
    });

    setOrangeLineup((prev) => {
      const newLineup = prev.filter((p) => p.id !== id);
      console.log(
        `Orange lineup: ${prev.length} -> ${newLineup.length} players`
      );
      return newLineup;
    });

    // Only call API if this is a database player (has numeric ID)
    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      try {
        // Extract game ID
        const path = window.location.pathname;
        const gameIdMatch = path.match(/\/games\/(\d+)/);
        if (!gameIdMatch || !gameIdMatch[1]) return;

        // Send delete request
        await fetch(
          `/api/games/${gameIdMatch[1]}/players?playerId=${numericId}`,
          {
            method: "DELETE",
          }
        );
      } catch (error) {
        console.error("Error deleting player:", error);
      }
    }
  };

  const reorderGreenLineup = (startIndex: number, endIndex: number) => {
    const newLineup = [...greenLineup];
    const [removed] = newLineup.splice(startIndex, 1);
    newLineup.splice(endIndex, 0, removed);
    setGreenLineup(newLineup);

    // Add this: Save the reordered lineup to the database
    const gameId = extractGameIdFromPath();
    if (gameId) {
      saveLineupToDatabase(gameId);
    }
  };

  const reorderOrangeLineup = (startIndex: number, endIndex: number) => {
    const newLineup = [...orangeLineup];
    const [removed] = newLineup.splice(startIndex, 1);
    newLineup.splice(endIndex, 0, removed);
    setOrangeLineup(newLineup);

    // Add this: Save the reordered lineup to the database
    const gameId = extractGameIdFromPath();
    if (gameId) {
      saveLineupToDatabase(gameId);
    }
  };

  // Add this helper function near the other utility functions
  const extractGameIdFromPath = () => {
    const path = window.location.pathname;
    const gameIdMatch = path.match(/\/games\/(\d+)/);
    return gameIdMatch ? gameIdMatch[1] : null;
  };

  // FIXED VERSION:
  const getNextBatter = (group: "orange" | "green"): Player | null => {
    const lineup = group === "orange" ? orangeLineup : greenLineup;
    if (!lineup.length) return null;

    // Get current index for this group
    const currentIndex = group === "orange" ? lastOrangeIndex : lastGreenIndex;

    // Get next player in rotation
    const nextIndex = (currentIndex + 1) % lineup.length;

    return lineup[nextIndex];
  };

  // Add this new function to actually advance the batter
  const advanceBatterIndex = (group: "orange" | "green") => {
    const lineup = group === "orange" ? orangeLineup : greenLineup;
    if (!lineup.length) return;

    const currentIndex = group === "orange" ? lastOrangeIndex : lastGreenIndex;
    const nextIndex = (currentIndex + 1) % lineup.length;

    if (group === "orange") {
      setLastOrangeIndex(nextIndex);
    } else {
      setLastGreenIndex(nextIndex);
    }
  };

  const saveLineupToDatabase = React.useCallback(
    async (gameId: string | number) => {
      try {
        // Debug the lineup before formatting
        console.log(
          "Raw lineup before formatting:",
          JSON.stringify([...greenLineup, ...orangeLineup], null, 2)
        );

        // Format players - completely rewritten
        const formattedPlayers = [...greenLineup, ...orangeLineup].map(
          (player) => {
            // Check if this should have an ID first
            const numericId = parseInt(player.id);
            const shouldIncludeId = !isNaN(numericId) && player.id.length < 10;

            // Create the object with conditional ID property using spread
            return {
              name: player.name,
              group_name: player.group,
              runs: player.runs || 0,
              outs: player.outs || 0,
              position: player.group === "green" ? 1 : 2,
              game_id: gameId,
              ...(shouldIncludeId ? { id: numericId } : {}),
            };
          }
        );

        // Debug the formatted players
        console.log(
          "Formatted players:",
          formattedPlayers.length,
          formattedPlayers
        );

        console.log(
          "Complete payload:",
          JSON.stringify(
            {
              current_inning: 1,
              is_home_team_batting: true,
              players: formattedPlayers,
              deleted_player_ids: deletedPlayerIds,
            },
            null,
            2
          )
        );

        const response = await fetch(`/api/games/${gameId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_inning: 1,
            is_home_team_batting: true,
            players: formattedPlayers,
            deleted_player_ids: deletedPlayerIds, // Add this line
          }),
        });

        // Clear the deleted players array after successful save
        if (response.ok) {
          setDeletedPlayerIds([]);
        }
      } catch {}
    },
    [greenLineup, orangeLineup, deletedPlayerIds]
  );

  return (
    <LineupContext.Provider
      value={{
        greenLineup,
        orangeLineup,
        addPlayer,
        updatePlayer,
        removePlayer,
        reorderGreenLineup,
        reorderOrangeLineup,
        getNextBatter,
        advanceBatterIndex,
        lastGreenIndex,
        lastOrangeIndex,
        setLastGreenIndex,
        setLastOrangeIndex,
        saveLineupToDatabase,
      }}
    >
      {children}
    </LineupContext.Provider>
  );
};

export const useLineup = () => {
  const context = useContext(LineupContext);
  if (!context) {
    throw new Error("useLineup must be used within a LineupProvider");
  }
  return context;
};
