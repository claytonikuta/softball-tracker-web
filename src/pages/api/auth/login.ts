// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { sql } from "@vercel/postgres";

const JWT_SECRET =
  process.env.JWT_SECRET || "softball-secret-key-change-in-production";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username, password } = req.body;

  try {
    // Very simple authentication - in production you'd want to hash passwords
    const result = await sql`
      SELECT * FROM users WHERE username = ${username} AND password = ${password}
    `;

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: result.rows[0].id, username: result.rows[0].username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return the token
    res.status(200).json({
      token,
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
