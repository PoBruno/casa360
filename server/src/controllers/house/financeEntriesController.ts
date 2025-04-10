import type { Request, Response } from "express"
import DatabaseManager from "../../services/databaseManager"

export const getAll = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const { type, category_id, currency_id, user_id, start_date, end_date, limit = 50, offset = 0 } = req.query

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Build query with filters
    let query = `
      SELECT fe.*, 
             c.name as category_name,
             cc.name as cost_center_name,
             curr.code as currency_code,
             curr.symbol as currency_symbol,
             u.username as user_username,
             p.id as payment_id,
             f.name as frequency_name,
             COUNT(t.id) as tasks_count
      FROM finance_entries fe
      JOIN category c ON fe.category_id = c.id
      JOIN cost_center cc ON c.cost_center_id = cc.id
      JOIN currency curr ON fe.currency_id = curr.id
      JOIN users u ON fe.user_id = u.id
      JOIN payment p ON fe.payment_id = p.id
      LEFT JOIN frequency f ON fe.frequency_id = f.id
      LEFT JOIN tasks t ON t.entry_type = 'Finance_Entries' AND t.entry_id = fe.id
    `

    const whereConditions: string[] = []
    const queryParams: any[] = []
    let paramIndex = 1

    if (type !== undefined) {
      whereConditions.push(`fe.type = $${paramIndex++}`)
      queryParams.push(type === "true" || type === "1")
    }

    if (category_id) {
      whereConditions.push(`fe.category_id = $${paramIndex++}`)
      queryParams.push(category_id)
    }

    if (currency_id) {
      whereConditions.push(`fe.currency_id = $${paramIndex++}`)
      queryParams.push(currency_id)
    }

    if (user_id) {
      whereConditions.push(`fe.user_id = $${paramIndex++}`)
      queryParams.push(user_id)
    }

    if (start_date) {
      whereConditions.push(`fe.start_date >= $${paramIndex++}`)
      queryParams.push(start_date)
    }

    if (end_date) {
      whereConditions.push(`fe.end_date <= $${paramIndex++}`)
      queryParams.push(end_date)
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`
    }

    query += ` GROUP BY fe.id, c.name, cc.name, curr.code, curr.symbol, u.username, p.id, f.name`
    query += ` ORDER BY fe.start_date DESC`
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    queryParams.push(limit, offset)

    const result = await housePool.query(query, queryParams)

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) FROM finance_entries fe
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
    console.error("Error fetching finance entries:", error)
    res.status(500).json({
      message: "Error fetching finance entries",
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
      SELECT fe.*, 
             c.name as category_name,
             cc.name as cost_center_name,
             curr.code as currency_code,
             curr.symbol as currency_symbol,
             u.username as user_username,
             p.id as payment_id,
             f.name as frequency_name
      FROM finance_entries fe
      JOIN category c ON fe.category_id = c.id
      JOIN cost_center cc ON c.cost_center_id = cc.id
      JOIN currency curr ON fe.currency_id = curr.id
      JOIN users u ON fe.user_id = u.id
      JOIN payment p ON fe.payment_id = p.id
      LEFT JOIN frequency f ON fe.frequency_id = f.id
      WHERE fe.id = $1
    `,
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Finance entry not found" })
    }

    // Get tasks for this entry
    const tasksResult = await housePool.query(
      `
      SELECT t.id, t.due_date, t.amount, t.description, t.status, t.document_id
      FROM tasks t
      WHERE t.entry_type = 'Finance_Entries' AND t.entry_id = $1
      ORDER BY t.due_date
    `,
      [id],
    )

    // Get payment details
    const paymentResult = await housePool.query(
      `
      SELECT p.*, py.name as payer_name
      FROM payment p
      JOIN payers py ON p.payer_id = py.id
      WHERE p.id = $1
    `,
      [result.rows[0].payment_id],
    )

    const paymentDetailsResult = await housePool.query(
      `
      SELECT pd.*, py.name as payer_name
      FROM payment_details pd
      JOIN payers py ON pd.payer_id = py.id
      WHERE pd.payment_id = $1
    `,
      [result.rows[0].payment_id],
    )

    res.json({
      ...result.rows[0],
      tasks: tasksResult.rows,
      payment: {
        ...paymentResult.rows[0],
        details: paymentDetailsResult.rows,
      },
    })
  } catch (error) {
    console.error("Error fetching finance entry:", error)
    res.status(500).json({
      message: "Error fetching finance entry",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const create = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params;
    const { 
      user_id: userUuid,  // This comes as UUID from data-user
      category_id, 
      currency_id,
      amount,
      frequency_id,
      start_date,
      end_date,
      description,
      type,
      payment_id,
    } = req.body;
    
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    
    // First check if user exists in house database
    let userResult = await housePool.query(
      "SELECT * FROM users WHERE data_user_uuid = $1", 
      [userUuid]
    );
    
    // If not found, fetch from data-user and create in house database
    if (userResult.rows.length === 0) {
      const userPool = await dbManager.getUserPool();
      const dataUserResult = await userPool.query(
        "SELECT username, email FROM users WHERE id = $1",
        [userUuid]
      );
      
      if (dataUserResult.rows.length === 0) {
        return res.status(404).json({ message: "User not found in data-user database" });
      }
      
      // Create user in house database
      userResult = await housePool.query(
        "INSERT INTO users (username, email, data_user_uuid) VALUES ($1, $2, $3) RETURNING id",
        [dataUserResult.rows[0].username, dataUserResult.rows[0].email, userUuid]
      );
    }
    
    const houseUserId = userResult.rows[0].id;
    
    // Now use houseUserId for the finance entry
    // Validate required fields
    if (!houseUserId || !category_id || !currency_id || !amount || !start_date || !payment_id) {
      return res.status(400).json({
        message: "Missing required fields",
        required: "user_id, category_id, currency_id, amount, start_date, payment_id",
      })
    }

    // Validate amount
    if (isNaN(Number.parseFloat(amount)) || Number.parseFloat(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" })
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

    // Check if payment exists
    const paymentResult = await housePool.query("SELECT * FROM payment WHERE id = $1", [payment_id])
    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" })
    }

    // Check if frequency exists if provided
    if (frequency_id) {
      const frequencyResult = await housePool.query("SELECT * FROM frequency WHERE id = $1", [frequency_id])
      if (frequencyResult.rows.length === 0) {
        return res.status(404).json({ message: "Frequency not found" })
      }
    }

    // Create finance entry
    const result = await housePool.query(
      `
      INSERT INTO finance_entries (
        user_id, category_id, currency_id, amount, frequency_id, start_date, end_date, description, type, payment_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
      [
        houseUserId,
        category_id,
        currency_id,
        amount,
        frequency_id,
        start_date,
        end_date,
        description,
        type === true || type === "true" || type === 1 || type === "1",
        payment_id,
      ],
    )

    // Get the created entry with related data
    const entryResult = await housePool.query(
      `
      SELECT fe.*, 
             c.name as category_name,
             cc.name as cost_center_name,
             curr.code as currency_code,
             curr.symbol as currency_symbol,
             u.username as user_username,
             p.id as payment_id,
             f.name as frequency_name
      FROM finance_entries fe
      JOIN category c ON fe.category_id = c.id
      JOIN cost_center cc ON c.cost_center_id = cc.id
      JOIN currency curr ON fe.currency_id = curr.id
      JOIN users u ON fe.user_id = u.id
      JOIN payment p ON fe.payment_id = p.id
      LEFT JOIN frequency f ON fe.frequency_id = f.id
      WHERE fe.id = $1
    `,
      [result.rows[0].id],
    )

    res.status(201).json(entryResult.rows[0])
  } catch (error) {
    console.error("Error creating finance entry:", error)
    res.status(500).json({
      message: "Error creating finance entry",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params
    const { category_id, currency_id, amount, frequency_id, start_date, end_date, description, payment_id } = req.body

    // Validate amount if provided
    if (amount !== undefined && (isNaN(Number.parseFloat(amount)) || Number.parseFloat(amount) <= 0)) {
      return res.status(400).json({ message: "Amount must be a positive number" })
    }

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if finance entry exists
    const entryResult = await housePool.query("SELECT * FROM finance_entries WHERE id = $1", [id])
    if (entryResult.rows.length === 0) {
      return res.status(404).json({ message: "Finance entry not found" })
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

    // Check if payment exists if provided
    if (payment_id) {
      const paymentResult = await housePool.query("SELECT * FROM payment WHERE id = $1", [payment_id])
      if (paymentResult.rows.length === 0) {
        return res.status(404).json({ message: "Payment not found" })
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

    if (payment_id !== undefined) {
      updates.push(`payment_id = $${paramIndex++}`)
      values.push(payment_id)
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update provided" })
    }

    values.push(id)

    // Update finance entry
    await housePool.query(`UPDATE finance_entries SET ${updates.join(", ")} WHERE id = $${paramIndex}`, values)

    // Get the updated entry with related data
    const updatedEntryResult = await housePool.query(
      `
      SELECT fe.*, 
             c.name as category_name,
             cc.name as cost_center_name,
             curr.code as currency_code,
             curr.symbol as currency_symbol,
             u.username as user_username,
             p.id as payment_id,
             f.name as frequency_name
      FROM finance_entries fe
      JOIN category c ON fe.category_id = c.id
      JOIN cost_center cc ON c.cost_center_id = cc.id
      JOIN currency curr ON fe.currency_id = curr.id
      JOIN users u ON fe.user_id = u.id
      JOIN payment p ON fe.payment_id = p.id
      LEFT JOIN frequency f ON fe.frequency_id = f.id
      WHERE fe.id = $1
    `,
      [id],
    )

    res.json(updatedEntryResult.rows[0])
  } catch (error) {
    console.error("Error updating finance entry:", error)
    res.status(500).json({
      message: "Error updating finance entry",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const remove = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if finance entry exists
    const entryResult = await housePool.query("SELECT * FROM finance_entries WHERE id = $1", [id])
    if (entryResult.rows.length === 0) {
      return res.status(404).json({ message: "Finance entry not found" })
    }

    // Check if there are tasks for this entry
    const tasksResult = await housePool.query("SELECT COUNT(*) FROM tasks WHERE entry_type = $1 AND entry_id = $2", [
      "Finance_Entries",
      id,
    ])

    // Check if there are transactions for this entry
    const transactionsResult = await housePool.query("SELECT COUNT(*) FROM transactions WHERE finance_entry_id = $1", [
      id,
    ])

    const tasksCount = Number.parseInt(tasksResult.rows[0].count)
    const transactionsCount = Number.parseInt(transactionsResult.rows[0].count)

    if (tasksCount > 0 || transactionsCount > 0) {
      return res.status(400).json({
        message: "Cannot delete finance entry because it has associated tasks or transactions",
        tasks: tasksCount,
        transactions: transactionsCount,
      })
    }

    // Delete finance entry
    await housePool.query("DELETE FROM finance_entries WHERE id = $1", [id])

    res.status(204).send()
  } catch (error) {
    console.error("Error deleting finance entry:", error)
    res.status(500).json({
      message: "Error deleting finance entry",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

