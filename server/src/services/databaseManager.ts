import { Pool } from "pg"
import { userPool, housePoolConfig } from "../config/database"

class DatabaseManager {
  private static instance: DatabaseManager
  private housePools: Map<string, Pool> = new Map()

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  async getUserPool(): Promise<Pool> {
    return userPool
  }

  async getHousePool(houseId: string): Promise<Pool> {
    if (!this.housePools.has(houseId)) {
      const pool = new Pool({
        ...housePoolConfig,
        database: houseId,
      })
      this.housePools.set(houseId, pool)
    }
    return this.housePools.get(houseId)!
  }

  async createHouseDatabase(houseId: string): Promise<void> {
    const adminPool = new Pool({
      ...housePoolConfig,
      database: "postgres",
    })

    try {
      // Drop existing connections to the database if it exists
      await adminPool.query(
        `
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = $1
      `,
        [houseId],
      )

      // Create new database using the template
      await adminPool.query(`CREATE DATABASE "${houseId}" WITH TEMPLATE house_template`)

      console.log(`Database "${houseId}" created successfully`)
    } catch (error) {
      console.error("Error creating house database:", error)
      try {
        await adminPool.query(`DROP DATABASE IF EXISTS "${houseId}"`)
      } catch (cleanupError) {
        console.error("Error cleaning up failed database:", cleanupError)
      }
      throw error
    } finally {
      await adminPool.end()
    }
  }

  async closeAllConnections(): Promise<void> {
    for (const [houseId, pool] of this.housePools.entries()) {
      await pool.end()
      this.housePools.delete(houseId)
    }
  }
}

export default DatabaseManager

