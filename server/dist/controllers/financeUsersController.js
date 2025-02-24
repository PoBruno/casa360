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
exports.deleteFinanceUsers = exports.updateFinanceUsers = exports.createFinanceUsers = exports.getFinanceUsersById = exports.getFinanceUsers = void 0;
const databaseManager_1 = __importDefault(require("../services/databaseManager"));
const getFinanceUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { house_id } = req.params;
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('SELECT * FROM user ORDER BY id');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuários', details: error });
    }
});
exports.getFinanceUsers = getFinanceUsers;
const getFinanceUsersById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('SELECT * FROM user WHERE id = $1', [id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuário', details: error });
    }
});
exports.getFinanceUsersById = getFinanceUsersById;
const createFinanceUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id } = req.params;
    const { name, email, password } = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('INSERT INTO user (name, email) VALUES ($1, $2) RETURNING *', [name, email, password]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar usuário', details: error });
    }
});
exports.createFinanceUsers = createFinanceUsers;
const updateFinanceUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    const { name, email, password } = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('UPDATE user SET name = $1, email = $2, updated_at = NOW() WHERE id = $4 RETURNING *', [name, email, password, id]);
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar usuário', details: error });
    }
});
exports.updateFinanceUsers = updateFinanceUsers;
const deleteFinanceUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        yield housePool.query('DELETE FROM user WHERE id = $1', [id]);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao deletar usuário', details: error });
    }
});
exports.deleteFinanceUsers = deleteFinanceUsers;
