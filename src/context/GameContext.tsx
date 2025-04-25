import React, { createContext, useContext, useEffect, useState } from "react";
import { Player, RunnerOnBase } from "../types/Player";

interface InningScore {
  runs: number;
  outs: number;
}

interface TeamScore {
  innings: InningScore[];
  totalRuns: number;
  totalOuts: number;
}

interface GameData {
  home_team_name: string;
  away_team_name: string;
  date: string;
  players: { id: number; name: string; position: string }[];
}

interface InningScore {
  runs: number;
  outs: number;
}

interface GameContextType {
  currentBatter: Player | null;
  onDeckBatter: Player | null;
  inTheHoleBatter: Player | null;
  runnersOnBase: RunnerOnBase[];
  lastGreenIndex: number;
  lastOrangeIndex: number;
  setCurrentBatter: (player: Player | null) => void;
  setOnDeckBatter: (player: Player | null) => void;
  setInTheHoleBatter: (player: Player | null) => void;
  setRunnersOnBase: React.Dispatch<React.SetStateAction<RunnerOnBase[]>>;
  setLastGreenIndex: (index: number) => void;
  setLastOrangeIndex: (index: number) => void;
  currentInning: number;
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  isHomeTeamBatting: boolean;
  setCurrentInning: (inning: number) => void;
  setIsHomeTeamBatting: (isHome: boolean) => void;
  updateHomeInningScore: (
    inning: number,
    runs: number | ((prev: number) => number),
    outs: number | ((prev: number) => number)
  ) => void;
  updateAwayInningScore: (
    inning: number,
    runs: number | ((prev: number) => number),
    outs: number | ((prev: number) => number)
  ) => void;
}

// Create an empty inning record
const createEmptyInning = (): InningScore => ({
  runs: 0,
  outs: 0,
});

// Create an initial team score with 7 innings (standard softball game)
const createInitialTeamScore = (): TeamScore => ({
  innings: Array(7)
    .fill(null)
    .map(() => createEmptyInning()),
  totalRuns: 0,
  totalOuts: 0,
});

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{
  children: React.ReactNode;
  initialData?: GameData | null;
}> = ({ children, initialData }) => {
  // Existing state
  const [currentBatter, setCurrentBatter] = useState<Player | null>(null);
  const [onDeckBatter, setOnDeckBatter] = useState<Player | null>(null);
  const [inTheHoleBatter, setInTheHoleBatter] = useState<Player | null>(null);
  const [runnersOnBase, setRunnersOnBase] = useState<RunnerOnBase[]>([]);
  const [lastGreenIndex, setLastGreenIndex] = useState<number>(0);
  const [lastOrangeIndex, setLastOrangeIndex] = useState<number>(0);

  // Inning tracking state
  const [currentInning, setCurrentInning] = useState<number>(1);
  const [isHomeTeamBatting, setIsHomeTeamBatting] = useState<boolean>(true);
  const [homeTeam, setHomeTeam] = useState<TeamScore>(createInitialTeamScore());
  const [awayTeam, setAwayTeam] = useState<TeamScore>(createInitialTeamScore());

  useEffect(() => {
    if (initialData) {
      console.log("Initializing game with data:", initialData);
      if (initialData.home_team_name) {
      }
      if (initialData.players && Array.isArray(initialData.players)) {
      }
    }
  }, [initialData]);

  // Update home team score for a specific inning
  const updateHomeInningScore = (
    inning: number,
    runs: number | ((prev: number) => number),
    outs: number | ((prev: number) => number)
  ) => {
    setHomeTeam((prev) => {
      const newInnings = [...prev.innings];
      const inningIndex = inning - 1;

      if (inningIndex < 0 || inningIndex >= newInnings.length) return prev;

      const currentInningData = newInnings[inningIndex];
      const newRuns =
        typeof runs === "function" ? runs(currentInningData.runs) : runs;
      const newOuts =
        typeof outs === "function" ? outs(currentInningData.outs) : outs;

      newInnings[inningIndex] = {
        runs: newRuns,
        outs: newOuts,
      };

      // Recalculate totals
      const totalRuns = newInnings.reduce(
        (sum, inning) => sum + inning.runs,
        0
      );
      const totalOuts = newInnings.reduce(
        (sum, inning) => sum + inning.outs,
        0
      );

      return {
        innings: newInnings,
        totalRuns,
        totalOuts,
      };
    });
  };

  // Update away team score for a specific inning
  const updateAwayInningScore = (
    inning: number,
    runs: number | ((prev: number) => number),
    outs: number | ((prev: number) => number)
  ) => {
    setAwayTeam((prev) => {
      const newInnings = [...prev.innings];
      const inningIndex = inning - 1;

      if (inningIndex < 0 || inningIndex >= newInnings.length) return prev;

      const currentInningData = newInnings[inningIndex];
      const newRuns =
        typeof runs === "function" ? runs(currentInningData.runs) : runs;
      const newOuts =
        typeof outs === "function" ? outs(currentInningData.outs) : outs;

      newInnings[inningIndex] = {
        runs: newRuns,
        outs: newOuts,
      };

      // Recalculate totals
      const totalRuns = newInnings.reduce(
        (sum, inning) => sum + inning.runs,
        0
      );
      const totalOuts = newInnings.reduce(
        (sum, inning) => sum + inning.outs,
        0
      );

      return {
        innings: newInnings,
        totalRuns,
        totalOuts,
      };
    });
  };

  return (
    <GameContext.Provider
      value={{
        currentBatter,
        onDeckBatter,
        inTheHoleBatter,
        runnersOnBase,
        lastGreenIndex,
        lastOrangeIndex,
        setCurrentBatter,
        setOnDeckBatter,
        setInTheHoleBatter,
        setRunnersOnBase,
        setLastGreenIndex,
        setLastOrangeIndex,
        currentInning,
        homeTeam,
        awayTeam,
        isHomeTeamBatting,
        setCurrentInning,
        setIsHomeTeamBatting,
        updateHomeInningScore,
        updateAwayInningScore,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};
