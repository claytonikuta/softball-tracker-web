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
    if (player.group === "green") {
      setGreenLineup((prev) => [...prev, player]);
    } else {
      setOrangeLineup((prev) => [...prev, player]);
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
    // Log removal attempt for debugging
    console.log(`Attempting to remove player with ID: ${id}`);

    // Extract base ID if it contains dashes
    const baseId = id.includes("-") ? id.split("-")[0] : id;

    // Remove from both lineups to be sure
    setGreenLineup((prev) => {
      const newLineup = prev.filter((player) => player.id !== baseId);
      console.log(
        `Green lineup: ${prev.length} -> ${newLineup.length} players`
      );
      return newLineup;
    });

    setOrangeLineup((prev) => {
      const newLineup = prev.filter((player) => player.id !== baseId);
      console.log(
        `Orange lineup: ${prev.length} -> ${newLineup.length} players`
      );
      return newLineup;
    });
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
    if (!gameId) return;

    try {
      // Format players correctly for the API
      const formattedPlayers = [...greenLineup, ...orangeLineup].map(
        (player) => {
          // For brand new players, don't try to include an ID at all
          const playerData = {
            id:
              player.id && !player.id.includes("17")
                ? Number(player.id)
                : undefined,
            name: player.name,
            group_name: player.group,
            runs: Number(player.runs || 0),
            outs: Number(player.outs || 0),
            position: player.group === "green" ? 1 : 2,
            game_id: gameId,
          };

          // Only include ID for existing database players (not timestamp IDs)
          if (player.id && !player.id.includes("17")) {
            playerData.id = Number(player.id);
          }

          console.log("Formatted player:", playerData);
          return playerData;
        }
      );

      console.log(
        "Complete payload:",
        JSON.stringify(
          {
            current_inning: 1,
            is_home_team_batting: true,
            players: formattedPlayers,
          },
          null,
          2
        )
      );

      console.log("Sending player data to server:", formattedPlayers);

      // Need to send the other required fields along with players
      // In the saveLineupToDatabase function
      const response = await fetch(`/api/games/${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_inning: 1,
          is_home_team_batting: true,
          players: formattedPlayers,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save lineup");
      }

      console.log("Lineup saved to database successfully");
    } catch (error) {
      console.error("Error saving lineup:", error);
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
