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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class DatabaseManager {
    constructor() {
        this.housePools = new Map();
        this.userPool = new pg_1.Pool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '5432'),
        });
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
                    database: houseId,
                    port: parseInt(process.env.DATA_CASA_PORT || '5433'),
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
                //database: 'postgres',
                port: parseInt(process.env.DATA_CASA_PORT || '5433'),
                //port: 5433,
            });
            try {
                // 1. Criar o banco de dados
                yield adminPool.query(`CREATE DATABASE "${houseId}"`);
                // 2. Conectar ao novo banco
                const newPool = yield this.getHousePool(houseId);
                // 3. Ler e executar o script SQL
                const sqlPath = path_1.default.join(__dirname, '../../db/data-casa/01-casa-tables.sql');
                const sql = fs_1.default.readFileSync(sqlPath, 'utf8');
                // 4. Dividir em comandos e executar um por um
                const commands = sql.split(/;\s*$/m).filter(cmd => cmd.trim());
                for (const command of commands) {
                    try {
                        yield newPool.query(command);
                    }
                    catch (error) {
                        console.error('Error executing SQL command:', command);
                        console.error('Error details:', error);
                        throw error;
                    }
                }
                yield newPool.end();
            }
            catch (error) {
                console.error('Error creating house database:', error);
                // Tentar limpar em caso de erro
                try {
                    yield adminPool.query(`DROP DATABASE IF EXISTS "${houseId}"`);
                }
                catch (cleanupError) {
                    console.error('Error cleaning up failed database:', cleanupError);
                }
                throw error;
            }
            finally {
                yield adminPool.end();
            }
        });
    }
}
exports.default = DatabaseManager;
