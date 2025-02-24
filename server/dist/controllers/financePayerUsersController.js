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
exports.deleteFinancePayerUser = exports.updateFinancePayerUser = exports.createFinancePayerUser = exports.getFinancePayerUsersByPayerId = exports.getFinancePayerUsers = void 0;
const databaseManager_1 = __importDefault(require("../services/databaseManager"));
const getFinancePayerUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { house_id } = req.params;
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query(`
      SELECT fpu.*, fp.name as payer_name, u.name as user_name 
      FROM finance_payer_users fpu
      JOIN finance_payer fp ON fp.id = fpu.finance_payer_id
      JOIN users u ON u.id = fpu.user_id
      ORDER BY fp.name, u.name
    `);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuários dos pagadores', details: error });
    }
});
exports.getFinancePayerUsers = getFinancePayerUsers;
const getFinancePayerUsersByPayerId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, payer_id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query(`
      SELECT fpu.*, u.name as user_name 
      FROM finance_payer_users fpu
      JOIN users u ON u.id = fpu.user_id
      WHERE fpu.finance_payer_id = $1
    `, [payer_id]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuários do pagador', details: error });
    }
});
exports.getFinancePayerUsersByPayerId = getFinancePayerUsersByPayerId;
const createFinancePayerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id } = req.params;
    const { finance_payer_id, user_id, percentage } = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('INSERT INTO finance_payer_users (finance_payer_id, user_id, percentage) VALUES ($1, $2, $3) RETURNING *', [finance_payer_id, user_id, percentage]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar relação pagador-usuário', details: error });
    }
});
exports.createFinancePayerUser = createFinancePayerUser;
const updateFinancePayerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, payer_id, user_id } = req.params;
    const { percentage } = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('UPDATE finance_payer_users SET percentage = $1 WHERE finance_payer_id = $2 AND user_id = $3 RETURNING *', [percentage, payer_id, user_id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Relação pagador-usuário não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar relação pagador-usuário', details: error });
    }
});
exports.updateFinancePayerUser = updateFinancePayerUser;
const deleteFinancePayerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, payer_id, user_id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('DELETE FROM finance_payer_users WHERE finance_payer_id = $1 AND user_id = $2 RETURNING *', [payer_id, user_id]);
        if (result.rows.length) {
            res.status(204).send();
        }
        else {
            res.status(404).json({ message: 'Relação pagador-usuário não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao deletar relação pagador-usuário', details: error });
    }
});
exports.deleteFinancePayerUser = deleteFinancePayerUser;
