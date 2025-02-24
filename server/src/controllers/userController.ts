import { Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

const dbManager = DatabaseManager.getInstance();

export const createHouse = async (req: Request, res: Response) => {
    const { userId, houseName } = req.body;
    if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    try {
        const dbManager = DatabaseManager.getInstance();
        const userPool = await dbManager.getUserPool();

        const result = await userPool.query(
            'INSERT INTO houses (user_id, house_name) VALUES ($1, $2) RETURNING id',
            [userId, houseName]
        );

        const houseId = result.rows[0].id;
        await dbManager.createHouseDatabase(houseId);

        await userPool.query(
            'INSERT INTO house_users (user_id, house_id, role) VALUES ($1, $2, $3)',
            [userId, houseId, 'owner']
        );

        res.status(201).json({ houseId });
    } catch (error) {
        console.error('Error creating house:', error);
        res.status(500).json({ message: 'Error creating house', error: error.message, stack: error.stack });
    }
    } catch (error) {
        res.status(500).json({ message: 'Error creating house', error });
    }
};

export const getHousesByUser = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    try {
        const dbManager = DatabaseManager.getInstance();
        const userPool = await dbManager.getUserPool();

        const result = await userPool.query('SELECT * FROM houses WHERE user_id = $1', [userId]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching houses', error });
    }
};