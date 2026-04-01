import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await sql`
      ALTER TABLE games
      ADD COLUMN IF NOT EXISTS our_team VARCHAR(10) DEFAULT 'home'
    `;

    return res.status(200).json({ message: "Migration completed: our_team column added" });
  } catch (error) {
    console.error("Migration error:", error);
    return res.status(500).json({ message: "Migration failed", error: String(error) });
  }
}
