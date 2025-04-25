// pages/games/index.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../../styles/Games.module.css";

interface Game {
  id: number;
  date: string;
  home_team_name: string;
  away_team_name: string;
  current_inning: number;
}

export default function GamesList() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch("/api/games");

        if (!response.ok) {
          throw new Error("Failed to fetch games");
        }

        const data = await response.json();
        setGames(data.games);
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

    fetchGames();
  }, []);

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Softball Games</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading games...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          <Link href="/games/new">
            <a className={styles.newGameButton}>+ New Game</a>
          </Link>

          <div className={styles.gamesList}>
            {games.length === 0 ? (
              <div className={styles.noGames}>
                No games yet. Create your first game!
              </div>
            ) : (
              games.map((game) => (
                <Link href={`/games/${game.id}`} key={game.id}>
                  <a className={styles.gameCard}>
                    <div className={styles.gameDate}>
                      {new Date(game.date).toLocaleDateString()}
                    </div>
                    <div className={styles.teams}>
                      <span>{game.home_team_name}</span>
                      <span>vs</span>
                      <span>{game.away_team_name}</span>
                    </div>
                    <div className={styles.inning}>
                      Inning: {game.current_inning}
                    </div>
                  </a>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
