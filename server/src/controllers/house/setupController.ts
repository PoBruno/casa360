import type { Request, Response } from "express"
import DatabaseManager from "../../services/databaseManager"

export const setupTestUser = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const userId = req.user?.id // UUID from data-user

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" })
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()
    const housePool = await dbManager.getHousePool(house_id)

    // Get user info from data-user
    const userResult = await userPool.query(
      "SELECT username, email, full_name FROM users WHERE id = $1",
      [userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    const { username, email, full_name } = userResult.rows[0]

    // Check if user already exists in house database
    const existingUser = await housePool.query(
      "SELECT * FROM users WHERE data_user_uuid = $1",
      [userId]
    )

    if (existingUser.rows.length > 0) {
      return res.json({
        message: "User already exists in house database",
        user_id: existingUser.rows[0].id,
        data_user_uuid: userId
      })
    }

    // Create user in house database
    const result = await housePool.query(
      "INSERT INTO users (username, email, data_user_uuid, password_hash) VALUES ($1, $2, $3, $4) RETURNING id",
      [username, email, userId, "placeholder_hash"]
    )

    res.status(201).json({
      message: "User created in house database",
      user_id: result.rows[0].id,
      data_user_uuid: userId
    })
  } catch (error) {
    console.error("Error setting up test user:", error)
    res.status(500).json({
      message: "Error setting up test user",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}