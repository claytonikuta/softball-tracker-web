import React, { useState } from "react";
// import Button from "../shared/Button";
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
      <div className={styles["form-row"]}>
        <input
          type="text"
          placeholder="Player Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles["name-input"]}
          required
        />

        <div className={styles["group-selector"]}>
          <label>
            <input
              type="radio"
              name="group"
              value="green"
              checked={group === "green"}
              onChange={() => setGroup("green")}
            />
            <span className={styles["green-group"]}>Green</span>
          </label>
          <label>
            <input
              type="radio"
              name="group"
              value="orange"
              checked={group === "orange"}
              onChange={() => setGroup("orange")}
            />
            <span className={styles["orange-group"]}>Orange</span>
          </label>
        </div>
      </div>

      <div className={styles["form-actions"]}>
        <button
          type="submit"
          className={styles["add-button"]}
          disabled={name.trim() === ""}
        >
          Add Player
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={styles["cancel-button"]}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default PlayerForm;
