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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../services/database");
const router = (0, express_1.Router)();
// GET: Lista todas as transações
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, database_1.query)('SELECT * FROM Transactions');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// GET: Busca transação por ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, database_1.query)('SELECT * FROM Transactions WHERE id = $1', [id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Transaction not found' });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// POST: Insere uma nova transação
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id, finance_installments_id, transaction_date, amount, is_income, description, status } = req.body;
        const result = yield (0, database_1.query)(`INSERT INTO Transactions
       (user_id, finance_installments_id, transaction_date, amount, is_income, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [user_id, finance_installments_id, transaction_date || new Date(), amount, is_income, description, status || 'pending']);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// PUT: Atualiza transação por ID
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { user_id, finance_installments_id, transaction_date, amount, is_income, description, status } = req.body;
        const result = yield (0, database_1.query)(`UPDATE Transactions
       SET user_id = $1, finance_installments_id = $2, transaction_date = $3, amount = $4,
           is_income = $5, description = $6, status = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`, [user_id, finance_installments_id, transaction_date, amount, is_income, description, status, id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Transaction not found' });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// DELETE: Remove transação por ID
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield (0, database_1.query)('DELETE FROM Transactions WHERE id = $1', [id]);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
exports.default = router;
