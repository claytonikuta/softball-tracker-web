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
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = players.findIndex((player) => player.id === active.id);
      const newIndex = players.findIndex((player) => player.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  // Make sure players is an array and has items before using SortableContext
  const safePlayersList = Array.isArray(players) ? players : [];

  return (
    <div className={styles["player-list"]}>
      <h3>{title}</h3>

      {!safePlayersList.length ? (
        <p className={styles["no-players"]}>No players added yet</p>
      ) : (
        // Only render DndContext when we have players
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {/* Only create SortableContext when we have safe player IDs */}
          {safePlayersList.length > 0 && (
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
          )}
        </DndContext>
      )}
    </div>
  );
};

export default PlayerList;
