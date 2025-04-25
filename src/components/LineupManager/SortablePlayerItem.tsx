import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Player } from "../../types/Player";
import PlayerCard from "../shared/PlayerCard";
import { useLineup } from "../../context/LineupContext";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import styles from "./SortablePlayerItem.module.css";

interface SortablePlayerItemProps {
  player: Player;
}

const SortablePlayerItem: React.FC<SortablePlayerItemProps> = ({ player }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: player.id });
  const { removePlayer, updatePlayer } = useLineup();

  // Add state for the confirmation modal
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  // Add state for the edit functionality
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedRuns, setEditedRuns] = useState(player.runs);
  const [editedOuts, setEditedOuts] = useState(player.outs);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "8px",
    position: "relative", // Ensure relative positioning
  };

  // Modified to show confirmation instead of direct removal
  const handleRemove = (e: React.MouseEvent) => {
    console.log("Remove button clicked for player:", player.name);
    e.stopPropagation();
    e.preventDefault();
    setShowRemoveModal(true);
  };

  // Function to handle actual removal after confirmation
  const confirmRemove = () => {
    console.log("Confirming removal of player:", player.name);
    removePlayer(player.id);
    setShowRemoveModal(false);
  };

  // Direct edit function that doesn't rely on click events
  const handleEdit = (e: React.MouseEvent) => {
    console.log("Direct edit function called for player:", player.name);
    e.stopPropagation();
    e.preventDefault();
    setEditedRuns(player.runs);
    setEditedOuts(player.outs);
    setShowEditModal(true);
  };

  // Save edited stats
  const saveEdit = () => {
    const updatedPlayer = {
      ...player,
      runs: editedRuns,
      outs: editedOuts,
    };
    updatePlayer(player.id, updatedPlayer);
    setShowEditModal(false);
  };

  return (
    <div ref={setNodeRef} style={style} className={styles["sortable-item"]}>
      {/* The card itself has the drag handlers */}
      <div className={styles["card-content"]} {...attributes} {...listeners}>
        <PlayerCard player={player} dragHandleProps={undefined} />
      </div>

      {/* Both buttons are completely separate from the draggable part */}
      <div
        style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          display: "flex",
          gap: "5px",
        }}
      >
        {/* Edit button */}
        <button
          className={styles["edit-player-btn"]}
          onMouseDown={handleEdit}
          style={{
            width: "24px",
            height: "24px",
            backgroundColor: "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: "50%",
            fontSize: "14px",
            cursor: "pointer",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✎
        </button>

        {/* Remove button */}
        <button
          className={styles["remove-player-btn"]}
          onMouseDown={handleRemove}
          style={{
            width: "24px",
            height: "24px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "20%",
            fontSize: "16px",
            cursor: "pointer",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        title="Remove Player"
      >
        <div className={styles["confirm-removal"]}>
          <p>
            Are you sure you want to remove <strong>{player.name}</strong> from
            the lineup?
          </p>
          <div className={styles["modal-actions"]}>
            <Button onClick={confirmRemove} className={styles["remove-button"]}>
              Yes, Remove
            </Button>
            <Button
              onClick={() => setShowRemoveModal(false)}
              className={styles["cancel-button"]}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Player: ${player.name}`}
      >
        <div className={styles["edit-player-form"]}>
          <div className={styles["edit-stat"]}>
            <h4>Runs:</h4>
            <div className={styles["counter-control"]}>
              <Button
                onClick={() => setEditedRuns((prev) => Math.max(0, prev - 1))}
                className={styles["small-btn"]}
              >
                -
              </Button>
              <span className={styles["counter-value"]}>{editedRuns}</span>
              <Button
                onClick={() => setEditedRuns((prev) => prev + 1)}
                className={styles["small-btn"]}
              >
                +
              </Button>
            </div>
          </div>
          <div className={styles["edit-stat"]}>
            <h4>Outs:</h4>
            <div className={styles["counter-control"]}>
              <Button
                onClick={() => setEditedOuts((prev) => Math.max(0, prev - 1))}
                className={styles["small-btn"]}
              >
                -
              </Button>
              <span className={styles["counter-value"]}>{editedOuts}</span>
              <Button
                onClick={() => setEditedOuts((prev) => prev + 1)}
                className={styles["small-btn"]}
              >
                +
              </Button>
            </div>
          </div>
          <div className={styles["modal-actions"]}>
            <Button onClick={saveEdit} className={styles["save-button"]}>
              Save Changes
            </Button>
            <Button
              onClick={() => setShowEditModal(false)}
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

export default SortablePlayerItem;
