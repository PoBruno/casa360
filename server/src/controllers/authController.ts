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
        
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Gera o token JWT com os campos necessários
        const token = jwt.sign(
            { 
                id: user.id.toString(), // Converte para string se for número
                email: user.email
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
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