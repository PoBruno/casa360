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
// GET: Lista todas as RFPs
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, database_1.query)('SELECT * FROM RFP');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// GET: Busca RFP por ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, database_1.query)('SELECT * FROM RFP WHERE id = $1', [id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'RFP not found' });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// POST: Insere nova RFP
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, created_by, status, approved_at, approved_by, approval_notes } = req.body;
        const result = yield (0, database_1.query)(`INSERT INTO RFP 
       (title, description, created_by, status, approved_at, approved_by, approval_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [title, description, created_by, status || 'pending', approved_at, approved_by, approval_notes]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// PUT: Atualiza RFP por ID
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, description, created_by, status, approved_at, approved_by, approval_notes } = req.body;
        const result = yield (0, database_1.query)(`UPDATE RFP
       SET title = $1, description = $2, created_by = $3, status = $4,
           approved_at = $5, approved_by = $6, approval_notes = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`, [title, description, created_by, status, approved_at, approved_by, approval_notes, id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'RFP not found' });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// DELETE: Remove RFP por ID
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield (0, database_1.query)('DELETE FROM RFP WHERE id = $1', [id]);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
exports.default = router;
