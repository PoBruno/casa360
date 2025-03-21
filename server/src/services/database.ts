import { userPool } from "../config/database"
import type { Request, Response } from "express"
import DatabaseManager from "../services/databaseManager"

export const query = (text: string, params?: any[]) => {
  return userPool.query(text, params)
}

export const getAllUsers = async () => {
  const res = await query("SELECT * FROM users")
  return res.rows
}

export const getUserById = async (id: number) => {
  const res = await query("SELECT * FROM users WHERE id = $1", [id])
  return res.rows[0]
}

interface UserInput {
  username: string
  email: string
  password: string
}

export const createUser = async ({ username, email, password }: UserInput) => {
  const result = await query("INSERT INTO Users (username, email, password) VALUES ($1, $2, $3) RETURNING *", [
    username,
    email,
    password,
  ])
  return result.rows[0]
}

export const updateUser = async (id: number, name: string, email: string) => {
  const res = await query("UPDATE Users SET name = $1, email = $2 WHERE id = $3 RETURNING *", [name, email, id])
  return res.rows[0]
}

export const deleteUser = async (id: number) => {
  await query("DELETE FROM Users WHERE id = $1", [id])
}

export const getAllFinanceRecords = async () => {
  const res = await query("SELECT * FROM Finance_Entries")
  return res.rows
}

export const createFinanceRecord = async (
  userId: number,
  financeCcId: number,
  financeCategoryId: number,
  financePayerId: number,
  startDate: Date,
  paymentDay: number,
  description: string,
  installmentsCount: number,
  isRecurring: boolean,
) => {
  const res = await query(
    "INSERT INTO Finance_Entries (user_id, finance_cc_id, finance_category_id, finance_payer_id, start_date, payment_day, description, installments_count, is_recurring) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
    [
      userId,
      financeCcId,
      financeCategoryId,
      financePayerId,
      startDate,
      paymentDay,
      description,
      installmentsCount,
      isRecurring,
    ],
  )
  return res.rows[0]
}

export const authenticateUser = async (email: string, password: string) => {
  const result = await query("SELECT * FROM users WHERE email = $1 AND password = crypt($2, password)", [
    email,
    password,
  ])
  return result.rows[0]
}

export const getUserByEmail = async (email: string) => {
  const result = await query("SELECT * FROM Users WHERE email = $1", [email])
  return result.rows[0]
}

export const getFinanceData = async (req: Request, res: Response) => {
  try {
    const { houseId } = req.params
    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(houseId)

    const result = await housePool.query("SELECT * FROM Finance_Entries")
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: "Error fetching finance data" })
  }
}

// Additional functions for finance records can be added here (update, delete, etc.)

