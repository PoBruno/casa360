import type { Request, Response } from "express"
import DatabaseManager from "../../services/databaseManager"

export const getAll = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const { cost_center_id } = req.query

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    let query = "SELECT * FROM category"
    const params: any[] = []

    if (cost_center_id) {
      query += " WHERE cost_center_id = $1"
      params.push(cost_center_id)
    }

    query += " ORDER BY name"

    const result = await housePool.query(query, params)

    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching categories:", error)
    res.status(500).json({
      message: "Error fetching categories",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const getById = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query("SELECT * FROM category WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching category:", error)
    res.status(500).json({
      message: "Error fetching category",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const create = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const { cost_center_id, name, description } = req.body

    if (!cost_center_id || !name) {
      return res.status(400).json({ message: "Cost center ID and name are required" })
    }

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if cost center exists
    const costCenterResult = await housePool.query("SELECT * FROM cost_center WHERE id = $1", [cost_center_id])

    if (costCenterResult.rows.length === 0) {
      return res.status(404).json({ message: "Cost center not found" })
    }

    // Create category
    const result = await housePool.query(
      "INSERT INTO category (cost_center_id, name, description) VALUES ($1, $2, $3) RETURNING *",
      [cost_center_id, name, description],
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Error creating category:", error)
    res.status(500).json({
      message: "Error creating category",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params
    const { cost_center_id, name, description } = req.body

    if (!cost_center_id && !name && !description) {
      return res.status(400).json({ message: "At least one field to update is required" })
    }

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if category exists
    const categoryResult = await housePool.query("SELECT * FROM category WHERE id = $1", [id])

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" })
    }

    // If cost_center_id is provided, check if it exists
    if (cost_center_id) {
      const costCenterResult = await housePool.query("SELECT * FROM cost_center WHERE id = $1", [cost_center_id])

      if (costCenterResult.rows.length === 0) {
        return res.status(404).json({ message: "Cost center not found" })
      }
    }

    // Build update query
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (cost_center_id !== undefined) {
      updates.push(`cost_center_id = $${paramIndex++}`)
      values.push(cost_center_id)
    }

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(name)
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(description)
    }

    values.push(id)

    // Update category
    const result = await housePool.query(
      `UPDATE category SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error updating category:", error)
    res.status(500).json({
      message: "Error updating category",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const remove = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if category exists
    const categoryResult = await housePool.query("SELECT * FROM category WHERE id = $1", [id])

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" })
    }

    // Check if category is in use
    const financeEntriesResult = await housePool.query("SELECT COUNT(*) FROM finance_entries WHERE category_id = $1", [
      id,
    ])

    const taskEntriesResult = await housePool.query("SELECT COUNT(*) FROM task_entries WHERE category_id = $1", [id])

    if (
      Number.parseInt(financeEntriesResult.rows[0].count) > 0 ||
      Number.parseInt(taskEntriesResult.rows[0].count) > 0
    ) {
      return res.status(400).json({
        message: "Cannot delete category because it is in use",
        financeEntries: Number.parseInt(financeEntriesResult.rows[0].count),
        taskEntries: Number.parseInt(taskEntriesResult.rows[0].count),
      })
    }

    // Delete category
    await housePool.query("DELETE FROM category WHERE id = $1", [id])

    res.status(204).send()
  } catch (error) {
    console.error("Error deleting category:", error)
    res.status(500).json({
      message: "Error deleting category",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

