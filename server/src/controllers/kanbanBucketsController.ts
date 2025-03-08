import { Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

// Get all kanban buckets
export const getKanbanBuckets = async (req: Request, res: Response) => {
  try {
    const house_id = req.params.house_id;
    
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    
    const query = `
      SELECT * FROM Kanban_Buckets 
      ORDER BY position ASC
    `;
    
    const { rows } = await housePool.query(query);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error getting kanban buckets:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get kanban bucket by ID
export const getKanbanBucketById = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params;
    
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    
    const query = `
      SELECT * FROM Kanban_Buckets 
      WHERE id = $1
    `;
    
    const { rows } = await housePool.query(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Kanban bucket not found' });
    }
    
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error getting kanban bucket by ID:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new kanban bucket
export const createKanbanBucket = async (req: Request, res: Response) => {
  try {
    const { name, position, filter, config } = req.body;
    const house_id = req.params.house_id;
    
    if (!name || position === undefined) {
      return res.status(400).json({ message: 'Name and position are required' });
    }
    
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    
    const query = `
      INSERT INTO Kanban_Buckets (name, position, filter, config)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const { rows } = await housePool.query(query, [name, position, filter, config]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating kanban bucket:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a kanban bucket
export const updateKanbanBucket = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params;
    const { name, position, filter, config } = req.body;
    
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    
    // Check if the bucket exists
    const checkQuery = 'SELECT * FROM Kanban_Buckets WHERE id = $1';
    const checkResult = await housePool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Kanban bucket not found' });
    }
    
    const query = `
      UPDATE Kanban_Buckets
      SET 
        name = COALESCE($1, name),
        position = COALESCE($2, position),
        filter = COALESCE($3, filter),
        config = COALESCE($4, config),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    
    const { rows } = await housePool.query(query, [name, position, filter, config, id]);
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error updating kanban bucket:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a kanban bucket
export const deleteKanbanBucket = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params;
    
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    
    // Check if the bucket exists
    const checkQuery = 'SELECT * FROM Kanban_Buckets WHERE id = $1';
    const checkResult = await housePool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Kanban bucket not found' });
    }
    
    const query = `
      DELETE FROM Kanban_Buckets
      WHERE id = $1
      RETURNING *
    `;
    
    const { rows } = await housePool.query(query, [id]);
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error deleting kanban bucket:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};