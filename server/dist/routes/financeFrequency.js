"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const houseAuth_1 = require("../middleware/houseAuth");
const financeFrequencyController_1 = require("../controllers/financeFrequencyController");
const router = (0, express_1.Router)({ mergeParams: true });
// Middleware para autenticação e validação de acesso à casa
const houseMiddleware = [auth_1.authenticate, houseAuth_1.validateHouseAccess];
// GET: Lista todas as frequências
router.get('/', houseMiddleware, financeFrequencyController_1.getFinanceFrequencies);
// GET: Retorna uma frequência por ID
router.get('/:id', houseMiddleware, financeFrequencyController_1.getFinanceFrequencyById);
// POST: Cria uma nova frequência
router.post('/', houseMiddleware, financeFrequencyController_1.createFinanceFrequency);
// PUT: Atualiza uma frequência existente
router.put('/:id', houseMiddleware, financeFrequencyController_1.updateFinanceFrequency);
// DELETE: Remove uma frequência
router.delete('/:id', houseMiddleware, financeFrequencyController_1.deleteFinanceFrequency);
exports.default = router;
