import { Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

export const getFinanceUsers = async (req: Request, res: Response) => {
    try {
        const { house_id } = req.params;
        const dbManager = DatabaseManager.getInstance();
        const housePool = await dbManager.getHousePool(house_id);

        const result = await housePool.query(`
            SELECT * FROM Users 
            ORDER BY id
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários', details: error });
    }
};

export const getFinanceUsersById = async (req: Request, res: Response) => {
    const { house_id, id } = req.params;
    try {
        const dbManager = DatabaseManager.getInstance();
        const housePool = await dbManager.getHousePool(house_id);
    
        const result = await housePool.query(
            'SELECT * FROM Users WHERE id = $1', 
            [id]
        );

        if (result.rows.length) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário', details: error });
    }
};

export const createFinanceUsers = async (req: Request, res: Response) => {
    const { house_id } = req.params;
    const { name, email } = req.body;
    
    try {
        const dbManager = DatabaseManager.getInstance();
        const housePool = await dbManager.getHousePool(house_id);

        // Begin transaction
        await housePool.query('BEGIN');
        
        try {
            const result = await housePool.query(
                `INSERT INTO Users (name, email) 
                 VALUES ($1, $2) 
                 RETURNING *`,
                [name, email]
            );

            await housePool.query('COMMIT');
            res.status(201).json(result.rows[0]);
        } catch (error) {
            await housePool.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Erro ao criar usuário', details: error });
    }
};

export const updateFinanceUsers = async (req: Request, res: Response) => {
    const { house_id, id } = req.params;
    const { name, email, account_status } = req.body;
    
    try {
        const dbManager = DatabaseManager.getInstance();
        const housePool = await dbManager.getHousePool(house_id);
    
        const result = await housePool.query(`
            UPDATE Users 
            SET name = $1, 
                email = $2, 
                account_status = $3,
                updated_at = NOW()
            WHERE id = $4
            RETURNING *
        `, [name, email, account_status || 'active', id]);
    
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário', details: error });
    }
};

export const deleteFinanceUsers = async (req: Request, res: Response) => {
    const { house_id, id } = req.params;
    
    try {
        const dbManager = DatabaseManager.getInstance();
        const housePool = await dbManager.getHousePool(house_id);
    
        const result = await housePool.query(
            'DELETE FROM Users WHERE id = $1 RETURNING *',
            [id]
        );
    
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Erro ao deletar usuário', details: error });
    }
};

