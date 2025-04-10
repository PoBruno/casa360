import type { Request, Response } from "express"
import DatabaseManager from "../../services/databaseManager"

export const getAll = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const { status, entry_type, due_date_start, due_date_end, limit = 50, offset = 0 } = req.query

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Build query with filters
    let query = `
      SELECT t.*,
             CASE 
               WHEN t.entry_type = 'Finance_Entries' THEN fe.description
               WHEN t.entry_type = 'Task_Entries' THEN te.description
               ELSE NULL
             END as entry_description,
             CASE 
               WHEN t.entry_type = 'Finance_Entries' THEN fe.type
               ELSE NULL
             END as is_expense,
             CASE 
               WHEN t.entry_type = 'Finance_Entries' THEN c_fe.name
               WHEN t.entry_type = 'Task_Entries' THEN c_te.name
               ELSE NULL
             END as category_name,
             CASE 
               WHEN t.entry_type = 'Finance_Entries' THEN cc_fe.name
               WHEN t.entry_type = 'Task_Entries' THEN cc_te.name
               ELSE NULL
             END as cost_center_name,
             CASE 
               WHEN t.entry_type = 'Finance_Entries' THEN curr_fe.symbol
               WHEN t.entry_type = 'Task_Entries' THEN curr_te.symbol
               ELSE NULL
             END as currency_symbol,
             d.file_path as document_path
      FROM tasks t
      LEFT JOIN finance_entries fe ON t.entry_type = 'Finance_Entries' AND t.entry_id = fe.id
      LEFT JOIN task_entries te ON t.entry_type = 'Task_Entries' AND t.entry_id = te.id
      LEFT JOIN category c_fe ON fe.category_id = c_fe.id
      LEFT JOIN category c_te ON te.category_id = c_te.id
      LEFT JOIN cost_center cc_fe ON c_fe.cost_center_id = cc_fe.id
      LEFT JOIN cost_center cc_te ON c_te.cost_center_id = cc_te.id
      LEFT JOIN currency curr_fe ON fe.currency_id = curr_fe.id
      LEFT JOIN currency curr_te ON te.currency_id = curr_te.id
      LEFT JOIN documents d ON t.document_id = d.id
    `

    const whereConditions: string[] = []
    const queryParams: any[] = []
    let paramIndex = 1

    if (status !== undefined) {
      whereConditions.push(`t.status = $${paramIndex++}`)
      queryParams.push(status === "true" || status === "1")
    }

    if (entry_type) {
      whereConditions.push(`t.entry_type = $${paramIndex++}`)
      queryParams.push(entry_type)
    }

    if (due_date_start) {
      whereConditions.push(`t.due_date >= $${paramIndex++}`)
      queryParams.push(due_date_start)
    }

    if (due_date_end) {
      whereConditions.push(`t.due_date <= $${paramIndex++}`)
      queryParams.push(due_date_end)
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`
    }

    query += ` ORDER BY t.due_date ASC`
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    queryParams.push(limit, offset)

    const result = await housePool.query(query, queryParams)

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) FROM tasks t
    `

    if (whereConditions.length > 0) {
      countQuery += ` WHERE ${whereConditions.join(" AND ")}`
    }

    const countResult = await housePool.query(countQuery, queryParams.slice(0, -2))
    const totalCount = Number.parseInt(countResult.rows[0].count)

    res.json({
      tasks: result.rows,
      pagination: {
        total: totalCount,
        limit: Number.parseInt(limit as string),
        offset: Number.parseInt(offset as string),
        hasMore: totalCount > Number.parseInt(offset as string) + Number.parseInt(limit as string),
      },
    })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    res.status(500).json({
      message: "Error fetching tasks",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const getById = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params;

    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(`
      SELECT t.*,
             CASE 
               WHEN t.entry_type = 'Finance_Entries' THEN fe.description
               WHEN t.entry_type = 'Task_Entries' THEN te.description
               ELSE NULL
             END as entry_description,
             CASE 
               WHEN t.entry_type = 'Finance_Entries' THEN fe.type
               ELSE NULL
             END as is_expense,
             CASE 
               WHEN t.entry_type = 'Finance_Entries' THEN c_fe.name
               WHEN t.entry_type = 'Task_Entries' THEN c_te.name
               ELSE NULL
             END as category_name,
             CASE 
               WHEN t.entry_type = 'Finance_Entries' THEN cc_fe.name
               WHEN t.entry_type = 'Task_Entries' THEN cc_te.name
               ELSE NULL
             END as cost_center_name,
             CASE 
               WHEN t.entry_type = 'Finance_Entries' THEN curr_fe.symbol
               WHEN t.entry_type = 'Task_Entries' THEN curr_te.symbol
               ELSE NULL
             END as currency_symbol,
             d.file_path as document_path
      FROM tasks t
      LEFT JOIN finance_entries fe ON t.entry_type = 'Finance_Entries' AND t.entry_id = fe.id
      LEFT JOIN task_entries te ON t.entry_type = 'Task_Entries' AND t.entry_id = te.id
      LEFT JOIN category c_fe ON fe.category_id = c_fe.id
      LEFT JOIN category c_te ON te.category_id = c_te.id
      LEFT JOIN cost_center cc_fe ON c_fe.cost_center_id = cc_fe.id
      LEFT JOIN cost_center cc_te ON c_te.cost_center_id = cc_te.id
      LEFT JOIN currency curr_fe ON fe.currency_id = curr_fe.id
      LEFT JOIN currency curr_te ON te.currency_id = curr_te.id
      LEFT JOIN documents d ON t.document_id = d.id
      WHERE t.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching task by id:", error)
    res.status(500).json({
      message: "Error fetching task by id",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

