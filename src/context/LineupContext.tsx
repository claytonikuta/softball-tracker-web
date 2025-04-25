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

  const addPlayer = (player: Player) => {
    // Add to appropriate lineup
    if (player.group === "green") {
      setGreenLineup((prev) => [...prev, player]);
    } else {
      setOrangeLineup((prev) => [...prev, player]);
    }

    // If we have a game ID from URL or props, save the lineup
    const path = window.location.pathname;
    const gameIdMatch = path.match(/\/games\/(\d+)/);
    if (gameIdMatch && gameIdMatch[1]) {
      // Wait a bit for state to update, then save
      setTimeout(() => saveLineupToDatabase(gameIdMatch[1]), 100);
    }
  };

  const updatePlayer = (id: string, updatedPlayer: Player) => {
    // IMPORTANT: Extract just the base ID without any timestamps
    const baseId = id.includes("-") ? id.split("-")[0] : id;

    console.log(`Updating player with base ID: ${baseId}`);

    // Use the updatedPlayer object, but ensure it keeps its original simple ID
    const playerToUpdate = {
      ...updatedPlayer,
      id: baseId, // Ensure we preserve the original ID
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
  };

  const removePlayer = (id: string) => {
    console.log(`Attempting to remove player with ID: ${id}`);

    // First check if this is a database-persisted player (has numeric ID)
    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      setDeletedPlayerIds((prev) => [...prev, numericId]);
    }

    // Remove from UI as before
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

    // Add explicit save after state updates (similar to addPlayer)
    const path = window.location.pathname;
    const gameIdMatch = path.match(/\/games\/(\d+)/);
    if (gameIdMatch && gameIdMatch[1]) {
      // Wait a bit longer for state to update since we have two setStates
      setTimeout(() => saveLineupToDatabase(gameIdMatch[1]), 200);
    }
  };

  const reorderGreenLineup = (startIndex: number, endIndex: number) => {
    const newLineup = [...greenLineup];
    const [removed] = newLineup.splice(startIndex, 1);
    newLineup.splice(endIndex, 0, removed);
    setGreenLineup(newLineup);
  };

  const reorderOrangeLineup = (startIndex: number, endIndex: number) => {
    const newLineup = [...orangeLineup];
    const [removed] = newLineup.splice(startIndex, 1);
    newLineup.splice(endIndex, 0, removed);
    setOrangeLineup(newLineup);
  };

  const getNextBatter = (group: "orange" | "green"): Player | null => {
    const lineup = group === "orange" ? orangeLineup : greenLineup;
    if (!lineup.length) return null;

    // Get current index for this group
    const currentIndex = group === "orange" ? lastOrangeIndex : lastGreenIndex;

    // Get next player in rotation
    const nextIndex = (currentIndex + 1) % lineup.length;

    // Update last index for this group
    if (group === "orange") {
      setLastOrangeIndex(nextIndex);
    } else {
      setLastGreenIndex(nextIndex);
    }

    return lineup[nextIndex];
  };

  const saveLineupToDatabase = async (gameId: string | number) => {
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

      // Rest of your existing code
    } catch {
      // Existing error handling
    }
  };

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
