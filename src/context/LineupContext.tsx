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
      // First determine what index this player should get
      let newIndex = 0;

      if (player.group === "green") {
        // New player gets placed at the end of the green lineup
        newIndex = greenLineup.length;
        // Add to UI state for immediate feedback
        setGreenLineup((prev) => [...prev, player]);
      } else {
        // New player gets placed at the end of the orange lineup
        newIndex = orangeLineup.length;
        // Add to UI state for immediate feedback
        setOrangeLineup((prev) => [...prev, player]);
      }

      // Extract game ID from URL
      const path = window.location.pathname;
      const gameIdMatch = path.match(/\/games\/(\d+)/);
      const gameId = gameIdMatch ? gameIdMatch[1] : null;

      if (gameId) {
        // Add to database with the correct index_in_group
        await fetch(`/api/games/${gameId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            players: [
              {
                name: player.name,
                group_name: player.group,
                position: player.group === "green" ? 1 : 2,
                index_in_group: newIndex,
                runs: 0,
                outs: 0,
              },
            ],
          }),
        });
      }
    } catch {}
  };

  const updatePlayer = async (id: string, updatedPlayer: Player) => {
    // Extract base ID (without timestamps)
    const baseId = id.includes("-") ? id.split("-")[0] : id;

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
    // First remove from UI for immediate feedback
    setGreenLineup((prev) => {
      const newLineup = prev.filter((p) => p.id !== id);
      return newLineup;
    });

    setOrangeLineup((prev) => {
      const newLineup = prev.filter((p) => p.id !== id);
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
    // Create a new array with the player moved to new position
    const newLineup = [...greenLineup];
    const [removed] = newLineup.splice(startIndex, 1);
    newLineup.splice(endIndex, 0, removed);

    // Update local state
    setGreenLineup(newLineup);

    // Save to database with explicit indices
    const gameId = extractGameIdFromPath();
    if (gameId) {
      // We need to explicitly save each player with their new index
      updatePlayerIndicesInDatabase(gameId, "green", newLineup);
    }
  };

  const reorderOrangeLineup = (startIndex: number, endIndex: number) => {
    // Create a new array with the player moved to new position
    const newLineup = [...orangeLineup];
    const [removed] = newLineup.splice(startIndex, 1);
    newLineup.splice(endIndex, 0, removed);

    // Update local state
    setOrangeLineup(newLineup);

    // Save to database with explicit indices
    const gameId = extractGameIdFromPath();
    if (gameId) {
      // We need to explicitly save each player with their new index
      updatePlayerIndicesInDatabase(gameId, "orange", newLineup);
    }
  };

  // Add this new function to handle updating indices directly:
  const updatePlayerIndicesInDatabase = async (
    gameId: string | number,
    group: "green" | "orange",
    lineup: Player[]
  ) => {
    try {
      // Create an array of update operations - one for each player
      const playersToUpdate = lineup
        .map((player, index) => {
          const numericId = parseInt(player.id);
          // Only include database players (ones with numeric IDs)
          if (!isNaN(numericId) && player.id.length < 10) {
            return {
              id: numericId,
              index_in_group: index,
            };
          }
          return null;
        })
        .filter(Boolean); // Remove any null entries

      // Send the batch update
      if (playersToUpdate.length > 0) {
        const response = await fetch(`/api/games/${gameId}/update-indices`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            players: playersToUpdate,
          }),
        });

        if (!response.ok) {
          console.error(
            "Failed to update player indices:",
            await response.text()
          );
        }
      }
    } catch (error) {
      console.error("Error updating player indices:", error);
    }
  };

  // Add this helper function for getting the game ID from URL
  const extractGameIdFromPath = () => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const gameIdMatch = path.match(/\/games\/(\d+)/);
      return gameIdMatch ? gameIdMatch[1] : null;
    }
    return null;
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
        // Format players with index information
        const formattedPlayers = [
          // Green players with their index
          ...greenLineup.map((player, index) => {
            const numericId = parseInt(player.id);
            const shouldIncludeId = !isNaN(numericId) && player.id.length < 10;

            return {
              name: player.name,
              group_name: player.group,
              runs: player.runs || 0,
              outs: player.outs || 0,
              position: 1, // Still indicate green group
              index_in_group: index, // Store index within group
              game_id: gameId,
              ...(shouldIncludeId ? { id: numericId } : {}),
            };
          }),

          // Orange players with their index
          ...orangeLineup.map((player, index) => {
            const numericId = parseInt(player.id);
            const shouldIncludeId = !isNaN(numericId) && player.id.length < 10;

            return {
              name: player.name,
              group_name: player.group,
              runs: player.runs || 0,
              outs: player.outs || 0,
              position: 2, // Still indicate orange group
              index_in_group: index, // Store index within group
              game_id: gameId,
              ...(shouldIncludeId ? { id: numericId } : {}),
            };
          }),
        ];

        const response = await fetch(`/api/games/${gameId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_inning: 1,
            is_home_team_batting: true,
            players: formattedPlayers,
            deleted_player_ids: deletedPlayerIds,
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
