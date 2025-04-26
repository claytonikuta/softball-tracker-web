import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      // Get game ID to exclude (current game)
      const { excludeGameId } = req.query;

      // Validate excludeGameId to ensure it's a single string or number
      const validatedExcludeGameId = Array.isArray(excludeGameId)
        ? excludeGameId[0]
        : excludeGameId || 0;

      // Fetch unique games with lineups
      const games = await sql`
        SELECT DISTINCT g.id, g.date, g.home_team_name, g.away_team_name
        FROM games g
        JOIN players p ON g.id = p.game_id
        WHERE g.id != ${validatedExcludeGameId}
        ORDER BY g.date DESC
        LIMIT 10
      `;

      return res.status(200).json(games.rows);
    } catch (error) {
      console.error("Error fetching games with lineups:", error);
      return res.status(500).json({ message: "Failed to fetch games" });
    }
  }

  // For importing a specific lineup
  if (req.method === "POST") {
    try {
      const { sourceGameId } = req.body;

      // Fetch players from source game
      const players = await sql`
        SELECT name, group_name, position 
        FROM players
        WHERE game_id = ${sourceGameId}
      `;

      return res.status(200).json(players.rows);
    } catch (error) {
      console.error("Error importing lineup:", error);
      return res.status(500).json({ message: "Failed to import lineup" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
