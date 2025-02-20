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
exports.getHousesByUser = void 0;
const database_1 = require("../services/database");
const getHousesByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    try {
        const result = yield (0, database_1.query)('SELECT * FROM houses WHERE user_id = $1', [userId]);
        res.status(200).json(result.rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao buscar casas', error });
    }
});
exports.getHousesByUser = getHousesByUser;
