"use strict";
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
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
// Monta primeiro as rotas de autenticação para evitar conflito
app.use('/api/auth', auth_1.default);
// Em seguida, as demais rotas
app.use('/api', routes_1.default);
app.use(error_1.default);
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
exports.default = app;
