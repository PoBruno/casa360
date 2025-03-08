import { Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

export const getFinanceInstallments = async (req: Request, res: Response) => {
  const { house_id } = req.params;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(`
      SELECT 
        fi.*,
        fe.description as entry_description,
        fe.is_income,
        fe.amount as entry_amount
      FROM Finance_Installments fi
      JOIN Finance_Entries fe ON fi.finance_entries_id = fe.id
      ORDER BY fi.due_date DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching installments:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar parcelas', 
      details: error 
    });
  }
};

export const getFinanceInstallmentById = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(`
      SELECT 
        fi.*,
        fe.description as entry_description,
        fe.is_income,
        fe.amount as entry_amount
      FROM Finance_Installments fi
      JOIN Finance_Entries fe ON fi.finance_entries_id = fe.id
      WHERE fi.id = $1
    `, [id]);

    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Parcela não encontrada' });
    }
  } catch (error) {
    console.error('Error fetching installment:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar parcela', 
      details: error 
    });
  }
};

export const createFinanceInstallment = async (req: Request, res: Response) => {
  const { house_id } = req.params;
  const {
    finance_entries_id,
    installment_number,
    due_date,
    amount,
    status = 'pending',
    category,
    priority,
    assignee,
    comments,
    tags,
    history
  } = req.body;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    // Check if finance_entries_id exists
    const entryExists = await housePool.query(
      'SELECT 1 FROM Finance_Entries WHERE id = $1',
      [finance_entries_id]
    );
    
    if (entryExists.rows.length === 0) {
      return res.status(400).json({ message: 'Finance Entry não encontrado' });
    }

    // Check for duplicate installment number
    const duplicateCheck = await housePool.query(
      'SELECT 1 FROM Finance_Installments WHERE finance_entries_id = $1 AND installment_number = $2',
      [finance_entries_id, installment_number]
    );
    
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Já existe uma parcela com este número para esta entrada financeira' 
      });
    }

    const result = await housePool.query(
      `INSERT INTO Finance_Installments (
        finance_entries_id, installment_number, due_date, 
        amount, status, category, priority, assignee, 
        comments, tags, history
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        finance_entries_id, installment_number, due_date,
        amount, status, category, priority, assignee,
        comments, tags, history || '{}'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating installment:', error);
    res.status(500).json({ 
      error: 'Erro ao criar parcela', 
      details: error 
    });
  }
};

export const updateInstallmentStatus = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const { status } = req.body;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'UPDATE Finance_Installments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Parcela não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status da parcela', details: error });
  }
};

export const updateFinanceInstallment = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const { 
    finance_entries_id, 
    installment_number, 
    due_date, 
    amount, 
    status,
    category,
    priority,
    assignee,
    comments,
    tags,
    history
  } = req.body;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    
    // Check if finance_entries_id exists if provided
    if (finance_entries_id) {
      const entryExists = await housePool.query(
        'SELECT 1 FROM Finance_Entries WHERE id = $1',
        [finance_entries_id]
      );
      
      if (entryExists.rows.length === 0) {
        return res.status(400).json({ message: 'Finance Entry não encontrado' });
      }
    }

    // Check if changing to duplicate installment number
    if (finance_entries_id && installment_number) {
      const duplicateCheck = await housePool.query(
        'SELECT 1 FROM Finance_Installments WHERE finance_entries_id = $1 AND installment_number = $2 AND id != $3',
        [finance_entries_id, installment_number, id]
      );
      
      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({ 
          message: 'Já existe uma parcela com este número para esta entrada financeira' 
        });
      }
    }

    const result = await housePool.query(
      `UPDATE Finance_Installments SET 
        finance_entries_id = $1,
        installment_number = $2,
        due_date = $3,
        amount = $4,
        status = $5,
        category = $6,
        priority = $7,
        assignee = $8,
        comments = $9,
        tags = $10,
        history = $11,
        updated_at = NOW()
      WHERE id = $12 RETURNING *`,
      [
        finance_entries_id, 
        installment_number, 
        due_date, 
        amount, 
        status,
        category,
        priority,
        assignee,
        comments,
        tags,
        history,
        id
      ]
    );

    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Parcela não encontrada' });
    }
  } catch (error) {
    console.error('Error updating installment:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar parcela', 
      details: error 
    });
  }
};

export const deleteFinanceInstallment = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'DELETE FROM Finance_Installments WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Parcela não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir parcela', details: error });
  }
};

export const patchFinanceInstallment = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const updates = req.body;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    
    // Check if finance_entries_id exists if provided
    if (updates.finance_entries_id) {
      const entryExists = await housePool.query(
        'SELECT 1 FROM Finance_Entries WHERE id = $1',
        [updates.finance_entries_id]
      );
      
      if (entryExists.rows.length === 0) {
        return res.status(400).json({ message: 'Finance Entry não encontrado' });
      }
    }

    // Check if changing to duplicate installment number
    if (updates.finance_entries_id && updates.installment_number) {
      const duplicateCheck = await housePool.query(
        'SELECT 1 FROM Finance_Installments WHERE finance_entries_id = $1 AND installment_number = $2 AND id != $3',
        [updates.finance_entries_id, updates.installment_number, id]
      );
      
      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({ 
          message: 'Já existe uma parcela com este número para esta entrada financeira' 
        });
      }
    }
    
    // Construct dynamic SET clause based on provided fields
    const setClause = [];
    const values = [];
    let paramCount = 1;
    
    // Process each update field
    for (const [key, value] of Object.entries(updates)) {
      // Skip id as it's not something we want to update
      if (key === 'id') continue;
      
      setClause.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
    
    // Always update the updated_at timestamp
    setClause.push(`updated_at = NOW()`);
    
    // Add the id as the last parameter
    values.push(id);
    
    // If no valid fields to update, return error
    if (setClause.length <= 1) {
      return res.status(400).json({ 
        error: 'Nenhum campo válido para atualização fornecido' 
      });
    }
    
    const query = `
      UPDATE Finance_Installments 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING *
    `;
    
    const result = await housePool.query(query, values);
    
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Parcela não encontrada' });
    }
  } catch (error) {
    console.error('Error updating installment:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar parcela', 
      details: error 
    });
  }
};
