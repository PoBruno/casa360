// filepath: /backend/backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import * as userService from '../services/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/database'; // exemplo, ou de outro arquivo de config

export const register = async (req: Request, res: Response) => {
    try {
        // use "username" para compatibilizar com a tabela
        const { username, email, password } = req.body;
        const saltRounds = config.bcrypt.saltRounds || 10;
        // Gere o hash da senha no código (assim, o trigger do banco não precisa ser executado)
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Cria novo usuário – note que a query usará a coluna "password"
        const newUser = await userService.createUser({ username, email, password: passwordHash });
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await userService.getUserByEmail(email);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Compare com o campo "password" (que já contém o hash)
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Gera o token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: config.jwt.expiresIn || '24h' }
        );
        
        // Retorna o token no formato Bearer
        res.status(200).json({
            message: 'Login successful',
            token: `Bearer ${token}`,
            user
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

// Se necessário, mantenha sua rota de logout conforme a lógica da aplicação
export const logout = async (req: Request, res: Response) => {
    try {
        // Implementação da lógica de logout (ex: invalidação de token)
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging out', error });
    }
};