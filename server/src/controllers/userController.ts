import type { Request, Response } from "express"
import DatabaseManager from "../services/databaseManager"

export const createHouse = async (req: Request, res: Response) => {
  const { userId, houseName } = req.body

  if (!userId || isNaN(Number(userId))) {
    return res.status(400).json({ message: "Invalid user ID" })
  }

  const dbManager = DatabaseManager.getInstance()

  try {
    const userPool = await dbManager.getUserPool()

    const result = await userPool.query("INSERT INTO houses (user_id, house_name) VALUES ($1, $2) RETURNING id", [
      userId,
      houseName,
    ])

    const houseId = result.rows[0].id
    await dbManager.createHouseDatabase(houseId)

    await userPool.query("INSERT INTO house_users (user_id, house_id, role) VALUES ($1, $2, $3)", [
      userId,
      houseId,
      "owner",
    ])

    res.status(201).json({ houseId })
  } catch (error: unknown) {
    console.error("Error creating house:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    res.status(500).json({ message: "Error creating house", error: errorMessage })
  }
}

export const getUserHouses = async (req: Request, res: Response) => {
  const userId = req.params.userId

  try {
    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    const result = await userPool.query("SELECT * FROM houses WHERE user_id = $1", [userId])
    res.status(200).json(result.rows)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    res.status(500).json({ message: "Error fetching houses", error: errorMessage })
  }
}

