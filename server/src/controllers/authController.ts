import { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import DatabaseManager from "../services/databaseManager"

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d"

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, full_name } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required" })
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Check if user already exists
    const existingUser = await userPool.query("SELECT * FROM users WHERE username = $1 OR email = $2", [
      username,
      email,
    ])

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Username or email already exists" })
    }

    // Insert new user (password will be hashed by the trigger)
    const result = await userPool.query(
      "INSERT INTO users (username, email, password, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name, account_status, created_at",
      [username, email, password, full_name],
    )

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0]
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Error registering user", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    console.log("Login attempt:", req.body)
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Get user by email
    console.log("Querying for user with email:", email)
    const result = await userPool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    )

    console.log("Query result rows:", result.rows.length)
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const user = result.rows[0]
    console.log("Found user:", user.username)

    // Check if account is active
    if (user.account_status !== "active") {
      return res.status(403).json({ message: "Account is not active" })
    }

    // Verify password (using the pg_crypto extension instead of bcrypt directly)
    console.log("Verifying password...")
    const passwordCheck = await userPool.query(
      "SELECT password = crypt($1, password) as password_match FROM users WHERE id = $2",
      [password, user.id]
    )

    if (!passwordCheck.rows[0].password_match) {
      console.log("Password verification failed")
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Update last login time
    await userPool.query("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1", [user.id])

    // Generate JWT token
    console.log("Generating token...")
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    console.log("Token generated successfully")
    
    // Get user's houses
    const housesResult = await userPool.query(
      `SELECT h.id, h.house_name, hu.role
       FROM houses h
       JOIN house_users hu ON h.id = hu.house_id
       WHERE hu.user_id = $1`,
      [user.id]
    )

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        houses: housesResult.rows
      }
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      message: "Error during login",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Get user profile
    const userResult = await userPool.query(
      `
      SELECT id, username, email, full_name, avatar_url, bio, account_status, email_verified, created_at
      FROM users
      WHERE id = $1
    `,
      [userId],
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    // Get user settings
    const settingsResult = await userPool.query(
      `
      SELECT theme, language, notification_preferences, default_house_id
      FROM user_settings
      WHERE user_id = $1
    `,
      [userId],
    )

    // Get user's houses
    const housesResult = await userPool.query(
      `
      SELECT h.id, h.house_name, h.description, h.cover_image_url, hu.role
      FROM houses h
      JOIN house_users hu ON h.id = hu.house_id
      WHERE hu.user_id = $1
    `,
      [userId],
    )

    res.json({
      user: userResult.rows[0],
      settings: settingsResult.rows[0] || {},
      houses: housesResult.rows,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Error fetching profile" })
  }
}

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const { full_name, bio, avatar_url } = req.body

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Update user profile
    const result = await userPool.query(
      `
      UPDATE users
      SET full_name = COALESCE($1, full_name),
          bio = COALESCE($2, bio),
          avatar_url = COALESCE($3, avatar_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, username, email, full_name, avatar_url, bio
    `,
      [full_name, bio, avatar_url, userId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Error updating profile" })
  }
}

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const { theme, language, notification_preferences, default_house_id } = req.body

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Update user settings
    const result = await userPool.query(
      `
      UPDATE user_settings
      SET theme = COALESCE($1, theme),
          language = COALESCE($2, language),
          notification_preferences = COALESCE($3, notification_preferences),
          default_house_id = COALESCE($4, default_house_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $5
      RETURNING *
    `,
      [theme, language, notification_preferences, default_house_id, userId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User settings not found" })
    }

    res.json({
      message: "Settings updated successfully",
      settings: result.rows[0],
    })
  } catch (error) {
    console.error("Update settings error:", error)
    res.status(500).json({ message: "Error updating settings" })
  }
}

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const { current_password, new_password } = req.body

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    if (!current_password || !new_password) {
      return res.status(400).json({ message: "Current password and new password are required" })
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Get current password
    const userResult = await userPool.query("SELECT password FROM users WHERE id = $1", [userId])

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, userResult.rows[0].password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10)

    // Update password
    await userPool.query("UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
      hashedPassword,
      userId,
    ])

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({ message: "Error changing password" })
  }
}

