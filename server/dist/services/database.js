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
exports.getUserByEmail = exports.authenticateUser = exports.createFinanceRecord = exports.getAllFinanceRecords = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = exports.query = void 0;
const database_1 = require("../config/database");
const query = (text, params) => {
    return database_1.primaryPool.query(text, params);
};
exports.query = query;
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield (0, exports.query)('SELECT * FROM Users');
    return res.rows;
});
exports.getAllUsers = getAllUsers;
const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield (0, exports.query)('SELECT * FROM Users WHERE id = $1', [id]);
    return res.rows[0];
});
exports.getUserById = getUserById;
const createUser = ({ name, email, password_hash }) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, exports.query)('INSERT INTO Users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *', [name, email, password_hash]);
    return result.rows[0];
});
exports.createUser = createUser;
const updateUser = (id, name, email) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield (0, exports.query)('UPDATE Users SET name = $1, email = $2 WHERE id = $3 RETURNING *', [name, email, id]);
    return res.rows[0];
});
exports.updateUser = updateUser;
const deleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.query)('DELETE FROM Users WHERE id = $1', [id]);
});
exports.deleteUser = deleteUser;
const getAllFinanceRecords = () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield (0, exports.query)('SELECT * FROM Finance_Entries');
    return res.rows;
});
exports.getAllFinanceRecords = getAllFinanceRecords;
const createFinanceRecord = (userId, financeCcId, financeCategoryId, financePayerId, startDate, paymentDay, description, installmentsCount, isRecurring) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield (0, exports.query)('INSERT INTO Finance_Entries (user_id, finance_cc_id, finance_category_id, finance_payer_id, start_date, payment_day, description, installments_count, is_recurring) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', [userId, financeCcId, financeCategoryId, financePayerId, startDate, paymentDay, description, installmentsCount, isRecurring]);
    return res.rows[0];
});
exports.createFinanceRecord = createFinanceRecord;
const authenticateUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, exports.query)('SELECT * FROM users WHERE email = $1 AND password = crypt($2, password)', [email, password]);
    return result.rows[0];
});
exports.authenticateUser = authenticateUser;
const getUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, exports.query)('SELECT * FROM Users WHERE email = $1', [email]);
    return result.rows[0];
});
exports.getUserByEmail = getUserByEmail;
// Additional functions for finance records can be added here (update, delete, etc.)
