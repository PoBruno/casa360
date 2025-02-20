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
exports.validateHouseAccess = void 0;
const databaseManager_1 = __importDefault(require("../services/databaseManager"));
const validateHouseAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { houseId } = req.params;
        const userId = req.user.id;
        const dbManager = databaseManager_1.default.getInstance();
        const userPool = yield dbManager.getUserPool();
        const result = yield userPool.query('SELECT * FROM houses WHERE id = $1 AND user_id = $2', [houseId, userId]);
        if (result.rows.length === 0) {
            return res.status(403).json({ message: 'Access denied to this house' });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ error: 'Error validating house access' });
    }
});
exports.validateHouseAccess = validateHouseAccess;
