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
// GET: Lista todas as associações pagador/usuário
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, database_1.query)('SELECT * FROM Finance_Payer_Users');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// GET: Retorna a associação por pagador e usuário (chave composta)
router.get('/:finance_payer_id/:user_id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { finance_payer_id, user_id } = req.params;
        const result = yield (0, database_1.query)('SELECT * FROM Finance_Payer_Users WHERE finance_payer_id = $1 AND user_id = $2', [finance_payer_id, user_id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Record not found' });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// POST: Insere uma nova associação pagador/usuário
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { finance_payer_id, user_id, percentage } = req.body;
        const result = yield (0, database_1.query)(`INSERT INTO Finance_Payer_Users (finance_payer_id, user_id, percentage)
       VALUES ($1, $2, $3) RETURNING *`, [finance_payer_id, user_id, percentage]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// PUT: Atualiza os percentuais da associação (chave composta)
router.put('/:finance_payer_id/:user_id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { finance_payer_id, user_id } = req.params;
        const { percentage } = req.body;
        const result = yield (0, database_1.query)(`UPDATE Finance_Payer_Users
       SET percentage = $1
       WHERE finance_payer_id = $2 AND user_id = $3 RETURNING *`, [percentage, finance_payer_id, user_id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Record not found' });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// DELETE: Remove uma associação por chave composta
router.delete('/:finance_payer_id/:user_id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { finance_payer_id, user_id } = req.params;
        yield (0, database_1.query)('DELETE FROM Finance_Payer_Users WHERE finance_payer_id = $1 AND user_id = $2', [finance_payer_id, user_id]);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
exports.default = router;
