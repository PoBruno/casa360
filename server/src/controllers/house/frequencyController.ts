import type { Request, Response } from "express"
import DatabaseManager from "../../services/databaseManager"

export const getAll = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query("SELECT * FROM frequency ORDER BY name")

    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching frequencies:", error)
    res.status(500).json({
      message: "Error fetching frequencies",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const getById = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query("SELECT * FROM frequency WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Frequency not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching frequency:", error)
    res.status(500).json({
      message: "Error fetching frequency",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const create = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const { name, description, scheduler_cron } = req.body

    if (!name || !scheduler_cron) {
      return res.status(400).json({ message: "Name and scheduler_cron are required" })
    }

    // Validate cron expression (basic validation)
    if (!isValidCronExpression(scheduler_cron)) {
      return res.status(400).json({ message: "Invalid cron expression" })
    }

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if frequency with same name already exists
    const existingResult = await housePool.query("SELECT * FROM frequency WHERE name = $1", [name])

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ message: "Frequency with this name already exists" })
    }

    // Create frequency
    const result = await housePool.query(
      "INSERT INTO frequency (name, description, scheduler_cron) VALUES ($1, $2, $3) RETURNING *",
      [name, description, scheduler_cron],
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Error creating frequency:", error)
    res.status(500).json({
      message: "Error creating frequency",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params
    const { name, description, scheduler_cron } = req.body

    if (!name && !description && !scheduler_cron) {
      return res.status(400).json({ message: "At least one field to update is required" })
    }

    // Validate cron expression if provided
    if (scheduler_cron && !isValidCronExpression(scheduler_cron)) {
      return res.status(400).json({ message: "Invalid cron expression" })
    }

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if frequency exists
    const frequencyResult = await housePool.query("SELECT * FROM frequency WHERE id = $1", [id])

    if (frequencyResult.rows.length === 0) {
      return res.status(404).json({ message: "Frequency not found" })
    }

    // If name is provided, check if it's unique
    if (name) {
      const existingResult = await housePool.query("SELECT * FROM frequency WHERE name = $1 AND id != $2", [name, id])

      if (existingResult.rows.length > 0) {
        return res.status(409).json({ message: "Frequency with this name already exists" })
      }
    }

    // Build update query
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(name)
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(description)
    }

    if (scheduler_cron !== undefined) {
      updates.push(`scheduler_cron = $${paramIndex++}`)
      values.push(scheduler_cron)
    }

    values.push(id)

    // Update frequency
    const result = await housePool.query(
      `UPDATE frequency SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error updating frequency:", error)
    res.status(500).json({
      message: "Error updating frequency",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const remove = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if frequency exists
    const frequencyResult = await housePool.query("SELECT * FROM frequency WHERE id = $1", [id])

    if (frequencyResult.rows.length === 0) {
      return res.status(404).json({ message: "Frequency not found" })
    }

    // Check if frequency is in use
    const financeEntriesResult = await housePool.query("SELECT COUNT(*) FROM finance_entries WHERE frequency_id = $1", [
      id,
    ])

    const taskEntriesResult = await housePool.query("SELECT COUNT(*) FROM task_entries WHERE frequency_id = $1", [id])

    if (
      Number.parseInt(financeEntriesResult.rows[0].count) > 0 ||
      Number.parseInt(taskEntriesResult.rows[0].count) > 0
    ) {
      return res.status(400).json({
        message: "Cannot delete frequency because it is in use",
        financeEntries: Number.parseInt(financeEntriesResult.rows[0].count),
        taskEntries: Number.parseInt(taskEntriesResult.rows[0].count),
      })
    }

    // Delete frequency
    await housePool.query("DELETE FROM frequency WHERE id = $1", [id])

    res.status(204).send()
  } catch (error) {
    console.error("Error deleting frequency:", error)
    res.status(500).json({
      message: "Error deleting frequency",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// Helper function to validate cron expression
function isValidCronExpression(cron: string): boolean {
  // Basic validation - should have 5 or 6 parts separated by spaces
  const parts = cron.split(" ")
  return parts.length >= 5 && parts.length <= 6
}

