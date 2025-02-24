"use strict";
/// <reference path="./types/express/custom.d.ts" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const error_1 = __importDefault(require("./middleware/error"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const house_1 = __importDefault(require("./routes/house"));
const financeCurrency_1 = __importDefault(require("./routes/financeCurrency"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = parseInt(process.env.PORT || '3000', 10);
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
// Monta primeiro as rotas de autenticação para evitar conflito
app.use('/api/auth', auth_1.default);
// Em seguida, as demais rotas
app.use('/api/houses', house_1.default);
app.use('/api/house/:house_id/finance-currency', financeCurrency_1.default);
app.use('/api', routes_1.default);
app.use(error_1.default);
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
exports.default = app;
