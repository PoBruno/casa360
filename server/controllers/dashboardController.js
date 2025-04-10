const pool = require('../db');

exports.getDashboardData = async (req, res) => {
  try {
    const { houseId } = req.params;
    const result = {};
    
    // Buscar resumo financeiro
    const financialQuery = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN is_income=true THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN is_income=false THEN amount ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN is_income=true THEN amount ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN is_income=false THEN amount ELSE 0 END), 0) as balance,
        COUNT(CASE WHEN status IN ('pending', 'overdue') AND is_income=false THEN 1 END) as pending_payments
      FROM Finance_Entries fe
      JOIN Finance_Installments fi ON fi.finance_entries_id = fe.id
      WHERE fe.house_id = $1
    `, [houseId]);
    
    // Buscar resumo de tarefas
    const taskQuery = await pool.query(`
      SELECT
        COUNT(CASE WHEN status = 'pending' AND due_date >= CURRENT_DATE THEN 1 END) as pending_count,
        COUNT(CASE WHEN status IN ('pending', 'overdue') AND due_date < CURRENT_DATE THEN 1 END) as overdue_count,
        COUNT(CASE WHEN status = 'completed' AND updated_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_completed
      FROM Tasks
      WHERE house_id = $1
    `, [houseId]);
    
    // Buscar eventos próximos
    const upcomingEventsQuery = await pool.query(`
      SELECT t.id, t.title, t.description, t.due_date, t.status, tt.name as task_type, tt.is_financial,
             u.name as assigned_to_name,
             CASE WHEN tt.is_financial THEN fi.amount ELSE NULL END as amount,
             CASE WHEN tt.is_financial THEN fe.is_income ELSE NULL END as is_income
      FROM Tasks t
      JOIN Task_Types tt ON t.task_type_id = tt.id
      LEFT JOIN Users u ON t.assigned_to = u.id
      LEFT JOIN Finance_Installments fi ON t.finance_installment_id = fi.id
      LEFT JOIN Finance_Entries fe ON fi.finance_entries_id = fe.id
      WHERE t.house_id = $1
        AND t.status = 'pending'
        AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 days'
      ORDER BY t.due_date ASC
      LIMIT 10
    `, [houseId]);
    
    // Buscar atividades recentes
    const recentActivitiesQuery = await pool.query(`
      (SELECT 
        'task_completed' as activity_type,
        t.title as description,
        t.updated_at as timestamp,
        u.name as user_name
       FROM Tasks t
       JOIN Users u ON t.assigned_to = u.id
       WHERE t.house_id = $1 AND t.status = 'completed' AND t.updated_at >= CURRENT_DATE - INTERVAL '7 days')
      UNION
      (SELECT 
        'payment_made' as activity_type,
        fe.description as description,
        fi.updated_at as timestamp,
        u.name as user_name
       FROM Finance_Installments fi
       JOIN Finance_Entries fe ON fi.finance_entries_id = fe.id
       JOIN Users u ON fe.user_id = u.id
       WHERE fe.house_id = $1 AND fi.status = 'paid' AND fi.updated_at >= CURRENT_DATE - INTERVAL '7 days')
      ORDER BY timestamp DESC
      LIMIT 15
    `, [houseId]);
    
    // Montar objeto de resposta
    result.financials = {
      income: financialQuery.rows[0].total_income,
      expenses: financialQuery.rows[0].total_expenses,
      balance: financialQuery.rows[0].balance,
      pendingPayments: financialQuery.rows[0].pending_payments
    };
    
    result.tasks = {
      pending: taskQuery.rows[0].pending_count,
      overdue: taskQuery.rows[0].overdue_count,
      completed: taskQuery.rows[0].recent_completed
    };
    
    result.upcomingEvents = upcomingEventsQuery.rows;
    result.recentActivities = recentActivitiesQuery.rows;
    
    res.json(result);
    
  } catch (err) {
    console.error('Erro ao buscar dados do dashboard:', err);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
};