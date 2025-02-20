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
// GET: Lista todas as parcelas
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, database_1.query)('SELECT * FROM Finance_Installments');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// GET: Busca parcela por ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, database_1.query)('SELECT * FROM Finance_Installments WHERE id = $1', [id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Finance Installment not found' });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// POST: Insere uma nova parcela
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { finance_entries_id, installment_number, due_date, amount, status } = req.body;
        const result = yield (0, database_1.query)(`INSERT INTO Finance_Installments 
       (finance_entries_id, installment_number, due_date, amount, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`, [finance_entries_id, installment_number, due_date, amount, status || 'pending']);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// PUT: Atualiza parcela por ID
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { finance_entries_id, installment_number, due_date, amount, status } = req.body;
        const result = yield (0, database_1.query)(`UPDATE Finance_Installments
       SET finance_entries_id = $1, installment_number = $2, due_date = $3, amount = $4, status = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`, [finance_entries_id, installment_number, due_date, amount, status, id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Finance Installment not found' });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// DELETE: Remove parcela por ID
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield (0, database_1.query)('DELETE FROM Finance_Installments WHERE id = $1', [id]);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
exports.default = router;
