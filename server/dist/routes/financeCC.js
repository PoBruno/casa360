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
// GET TUDO: Lista todos os Centros de Custo
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, database_1.query)('SELECT * FROM Finance_CC');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// GET POR ID: Retorna um Centro de Custo específico
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, database_1.query)('SELECT * FROM Finance_CC WHERE id = $1', [id]);
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
// POST: Insere um novo Centro de Custo
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description } = req.body;
        const result = yield (0, database_1.query)(`INSERT INTO Finance_CC (name, description)
       VALUES ($1, $2) RETURNING *`, [name, description]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// PUT: Atualiza um Centro de Custo
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const result = yield (0, database_1.query)(`UPDATE Finance_CC
       SET name = $1, description = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`, [name, description, id]);
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
// DELETE: Remove um Centro de Custo
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield (0, database_1.query)('DELETE FROM Finance_CC WHERE id = $1', [id]);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
exports.default = router;
