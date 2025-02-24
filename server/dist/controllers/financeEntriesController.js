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
exports.deleteFinanceEntry = exports.updateFinanceEntry = exports.createFinanceEntry = exports.getFinanceEntryById = exports.getFinanceEntries = void 0;
const databaseManager_1 = __importDefault(require("../services/databaseManager"));
const getFinanceEntries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { house_id } = req.params;
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('SELECT * FROM finance_entries ORDER BY id');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar entradas financeiras', details: error });
    }
});
exports.getFinanceEntries = getFinanceEntries;
const getFinanceEntryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('SELECT * FROM finance_entries WHERE id = $1', [id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Entrada financeira não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar entrada financeira', details: error });
    }
});
exports.getFinanceEntryById = getFinanceEntryById;
const createFinanceEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id } = req.params;
    const entry = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query(`INSERT INTO finance_entries (
        user_id, finance_cc_id, finance_category_id, finance_payer_id,
        finance_currency_id, finance_frequency_id, is_income, amount,
        start_date, end_date, description, installments_count,
        is_fixed, is_recurring, payment_day
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING *`, [
            entry.user_id, entry.finance_cc_id, entry.finance_category_id,
            entry.finance_payer_id, entry.finance_currency_id,
            entry.finance_frequency_id, entry.is_income, entry.amount,
            entry.start_date, entry.end_date, entry.description,
            entry.installments_count, entry.is_fixed, entry.is_recurring,
            entry.payment_day
        ]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar entrada financeira', details: error });
    }
});
exports.createFinanceEntry = createFinanceEntry;
const updateFinanceEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    const entry = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query(`UPDATE finance_entries SET
        finance_cc_id = $1, finance_category_id = $2, finance_payer_id = $3,
        finance_currency_id = $4, finance_frequency_id = $5, is_income = $6,
        amount = $7, start_date = $8, end_date = $9, description = $10,
        installments_count = $11, is_fixed = $12, is_recurring = $13,
        payment_day = $14, updated_at = NOW()
      WHERE id = $15 RETURNING *`, [
            entry.finance_cc_id, entry.finance_category_id, entry.finance_payer_id,
            entry.finance_currency_id, entry.finance_frequency_id, entry.is_income,
            entry.amount, entry.start_date, entry.end_date, entry.description,
            entry.installments_count, entry.is_fixed, entry.is_recurring,
            entry.payment_day, id
        ]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Entrada financeira não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar entrada financeira', details: error });
    }
});
exports.updateFinanceEntry = updateFinanceEntry;
const deleteFinanceEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('DELETE FROM finance_entries WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length) {
            res.status(204).send();
        }
        else {
            res.status(404).json({ message: 'Entrada financeira não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao deletar entrada financeira', details: error });
    }
});
exports.deleteFinanceEntry = deleteFinanceEntry;
