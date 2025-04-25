import React, { useState } from "react";
import PlayerForm from "./PlayerForm";
import PlayerList from "./PlayerList";
import { useLineup } from "../../context/LineupContext";
import { useGameContext } from "../../context/GameContext";
import { Runner, RunnerOnBase } from "../../types/Player";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import styles from "./LineupManager.module.css";
import ImportLineup from "../GameTracker/ImportLineup";

const LineupManager: React.FC = () => {
  const {
    greenLineup,
    orangeLineup,
    addPlayer,
    reorderGreenLineup,
    reorderOrangeLineup,
  } = useLineup();
  const { setRunnersOnBase } = useGameContext();

  const [showForm, setShowForm] = useState(false);
  const [showPlaceRunnerModal, setShowPlaceRunnerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Runner | null>(null);
  const [selectedBase, setSelectedBase] = useState<number>(0);

  // Safety check - if any of these aren't arrays, handle it gracefully
  if (!Array.isArray(greenLineup) || !Array.isArray(orangeLineup)) {
    console.warn("LineupManager received non-array lineup data");
    return (
      <div className={styles["lineup-manager"]}>
        <h2>Lineup Manager</h2>
        <p>Loading lineup data...</p>
      </div>
    );
  }

  // Safe list of all players - defensive coding
  const allPlayers =
    Array.isArray(greenLineup) && Array.isArray(orangeLineup)
      ? [...greenLineup, ...orangeLineup]
      : [];

  const handleAddPlayer = (player: {
    name: string;
    group: "green" | "orange";
  }) => {
    const newPlayer = {
      ...player,
      id: Date.now().toString(),
      runs: 0,
      outs: 0,
    };
    addPlayer(newPlayer);
    setShowForm(false);
  };

  const handlePlaceRunner = () => {
    setShowPlaceRunnerModal(true);
  };

  const confirmPlaceRunner = () => {
    if (!selectedPlayer) return;

    // Create a unique ID for this runner instance
    const uniqueId = `${selectedPlayer.id}-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;

    // Create runner object with the selected base
    const newRunner: RunnerOnBase = {
      ...selectedPlayer,
      id: uniqueId,
      baseIndex: selectedBase,
    };

    // Add to runners list
    setRunnersOnBase((prev) => [...prev, newRunner]);

    // Close modal and reset selection
    setShowPlaceRunnerModal(false);
    setSelectedPlayer(null);
    setSelectedBase(0);
  };

  return (
    <div className={styles["lineup-manager"]}>
      <h2>Lineup Manager</h2>

      <ImportLineup />

      <div className={styles["lineup-actions"]}>
        <div className={styles["action-buttons"]}>
          <button
            className={styles["add-player-btn"]}
            onClick={() => setShowForm(true)}
          >
            Add Player
          </button>
          <button
            className={styles["place-runner-btn"]}
            onClick={handlePlaceRunner}
          >
            Place Runner on Base
          </button>
        </div>

        {showForm && (
          <PlayerForm
            onAddPlayer={handleAddPlayer}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>

      <div className={styles["lineup-lists"]}>
        <PlayerList
          title="Green Group Lineup"
          players={greenLineup}
          onReorder={reorderGreenLineup}
        />
        <PlayerList
          title="Orange Group Lineup"
          players={orangeLineup}
          onReorder={reorderOrangeLineup}
        />
      </div>

      {/* Place Runner Modal */}
      <Modal
        isOpen={showPlaceRunnerModal}
        onClose={() => setShowPlaceRunnerModal(false)}
        title="Place Runner on Base"
      >
        <div className={styles["place-runner-form"]}>
          <div className={styles["form-group"]}>
            <label>Select Player:</label>
            <select
              value={selectedPlayer?.id || ""}
              onChange={(e) => {
                const player = allPlayers.find((p) => p.id === e.target.value);
                setSelectedPlayer(
                  player ? { ...player, onBase: "first" } : null
                );
              }}
            >
              <option value="">-- Select Player --</option>
              {Array.isArray(allPlayers) && allPlayers.length > 0 ? (
                allPlayers.map((player) => (
                  <option
                    key={player?.id || `player-${Math.random()}`}
                    value={player?.id || ""}
                  >
                    {player?.name || "Unknown"} (
                    {player?.group === "green" ? "Green" : "Orange"})
                  </option>
                ))
              ) : (
                <option value="">No players available</option>
              )}
            </select>
          </div>

          <div className={styles["form-group"]}>
            <label>Select Base:</label>
            <div className={styles["base-selection"]}>
              <label className={styles["base-option"]}>
                <input
                  type="radio"
                  name="base"
                  checked={selectedBase === 0}
                  onChange={() => setSelectedBase(0)}
                />
                <span>First Base</span>
              </label>
              <label className={styles["base-option"]}>
                <input
                  type="radio"
                  name="base"
                  checked={selectedBase === 1}
                  onChange={() => setSelectedBase(1)}
                />
                <span>Second Base</span>
              </label>
              <label className={styles["base-option"]}>
                <input
                  type="radio"
                  name="base"
                  checked={selectedBase === 2}
                  onChange={() => setSelectedBase(2)}
                />
                <span>Third Base</span>
              </label>
            </div>
          </div>

          <div className={styles["modal-actions"]}>
            <Button
              onClick={confirmPlaceRunner}
              className={styles["place-button"]}
              disabled={!selectedPlayer}
            >
              Place Runner
            </Button>
            <Button
              onClick={() => setShowPlaceRunnerModal(false)}
              className={styles["cancel-button"]}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LineupManager;
