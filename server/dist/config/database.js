"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.dataCasaPool = exports.primaryPool = exports.config = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: '24h'
    },
    bcrypt: {
        saltRounds: 10
    },
    db: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    }
};
exports.primaryPool = new pg_1.Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT)
});
exports.dataCasaPool = new pg_1.Pool({
    host: process.env.DATA_CASA_HOST,
    user: process.env.DATA_CASA_USER,
    password: process.env.DATA_CASA_PASSWORD,
    database: process.env.DATA_CASA_NAME,
    port: Number(process.env.DATA_CASA_PORT)
});
const query = (text, params) => {
    return exports.primaryPool.query(text, params);
};
exports.query = query;
exports.default = {
    query: exports.query,
};
