import React, { useState, useEffect, useCallback } from "react";
import { useLineup } from "../../context/LineupContext";
import { useRouter } from "next/router";
import Button from "../shared/Button";
import styles from "./ImportLineup.module.css";

interface Game {
  id: number;
  date: string;
  home_team_name: string;
  away_team_name: string;
}

interface ImportedPlayer {
  name: string;
  group_name: string;
  position: number;
}

const ImportLineup: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { greenLineup, orangeLineup, addPlayer } = useLineup();

  const [previousGames, setPreviousGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Memoize fetchGames function to avoid dependency issues
  const fetchGames = useCallback(async () => {
    if (!id) return;

    try {
      const response = await fetch(`/api/games/lineups?excludeGameId=${id}`);
      if (!response.ok) throw new Error("Failed to fetch games");

      const data = await response.json();
      setPreviousGames(data);
    } catch (error) {
      console.error("Failed to fetch previous games:", error);
    }
  }, [id]);

  // Fetch previous games when component mounts or expands
  useEffect(() => {
    if (isOpen) {
      fetchGames();
    }
  }, [isOpen, fetchGames]);

  const handleImportLineup = async () => {
    if (!selectedGameId) return;

    setIsLoading(true);
    try {
      // Confirm before replacing if there's an existing lineup
      if (greenLineup.length > 0 || orangeLineup.length > 0) {
        if (!confirm("This will replace your current lineup. Continue?")) {
          setIsLoading(false);
          return;
        }
      }

      // Fetch players from selected game
      const response = await fetch("/api/games/lineups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceGameId: selectedGameId }),
      });

      if (!response.ok) throw new Error("Failed to import lineup");

      const importedPlayers: ImportedPlayer[] = await response.json();

      // Process and add each player
      importedPlayers.forEach((player) => {
        const newPlayer = {
          id: Date.now().toString() + Math.random().toString().slice(2, 8),
          name: player.name,
          group:
            player.group_name === "green" || player.group_name === "orange"
              ? (player.group_name as "green" | "orange")
              : player.position === 1
              ? "green"
              : "orange",
          runs: 0,
          outs: 0,
        };

        addPlayer(newPlayer);
      });

      setIsOpen(false);
      setSelectedGameId("");
      alert("Lineup imported successfully!");
    } catch (error) {
      console.error("Failed to import lineup:", error);
      alert("Error importing lineup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.importLineupContainer}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={styles.importToggleButton}
        >
          Import Lineup From Previous Game
        </button>
      ) : (
        <div className={styles.importLineup}>
          <h3>Import Lineup from Previous Game</h3>

          <div className={styles.selectContainer}>
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              disabled={isLoading}
              className={styles.gameSelect}
            >
              <option value="">Select a previous game</option>
              {previousGames.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.home_team_name} vs {game.away_team_name} (
                  {new Date(game.date).toLocaleDateString()})
                </option>
              ))}
            </select>

            <div className={styles.buttonGroup}>
              <Button
                onClick={handleImportLineup}
                disabled={!selectedGameId || isLoading}
                className={styles.importButton}
              >
                {isLoading ? "Importing..." : "Import Lineup"}
              </Button>

              <Button
                onClick={() => setIsOpen(false)}
                className={styles.cancelButton}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportLineup;
