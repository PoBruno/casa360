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
exports.createHouse = void 0;
const databaseManager_1 = __importDefault(require("./databaseManager"));
const createHouse = (userId, houseName) => __awaiter(void 0, void 0, void 0, function* () {
    const dbManager = databaseManager_1.default.getInstance();
    const userPool = yield dbManager.getUserPool();
    const result = yield userPool.query('INSERT INTO houses (user_id, house_name) VALUES ($1, $2) RETURNING id', [userId, houseName]);
    const houseId = result.rows[0].id;
    yield dbManager.createHouseDatabase(houseId);
    return houseId;
});
exports.createHouse = createHouse;
