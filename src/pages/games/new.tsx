// pages/games/new.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import styles from "../../styles/NewGame.module.css";

export default function NewGame() {
  const [homeTeam, setHomeTeam] = useState("Our Team");
  const [awayTeam, setAwayTeam] = useState("Opponent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gameDate, setGameDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          home_team_name: homeTeam,
          away_team_name: awayTeam,
          date: gameDate, // Add this line to include the date
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create game");
      }

      // Redirect to the new game
      router.push(`/games/${data.game.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Create New Game</h1>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="gameDate">Game Date:</label>
          <input
            type="date"
            id="gameDate"
            value={gameDate}
            onChange={(e) => setGameDate(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="homeTeam">Home Team</label>
          <input
            id="homeTeam"
            type="text"
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="awayTeam">Away Team</label>
          <input
            id="awayTeam"
            type="text"
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            required
          />
        </div>

        <div className={styles.buttons}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.cancelButton}
          >
            Cancel
          </button>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Game"}
          </button>
        </div>
      </form>
    </div>
  );
}
