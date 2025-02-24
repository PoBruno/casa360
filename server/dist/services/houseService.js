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
exports.getHousesByUser = exports.createHouse = exports.executeHouseTablesScript = exports.createHouseDatabase = exports.createHouseEntry = void 0;
const database_1 = require("./database");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const createHouseEntry = ({ user_id, house_name }) => __awaiter(void 0, void 0, void 0, function* () {
    const insertResult = yield (0, database_1.query)('INSERT INTO houses (user_id, house_name) VALUES ($1, $2) RETURNING *;', [user_id, house_name]);
    return insertResult.rows[0];
});
exports.createHouseEntry = createHouseEntry;
const createHouseDatabase = (houseId) => __awaiter(void 0, void 0, void 0, function* () {
    // Conectar ao banco 'postgres' para poder criar novos bancos
    const adminPool = new pg_1.Pool({
        host: process.env.DATA_CASA_HOST || 'localhost',
        user: process.env.DATA_CASA_USER,
        password: process.env.DATA_CASA_PASSWORD,
        database: 'postgres',
        port: 5433, // Forçar porta 5433
    });
    try {
        // Dropar conexões existentes com o banco se houver
        yield adminPool.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = $1
    `, [houseId]);
        // Criar novo banco usando o template
        yield adminPool.query(`CREATE DATABASE "${houseId}" WITH TEMPLATE house_template`);
        console.log(`Database "${houseId}" created successfully`);
    }
    catch (error) {
        console.error('Error creating house database:', error);
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
exports.createHouseDatabase = createHouseDatabase;
const executeHouseTablesScript = (houseId) => __awaiter(void 0, void 0, void 0, function* () {
    const newHousePool = new pg_1.Pool({
        host: process.env.DATA_CASA_HOST,
        user: process.env.DATA_CASA_USER,
        password: process.env.DATA_CASA_PASSWORD,
        database: houseId,
        port: parseInt(process.env.DATA_CASA_PORT || '5432'),
    });
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
});
exports.executeHouseTablesScript = executeHouseTablesScript;
const createHouse = ({ user_id, house_name }) => __awaiter(void 0, void 0, void 0, function* () {
    const house = yield (0, exports.createHouseEntry)({ user_id, house_name });
    yield (0, exports.createHouseDatabase)(house.house_name);
    yield (0, exports.executeHouseTablesScript)(house.house_name);
    return house;
});
exports.createHouse = createHouse;
const getHousesByUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, database_1.query)('SELECT * FROM houses WHERE user_id = $1;', [userId]);
    return result.rows;
});
exports.getHousesByUser = getHousesByUser;
