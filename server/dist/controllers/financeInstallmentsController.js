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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFinanceInstallment = exports.updateFinanceInstallment = exports.updateInstallmentStatus = exports.getFinanceInstallmentById = exports.getFinanceInstallments = void 0;
const databaseManager_1 = __importDefault(require("../services/databaseManager"));
const getFinanceInstallments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('SELECT * FROM Finance_Installments ORDER BY due_date');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar parcelas', details: error });
    }
});
exports.getFinanceInstallments = getFinanceInstallments;
const getFinanceInstallmentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('SELECT * FROM Finance_Installments WHERE id = $1', [id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Parcela não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar parcela', details: error });
    }
});
exports.getFinanceInstallmentById = getFinanceInstallmentById;
const updateInstallmentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    const { status } = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('UPDATE Finance_Installments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Parcela não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar status da parcela', details: error });
    }
});
exports.updateInstallmentStatus = updateInstallmentStatus;
const updateFinanceInstallment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    const { finance_entries_id, installment_number, due_date, amount } = req.body;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query(`UPDATE Finance_Installments SET 
        finance_entries_id = $1,
        installment_number = $2,
        due_date = $3,
        amount = $4,
        updated_at = NOW()
      WHERE id = $5 RETURNING *`, [finance_entries_id, installment_number, due_date, amount, id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ message: 'Parcela não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar parcela', details: error });
    }
});
exports.updateFinanceInstallment = updateFinanceInstallment;
const deleteFinanceInstallment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { house_id, id } = req.params;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const housePool = yield dbManager.getHousePool(house_id);
        const result = yield housePool.query('DELETE FROM Finance_Installments WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length) {
            res.status(204).send();
        }
        else {
            res.status(404).json({ message: 'Parcela não encontrada' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao excluir parcela', details: error });
    }
});
exports.deleteFinanceInstallment = deleteFinanceInstallment;
