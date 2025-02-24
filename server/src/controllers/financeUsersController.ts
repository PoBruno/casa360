import { Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

export const getFinanceUsers = async (req: Request, res: Response) => {
    try {
            const { house_id } = req.params;
            const dbManager = DatabaseManager.getInstance();
            const housePool = await dbManager.getHousePool(house_id);

            const result = await housePool.query('SELECT * FROM users ORDER BY id');
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar usuários', details: error });
        }
};

export const getFinanceUsersById = async (req: Request, res: Response) => {
    const { house_id, id } = req.params;
    try {
        const dbManager = DatabaseManager.getInstance();
        const housePool = await dbManager.getHousePool(house_id);
    
        const result = await housePool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuário', details: error });
    }
};

export const createFinanceUsers = async (req: Request, res: Response) => {
    const { house_id } = req.params;
    const { name, email } = req.body; // Remove password since it's not in the table structure
    
    try {
        const dbManager = DatabaseManager.getInstance();
        // Use userPool instead of housePool since Users table is in the main database
        const userPool = await dbManager.getUserPool();
    
        const result = await userPool.query(
            `INSERT INTO Users (name, email) 
             VALUES ($1, $2) 
             RETURNING *`,
            [name, email] // Remove password from parameters array
        );

        // Add user to house_users table
        await userPool.query(
            `INSERT INTO house_users (user_id, house_id, role) 
             VALUES ($1, $2, $3)`,
            [result.rows[0].id, house_id, 'member']
        );
    
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Erro ao criar usuário', details: error });
    }
};

export const updateFinanceUsers = async (req: Request, res: Response) => {
    const { house_id, id } = req.params;
    const { name, email, password } = req.body;
    try {
        const dbManager = DatabaseManager.getInstance();
        const housePool = await dbManager.getHousePool(house_id);
    
        const result = await housePool.query(
            'UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $4 RETURNING *',
            [name, email, password, id]
        );
    
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar usuário', details: error });
    }
};

export const deleteFinanceUsers = async (req: Request, res: Response) => {
    const { house_id, id } = req.params;
    try {
        const dbManager = DatabaseManager.getInstance();
        const housePool = await dbManager.getHousePool(house_id);
    
        await housePool.query('DELETE FROM users WHERE id = $1', [id]);
    
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar usuário', details: error });
    }
};

