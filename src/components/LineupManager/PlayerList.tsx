import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Player } from "../../types/Player";
import SortablePlayerItem from "./SortablePlayerItem";
import styles from "./PlayerList.module.css";

interface PlayerListProps {
  title: string;
  players: Player[];
  onReorder: (startIndex: number, endIndex: number) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({
  title,
  players,
  onReorder,
}) => {
  // Move ALL hooks to the top before any conditional logic
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Safe handler with additional checks
  const handleDragEnd = (event: DragEndEvent) => {
    if (!Array.isArray(players)) return; // Ensure players is an array before proceeding
    const { active, over } = event;
    if (!over || !active || !active.id || !over.id) return;

    if (active.id !== over.id) {
      const oldIndex = players.findIndex((player) => player?.id === active.id);
      const newIndex = players.findIndex((player) => player?.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  // Make sure players is an array and has items
  const isPlayersArray = Array.isArray(players);
  const safePlayersList = isPlayersArray ? players : [];

  // After all hooks, we can check and warn
  if (!isPlayersArray) {
    console.warn(`PlayerList "${title}" received non-array players:`, players);
  }

  return (
    <div className={styles["player-list"]}>
      <h3>{title}</h3>

      {!isPlayersArray || safePlayersList.length === 0 ? (
        <p className={styles["no-players"]}>
          {!isPlayersArray ? "No players available" : "No players added yet"}
        </p>
      ) : (
        // Only render DndContext when we have players
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={safePlayersList.map(
              (player) => player?.id || `player-${Math.random()}`
            )}
            strategy={verticalListSortingStrategy}
          >
            <div className={styles["players-container"]}>
              {safePlayersList.map((player) => (
                <SortablePlayerItem
                  key={player?.id || `player-${Math.random()}`}
                  player={player}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default PlayerList;
