import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;
  const { players } = req.body;

  if (!Array.isArray(players) || !id || Array.isArray(id)) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  try {
    // Process each player update
    for (const player of players) {
      if (!player.id || typeof player.index_in_group !== "number") {
        console.warn("Skipping invalid player update:", player);
        continue;
      }

      // Update just the index_in_group field for this player
      await sql`
        UPDATE players 
        SET index_in_group = ${player.index_in_group}
        WHERE id = ${player.id} AND game_id = ${id}
      `;
    }

    return res
      .status(200)
      .json({ message: "Player indices updated successfully" });
  } catch (error) {
    console.error("Error updating player indices:", error);
    return res.status(500).json({ message: "Failed to update player indices" });
  }
}
