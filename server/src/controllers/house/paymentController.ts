import type { Request, Response } from "express"
import DatabaseManager from "../../services/databaseManager"

export const getAll = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query(`
      SELECT p.*, 
             py.name as payer_name,
             COUNT(pd.id) as details_count
      FROM payment p
      JOIN payers py ON p.payer_id = py.id
      LEFT JOIN payment_details pd ON p.id = pd.payment_id
      GROUP BY p.id, py.name
      ORDER BY p.id
    `)

    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching payments:", error)
    res.status(500).json({
      message: "Error fetching payments",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const getById = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query(
      `
      SELECT p.*, py.name as payer_name
      FROM payment p
      JOIN payers py ON p.payer_id = py.id
      WHERE p.id = $1
    `,
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" })
    }

    // Get payment details
    const detailsResult = await housePool.query(
      `
      SELECT pd.*, py.name as payer_name
      FROM payment_details pd
      JOIN payers py ON pd.payer_id = py.id
      WHERE pd.payment_id = $1
      ORDER BY pd.id
    `,
      [id],
    )

    // Get finance entries using this payment
    const entriesResult = await housePool.query(
      `
      SELECT fe.id, fe.description, fe.amount, fe.type, fe.start_date
      FROM finance_entries fe
      WHERE fe.payment_id = $1
      ORDER BY fe.start_date DESC
    `,
      [id],
    )

    res.json({
      ...result.rows[0],
      details: detailsResult.rows,
      entries: entriesResult.rows,
    })
  } catch (error) {
    console.error("Error fetching payment:", error)
    res.status(500).json({
      message: "Error fetching payment",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const create = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const { payer_id, percentage, details } = req.body

    if (!payer_id) {
      return res.status(400).json({ message: "Payer ID is required" })
    }

    if (percentage === undefined) {
      return res.status(400).json({ message: "Percentage is required" })
    }

    // Validate percentage
    if (
      isNaN(Number.parseFloat(percentage)) ||
      Number.parseFloat(percentage) < 0 ||
      Number.parseFloat(percentage) > 100
    ) {
      return res.status(400).json({ message: "Percentage must be between 0 and 100" })
    }

    // If details are provided, validate them
    if (details && Array.isArray(details)) {
      // Check if details percentages sum to 100
      const totalPercentage = details.reduce((sum, detail) => sum + Number.parseFloat(detail.percentage), 0)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        // Allow small floating point errors
        return res.status(400).json({
          message: "Payment details percentages must sum to 100%",
          total: totalPercentage,
        })
      }

      // Check if all payers exist
      for (const detail of details) {
        if (!detail.payer_id || !detail.percentage) {
          return res.status(400).json({ message: "Each payment detail must have payer_id and percentage" })
        }

        if (
          isNaN(Number.parseFloat(detail.percentage)) ||
          Number.parseFloat(detail.percentage) < 0 ||
          Number.parseFloat(detail.percentage) > 100
        ) {
          return res.status(400).json({ message: "Each percentage must be between 0 and 100" })
        }
      }
    }

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if payer exists
    const payerResult = await housePool.query("SELECT * FROM payers WHERE id = $1", [payer_id])

    if (payerResult.rows.length === 0) {
      return res.status(404).json({ message: "Payer not found" })
    }

    // Begin transaction
    const client = await housePool.connect()

    try {
      await client.query("BEGIN")

      // Create payment
      const paymentResult = await client.query(
        "INSERT INTO payment (payer_id, percentage) VALUES ($1, $2) RETURNING *",
        [payer_id, percentage],
      )

      const payment = paymentResult.rows[0]

      // If details are provided, create payment details
      if (details && Array.isArray(details) && details.length > 0) {
        for (const detail of details) {
          await client.query("INSERT INTO payment_details (payment_id, payer_id, percentage) VALUES ($1, $2, $3)", [
            payment.id,
            detail.payer_id,
            detail.percentage,
          ])
        }
      }

      await client.query("COMMIT")

      // Get the created payment with details
      const result = await housePool.query(
        `
        SELECT p.*, py.name as payer_name
        FROM payment p
        JOIN payers py ON p.payer_id = py.id
        WHERE p.id = $1
      `,
        [payment.id],
      )

      // Get payment details
      const detailsResult = await housePool.query(
        `
        SELECT pd.*, py.name as payer_name
        FROM payment_details pd
        JOIN payers py ON pd.payer_id = py.id
        WHERE pd.payment_id = $1
        ORDER BY pd.id
      `,
        [payment.id],
      )

      res.status(201).json({
        ...result.rows[0],
        details: detailsResult.rows,
      })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error creating payment:", error)
    res.status(500).json({
      message: "Error creating payment",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params
    const { payer_id, percentage, details } = req.body

    if (!payer_id && percentage === undefined && !details) {
      return res.status(400).json({ message: "At least one field to update is required" })
    }

    // Validate percentage if provided
    if (percentage !== undefined) {
      if (
        isNaN(Number.parseFloat(percentage)) ||
        Number.parseFloat(percentage) < 0 ||
        Number.parseFloat(percentage) > 100
      ) {
        return res.status(400).json({ message: "Percentage must be between 0 and 100" })
      }
    }

    // If details are provided, validate them
    if (details && Array.isArray(details)) {
      // Check if details percentages sum to 100
      const totalPercentage = details.reduce((sum, detail) => sum + Number.parseFloat(detail.percentage), 0)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        // Allow small floating point errors
        return res.status(400).json({
          message: "Payment details percentages must sum to 100%",
          total: totalPercentage,
        })
      }

      // Check if all payers exist
      for (const detail of details) {
        if (!detail.payer_id || !detail.percentage) {
          return res.status(400).json({ message: "Each payment detail must have payer_id and percentage" })
        }

        if (
          isNaN(Number.parseFloat(detail.percentage)) ||
          Number.parseFloat(detail.percentage) < 0 ||
          Number.parseFloat(detail.percentage) > 100
        ) {
          return res.status(400).json({ message: "Each percentage must be between 0 and 100" })
        }
      }
    }

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if payment exists
    const paymentResult = await housePool.query("SELECT * FROM payment WHERE id = $1", [id])

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" })
    }

    // If payer_id is provided, check if it exists
    if (payer_id) {
      const payerResult = await housePool.query("SELECT * FROM payers WHERE id = $1", [payer_id])

      if (payerResult.rows.length === 0) {
        return res.status(404).json({ message: "Payer not found" })
      }
    }

    // Begin transaction
    const client = await housePool.connect()

    try {
      await client.query("BEGIN")

      // Update payment
      if (payer_id || percentage !== undefined) {
        const updates: string[] = []
        const values: any[] = []
        let paramIndex = 1

        if (payer_id !== undefined) {
          updates.push(`payer_id = $${paramIndex++}`)
          values.push(payer_id)
        }

        if (percentage !== undefined) {
          updates.push(`percentage = $${paramIndex++}`)
          values.push(percentage)
        }

        values.push(id)

        await client.query(`UPDATE payment SET ${updates.join(", ")} WHERE id = $${paramIndex}`, values)
      }

      // If details are provided, update payment details
      if (details && Array.isArray(details)) {
        // Delete existing details
        await client.query("DELETE FROM payment_details WHERE payment_id = $1", [id])

        // Create new details
        for (const detail of details) {
          await client.query("INSERT INTO payment_details (payment_id, payer_id, percentage) VALUES ($1, $2, $3)", [
            id,
            detail.payer_id,
            detail.percentage,
          ])
        }
      }

      await client.query("COMMIT")

      // Get the updated payment with details
      const result = await housePool.query(
        `
        SELECT p.*, py.name as payer_name
        FROM payment p
        JOIN payers py ON p.payer_id = py.id
        WHERE p.id = $1
      `,
        [id],
      )

      // Get payment details
      const detailsResult = await housePool.query(
        `
        SELECT pd.*, py.name as payer_name
        FROM payment_details pd
        JOIN payers py ON pd.payer_id = py.id
        WHERE pd.payment_id = $1
        ORDER BY pd.id
      `,
        [id],
      )

      res.json({
        ...result.rows[0],
        details: detailsResult.rows,
      })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error updating payment:", error)
    res.status(500).json({
      message: "Error updating payment",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const remove = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if payment exists
    const paymentResult = await housePool.query("SELECT * FROM payment WHERE id = $1", [id])

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" })
    }

    // Check if payment is in use in finance_entries
    const entriesResult = await housePool.query("SELECT COUNT(*) FROM finance_entries WHERE payment_id = $1", [id])

    if (Number.parseInt(entriesResult.rows[0].count) > 0) {
      return res.status(400).json({
        message: "Cannot delete payment because it is in use",
        entries: Number.parseInt(entriesResult.rows[0].count),
      })
    }

    // Begin transaction
    const client = await housePool.connect()

    try {
      await client.query("BEGIN")

      // Delete payment details
      await client.query("DELETE FROM payment_details WHERE payment_id = $1", [id])

      // Delete payment
      await client.query("DELETE FROM payment WHERE id = $1", [id])

      await client.query("COMMIT")

      res.status(204).send()
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error deleting payment:", error)
    res.status(500).json({
      message: "Error deleting payment",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

