import React, { useState } from "react";
import Button from "../shared/Button";
import styles from "./PlayerForm.module.css";

interface PlayerFormProps {
  onAddPlayer: (player: { name: string; group: "green" | "orange" }) => void;
  onCancel: () => void;
}

const PlayerForm: React.FC<PlayerFormProps> = ({ onAddPlayer, onCancel }) => {
  const [name, setName] = useState("");
  const [group, setGroup] = useState<"green" | "orange">("green");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === "") return;

    onAddPlayer({
      name: name.trim(),
      group: group,
    });

    // Reset form
    setName("");
    setGroup("orange");
  };

  return (
    <form className={styles["player-form"]} onSubmit={handleSubmit}>
      <div className={styles["form-field"]}>
        <label htmlFor="player-name">Player Name</label>
        <input
          id="player-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter player name"
          required
        />
      </div>

      <div className={styles["form-field"]}>
        <label className={styles["group-label"]}>Group</label>
        <div className={styles["radio-group"]}>
          <label className={styles["radio-container green-group"]}>
            <input
              type="radio"
              name="group"
              value="green"
              checked={group === "green"}
              onChange={() => setGroup("green")}
            />
            <span className={styles["radio-custom"]}></span>
            <span className={styles["radio-label"]}>Green Group</span>
          </label>

          <label className={styles["radio-container orange-group"]}>
            <input
              type="radio"
              name="group"
              value="orange"
              checked={group === "orange"}
              onChange={() => setGroup("orange")}
            />
            <span className={styles["radio-custom"]}></span>
            <span className={styles["radio-label"]}>Orange Group</span>
          </label>
        </div>
      </div>

      <div className={styles["form-actions"]}>
        <Button
          onClick={() =>
            handleSubmit(new Event("submit") as unknown as React.FormEvent)
          }
          className={styles["add-button"]}
        >
          Add Player
        </Button>
        <Button onClick={onCancel} className={styles["cancel-button"]}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default PlayerForm;
