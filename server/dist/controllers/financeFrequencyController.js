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
exports.deleteFinanceFrequency = exports.updateFinanceFrequency = exports.createFinanceFrequency = exports.getFinanceFrequencyById = exports.getFinanceFrequencies = void 0;
const databaseManager_1 = __importDefault(require("../services/databaseManager"));
const getFinanceFrequencies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { house_id } = req.params;
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('SELECT * FROM finance_frequency ORDER BY id');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar frequências', details: error });
    }
});
exports.getFinanceFrequencies = getFinanceFrequencies;
const getFinanceFrequencyById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('SELECT * FROM finance_frequency WHERE id = $1', [id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Frequência não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar frequência', details: error });
    }
});
exports.getFinanceFrequencyById = getFinanceFrequencyById;
const createFinanceFrequency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id } = req.params;
    const { name, days_interval } = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('INSERT INTO finance_frequency (name, days_interval) VALUES ($1, $2) RETURNING *', [name, days_interval]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar frequência', details: error });
    }
});
exports.createFinanceFrequency = createFinanceFrequency;
const updateFinanceFrequency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    const { name, days_interval } = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('UPDATE finance_frequency SET name = $1, days_interval = $2, updated_at = NOW() WHERE id = $3 RETURNING *', [name, days_interval, id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Frequência não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar frequência', details: error });
    }
});
exports.updateFinanceFrequency = updateFinanceFrequency;
const deleteFinanceFrequency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('DELETE FROM finance_frequency WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length) {
            res.status(204).send();
        }
        else {
            res.status(404).json({ message: 'Frequência não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao deletar frequência', details: error });
    }
});
exports.deleteFinanceFrequency = deleteFinanceFrequency;
