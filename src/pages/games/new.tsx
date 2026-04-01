import { useState } from "react";
import { useRouter } from "next/router";
import styles from "../../styles/NewGame.module.css";

export default function NewGame() {
  const [ourName, setOurName] = useState("Xiballba");
  const [opponentName, setOpponentName] = useState("Opponent");
  const [weAre, setWeAre] = useState<"home" | "away">("home");
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

    const home_team_name = weAre === "home" ? ourName : opponentName;
    const away_team_name = weAre === "home" ? opponentName : ourName;

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          home_team_name,
          away_team_name,
          our_team: weAre,
          date: gameDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create game");
      }

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
          <label htmlFor="ourTeam">
            Our Team
            <span className={styles.roleTag}>
              {weAre === "home" ? "HOME" : "AWAY"}
            </span>
          </label>
          <input
            id="ourTeam"
            type="text"
            value={ourName}
            onChange={(e) => setOurName(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="opponent">
            Opponent
            <span className={styles.roleTagMuted}>
              {weAre === "home" ? "AWAY" : "HOME"}
            </span>
          </label>
          <input
            id="opponent"
            type="text"
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>We are playing:</label>
          <div className={styles.teamToggle}>
            <button
              type="button"
              className={`${styles.toggleOption} ${weAre === "home" ? styles.toggleActive : ""}`}
              onClick={() => setWeAre("home")}
            >
              Home
            </button>
            <button
              type="button"
              className={`${styles.toggleOption} ${weAre === "away" ? styles.toggleActive : ""}`}
              onClick={() => setWeAre("away")}
            >
              Away
            </button>
          </div>
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
