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
exports.deleteFinanceEntry = exports.updateFinanceEntry = exports.getFinanceEntryById = exports.getAllFinanceEntries = exports.createFinanceEntry = void 0;
// filepath: /backend/src/models/finance.ts
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
// Create a new finance entry
const createFinanceEntry = (entry) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, financeCcId, financeCategoryId, financePayerId, startDate, paymentDay, description, installmentsCount, isRecurring } = entry;
    const result = yield pool.query(`INSERT INTO Finance_Entries (user_id, finance_cc_id, finance_category_id, finance_payer_id, start_date, payment_day, description, installments_count, is_recurring)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`, [userId, financeCcId, financeCategoryId, financePayerId, startDate, paymentDay, description, installmentsCount, isRecurring]);
    return result.rows[0];
});
exports.createFinanceEntry = createFinanceEntry;
// Get all finance entries
const getAllFinanceEntries = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield pool.query(`SELECT * FROM Finance_Entries`);
    return result.rows;
});
exports.getAllFinanceEntries = getAllFinanceEntries;
// Get a finance entry by ID
const getFinanceEntryById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield pool.query(`SELECT * FROM Finance_Entries WHERE id = $1`, [id]);
    return result.rows[0];
});
exports.getFinanceEntryById = getFinanceEntryById;
// Update a finance entry
const updateFinanceEntry = (id, entry) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, financeCcId, financeCategoryId, financePayerId, startDate, paymentDay, description, installmentsCount, isRecurring } = entry;
    const result = yield pool.query(`UPDATE Finance_Entries SET user_id = COALESCE($1, user_id), finance_cc_id = COALESCE($2, finance_cc_id), 
         finance_category_id = COALESCE($3, finance_category_id), finance_payer_id = COALESCE($4, finance_payer_id), 
         start_date = COALESCE($5, start_date), payment_day = COALESCE($6, payment_day), 
         description = COALESCE($7, description), installments_count = COALESCE($8, installments_count), 
         is_recurring = COALESCE($9, is_recurring) WHERE id = $10 RETURNING *`, [userId, financeCcId, financeCategoryId, financePayerId, startDate, paymentDay, description, installmentsCount, isRecurring, id]);
    return result.rows[0];
});
exports.updateFinanceEntry = updateFinanceEntry;
// Delete a finance entry
const deleteFinanceEntry = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield pool.query(`DELETE FROM Finance_Entries WHERE id = $1`, [id]);
});
exports.deleteFinanceEntry = deleteFinanceEntry;
