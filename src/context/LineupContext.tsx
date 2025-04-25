import React, { createContext, useContext, useEffect, useState } from "react";
import { Player } from "../types/Player";

interface PlayerData {
  id: number;
  name: string;
  position: string;
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
}

const LineupContext = createContext<LineupContextType | undefined>(undefined);

export const LineupProvider: React.FC<{
  children: React.ReactNode;
  initialData?: PlayerData[];
}> = ({ children, initialData }) => {
  const [greenLineup, setGreenLineup] = useState<Player[]>([]);
  const [orangeLineup, setOrangeLineup] = useState<Player[]>([]);
  const [lastGreenIndex, setLastGreenIndex] = useState<number>(0);
  const [lastOrangeIndex, setLastOrangeIndex] = useState<number>(0);

  // Initialize lineups from initialData if provided
  useEffect(() => {
    if (initialData && Array.isArray(initialData) && initialData.length > 0) {
      console.log("Initializing lineup with data:", initialData);

      // Process the player data safely
      const tempGreenLineup: Player[] = [];
      const tempOrangeLineup: Player[] = [];

      initialData.forEach((playerData) => {
        // Only process valid player data
        if (playerData && playerData.name) {
          const player: Player = {
            id: String(playerData.id || Date.now()),
            name: playerData.name,
            group: playerData.position?.toLowerCase().includes("green")
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
        }
      });

      if (tempGreenLineup.length > 0) setGreenLineup(tempGreenLineup);
      if (tempOrangeLineup.length > 0) setOrangeLineup(tempOrangeLineup);
    }
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
