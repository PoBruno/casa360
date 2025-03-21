import { query as userQuery } from "./database"
import { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config()

interface HouseInput {
  user_id: string
  house_name: string
  address?: string
}

export const createHouseEntry = async ({ user_id, house_name }: HouseInput) => {
  const insertResult = await userQuery("INSERT INTO houses (user_id, house_name) VALUES ($1, $2) RETURNING *;", [
    user_id,
    house_name,
  ])
  return insertResult.rows[0]
}

export const createHouseDatabase = async (houseId: string): Promise<void> => {
  // Conectar ao banco 'postgres' para poder criar novos bancos
  const adminPool = new Pool({
    host: process.env.DATA_CASA_HOST || "localhost",
    user: process.env.DATA_CASA_USER,
    password: process.env.DATA_CASA_PASSWORD,
    database: "postgres",
    port: 5433, // Forçar porta 5433
  })

  try {
    // Dropar conexões existentes com o banco se houver
    await adminPool.query(
      `
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = $1
    `,
      [houseId],
    )

    // Criar novo banco usando o template
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

export const executeHouseTablesScript = async (houseId: string): Promise<void> => {
  const newHousePool = new Pool({
    host: process.env.DATA_CASA_HOST,
    user: process.env.DATA_CASA_USER,
    password: process.env.DATA_CASA_PASSWORD,
    database: houseId,
    port: Number.parseInt(process.env.DATA_CASA_PORT || "5432"),
  })

  //try {
  //  const sqlFilePath = path.join(__dirname, '../../db/data-casa/02-casa-insert-test.sql');
  //  const sqlScript = fs.readFileSync(sqlFilePath, { encoding: 'utf8' });
  //  await newHousePool.query(sqlScript);
  //} catch (error) {
  //  console.error('Error executing SQL script:', error);
  //  throw error;
  //} finally {
  //  await newHousePool.end();
  //}
}

export const createHouse = async ({ user_id, house_name }: HouseInput) => {
  const house = await createHouseEntry({ user_id, house_name })
  await createHouseDatabase(house.house_name)
  await executeHouseTablesScript(house.house_name)
  return house
}

export const getHousesByUser = async (userId: string) => {
  const result = await userQuery("SELECT * FROM houses WHERE user_id = $1;", [userId])
  return result.rows
}

