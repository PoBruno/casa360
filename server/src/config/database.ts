import { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config()

// Main user database connection
export const userPool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "user",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "data-user",
  port: Number(process.env.DB_PORT || 5432),
})

// Base configuration for house databases
export const housePoolConfig = {
  host: process.env.DATA_CASA_HOST || "localhost",
  user: process.env.DATA_CASA_USER || "user",
  password: process.env.DATA_CASA_PASSWORD || "password",
  port: Number(process.env.DATA_CASA_PORT || 5433),
}

// Function to get a connection to a specific house database
export const getHousePool = (houseId: string): Pool => {
  return new Pool({
    ...housePoolConfig,
    database: houseId,
  })
}

export default {
  userPool,
  getHousePool,
}

