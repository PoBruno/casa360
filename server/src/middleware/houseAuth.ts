import type { Request, Response, NextFunction } from "express"
import DatabaseManager from "../services/databaseManager"

interface CustomRequest extends Request {
  user?: {
    id: string
    email: string
    username?: string
    role?: string
    permissions?: {
      read: boolean
      write: boolean
      delete: boolean
      admin: boolean
    }
  }
}

export const validateHouseAccess = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { house_id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" })
    }

    if (!house_id) {
      return res.status(400).json({ message: "House ID is required" })
    }

    // Get user pool to check permissions
    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Query the house_users table to check permissions
    const result = await userPool.query(
      `
      SELECT hu.role, r.permissions
      FROM house_users hu
      JOIN roles r ON hu.role = r.name
      WHERE hu.house_id = $1 AND hu.user_id = $2
    `,
      [house_id, userId],
    )

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Access denied to this house" })
    }

    // Add role and permissions to the request
    const userRole = result.rows[0].role
    const permissions = result.rows[0].permissions

    if (!req.user) {
      req.user = { id: userId, email: "", role: userRole, permissions }
    } else {
      req.user.role = userRole
      req.user.permissions = permissions
    }

    next()
  } catch (error) {
    console.error("Error validating house access:", error)
    res.status(500).json({ error: "Error validating house access" })
  }
}

export const requirePermission = (permission: "read" | "write" | "delete" | "admin") => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user?.permissions?.[permission]) {
      return res.status(403).json({
        message: "Insufficient permissions",
        required: permission,
      })
    }
    next()
  }
}

