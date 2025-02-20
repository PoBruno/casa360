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
// GET TUDO: Lista todas as entradas do histórico
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, database_1.query)('SELECT * FROM User_Wallet_History');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// GET POR ID: Retorna um registro específico do histórico
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, database_1.query)('SELECT * FROM User_Wallet_History WHERE id = $1', [id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Registro não encontrado' });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// POST: Insere um novo registro no histórico
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id, change_amount, resulting_balance, change_date } = req.body;
        const result = yield (0, database_1.query)(`INSERT INTO User_Wallet_History (user_id, change_amount, resulting_balance, change_date)
       VALUES ($1, $2, $3, $4) RETURNING *`, [user_id, change_amount, resulting_balance, change_date]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// PUT: Atualiza um registro do histórico
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { user_id, change_amount, resulting_balance, change_date } = req.body;
        const result = yield (0, database_1.query)(`UPDATE User_Wallet_History 
       SET user_id = $1, change_amount = $2, resulting_balance = $3, change_date = $4
       WHERE id = $5 RETURNING *`, [user_id, change_amount, resulting_balance, change_date, id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Registro não encontrado' });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// DELETE: Remove um registro do histórico
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield (0, database_1.query)('DELETE FROM User_Wallet_History WHERE id = $1', [id]);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
exports.default = router;
