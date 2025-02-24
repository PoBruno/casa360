import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

class DatabaseManager {
  private static instance: DatabaseManager;
  private userPool: Pool;
  private housePools: Map<string, Pool> = new Map();

  private constructor() {
    this.userPool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '5432'),
    });
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async getUserPool(): Promise<Pool> {
    return this.userPool;
  }

  async getHousePool(houseId: string): Promise<Pool> {
    if (!this.housePools.has(houseId)) {
      const pool = new Pool({
        host: process.env.DATA_CASA_HOST,
        user: process.env.DATA_CASA_USER,
        password: process.env.DATA_CASA_PASSWORD,
        database: houseId,
        port: parseInt(process.env.DATA_CASA_PORT || '5433'),
      });
      this.housePools.set(houseId, pool);
    }
    return this.housePools.get(houseId)!;
  }

  async createHouseDatabase(houseId: string): Promise<void> {
    const adminPool = new Pool({
      host: process.env.DATA_CASA_HOST,
      user: process.env.DATA_CASA_USER,
      password: process.env.DATA_CASA_PASSWORD,
      //database: 'postgres',
      port: parseInt(process.env.DATA_CASA_PORT || '5433'),
      //port: 5433,
    });

    try {
      // 1. Criar o banco de dados
      await adminPool.query(`CREATE DATABASE "${houseId}"`);
      
      // 2. Conectar ao novo banco
      const newPool = await this.getHousePool(houseId);
      
      // 3. Ler e executar o script SQL
      const sqlPath = path.join(__dirname, '../../db/data-casa/01-casa-tables.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // 4. Dividir em comandos e executar um por um
      const commands = sql.split(/;\s*$/m).filter(cmd => cmd.trim());

      for (const command of commands) {
        try {
          await newPool.query(command);
        } catch (error) {
          console.error('Error executing SQL command:', command);
          console.error('Error details:', error);
          throw error;
        }
      }

      await newPool.end();
    } catch (error) {
      console.error('Error creating house database:', error);
      // Tentar limpar em caso de erro
      try {
        await adminPool.query(`DROP DATABASE IF EXISTS "${houseId}"`);
      } catch (cleanupError) {
        console.error('Error cleaning up failed database:', cleanupError);
      }
      throw error;
    } finally {
      await adminPool.end();
    }
  }
}

export default DatabaseManager;
