import { Router, Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

// Use mergeParams to access parent router parameters
const router = Router({ mergeParams: true });

// Define interface for request params
interface HouseRequestParams {
  house_id: string;
}

interface HouseIdAndItemParams extends HouseRequestParams {
  id: string;
}

// GET: Lista todas as moedas/taxas de câmbio
router.get('/', async (req: Request<HouseRequestParams>, res: Response) => {
  try {
    const { house_id } = req.params;
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    
    const result = await housePool.query('SELECT * FROM Finance_Currency ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao buscar moedas/taxas de câmbio',
      details: error
    });
  }
});

// GET: Retorna uma moeda por ID
router.get('/:id', async (req: Request<HouseIdAndItemParams>, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    
    const result = await housePool.query(
      'SELECT * FROM Finance_Currency WHERE id = $1',
      [id]
    );
    
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Moeda não encontrada' });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao buscar moeda',
      details: error
    });
  }
});

// POST: Insere uma nova moeda
router.post('/', async (req: Request<HouseRequestParams>, res: Response) => {
  const { house_id } = req.params;
  const { name, symbol, exchange_rate } = req.body;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    
    const result = await housePool.query(
      `INSERT INTO Finance_Currency (name, symbol, exchange_rate, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`,
      [name, symbol, exchange_rate]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao criar moeda',
      details: error
    });
  }
});

// PUT: Atualiza uma moeda por ID
router.put('/:id', async (req: Request<HouseIdAndItemParams>, res: Response) => {
  const { house_id, id } = req.params;
  const { name, symbol, exchange_rate } = req.body;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    
    const result = await housePool.query(
      `UPDATE Finance_Currency 
       SET name = $1, symbol = $2, exchange_rate = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [name, symbol, exchange_rate, id]
    );
    
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Moeda não encontrada' });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao atualizar moeda',
      details: error
    });
  }
});

// DELETE: Remove uma moeda por ID
router.delete('/:id', async (req: Request<HouseIdAndItemParams>, res: Response) => {
  const { house_id, id } = req.params;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    
    await housePool.query(
      'DELETE FROM Finance_Currency WHERE id = $1',
      [id]
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao remover moeda',
      details: error
    });
  }
});

export default router;