import React, { useState, useEffect } from "react";
import { useLineup } from "../../context/LineupContext";
import { Player } from "../../types/Player";
import styles from "./ImportLineup.module.css";

interface Game {
  id: string;
  home_team_name: string;
  away_team_name: string;
  date: string;
}

const ImportLineup: React.FC = () => {
  const [previousGames, setPreviousGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { greenLineup, orangeLineup, addPlayer } = useLineup();

  // Fetch previous games when component mounts
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch("/api/games");
        const data = await response.json();
        setPreviousGames(data);
      } catch (error) {
        console.error("Failed to fetch games:", error);
      }
    };

    fetchGames();
  }, []);

  const handleImportLineup = async () => {
    if (!selectedGameId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/games/${selectedGameId}/players`);
      const players = await response.json();

      // Confirm before replacing if there's an existing lineup
      if (greenLineup.length > 0 || orangeLineup.length > 0) {
        if (!confirm("This will replace your current lineup. Continue?")) {
          setIsLoading(false);
          return;
        }
      }

      // Import players one by one
      players.forEach(
        (player: { id: number; name: string; position: string }) => {
          // Convert API player format to your app's Player format
          const newPlayer: Player = {
            id: String(player.id), // Convert number ID to string if needed
            name: player.name,
            group: player.position.includes("Green") ? "green" : "orange", // Adjust based on your data
            runs: 0,
            outs: 0,
          };

          addPlayer(newPlayer);
        }
      );

      alert("Lineup imported successfully!");
    } catch (error) {
      console.error("Failed to import lineup:", error);
      alert("Failed to import lineup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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

        <button
          onClick={handleImportLineup}
          disabled={!selectedGameId || isLoading}
          className={styles.importButton}
        >
          {isLoading ? "Importing..." : "Import Lineup"}
        </button>
      </div>
    </div>
  );
};

export default ImportLineup;
