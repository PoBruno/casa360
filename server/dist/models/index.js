"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Finance = void 0;
// filepath: /backend/backend/src/models/index.ts
var finance_1 = require("./finance");
Object.defineProperty(exports, "Finance", { enumerable: true, get: function () { return __importDefault(finance_1).default; } });
var user_1 = require("./user");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return __importDefault(user_1).default; } });
