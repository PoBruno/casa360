import type { Request, Response } from "express"
import DatabaseManager from "../../services/databaseManager"

export const getAll = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query("SELECT * FROM currency ORDER BY code")

    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching currencies:", error)
    res.status(500).json({
      message: "Error fetching currencies",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const getById = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query("SELECT * FROM currency WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Currency not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching currency:", error)
    res.status(500).json({
      message: "Error fetching currency",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const create = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const { code, symbol, exchange_rate } = req.body

    if (!code || !symbol || !exchange_rate) {
      return res.status(400).json({ message: "Code, symbol, and exchange rate are required" })
    }

    // Validate code format (3 letters)
    if (!/^[A-Z]{3}$/.test(code)) {
      return res.status(400).json({ message: "Currency code must be 3 uppercase letters" })
    }

    // Validate exchange rate
    if (isNaN(Number.parseFloat(exchange_rate)) || Number.parseFloat(exchange_rate) <= 0) {
      return res.status(400).json({ message: "Exchange rate must be a positive number" })
    }

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if currency with same code already exists
    const existingResult = await housePool.query("SELECT * FROM currency WHERE code = $1", [code])

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ message: "Currency with this code already exists" })
    }

    // Create currency
    const result = await housePool.query(
      "INSERT INTO currency (code, symbol, exchange_rate) VALUES ($1, $2, $3) RETURNING *",
      [code, symbol, exchange_rate],
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Error creating currency:", error)
    res.status(500).json({
      message: "Error creating currency",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params
    const { code, symbol, exchange_rate } = req.body

    if (!code && !symbol && !exchange_rate) {
      return res.status(400).json({ message: "At least one field to update is required" })
    }

    // Validate code format if provided
    if (code && !/^[A-Z]{3}$/.test(code)) {
      return res.status(400).json({ message: "Currency code must be 3 uppercase letters" })
    }

    // Validate exchange rate if provided
    if (exchange_rate && (isNaN(Number.parseFloat(exchange_rate)) || Number.parseFloat(exchange_rate) <= 0)) {
      return res.status(400).json({ message: "Exchange rate must be a positive number" })
    }

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if currency exists
    const currencyResult = await housePool.query("SELECT * FROM currency WHERE id = $1", [id])

    if (currencyResult.rows.length === 0) {
      return res.status(404).json({ message: "Currency not found" })
    }

    // If code is provided, check if it's unique
    if (code) {
      const existingResult = await housePool.query("SELECT * FROM currency WHERE code = $1 AND id != $2", [code, id])

      if (existingResult.rows.length > 0) {
        return res.status(409).json({ message: "Currency with this code already exists" })
      }
    }

    // Build update query
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (code !== undefined) {
      updates.push(`code = $${paramIndex++}`)
      values.push(code)
    }

    if (symbol !== undefined) {
      updates.push(`symbol = $${paramIndex++}`)
      values.push(symbol)
    }

    if (exchange_rate !== undefined) {
      updates.push(`exchange_rate = $${paramIndex++}`)
      values.push(exchange_rate)
    }

    values.push(id)

    // Update currency
    const result = await housePool.query(
      `UPDATE currency SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error updating currency:", error)
    res.status(500).json({
      message: "Error updating currency",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const remove = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if currency exists
    const currencyResult = await housePool.query("SELECT * FROM currency WHERE id = $1", [id])

    if (currencyResult.rows.length === 0) {
      return res.status(404).json({ message: "Currency not found" })
    }

    // Check if currency is in use
    const financeEntriesResult = await housePool.query("SELECT COUNT(*) FROM finance_entries WHERE currency_id = $1", [
      id,
    ])

    const taskEntriesResult = await housePool.query("SELECT COUNT(*) FROM task_entries WHERE currency_id = $1", [id])

    if (
      Number.parseInt(financeEntriesResult.rows[0].count) > 0 ||
      Number.parseInt(taskEntriesResult.rows[0].count) > 0
    ) {
      return res.status(400).json({
        message: "Cannot delete currency because it is in use",
        financeEntries: Number.parseInt(financeEntriesResult.rows[0].count),
        taskEntries: Number.parseInt(taskEntriesResult.rows[0].count),
      })
    }

    // Delete currency
    await housePool.query("DELETE FROM currency WHERE id = $1", [id])

    res.status(204).send()
  } catch (error) {
    console.error("Error deleting currency:", error)
    res.status(500).json({
      message: "Error deleting currency",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

