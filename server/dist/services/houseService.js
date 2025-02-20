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
exports.createHouse = void 0;
const database_1 = require("./database");
const dataCasa_1 = require("../config/dataCasa");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const createHouse = ({ user_id, house_db_name, address }) => __awaiter(void 0, void 0, void 0, function* () {
    // Insere o cadastro da casa na base data-user
    const insertResult = yield (0, database_1.query)('INSERT INTO houses (user_id, house_db_name, address) VALUES ($1, $2, $3) RETURNING *', [user_id, house_db_name, address]);
    const house = insertResult.rows[0];
    // Conecta na instância data-casa para criar um novo banco de dados
    // Utilize uma conexão separada (usando um pool específico para criação de DB)
    const adminPool = new dataCasa_1.dataCasaPool.constructor({
        host: process.env.DATA_CASA_HOST,
        user: process.env.DATA_CASA_USER,
        password: process.env.DATA_CASA_PASSWORD,
        database: process.env.DATA_CASA_NAME,
        port: Number(process.env.DATA_CASA_PORT),
    });
    // Cria o novo banco com o nome igual à house_db_name (pode ser também house.id se preferir)
    yield adminPool.query(`CREATE DATABASE "${house.house_db_name}"`);
    yield adminPool.end();
    // Após criar o banco, execute o script de criação de tabelas nele
    // Conecta ao novo banco
    const newHousePool = new dataCasa_1.dataCasaPool.constructor({
        host: process.env.DATA_CASA_HOST,
        user: process.env.DATA_CASA_USER,
        password: process.env.DATA_CASA_PASSWORD,
        database: house.house_db_name,
        port: Number(process.env.DATA_CASA_PORT),
    });
    const sqlFilePath = path_1.default.join(__dirname, '../../db/data-casa/01-create-tables.sql');
    const sqlScript = fs_1.default.readFileSync(sqlFilePath, { encoding: 'utf8' });
    // Divida o script em comandos (assumindo que cada comando termine com “;”)
    const commands = sqlScript.split(/;\s*$/m).filter(Boolean);
    for (const command of commands) {
        yield newHousePool.query(command);
    }
    yield newHousePool.end();
    return house;
});
exports.createHouse = createHouse;
