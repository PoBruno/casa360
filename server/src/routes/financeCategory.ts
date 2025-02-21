import { Router } from 'express';
import { Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

const router = Router({ mergeParams: true });

// GET: Lista todas as categorias
router.get('/', async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params;
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    
    const result = await housePool.query(`
      SELECT 
        fc.*, 
        pc.name as parent_category_name
      FROM Finance_Category fc
      LEFT JOIN Finance_Category pc ON fc.parent_category_id = pc.id
      ORDER BY fc.id`);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching finance categories:', error);
    res.status(500).json({ error: 'Error fetching finance categories' });
  }
});

// GET: Retorna uma categoria financeira por ID para a house informada
router.get('/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query('SELECT * FROM Finance_Category WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Finance category not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching finance category' });
  }
});

// POST: Insere uma nova categoria financeira para a house informada
router.post('/', async (req: Request, res: Response) => {
  const { house_id } = req.params;
  const { name, parent_category_id, description } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query(
      `INSERT INTO Finance_Category (name, parent_category_id, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`,
      [name, parent_category_id || null, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao inserir Finance_Category' });
  }
});

// PUT: Atualiza uma categoria financeira por ID para a house informada
router.put('/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const { name, parent_category_id, description } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query(
      `UPDATE Finance_Category 
       SET name = $1, parent_category_id = $2, description = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [name, parent_category_id || null, description, id]
    );
    if (result.rows.length > 0) res.status(200).json(result.rows[0]);
    else res.status(404).json({ message: 'Finance_Category não encontrada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar Finance_Category' });
  }
});

// DELETE: Remove uma categoria financeira por ID para a house informada
router.delete('/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query('DELETE FROM Finance_Category WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) res.status(200).json({ message: 'Finance_Category removida com sucesso' });
    else res.status(404).json({ message: 'Finance_Category não encontrada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar Finance_Category' });
  }
});

export default router;
