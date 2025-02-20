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
// GET: Lista todos os fornecedores
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, database_1.query)('SELECT * FROM Suppliers');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// GET: Busca fornecedor por ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, database_1.query)('SELECT * FROM Suppliers WHERE id = $1', [id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Supplier not found' });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// POST: Insere novo fornecedor
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, contact_info, website, address, supplier_type, rating } = req.body;
        const result = yield (0, database_1.query)(`INSERT INTO Suppliers 
       (name, contact_info, website, address, supplier_type, rating)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [name, contact_info, website, address, supplier_type, rating]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// PUT: Atualiza fornecedor por ID
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, contact_info, website, address, supplier_type, rating } = req.body;
        const result = yield (0, database_1.query)(`UPDATE Suppliers
       SET name = $1, contact_info = $2, website = $3, address = $4, supplier_type = $5, rating = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`, [name, contact_info, website, address, supplier_type, rating, id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Supplier not found' });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// DELETE: Remove fornecedor por ID
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield (0, database_1.query)('DELETE FROM Suppliers WHERE id = $1', [id])
            .catch((err) => {
            console.error('Database connection error', err.stack);
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
exports.default = router;
