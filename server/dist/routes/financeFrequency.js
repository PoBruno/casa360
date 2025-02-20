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
// GET TUDO: Lista todas as frequências financeiras
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, database_1.query)('SELECT * FROM Finance_Frequency');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// GET POR ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, database_1.query)('SELECT * FROM Finance_Frequency WHERE id = $1', [id]);
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
// POST: Insere uma nova frequência financeira
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, days_interval } = req.body;
        const result = yield (0, database_1.query)(`INSERT INTO Finance_Frequency (name, days_interval)
       VALUES ($1, $2) RETURNING *`, [name, days_interval]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// PUT: Atualiza uma frequência financeira
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, days_interval } = req.body;
        const result = yield (0, database_1.query)(`UPDATE Finance_Frequency
       SET name = $1, days_interval = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`, [name, days_interval, id]);
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
// DELETE: Remove uma frequência financeira
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield (0, database_1.query)('DELETE FROM Finance_Frequency WHERE id = $1', [id]);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
exports.default = router;
