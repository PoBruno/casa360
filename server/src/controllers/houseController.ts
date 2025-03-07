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

export const getUserHouses = async (req: Request, res: Response) => {
  const userId = req.user?.id; // Get userId from the token
  
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - User not authenticated' });
  }

  try {
    const dbManager = DatabaseManager.getInstance();
    const userPool = await dbManager.getUserPool();

    // Query the house_users table to get all houses including the user's role
    const result = await userPool.query(`
      SELECT h.id, h.house_name, h.created_at, hu.role 
      FROM houses h
      JOIN house_users hu ON h.id = hu.house_id
      WHERE hu.user_id = $1
      ORDER BY h.created_at DESC
    `, [userId]);

    res.status(200).json({
      count: result.rows.length,
      houses: result.rows
    });
  } catch (error) {
    console.error('Error fetching user houses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch houses', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};
