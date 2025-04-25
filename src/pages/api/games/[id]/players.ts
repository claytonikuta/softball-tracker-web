import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query; // Game ID
  const gameId = Array.isArray(id) ? id[0] : id;

  // Add a single player
  if (req.method === "POST") {
    try {
      const { name, group_name, runs, outs, position } = req.body;

      const result = await sql`
        INSERT INTO players (game_id, name, group_name, runs, outs, position)
        VALUES (${gameId}, ${name}, ${group_name}, ${runs || 0}, ${
        outs || 0
      }, ${position})
        RETURNING *
      `;

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error adding player:", error);
      return res.status(500).json({ message: "Failed to add player" });
    }
  }

  // Update a single player
  if (req.method === "PUT") {
    try {
      const { id: playerId, name, group_name, runs, outs, position } = req.body;

      const result = await sql`
          UPDATE players 
          SET 
            name = ${name}, 
            group_name = ${group_name},
            runs = ${runs || 0}, 
            outs = ${outs || 0},
            position = ${position}
          WHERE id = ${playerId} AND game_id = ${gameId}
          RETURNING *
        `;

      return res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Error updating player:", error);
      return res.status(500).json({ message: "Failed to update player" });
    }
  }

  // Delete a single player
  if (req.method === "DELETE") {
    try {
      const { playerId } = req.query;
      const validatedPlayerId = Array.isArray(playerId)
        ? playerId[0]
        : playerId;
      const validatedGameId = Array.isArray(gameId) ? gameId[0] : gameId;

      await sql`
        DELETE FROM players 
        WHERE id = ${validatedPlayerId} AND game_id = ${validatedGameId}
      `;

      return res.status(200).json({ message: "Player deleted successfully" });
    } catch (error) {
      console.error("Error deleting player:", error);
      return res.status(500).json({ message: "Failed to delete player" });
    }
  }

  if (req.method === "GET") {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid game ID" });
    }

    try {
      // Fetch players for the specified game
      const result = await sql`
        SELECT * FROM players 
        WHERE game_id = ${id}
        ORDER BY 
          CASE WHEN group_name = 'green' THEN 0 ELSE 1 END,
          name
      `;

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching players:", error);
      return res.status(500).json({ message: "Failed to fetch players" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
