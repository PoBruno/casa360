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
exports.deleteFinanceCurrency = exports.updateFinanceCurrency = exports.createFinanceCurrency = exports.getFinanceCurrencyById = exports.getFinanceCurrencies = void 0;
const databaseManager_1 = __importDefault(require("../services/databaseManager"));
const getFinanceCurrencies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { house_id } = req.params;
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('SELECT * FROM finance_currency ORDER BY id');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar moedas/taxas de câmbio', details: error });
    }
});
exports.getFinanceCurrencies = getFinanceCurrencies;
const getFinanceCurrencyById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('SELECT * FROM finance_currency WHERE id = $1', [id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Moeda não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar moeda', details: error });
    }
});
exports.getFinanceCurrencyById = getFinanceCurrencyById;
const createFinanceCurrency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id } = req.params;
    const { name, symbol, exchange_rate } = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('INSERT INTO finance_currency (name, symbol, exchange_rate) VALUES ($1, $2, $3) RETURNING *', [name, symbol, exchange_rate]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar moeda', details: error });
    }
});
exports.createFinanceCurrency = createFinanceCurrency;
const updateFinanceCurrency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    const { name, symbol, exchange_rate } = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('UPDATE finance_currency SET name = $1, symbol = $2, exchange_rate = $3, updated_at = NOW() WHERE id = $4 RETURNING *', [name, symbol, exchange_rate, id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Moeda não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar moeda', details: error });
    }
});
exports.updateFinanceCurrency = updateFinanceCurrency;
const deleteFinanceCurrency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('DELETE FROM finance_currency WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length) {
            res.status(204).send();
        }
        else {
            res.status(404).json({ message: 'Moeda não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao deletar moeda', details: error });
    }
});
exports.deleteFinanceCurrency = deleteFinanceCurrency;
