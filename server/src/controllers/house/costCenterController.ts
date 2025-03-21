import type { Request, Response } from "express"
import DatabaseManager from "../../services/databaseManager"

export const getAll = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query("SELECT * FROM cost_center ORDER BY name")

    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching cost centers:", error)
    res.status(500).json({
      message: "Error fetching cost centers",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const getById = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query("SELECT * FROM cost_center WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cost center not found" })
    }

    // Get categories for this cost center
    const categoriesResult = await housePool.query("SELECT * FROM category WHERE cost_center_id = $1 ORDER BY name", [
      id,
    ])

    res.json({
      ...result.rows[0],
      categories: categoriesResult.rows,
    })
  } catch (error) {
    console.error("Error fetching cost center:", error)
    res.status(500).json({
      message: "Error fetching cost center",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const create = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ message: "Name is required" })
    }

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if cost center with same name already exists
    const existingResult = await housePool.query("SELECT * FROM cost_center WHERE name = $1", [name])

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ message: "Cost center with this name already exists" })
    }

    // Create cost center
    const result = await housePool.query("INSERT INTO cost_center (name, description) VALUES ($1, $2) RETURNING *", [
      name,
      description,
    ])

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Error creating cost center:", error)
    res.status(500).json({
      message: "Error creating cost center",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params
    const { name, description } = req.body

    if (!name && !description) {
      return res.status(400).json({ message: "At least one field to update is required" })
    }

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if cost center exists
    const costCenterResult = await housePool.query("SELECT * FROM cost_center WHERE id = $1", [id])

    if (costCenterResult.rows.length === 0) {
      return res.status(404).json({ message: "Cost center not found" })
    }

    // If name is provided, check if it's unique
    if (name) {
      const existingResult = await housePool.query("SELECT * FROM cost_center WHERE name = $1 AND id != $2", [name, id])

      if (existingResult.rows.length > 0) {
        return res.status(409).json({ message: "Cost center with this name already exists" })
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

    values.push(id)

    // Update cost center
    const result = await housePool.query(
      `UPDATE cost_center SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error updating cost center:", error)
    res.status(500).json({
      message: "Error updating cost center",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const remove = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if cost center exists
    const costCenterResult = await housePool.query("SELECT * FROM cost_center WHERE id = $1", [id])

    if (costCenterResult.rows.length === 0) {
      return res.status(404).json({ message: "Cost center not found" })
    }

    // Check if cost center has categories
    const categoriesResult = await housePool.query("SELECT COUNT(*) FROM category WHERE cost_center_id = $1", [id])

    if (Number.parseInt(categoriesResult.rows[0].count) > 0) {
      return res.status(400).json({
        message: "Cannot delete cost center because it has categories",
        categories: Number.parseInt(categoriesResult.rows[0].count),
      })
    }

    // Delete cost center
    await housePool.query("DELETE FROM cost_center WHERE id = $1", [id])

    res.status(204).send()
  } catch (error) {
    console.error("Error deleting cost center:", error)
    res.status(500).json({
      message: "Error deleting cost center",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

