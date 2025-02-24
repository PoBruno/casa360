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
    var _a;
    try {
        const { house_id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        // Usar o pool da instância data-user para verificar permissões
        const dbManager = databaseManager_1.default.getInstance();
        const userPool = yield dbManager.getUserPool();
        // Consultar a tabela house_users para verificar as permissões
        const result = yield userPool.query(`SELECT hu.role 
       FROM house_users hu 
       WHERE hu.house_id = $1 
       AND hu.user_id = $2`, [house_id, userId]);
        if (result.rows.length === 0) {
            return res.status(403).json({ message: 'Access denied to this house' });
        }
        // Adicionar a role do usuário ao request para uso posterior
        const userRole = result.rows[0].role;
        if (!req.user)
            req.user = { id: userId, email: '', role: userRole };
        else
            req.user.role = userRole;
        // Por enquanto, apenas 'owner' tem acesso
        if (userRole !== 'owner') {
            return res.status(403).json({
                message: 'Insufficient permissions',
                required: 'owner',
                current: userRole
            });
        }
        next();
    }
    catch (error) {
        console.error('Error validating house access:', error);
        res.status(500).json({ error: 'Error validating house access' });
    }
});
exports.validateHouseAccess = validateHouseAccess;
