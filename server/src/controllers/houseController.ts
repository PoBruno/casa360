import { Request, Response } from 'express';
import { createHouseEntry, createHouseDatabase, executeHouseTablesScript } from '../services/houseService';
import DatabaseManager from '../services/databaseManager';

export const createHouse = async (req: Request, res: Response) => {
  const { houseName, address } = req.body;
  const userId = req.user?.id; // Pega o userId do token
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  if (!houseName) {
    return res.status(400).json({ message: 'House name is required' });
  }

  try {
    const house = await createHouseEntry({ 
      user_id: userId, 
      house_name: houseName 
    });
    
    // Create database using house.id instead of house_name
    await createHouseDatabase(house.id);
    await executeHouseTablesScript(house.id);

    res.status(201).json({ houseId: house.id });
  } catch (error) {
    console.error('Error creating house:', error);
    res.status(500).json({ message: 'Error creating house', error });
  }
};

export const getHousesByUser = async (req: Request, res: Response) => {
  const userId = req.user?.id; // Pega o userId do token
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const dbManager = DatabaseManager.getInstance();
    const userPool = await dbManager.getUserPool();

    const result = await userPool.query('SELECT * FROM houses WHERE user_id = $1', [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching houses:', error);
    res.status(500).json({ message: 'Error fetching houses', error });
  }
};
