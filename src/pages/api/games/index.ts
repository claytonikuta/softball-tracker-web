import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET - Fetch all games
  if (req.method === "GET") {
    try {
      const result = await sql`
        SELECT * FROM games ORDER BY created_at DESC
      `;

      return res.status(200).json({ games: result.rows });
    } catch (error) {
      console.error("Error fetching games:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // POST - Create new game
  if (req.method === "POST") {
    const { home_team_name, away_team_name } = req.body;

    if (!home_team_name || !away_team_name) {
      return res
        .status(400)
        .json({ message: "Home and away team names are required" });
    }

    try {
      // Create a new game
      const gameResult = await sql`
        INSERT INTO games (home_team_name, away_team_name) 
        VALUES (${home_team_name}, ${away_team_name}) 
        RETURNING *
      `;

      const game = gameResult.rows[0];

      // Create 7 innings for the game
      for (let i = 1; i <= 7; i++) {
        await sql`
          INSERT INTO innings (game_id, inning_number)
          VALUES (${game.id}, ${i})
        `;
      }

      return res.status(201).json({
        message: "Game created successfully",
        game: game,
      });
    } catch (error) {
      console.error("Error creating game:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
}
