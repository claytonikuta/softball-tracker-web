import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
