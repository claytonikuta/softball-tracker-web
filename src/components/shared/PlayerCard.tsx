import React from "react";
import { Player } from "../../types/Player";
import styles from "./PlayerCard.module.css";

interface PlayerCardProps {
  player: Player;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, dragHandleProps }) => {
  return (
    <div className={styles["player-card"]} {...dragHandleProps}>
      <div className={styles["player-info"]}>
        <div className={styles["player-name"]}>{player.name}</div>
        <div className={styles["player-group"]}>
          {player.group === "green" ? "Green Group" : "Orange Group"}
        </div>
        <div className={styles["player-stats"]}>
          <span>Runs: {player.runs}</span>
          <span>Outs: {player.outs}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
