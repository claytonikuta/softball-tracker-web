import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: "Invalid game ID" });
  }

  // GET - Fetch specific game with all related data
  if (req.method === "GET") {
    try {
      // Get game data
      const gameResult = await sql`
        SELECT * FROM games WHERE id = ${id}
      `;

      if (gameResult.rowCount === 0) {
        return res.status(404).json({ message: "Game not found" });
      }

      const game = gameResult.rows[0];

      // Get innings data
      const inningsResult = await sql`
        SELECT * FROM innings WHERE game_id = ${id} ORDER BY inning_number
      `;

      // Get players data
      const playersResult = await sql`
        SELECT * FROM players WHERE game_id = ${id} ORDER BY position
      `;

      // Get runners data
      const runnersResult = await sql`
        SELECT r.*, p.name, p.group_name, p.runs, p.outs 
        FROM runners r
        JOIN players p ON r.player_id = p.id
        WHERE r.game_id = ${id}
      `;

      // Format data for client
      game.innings = inningsResult.rows;
      game.players = playersResult.rows;
      game.runners = runnersResult.rows;

      return res.status(200).json({ game });
    } catch (error) {
      console.error("Error fetching game:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // PUT - Update game state
  if (req.method === "PUT") {
    try {
      const {
        current_inning,
        is_home_team_batting,
        innings,
        players,
        runners,
      } = req.body;

      // Update game basic info
      await sql`
        UPDATE games 
        SET 
          current_inning = ${current_inning}, 
          is_home_team_batting = ${is_home_team_batting},
          updated_at = NOW()
        WHERE id = ${id}
      `;

      // Update innings
      if (innings && Array.isArray(innings)) {
        for (const inning of innings) {
          await sql`
            UPDATE innings 
            SET 
              home_runs = ${inning.home_runs}, 
              home_outs = ${inning.home_outs},
              away_runs = ${inning.away_runs}, 
              away_outs = ${inning.away_outs}
            WHERE id = ${inning.id} AND game_id = ${id}
          `;
        }
      }

      // Delete players
      if (
        req.body.deleted_player_ids &&
        Array.isArray(req.body.deleted_player_ids)
      ) {
        for (const playerId of req.body.deleted_player_ids) {
          await sql`
      DELETE FROM players WHERE id = ${playerId} AND game_id = ${id}
    `;
        }
      }

      // Update players
      if (players && Array.isArray(players)) {
        for (const player of players) {
          if (player.id) {
            // Update existing player
            await sql`
              UPDATE players 
              SET 
                name = ${player.name}, 
                group_name = ${player.group_name},
                runs = ${player.runs}, 
                outs = ${player.outs},
                position = ${player.position}
              WHERE id = ${player.id} AND game_id = ${id}
            `;
          } else {
            // Add new player
            await sql`
              INSERT INTO players (game_id, name, group_name, runs, outs, position)
              VALUES (${id}, ${player.name}, ${player.group_name}, ${player.runs}, ${player.outs}, ${player.position})
            `;
          }
        }
      }

      // Update runners - clear existing and add new
      await sql`DELETE FROM runners WHERE game_id = ${id}`;

      if (runners && Array.isArray(runners)) {
        for (const runner of runners) {
          await sql`
            INSERT INTO runners (game_id, player_id, base_index)
            VALUES (${id}, ${runner.player_id}, ${runner.base_index})
          `;
        }
      }

      return res.status(200).json({ message: "Game updated successfully" });
    } catch (error) {
      console.error("Error updating game:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Delete related records first (foreign key constraints)
      await sql`DELETE FROM runners WHERE game_id = ${id}`;
      await sql`DELETE FROM players WHERE game_id = ${id}`;
      await sql`DELETE FROM innings WHERE game_id = ${id}`;

      // Delete the game itself
      await sql`DELETE FROM games WHERE id = ${id}`;

      return res.status(200).json({ message: "Game deleted successfully" });
    } catch (error) {
      console.error("Error deleting game:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
}
