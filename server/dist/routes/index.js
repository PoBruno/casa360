"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const houseAuth_1 = require("../middleware/houseAuth");
// Importações das rotas
const user_1 = __importDefault(require("./user"));
const financeFrequency_1 = __importDefault(require("./financeFrequency"));
const financeCC_1 = __importDefault(require("./financeCC"));
const financeCategory_1 = __importDefault(require("./financeCategory"));
const financePayer_1 = __importDefault(require("./financePayer"));
const financePayerUsers_1 = __importDefault(require("./financePayerUsers"));
const financeEntries_1 = __importDefault(require("./financeEntries"));
const financeInstallments_1 = __importDefault(require("./financeInstallments"));
const transactions_1 = __importDefault(require("./transactions"));
const financeCurrency_1 = __importDefault(require("./financeCurrency"));
const financeUsers_1 = __importDefault(require("./financeUsers"));
const router = (0, express_1.Router)();
// Middleware para autenticação e validação de acesso à casa
const houseMiddleware = [auth_1.authenticate, houseAuth_1.validateHouseAccess];
// Rotas públicas, ex: /api/auth, etc.
router.use('/users', user_1.default);
// Agrupa todas as rotas relacionadas à casa sob /house/:house_id
router.use('/house/:house_id', houseMiddleware, (req, res, next) => {
    // Middleware para rotas da casa
    next();
});
// Monta as rotas protegidas
router.use('/house/:house_id/finance-frequency', financeFrequency_1.default);
router.use('/house/:house_id/finance-cc', financeCC_1.default);
router.use('/house/:house_id/finance-category', financeCategory_1.default);
router.use('/house/:house_id/finance-payer', financePayer_1.default);
router.use('/house/:house_id/finance-payer-users', financePayerUsers_1.default);
router.use('/house/:house_id/finance-entries', financeEntries_1.default);
router.use('/house/:house_id/finance-installments', financeInstallments_1.default);
router.use('/house/:house_id/finance-transactions', transactions_1.default);
router.use('/house/:house_id/finance-currency', financeCurrency_1.default);
router.use('/house/:house_id/finance-users', financeUsers_1.default);
exports.default = router;
