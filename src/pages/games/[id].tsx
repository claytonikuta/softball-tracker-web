// pages/games/[id].tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import dynamic from "next/dynamic";
import { GameProvider } from "../../context/GameContext";
import { LineupProvider } from "../../context/LineupContext";
import styles from "../../styles/GameDetail.module.css";

// Dynamically import the GameTracker to avoid SSR issues
const GameTracker = dynamic(
  () => import("../../components/GameTracker/GameTracker"),
  {
    ssr: false,
  }
);

export default function GameDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  interface GameData {
    home_team_name: string;
    away_team_name: string;
    date: string;
    players: { id: number; name: string; position: string }[];
  }

  const [gameData, setGameData] = useState<GameData | null>(null);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const response = await fetch(`/api/games/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch game data");
        }

        const data = await response.json();
        setGameData(data.game);
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

    if (id) {
      fetchGameData();
    }
  }, [id]);

  if (loading) {
    return <div className={styles.loading}>Loading game data...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/games">
          <a className={styles.backLink}>← Back to Games</a>
        </Link>

        <h1>
          {gameData &&
            `${gameData.home_team_name} vs ${gameData.away_team_name}`}
        </h1>

        <span className={styles.date}>
          {gameData && new Date(gameData.date).toLocaleDateString()}
        </span>
      </header>

      <div className={styles.gameContainer}>
        <GameProvider initialData={gameData}>
          {gameData && (
            <LineupProvider initialData={gameData.players}>
              <GameTracker />
            </LineupProvider>
          )}
        </GameProvider>
      </div>
    </div>
  );
}
