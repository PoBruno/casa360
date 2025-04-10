import type { Request, Response } from "express"
import DatabaseManager from "../../services/databaseManager"

export const getAll = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const { category_id, currency_id, user_id, start_date, end_date, limit = 50, offset = 0 } = req.query

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Build query with filters
    let query = `
      SELECT te.*, 
             c.name as category_name,
             cc.name as cost_center_name,
             curr.code as currency_code,
             curr.symbol as currency_symbol,
             u.username as user_username,
             f.name as frequency_name,
             COUNT(t.id) as tasks_count
      FROM task_entries te
      JOIN category c ON te.category_id = c.id
      JOIN cost_center cc ON c.cost_center_id = cc.id
      JOIN currency curr ON te.currency_id = curr.id
      JOIN users u ON te.user_id = u.id
      LEFT JOIN frequency f ON te.frequency_id = f.id
      LEFT JOIN tasks t ON t.entry_type = 'Task_Entries' AND t.entry_id = te.id
    `

    const whereConditions: string[] = []
    const queryParams: any[] = []
    let paramIndex = 1

    if (category_id) {
      whereConditions.push(`te.category_id = $${paramIndex++}`)
      queryParams.push(category_id)
    }

    if (currency_id) {
      whereConditions.push(`te.currency_id = $${paramIndex++}`)
      queryParams.push(currency_id)
    }

    if (user_id) {
      whereConditions.push(`te.user_id = $${paramIndex++}`)
      queryParams.push(user_id)
    }

    if (start_date) {
      whereConditions.push(`te.start_date >= $${paramIndex++}`)
      queryParams.push(start_date)
    }

    if (end_date) {
      whereConditions.push(`te.end_date <= $${paramIndex++}`)
      queryParams.push(end_date)
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`
    }

    query += ` GROUP BY te.id, c.name, cc.name, curr.code, curr.symbol, u.username, f.name`
    query += ` ORDER BY te.start_date DESC`
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    queryParams.push(limit, offset)

    const result = await housePool.query(query, queryParams)

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) FROM task_entries te
    `

    if (whereConditions.length > 0) {
      countQuery += ` WHERE ${whereConditions.join(" AND ")}`
    }

    const countResult = await housePool.query(countQuery, queryParams.slice(0, -2))
    const totalCount = Number.parseInt(countResult.rows[0].count)

    res.json({
      entries: result.rows,
      pagination: {
        total: totalCount,
        limit: Number.parseInt(limit as string),
        offset: Number.parseInt(offset as string),
        hasMore: totalCount > Number.parseInt(offset as string) + Number.parseInt(limit as string),
      },
    })
  } catch (error) {
    console.error("Error fetching task entries:", error)
    res.status(500).json({
      message: "Error fetching task entries",
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
      SELECT te.*, 
             c.name as category_name,
             cc.name as cost_center_name,
             curr.code as currency_code,
             curr.symbol as currency_symbol,
             u.username as user_username,
             f.name as frequency_name
      FROM task_entries te
      JOIN category c ON te.category_id = c.id
      JOIN cost_center cc ON c.cost_center_id = cc.id
      JOIN currency curr ON te.currency_id = curr.id
      JOIN users u ON te.user_id = u.id
      LEFT JOIN frequency f ON te.frequency_id = f.id
      WHERE te.id = $1
    `,
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task entry not found" })
    }

    // Get tasks for this entry
    const tasksResult = await housePool.query(
      `
      SELECT t.id, t.due_date, t.amount, t.description, t.status, t.document_id
      FROM tasks t
      WHERE t.entry_type = 'Task_Entries' AND t.entry_id = $1
      ORDER BY t.due_date
    `,
      [id],
    )

    res.json({
      ...result.rows[0],
      tasks: tasksResult.rows,
    })
  } catch (error) {
    console.error("Error fetching task entry:", error)
    res.status(500).json({
      message: "Error fetching task entry",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const create = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const { user_id, category_id, currency_id, amount, frequency_id, start_date, end_date, description } = req.body

    // Validate required fields
    if (!user_id || !category_id || !currency_id || !amount || !start_date) {
      return res.status(400).json({
        message: "Missing required fields",
        required: "user_id, category_id, currency_id, amount, start_date",
      })
    }

    // Validate amount
    if (isNaN(Number.parseFloat(amount)) || Number.parseFloat(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" })
    }

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if user exists
    const userResult = await housePool.query("SELECT * FROM users WHERE id = $1", [user_id])
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if category exists
    const categoryResult = await housePool.query("SELECT * FROM category WHERE id = $1", [category_id])
    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" })
    }

    // Check if currency exists
    const currencyResult = await housePool.query("SELECT * FROM currency WHERE id = $1", [currency_id])
    if (currencyResult.rows.length === 0) {
      return res.status(404).json({ message: "Currency not found" })
    }

    // Check if frequency exists if provided
    if (frequency_id) {
      const frequencyResult = await housePool.query("SELECT * FROM frequency WHERE id = $1", [frequency_id])
      if (frequencyResult.rows.length === 0) {
        return res.status(404).json({ message: "Frequency not found" })
      }
    }

    // Create task entry
    const result = await housePool.query(
      `
      INSERT INTO task_entries (
        user_id, category_id, currency_id, amount, frequency_id, start_date, end_date, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [user_id, category_id, currency_id, amount, frequency_id, start_date, end_date, description],
    )

    // Get the created entry with related data
    const entryResult = await housePool.query(
      `
      SELECT te.*, 
             c.name as category_name,
             cc.name as cost_center_name,
             curr.code as currency_code,
             curr.symbol as currency_symbol,
             u.username as user_username,
             f.name as frequency_name
      FROM task_entries te
      JOIN category c ON te.category_id = c.id
      JOIN cost_center cc ON c.cost_center_id = cc.id
      JOIN currency curr ON te.currency_id = curr.id
      JOIN users u ON te.user_id = u.id
      LEFT JOIN frequency f ON te.frequency_id = f.id
      WHERE te.id = $1
    `,
      [result.rows[0].id],
    )

    res.status(201).json(entryResult.rows[0])
  } catch (error) {
    console.error("Error creating task entry:", error)
    res.status(500).json({
      message: "Error creating task entry",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params
    const { category_id, currency_id, amount, frequency_id, start_date, end_date, description } = req.body

    // Validate amount if provided
    if (amount !== undefined && (isNaN(Number.parseFloat(amount)) || Number.parseFloat(amount) <= 0)) {
      return res.status(400).json({ message: "Amount must be a positive number" })
    }

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if task entry exists
    const entryResult = await housePool.query("SELECT * FROM task_entries WHERE id = $1", [id])
    if (entryResult.rows.length === 0) {
      return res.status(404).json({ message: "Task entry not found" })
    }

    // Check if category exists if provided
    if (category_id) {
      const categoryResult = await housePool.query("SELECT * FROM category WHERE id = $1", [category_id])
      if (categoryResult.rows.length === 0) {
        return res.status(404).json({ message: "Category not found" })
      }
    }

    // Check if currency exists if provided
    if (currency_id) {
      const currencyResult = await housePool.query("SELECT * FROM currency WHERE id = $1", [currency_id])
      if (currencyResult.rows.length === 0) {
        return res.status(404).json({ message: "Currency not found" })
      }
    }

    // Check if frequency exists if provided
    if (frequency_id) {
      const frequencyResult = await housePool.query("SELECT * FROM frequency WHERE id = $1", [frequency_id])
      if (frequencyResult.rows.length === 0) {
        return res.status(404).json({ message: "Frequency not found" })
      }
    }

    // Build update query
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (category_id !== undefined) {
      updates.push(`category_id = $${paramIndex++}`)
      values.push(category_id)
    }

    if (currency_id !== undefined) {
      updates.push(`currency_id = $${paramIndex++}`)
      values.push(currency_id)
    }

    if (amount !== undefined) {
      updates.push(`amount = $${paramIndex++}`)
      values.push(amount)
    }

    if (frequency_id !== undefined) {
      updates.push(`frequency_id = $${paramIndex++}`)
      values.push(frequency_id)
    }

    if (start_date !== undefined) {
      updates.push(`start_date = $${paramIndex++}`)
      values.push(start_date)
    }

    if (end_date !== undefined) {
      updates.push(`end_date = $${paramIndex++}`)
      values.push(end_date)
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(description)
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update provided" })
    }

    values.push(id)

    // Update task entry
    await housePool.query(`UPDATE task_entries SET ${updates.join(", ")} WHERE id = $${paramIndex}`, values)

    // Get the updated entry with related data
    const updatedEntryResult = await housePool.query(
      `
      SELECT te.*, 
             c.name as category_name,
             cc.name as cost_center_name,
             curr.code as currency_code,
             curr.symbol as currency_symbol,
             u.username as user_username,
             f.name as frequency_name
      FROM task_entries te
      JOIN category c ON te.category_id = c.id
      JOIN cost_center cc ON c.cost_center_id = cc.id
      JOIN currency curr ON te.currency_id = curr.id
      JOIN users u ON te.user_id = u.id
      LEFT JOIN frequency f ON te.frequency_id = f.id
      WHERE te.id = $1
    `,
      [id],
    )

    res.json(updatedEntryResult.rows[0])
  } catch (error) {
    console.error("Error updating task entry:", error)
    res.status(500).json({
      message: "Error updating task entry",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const remove = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if task entry exists
    const entryResult = await housePool.query("SELECT * FROM task_entries WHERE id = $1", [id])
    if (entryResult.rows.length === 0) {
      return res.status(404).json({ message: "Task entry not found" })
    }

    // Check if there are tasks for this entry
    const tasksResult = await housePool.query("SELECT COUNT(*) FROM tasks WHERE entry_type = $1 AND entry_id = $2", [
      "Task_Entries",
      id,
    ])

    const tasksCount = Number.parseInt(tasksResult.rows[0].count)

    if (tasksCount > 0) {
      return res.status(400).json({
        message: "Cannot delete task entry because it has associated tasks",
        tasks: tasksCount,
      })
    }

    // Delete task entry
    await housePool.query("DELETE FROM task_entries WHERE id = $1", [id])

    res.status(204).send()
  } catch (error) {
    console.error("Error deleting task entry:", error)
    res.status(500).json({
      message: "Error deleting task entry",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

