"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataCasaPool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.dataCasaPool = new pg_1.Pool({
    host: process.env.DATA_CASA_HOST,
    user: process.env.DATA_CASA_USER,
    password: process.env.DATA_CASA_PASSWORD,
    database: process.env.DATA_CASA_NAME,
    port: Number(process.env.DATA_CASA_PORT),
});
