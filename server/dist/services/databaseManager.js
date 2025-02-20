"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
class DatabaseManager {
    constructor() {
        this.userPool = new pg_1.Pool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '5432'),
        });
        this.housePools = new Map();
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    getUserPool() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userPool;
        });
    }
    getHousePool(houseId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.housePools.has(houseId)) {
                const pool = new pg_1.Pool({
                    host: process.env.DATA_CASA_HOST,
                    user: process.env.DATA_CASA_USER,
                    password: process.env.DATA_CASA_PASSWORD,
                    database: `house_${houseId}`,
                    port: parseInt(process.env.DATA_CASA_PORT || '5432'),
                });
                this.housePools.set(houseId, pool);
            }
            return this.housePools.get(houseId);
        });
    }
    createHouseDatabase(houseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const adminPool = new pg_1.Pool({
                host: process.env.DATA_CASA_HOST,
                user: process.env.DATA_CASA_USER,
                password: process.env.DATA_CASA_PASSWORD,
                database: 'postgres',
                port: parseInt(process.env.DATA_CASA_PORT || '5432'),
            });
            try {
                yield adminPool.query(`CREATE DATABASE house_${houseId}`);
                const newPool = yield this.getHousePool(houseId);
                // Execute creation script
                const sqlPath = path.join(__dirname, '../../db/data-casa/01-create-tables.sql');
                const sql = fs.readFileSync(sqlPath, 'utf8');
                yield newPool.query(sql);
            }
            finally {
                yield adminPool.end();
            }
        });
    }
}
exports.default = DatabaseManager;
