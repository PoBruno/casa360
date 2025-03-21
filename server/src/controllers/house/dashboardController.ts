import type { Request, Response } from "express"
import DatabaseManager from "../../services/databaseManager"

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" })
    }

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Get financial summary
    const financialSummary = await getFinancialSummary(housePool)

    // Get upcoming tasks
    const upcomingTasks = await getUpcomingTasks(housePool)

    // Get recent transactions
    const recentTransactions = await getRecentTransactions(housePool)

    // Get wallet balances
    const walletBalances = await getWalletBalances(housePool)

    res.json({
      financialSummary,
      upcomingTasks,
      recentTransactions,
      walletBalances,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    res.status(500).json({
      message: "Error fetching dashboard data",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

async function getFinancialSummary(housePool: any) {
  // Get total income, expenses, and balance for current month
  const currentMonthStart = new Date()
  currentMonthStart.setDate(1)
  currentMonthStart.setHours(0, 0, 0, 0)

  const currentMonthEnd = new Date()
  currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1)
  currentMonthEnd.setDate(0)
  currentMonthEnd.setHours(23, 59, 59, 999)

  const result = await housePool.query(
    `
    SELECT
      SUM(CASE WHEN t.entry_type = 'Finance_Entries' AND fe.type = false THEN t.amount ELSE 0 END) as income,
      SUM(CASE WHEN t.entry_type = 'Finance_Entries' AND fe.type = true THEN t.amount ELSE 0 END) as expenses,
      COUNT(CASE WHEN t.status = false AND t.due_date < CURRENT_DATE THEN 1 END) as overdue_tasks,
      COUNT(CASE WHEN t.status = false AND t.due_date >= CURRENT_DATE AND t.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as upcoming_tasks
    FROM tasks t
    LEFT JOIN finance_entries fe ON t.entry_type = 'Finance_Entries' AND t.entry_id = fe.id
    WHERE t.due_date BETWEEN $1 AND $2
  `,
    [currentMonthStart, currentMonthEnd],
  )

  const { income, expenses, overdue_tasks, upcoming_tasks } = result.rows[0]

  return {
    income: Number.parseFloat(income) || 0,
    expenses: Number.parseFloat(expenses) || 0,
    balance: (Number.parseFloat(income) || 0) - (Number.parseFloat(expenses) || 0),
    overdueTasks: Number.parseInt(overdue_tasks) || 0,
    upcomingTasks: Number.parseInt(upcoming_tasks) || 0,
  }
}

async function getUpcomingTasks(housePool: any) {
  // Get upcoming tasks for the next 7 days
  const result = await housePool.query(`
    SELECT t.id, t.entry_type, t.entry_id, t.due_date, t.amount, t.description, t.status,
           CASE 
             WHEN t.entry_type = 'Finance_Entries' THEN fe.type
             ELSE NULL
           END as is_expense,
           c.name as category_name,
           cc.name as cost_center_name,
           curr.symbol as currency_symbol
    FROM tasks t
    LEFT JOIN finance_entries fe ON t.entry_type = 'Finance_Entries' AND t.entry_id = fe.id
    LEFT JOIN task_entries te ON t.entry_type = 'Task_Entries' AND t.entry_id = te.id
    LEFT JOIN category c ON (fe.category_id = c.id) OR (te.category_id = c.id)
    LEFT JOIN cost_center cc ON c.cost_center_id = cc.id
    LEFT JOIN currency curr ON (fe.currency_id = curr.id) OR (te.currency_id = curr.id)
    WHERE t.status = false
      AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    ORDER BY t.due_date ASC
    LIMIT 10
  `)

  return result.rows
}

async function getRecentTransactions(housePool: any) {
  // Get recent transactions
  const result = await housePool.query(`
    SELECT tr.id, tr.transaction_date, tr.amount, tr.description,
           fe.type as is_expense,
           c.name as category_name,
           cc.name as cost_center_name,
           curr.symbol as currency_symbol
    FROM transactions tr
    JOIN finance_entries fe ON tr.finance_entry_id = fe.id
    JOIN category c ON fe.category_id = c.id
    JOIN cost_center cc ON c.cost_center_id = cc.id
    JOIN currency curr ON fe.currency_id = curr.id
    ORDER BY tr.transaction_date DESC
    LIMIT 10
  `)

  return result.rows
}

async function getWalletBalances(housePool: any) {
  // Get latest wallet balance for each user
  const result = await housePool.query(`
    WITH latest_wallet AS (
      SELECT DISTINCT ON (user_id) 
        user_id, balance, updated_at
      FROM wallet
      ORDER BY user_id, updated_at DESC
    )
    SELECT u.id, u.username, lw.balance, lw.updated_at
    FROM latest_wallet lw
    JOIN users u ON lw.user_id = u.id
    ORDER BY lw.balance DESC
  `)

  return result.rows
}

