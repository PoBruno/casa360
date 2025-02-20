import DatabaseManager from '../services/databaseManager';

export const getFinanceData = async (req: Request, res: Response) => {
  try {
    const { houseId } = req.params;
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(houseId);

    const result = await housePool.query('SELECT * FROM Finance_Entries');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching finance data' });
  }
};
