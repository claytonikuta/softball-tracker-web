import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { Player, RunnerOnBase } from "../types/Player";

// ── Types ────────────────────────────────────────────────────────────────────

interface InningScore {
  runs: number;
  outs: number;
}

interface TeamScore {
  innings: InningScore[];
  totalRuns: number;
  totalOuts: number;
}

interface PlayerData {
  id: number;
  name: string;
  position: string;
  group_name?: string;
}

const createEmptyInning = (): InningScore => ({ runs: 0, outs: 0 });

const createInitialTeamScore = (): TeamScore => ({
  innings: Array(7)
    .fill(null)
    .map(() => createEmptyInning()),
  totalRuns: 0,
  totalOuts: 0,
});

// ── State ────────────────────────────────────────────────────────────────────

export interface GameSessionState {
  greenLineup: Player[];
  orangeLineup: Player[];
  lastGreenIndex: number;
  lastOrangeIndex: number;
  alternatingTurn: "green" | "orange";
  runnersOnBase: RunnerOnBase[];
  currentInning: number;
  isHomeTeamBatting: boolean;
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  deletedPlayerIds: number[];
  isInitialDataLoaded: boolean;
}

const initialState: GameSessionState = {
  greenLineup: [],
  orangeLineup: [],
  lastGreenIndex: 0,
  lastOrangeIndex: 0,
  alternatingTurn: "green",
  runnersOnBase: [],
  currentInning: 1,
  isHomeTeamBatting: true,
  homeTeam: createInitialTeamScore(),
  awayTeam: createInitialTeamScore(),
  deletedPlayerIds: [],
  isInitialDataLoaded: false,
};

// ── Actions ──────────────────────────────────────────────────────────────────

export type GameSessionAction =
  | { type: "INIT_LINEUPS"; green: Player[]; orange: Player[] }
  | {
      type: "LOAD_GAME_STATE";
      lastGreenIndex: number;
      lastOrangeIndex: number;
      runners: RunnerOnBase[];
    }
  | { type: "MARK_INITIAL_DATA_LOADED" }
  | { type: "ADD_PLAYER"; player: Player }
  | { type: "UPDATE_PLAYER"; id: string; player: Player }
  | { type: "REMOVE_PLAYER"; id: string }
  | {
      type: "REORDER_LINEUP";
      group: "green" | "orange";
      startIndex: number;
      endIndex: number;
    }
  | {
      type: "RECORD_AT_BAT";
      result: "single" | "double" | "triple" | "homerun" | "out";
    }
  | { type: "MOVE_RUNNER"; runnerId: string; direction: "forward" | "backward" }
  | { type: "RUNNER_OUT"; runnerId: string }
  | { type: "RUNNER_SCORED"; runnerId: string }
  | { type: "PLACE_RUNNER"; player: Player; baseIndex: number }
  | { type: "SET_RUNNERS"; runners: RunnerOnBase[] }
  | {
      type: "UPDATE_INNING_SCORE";
      team: "home" | "away";
      inning: number;
      runsDelta: number;
      outsDelta: number;
    }
  | { type: "SET_INNING"; inning: number }
  | { type: "SET_HOME_TEAM_BATTING"; isHome: boolean }
  | { type: "CLEAR_DELETED_PLAYER_IDS" };

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentBatter(state: GameSessionState): Player | null {
  const { alternatingTurn, greenLineup, orangeLineup, lastGreenIndex, lastOrangeIndex } = state;
  const lineup = alternatingTurn === "green" ? greenLineup : orangeLineup;
  const index = alternatingTurn === "green" ? lastGreenIndex : lastOrangeIndex;
  if (lineup.length === 0) return null;
  return lineup[index % lineup.length] ?? null;
}

function reorderArray<T>(arr: T[], startIndex: number, endIndex: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

function updateTeamInningScore(
  team: TeamScore,
  inning: number,
  runsDelta: number,
  outsDelta: number
): TeamScore {
  const inningIndex = inning - 1;
  if (inningIndex < 0 || inningIndex >= team.innings.length) return team;

  const newInnings = [...team.innings];
  const current = newInnings[inningIndex];
  newInnings[inningIndex] = {
    runs: Math.max(0, current.runs + runsDelta),
    outs: Math.max(0, Math.min(3, current.outs + outsDelta)),
  };

  return {
    innings: newInnings,
    totalRuns: newInnings.reduce((sum, i) => sum + i.runs, 0),
    totalOuts: newInnings.reduce((sum, i) => sum + i.outs, 0),
  };
}

function updatePlayerInLineups(
  state: GameSessionState,
  playerId: string,
  updater: (p: Player) => Player
): GameSessionState {
  const baseId = playerId.includes("-") ? playerId.split("-")[0] : playerId;
  return {
    ...state,
    greenLineup: state.greenLineup.map((p) =>
      p.id === baseId ? updater(p) : p
    ),
    orangeLineup: state.orangeLineup.map((p) =>
      p.id === baseId ? updater(p) : p
    ),
  };
}

function makeRunnerId(baseId: string): string {
  return `${baseId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// ── Reducer ──────────────────────────────────────────────────────────────────

function gameSessionReducer(
  state: GameSessionState,
  action: GameSessionAction
): GameSessionState {
  switch (action.type) {
    case "INIT_LINEUPS":
      return {
        ...state,
        greenLineup: action.green,
        orangeLineup: action.orange,
      };

    case "LOAD_GAME_STATE":
      return {
        ...state,
        lastGreenIndex: action.lastGreenIndex,
        lastOrangeIndex: action.lastOrangeIndex,
        runnersOnBase: action.runners,
        isInitialDataLoaded: true,
      };

    case "MARK_INITIAL_DATA_LOADED":
      return { ...state, isInitialDataLoaded: true };

    case "ADD_PLAYER": {
      const { player } = action;
      if (player.group === "green") {
        return { ...state, greenLineup: [...state.greenLineup, player] };
      }
      return { ...state, orangeLineup: [...state.orangeLineup, player] };
    }

    case "UPDATE_PLAYER": {
      const baseId = action.id.includes("-")
        ? action.id.split("-")[0]
        : action.id;
      const updated = { ...action.player, id: baseId };
      return {
        ...state,
        greenLineup: state.greenLineup.map((p) =>
          p.id === baseId ? updated : p
        ),
        orangeLineup: state.orangeLineup.map((p) =>
          p.id === baseId ? updated : p
        ),
      };
    }

    case "REMOVE_PLAYER": {
      const { id } = action;
      const numericId = parseInt(id);
      const newDeleted = !isNaN(numericId)
        ? [...state.deletedPlayerIds, numericId]
        : state.deletedPlayerIds;

      const filteredGreen = state.greenLineup.filter((p) => p.id !== id);
      const filteredOrange = state.orangeLineup.filter((p) => p.id !== id);

      const clampedGreenIndex =
        filteredGreen.length > 0
          ? state.lastGreenIndex % filteredGreen.length
          : 0;
      const clampedOrangeIndex =
        filteredOrange.length > 0
          ? state.lastOrangeIndex % filteredOrange.length
          : 0;

      const filteredRunners = state.runnersOnBase.filter((r) => {
        const basePlayerId = r.id.split("-")[0];
        return (
          filteredGreen.some((p) => p.id === basePlayerId) ||
          filteredOrange.some((p) => p.id === basePlayerId)
        );
      });

      return {
        ...state,
        greenLineup: filteredGreen,
        orangeLineup: filteredOrange,
        lastGreenIndex: clampedGreenIndex,
        lastOrangeIndex: clampedOrangeIndex,
        deletedPlayerIds: newDeleted,
        runnersOnBase: filteredRunners,
      };
    }

    case "REORDER_LINEUP": {
      const { group, startIndex, endIndex } = action;
      if (group === "green") {
        return {
          ...state,
          greenLineup: reorderArray(state.greenLineup, startIndex, endIndex),
        };
      }
      return {
        ...state,
        orangeLineup: reorderArray(state.orangeLineup, startIndex, endIndex),
      };
    }

    case "RECORD_AT_BAT": {
      const { result } = action;
      const batter = getCurrentBatter(state);
      if (!batter) return state;

      let newState = { ...state };

      // 1. Advance the index for the group that just batted
      if (batter.group === "green") {
        newState.lastGreenIndex =
          state.greenLineup.length > 0
            ? (state.lastGreenIndex + 1) % state.greenLineup.length
            : 0;
      } else {
        newState.lastOrangeIndex =
          state.orangeLineup.length > 0
            ? (state.lastOrangeIndex + 1) % state.orangeLineup.length
            : 0;
      }

      // 2. Toggle alternating turn
      newState.alternatingTurn =
        state.alternatingTurn === "green" ? "orange" : "green";

      // 3. Process the result
      if (result === "out") {
        newState = updatePlayerInLineups(newState, batter.id, (p) => ({
          ...p,
          outs: p.outs + 1,
        }));
        const team = state.isHomeTeamBatting ? "home" : "away";
        if (team === "home") {
          newState.homeTeam = updateTeamInningScore(
            newState.homeTeam,
            state.currentInning,
            0,
            1
          );
        } else {
          newState.awayTeam = updateTeamInningScore(
            newState.awayTeam,
            state.currentInning,
            0,
            1
          );
        }
      } else if (result === "homerun") {
        newState = updatePlayerInLineups(newState, batter.id, (p) => ({
          ...p,
          runs: p.runs + 1,
        }));
        const team = state.isHomeTeamBatting ? "home" : "away";
        if (team === "home") {
          newState.homeTeam = updateTeamInningScore(
            newState.homeTeam,
            state.currentInning,
            1,
            0
          );
        } else {
          newState.awayTeam = updateTeamInningScore(
            newState.awayTeam,
            state.currentInning,
            1,
            0
          );
        }
      } else {
        // single, double, triple
        const baseIndex =
          result === "single" ? 0 : result === "double" ? 1 : 2;
        const newRunner: RunnerOnBase = {
          ...batter,
          id: makeRunnerId(batter.id),
          baseIndex,
        };
        newState.runnersOnBase = [...state.runnersOnBase, newRunner];
      }

      return newState;
    }

    case "MOVE_RUNNER": {
      const { runnerId, direction } = action;
      return {
        ...state,
        runnersOnBase: state.runnersOnBase.map((r) => {
          if (r.id !== runnerId) return r;
          if (direction === "forward") {
            return { ...r, baseIndex: Math.min(r.baseIndex + 1, 2) };
          }
          return { ...r, baseIndex: Math.max(r.baseIndex - 1, 0) };
        }),
      };
    }

    case "RUNNER_OUT": {
      const { runnerId } = action;
      const runner = state.runnersOnBase.find((r) => r.id === runnerId);
      if (!runner) return state;

      const basePlayerId = runner.id.split("-")[0];
      const withUpdatedPlayer = updatePlayerInLineups(state, basePlayerId, (p) => ({
        ...p,
        outs: p.outs + 1,
      }));

      const teamKey = state.isHomeTeamBatting ? "homeTeam" : "awayTeam";
      return {
        ...withUpdatedPlayer,
        [teamKey]: updateTeamInningScore(
          withUpdatedPlayer[teamKey],
          state.currentInning,
          0,
          1
        ),
        runnersOnBase: withUpdatedPlayer.runnersOnBase.filter(
          (r) => r.id !== runnerId
        ),
      };
    }

    case "RUNNER_SCORED": {
      const { runnerId } = action;
      const runner = state.runnersOnBase.find((r) => r.id === runnerId);
      if (!runner) return state;

      const basePlayerId = runner.id.split("-")[0];
      const withUpdatedPlayer = updatePlayerInLineups(state, basePlayerId, (p) => ({
        ...p,
        runs: p.runs + 1,
      }));

      const teamKey = state.isHomeTeamBatting ? "homeTeam" : "awayTeam";
      return {
        ...withUpdatedPlayer,
        [teamKey]: updateTeamInningScore(
          withUpdatedPlayer[teamKey],
          state.currentInning,
          1,
          0
        ),
        runnersOnBase: withUpdatedPlayer.runnersOnBase.filter(
          (r) => r.id !== runnerId
        ),
      };
    }

    case "PLACE_RUNNER": {
      const { player, baseIndex } = action;
      const newRunner: RunnerOnBase = {
        ...player,
        id: makeRunnerId(player.id),
        baseIndex,
      };
      return {
        ...state,
        runnersOnBase: [...state.runnersOnBase, newRunner],
      };
    }

    case "SET_RUNNERS":
      return { ...state, runnersOnBase: action.runners };

    case "UPDATE_INNING_SCORE": {
      const { team, inning, runsDelta, outsDelta } = action;
      if (team === "home") {
        return {
          ...state,
          homeTeam: updateTeamInningScore(
            state.homeTeam,
            inning,
            runsDelta,
            outsDelta
          ),
        };
      }
      return {
        ...state,
        awayTeam: updateTeamInningScore(
          state.awayTeam,
          inning,
          runsDelta,
          outsDelta
        ),
      };
    }

    case "SET_INNING":
      return { ...state, currentInning: action.inning };

    case "SET_HOME_TEAM_BATTING":
      return { ...state, isHomeTeamBatting: action.isHome };

    case "CLEAR_DELETED_PLAYER_IDS":
      return { ...state, deletedPlayerIds: [] };

    default:
      return state;
  }
}

// ── Context Shape ────────────────────────────────────────────────────────────

interface GameSessionContextType {
  // State (read-only access for components)
  greenLineup: Player[];
  orangeLineup: Player[];
  lastGreenIndex: number;
  lastOrangeIndex: number;
  alternatingTurn: "green" | "orange";
  runnersOnBase: RunnerOnBase[];
  currentInning: number;
  isHomeTeamBatting: boolean;
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  isInitialDataLoaded: boolean;

  // Derived values
  currentBatter: Player | null;
  onDeckBatter: Player | null;
  inTheHoleBatter: Player | null;

  // Dispatch
  dispatch: React.Dispatch<GameSessionAction>;

  // Async action helpers (dispatch + API call)
  addPlayer: (player: Player) => Promise<void>;
  updatePlayer: (id: string, updatedPlayer: Player) => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  reorderLineup: (
    group: "green" | "orange",
    startIndex: number,
    endIndex: number
  ) => void;
  saveLineupToDatabase: (gameId: string | number) => Promise<void>;
}

const GameSessionContext = createContext<GameSessionContextType | undefined>(
  undefined
);

// ── Provider ─────────────────────────────────────────────────────────────────

interface GameSessionProviderProps {
  children: React.ReactNode;
  initialPlayers?: PlayerData[] | { players: PlayerData[] };
  gameId?: string | number;
}

export const GameSessionProvider: React.FC<GameSessionProviderProps> = ({
  children,
  initialPlayers,
  gameId,
}) => {
  const [state, dispatch] = useReducer(gameSessionReducer, initialState);

  // Initialize lineups from initial player data
  useEffect(() => {
    if (!initialPlayers) return;

    const playersArray = Array.isArray(initialPlayers)
      ? initialPlayers
      : "players" in initialPlayers && Array.isArray(initialPlayers.players)
        ? initialPlayers.players
        : null;

    if (!playersArray) return;

    const green: Player[] = [];
    const orange: Player[] = [];

    playersArray.forEach((pd: PlayerData) => {
      if (!pd) return;
      const player: Player = {
        id: String(pd.id || Date.now() + Math.random()),
        name: pd.name || "Unknown Player",
        group: (pd.group_name || pd.position || "")
          .toLowerCase()
          .includes("green")
          ? "green"
          : "orange",
        runs: 0,
        outs: 0,
      };
      if (player.group === "green") green.push(player);
      else orange.push(player);
    });

    if (green.length > 0 || orange.length > 0) {
      dispatch({ type: "INIT_LINEUPS", green, orange });
    }
  }, [initialPlayers]);

  // ── Derived batters ──────────────────────────────────────────────────────

  const currentBatter = useMemo(() => {
    const { alternatingTurn, greenLineup, orangeLineup, lastGreenIndex, lastOrangeIndex } = state;
    const lineup = alternatingTurn === "green" ? greenLineup : orangeLineup;
    const index = alternatingTurn === "green" ? lastGreenIndex : lastOrangeIndex;
    if (lineup.length === 0) return null;
    return lineup[index % lineup.length] ?? null;
  }, [state]);

  const onDeckBatter = useMemo(() => {
    const { alternatingTurn, greenLineup, orangeLineup, lastGreenIndex, lastOrangeIndex } = state;
    const lineup = alternatingTurn === "green" ? orangeLineup : greenLineup;
    const index = alternatingTurn === "green" ? lastOrangeIndex : lastGreenIndex;
    if (lineup.length === 0) return null;
    return lineup[index % lineup.length] ?? null;
  }, [state]);

  const inTheHoleBatter = useMemo(() => {
    const { alternatingTurn, greenLineup, orangeLineup, lastGreenIndex, lastOrangeIndex } = state;
    const lineup = alternatingTurn === "green" ? greenLineup : orangeLineup;
    const index = alternatingTurn === "green" ? lastGreenIndex : lastOrangeIndex;
    if (lineup.length === 0) return null;
    return lineup[(index + 1) % lineup.length] ?? null;
  }, [state]);

  // ── Async action helpers ─────────────────────────────────────────────────

  const extractGameId = useCallback((): string | null => {
    if (gameId) return String(gameId);
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/\/games\/(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  }, [gameId]);

  const addPlayer = useCallback(
    async (player: Player) => {
      dispatch({ type: "ADD_PLAYER", player });

      const gid = extractGameId();
      if (!gid) return;

      const lineup =
        player.group === "green" ? state.greenLineup : state.orangeLineup;
      const newIndex = lineup.length;

      try {
        await fetch(`/api/games/${gid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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
      } catch {
        // silently fail - UI already updated
      }
    },
    [extractGameId, state.greenLineup, state.orangeLineup]
  );

  const updatePlayer = useCallback(
    async (id: string, updatedPlayer: Player) => {
      dispatch({ type: "UPDATE_PLAYER", id, player: updatedPlayer });

      const baseId = id.includes("-") ? id.split("-")[0] : id;
      const numericId = parseInt(baseId);
      if (isNaN(numericId)) return;

      const gid = extractGameId();
      if (!gid) return;

      try {
        await fetch(`/api/games/${gid}/players`, {
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
    },
    [extractGameId]
  );

  const removePlayer = useCallback(
    async (id: string) => {
      dispatch({ type: "REMOVE_PLAYER", id });

      const numericId = parseInt(id);
      if (isNaN(numericId)) return;

      const gid = extractGameId();
      if (!gid) return;

      try {
        await fetch(`/api/games/${gid}/players?playerId=${numericId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Error deleting player:", error);
      }
    },
    [extractGameId]
  );

  const reorderLineup = useCallback(
    (group: "green" | "orange", startIndex: number, endIndex: number) => {
      dispatch({ type: "REORDER_LINEUP", group, startIndex, endIndex });

      const gid = extractGameId();
      if (!gid) return;

      const lineup =
        group === "green" ? state.greenLineup : state.orangeLineup;
      const reordered = reorderArray(lineup, startIndex, endIndex);

      const playersToUpdate = reordered
        .map((player, index) => {
          const numericId = parseInt(player.id);
          if (!isNaN(numericId) && player.id.length < 10) {
            return { id: numericId, index_in_group: index };
          }
          return null;
        })
        .filter(Boolean);

      if (playersToUpdate.length > 0) {
        fetch(`/api/games/${gid}/update-indices`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ players: playersToUpdate }),
        }).catch((err) => console.error("Error updating player indices:", err));
      }
    },
    [extractGameId, state.greenLineup, state.orangeLineup]
  );

  const saveLineupToDatabase = useCallback(
    async (gid: string | number) => {
      const formattedPlayers = [
        ...state.greenLineup.map((player, index) => {
          const numericId = parseInt(player.id);
          const shouldIncludeId = !isNaN(numericId) && player.id.length < 10;
          return {
            name: player.name,
            group_name: player.group,
            runs: player.runs || 0,
            outs: player.outs || 0,
            position: 1,
            index_in_group: index,
            game_id: gid,
            ...(shouldIncludeId ? { id: numericId } : {}),
          };
        }),
        ...state.orangeLineup.map((player, index) => {
          const numericId = parseInt(player.id);
          const shouldIncludeId = !isNaN(numericId) && player.id.length < 10;
          return {
            name: player.name,
            group_name: player.group,
            runs: player.runs || 0,
            outs: player.outs || 0,
            position: 2,
            index_in_group: index,
            game_id: gid,
            ...(shouldIncludeId ? { id: numericId } : {}),
          };
        }),
      ];

      try {
        const response = await fetch(`/api/games/${gid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_inning: 1,
            is_home_team_batting: true,
            players: formattedPlayers,
            deleted_player_ids: state.deletedPlayerIds,
          }),
        });

        if (response.ok) {
          dispatch({ type: "CLEAR_DELETED_PLAYER_IDS" });
        }
      } catch {
        // silently fail
      }
    },
    [state.greenLineup, state.orangeLineup, state.deletedPlayerIds]
  );

  // ── Context value ────────────────────────────────────────────────────────

  const value = useMemo<GameSessionContextType>(
    () => ({
      greenLineup: state.greenLineup,
      orangeLineup: state.orangeLineup,
      lastGreenIndex: state.lastGreenIndex,
      lastOrangeIndex: state.lastOrangeIndex,
      alternatingTurn: state.alternatingTurn,
      runnersOnBase: state.runnersOnBase,
      currentInning: state.currentInning,
      isHomeTeamBatting: state.isHomeTeamBatting,
      homeTeam: state.homeTeam,
      awayTeam: state.awayTeam,
      isInitialDataLoaded: state.isInitialDataLoaded,
      currentBatter,
      onDeckBatter,
      inTheHoleBatter,
      dispatch,
      addPlayer,
      updatePlayer,
      removePlayer,
      reorderLineup,
      saveLineupToDatabase,
    }),
    [
      state,
      currentBatter,
      onDeckBatter,
      inTheHoleBatter,
      addPlayer,
      updatePlayer,
      removePlayer,
      reorderLineup,
      saveLineupToDatabase,
    ]
  );

  return (
    <GameSessionContext.Provider value={value}>
      {children}
    </GameSessionContext.Provider>
  );
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useGameSession = (): GameSessionContextType => {
  const context = useContext(GameSessionContext);
  if (!context) {
    throw new Error("useGameSession must be used within a GameSessionProvider");
  }
  return context;
};
