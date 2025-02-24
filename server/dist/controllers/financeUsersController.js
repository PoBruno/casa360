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
        const result = yield housePool.query(`
            SELECT * FROM Users 
            ORDER BY id
        `);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários', details: error });
    }
});
exports.getFinanceUsers = getFinanceUsers;
const getFinanceUsersById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('SELECT * FROM Users WHERE id = $1', [id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário', details: error });
    }
});
exports.getFinanceUsersById = getFinanceUsersById;
const createFinanceUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id } = req.params;
    const { name, email } = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        // Begin transaction
        yield housePool.query('BEGIN');
        try {
            const result = yield housePool.query(`INSERT INTO Users (name, email) 
                 VALUES ($1, $2) 
                 RETURNING *`, [name, email, 0, 'active']);
            yield housePool.query('COMMIT');
            res.status(201).json(result.rows[0]);
        }
        catch (error) {
            yield housePool.query('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Erro ao criar usuário', details: error });
    }
});
exports.createFinanceUsers = createFinanceUsers;
const updateFinanceUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    const { name, email, account_status } = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query(`
            UPDATE Users 
            SET name = $1, 
                email = $2, 
                account_status = $3,
                updated_at = NOW()
            WHERE id = $4
            RETURNING *
        `, [name, email, account_status || 'active', id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário', details: error });
    }
});
exports.updateFinanceUsers = updateFinanceUsers;
const deleteFinanceUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('DELETE FROM Users WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Erro ao deletar usuário', details: error });
    }
});
exports.deleteFinanceUsers = deleteFinanceUsers;
