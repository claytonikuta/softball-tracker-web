import React, { useState } from "react";
import PlayerForm from "./PlayerForm";
import PlayerList from "./PlayerList";
import ImportLineup from "./ImportLineup";
import { useGameSession } from "../../context/GameSessionContext";
import { Runner } from "../../types/Player";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import styles from "./LineupManager.module.css";

const LineupManager: React.FC = () => {
  const {
    greenLineup,
    orangeLineup,
    addPlayer,
    reorderLineup,
    dispatch,
  } = useGameSession();

  const [showForm, setShowForm] = useState(false);
  const [showPlaceRunnerModal, setShowPlaceRunnerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Runner | null>(null);
  const [selectedBase, setSelectedBase] = useState<number>(0);

  try {
    if (!greenLineup || !Array.isArray(greenLineup)) {
      return (
        <div className={styles["lineup-manager"]}>
          <h2>Lineup Manager</h2>
          <p>Loading lineup data...</p>
        </div>
      );
    }

    if (!orangeLineup || !Array.isArray(orangeLineup)) {
      return (
        <div className={styles["lineup-manager"]}>
          <h2>Lineup Manager</h2>
          <p>Loading lineup data...</p>
        </div>
      );
    }

    const allPlayers = [...greenLineup, ...orangeLineup];

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
      dispatch({
        type: "PLACE_RUNNER",
        player: selectedPlayer,
        baseIndex: selectedBase,
      });
      setShowPlaceRunnerModal(false);
      setSelectedPlayer(null);
      setSelectedBase(0);
    };

    return (
      <div className={styles["lineup-manager"]}>
        <h2>Lineup Manager</h2>

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

          <ImportLineup />

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
            onReorder={(startIndex: number, endIndex: number) =>
              reorderLineup("green", startIndex, endIndex)
            }
          />
          <PlayerList
            title="Orange Group Lineup"
            players={orangeLineup}
            onReorder={(startIndex: number, endIndex: number) =>
              reorderLineup("orange", startIndex, endIndex)
            }
          />
        </div>

        {showPlaceRunnerModal && (
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
                    const player = allPlayers.find(
                      (p) => p.id === e.target.value
                    );
                    setSelectedPlayer(
                      player ? { ...player, onBase: "first" } : null
                    );
                  }}
                >
                  <option value="">-- Select Player --</option>
                  {allPlayers.length > 0 ? (
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
        )}
      </div>
    );
  } catch (error) {
    console.error("Caught error in LineupManager:", error);
    return (
      <div className={styles["lineup-manager"]}>
        <h2>Lineup Manager</h2>
        <p>There was a problem loading the lineup manager.</p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: "8px 16px", margin: "20px auto", display: "block" }}
        >
          Reload
        </button>
      </div>
    );
  }
};

export default LineupManager;
