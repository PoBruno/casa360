"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const houseAuth_1 = require("../middleware/houseAuth");
const financeCurrencyController_1 = require("../controllers/financeCurrencyController");
const router = (0, express_1.Router)({ mergeParams: true });
// Middleware para autenticação e validação de acesso à casa
const houseMiddleware = [auth_1.authenticate, houseAuth_1.validateHouseAccess];
// GET: Lista todas as moedas/taxas de câmbio
router.get('/', houseMiddleware, financeCurrencyController_1.getFinanceCurrencies);
// GET: Retorna uma moeda por ID
router.get('/:id', houseMiddleware, financeCurrencyController_1.getFinanceCurrencyById);
// POST: Insere uma nova moeda
router.post('/', houseMiddleware, financeCurrencyController_1.createFinanceCurrency);
// PUT: Atualiza uma moeda por ID
router.put('/:id', houseMiddleware, financeCurrencyController_1.updateFinanceCurrency);
// DELETE: Remove uma moeda por ID
router.delete('/:id', houseMiddleware, financeCurrencyController_1.deleteFinanceCurrency);
exports.default = router;
