import { Pool } from 'pg';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private userPool: Pool;
  private housePools: Map<string, Pool>;

  private constructor() {
    this.userPool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '5432'),
    });

    this.housePools = new Map();
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
        database: `house_${houseId}`,
        port: parseInt(process.env.DATA_CASA_PORT || '5432'),
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
      database: 'postgres',
      port: parseInt(process.env.DATA_CASA_PORT || '5432'),
    });

    try {
      await adminPool.query(`CREATE DATABASE house_${houseId}`);
      const newPool = await this.getHousePool(houseId);
      
      // Execute creation script
      const sqlPath = path.join(__dirname, '../../db/data-casa/01-create-tables.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await newPool.query(sql);
    } finally {
      await adminPool.end();
    }
  }
}

export default DatabaseManager;