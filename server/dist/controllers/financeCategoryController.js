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
exports.deleteFinanceCategory = exports.updateFinanceCategory = exports.createFinanceCategory = exports.getFinanceCategoryById = exports.getFinanceCategories = void 0;
const databaseManager_1 = __importDefault(require("../services/databaseManager"));
const getFinanceCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { house_id } = req.params;
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('SELECT * FROM finance_category ORDER BY id');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar categorias', details: error });
    }
});
exports.getFinanceCategories = getFinanceCategories;
const getFinanceCategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('SELECT * FROM finance_category WHERE id = $1', [id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Categoria não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar categoria', details: error });
    }
});
exports.getFinanceCategoryById = getFinanceCategoryById;
const createFinanceCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id } = req.params;
    const { name, parent_category_id } = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('INSERT INTO finance_category (name, parent_category_id) VALUES ($1, $2) RETURNING *', [name, parent_category_id]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar categoria', details: error });
    }
});
exports.createFinanceCategory = createFinanceCategory;
const updateFinanceCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    const { name, parent_category_id } = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('UPDATE finance_category SET name = $1, parent_category_id = $2, updated_at = NOW() WHERE id = $3 RETURNING *', [name, parent_category_id, id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Categoria não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar categoria', details: error });
    }
});
exports.updateFinanceCategory = updateFinanceCategory;
const deleteFinanceCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('DELETE FROM finance_category WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length) {
            res.status(204).send();
        }
        else {
            res.status(404).json({ message: 'Categoria não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao deletar categoria', details: error });
    }
});
exports.deleteFinanceCategory = deleteFinanceCategory;
