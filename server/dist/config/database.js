"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.query = exports.dataCasaPool = exports.primaryPool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT)
};
exports.config = config;
exports.primaryPool = new pg_1.Pool(config);
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
    config,
    primaryPool: exports.primaryPool,
    dataCasaPool: exports.dataCasaPool
};
