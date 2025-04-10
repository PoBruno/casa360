import type { Request, Response } from "express"
import DatabaseManager from "../../services/databaseManager"

export const getAll = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query("SELECT * FROM payers ORDER BY name")

    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching payers:", error)
    res.status(500).json({
      message: "Error fetching payers",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const getById = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query("SELECT * FROM payers WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Payer not found" })
    }

    // Get payments associated with this payer
    const paymentsResult = await housePool.query(
      `
      SELECT p.*, 
             COUNT(pd.id) as details_count
      FROM payment p
      LEFT JOIN payment_details pd ON p.id = pd.payment_id
      WHERE p.payer_id = $1
      GROUP BY p.id
    `,
      [id],
    )

    res.json({
      ...result.rows[0],
      payments: paymentsResult.rows,
    })
  } catch (error) {
    console.error("Error fetching payer:", error)
    res.status(500).json({
      message: "Error fetching payer",
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

    // Create payer
    const result = await housePool.query("INSERT INTO payers (name, description) VALUES ($1, $2) RETURNING *", [
      name,
      description,
    ])

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Error creating payer:", error)
    res.status(500).json({
      message: "Error creating payer",
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

    // Check if payer exists
    const payerResult = await housePool.query("SELECT * FROM payers WHERE id = $1", [id])

    if (payerResult.rows.length === 0) {
      return res.status(404).json({ message: "Payer not found" })
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

    // Update payer
    const result = await housePool.query(
      `UPDATE payers SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error updating payer:", error)
    res.status(500).json({
      message: "Error updating payer",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const remove = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if payer exists
    const payerResult = await housePool.query("SELECT * FROM payers WHERE id = $1", [id])

    if (payerResult.rows.length === 0) {
      return res.status(404).json({ message: "Payer not found" })
    }

    // Check if payer is in use in payment
    const paymentResult = await housePool.query("SELECT COUNT(*) FROM payment WHERE payer_id = $1", [id])

    // Check if payer is in use in payment_details
    const paymentDetailsResult = await housePool.query("SELECT COUNT(*) FROM payment_details WHERE payer_id = $1", [id])

    if (Number.parseInt(paymentResult.rows[0].count) > 0 || Number.parseInt(paymentDetailsResult.rows[0].count) > 0) {
      return res.status(400).json({
        message: "Cannot delete payer because it is in use",
        payments: Number.parseInt(paymentResult.rows[0].count),
        paymentDetails: Number.parseInt(paymentDetailsResult.rows[0].count),
      })
    }

    // Delete payer
    await housePool.query("DELETE FROM payers WHERE id = $1", [id])

    res.status(204).send()
  } catch (error) {
    console.error("Error deleting payer:", error)
    res.status(500).json({
      message: "Error deleting payer",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

