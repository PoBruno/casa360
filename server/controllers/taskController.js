const pool = require('../db');

exports.getAllTasks = async (req, res) => {
  try {
    const { houseId } = req.params;
    const result = await pool.query(
      `SELECT t.*, tt.name as task_type, tt.is_financial, u.name as assigned_to_name,
              CASE WHEN tt.is_financial THEN fi.amount ELSE NULL END as amount,
              CASE WHEN tt.is_financial THEN fe.is_income ELSE NULL END as is_income
       FROM Tasks t
       JOIN Task_Types tt ON t.task_type_id = tt.id
       LEFT JOIN Users u ON t.assigned_to = u.id
       LEFT JOIN Finance_Installments fi ON t.finance_installment_id = fi.id
       LEFT JOIN Finance_Entries fe ON fi.finance_entries_id = fe.id
       WHERE t.house_id = $1
       ORDER BY 
         CASE WHEN t.status = 'pending' AND t.due_date < CURRENT_DATE THEN 0
              WHEN t.status = 'pending' THEN 1
              ELSE 2 END,
         t.due_date ASC`,
      [houseId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
};

exports.createTask = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { title, description, taskTypeId, priority, dueDate, 
            assignedTo, createdBy, recurrence, houseId } = req.body;
    
    // Inserir a tarefa
    const taskResult = await client.query(
      `INSERT INTO Tasks (title, description, task_type_id, status, priority, 
                          due_date, assigned_to, created_by, house_id)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8) 
       RETURNING id`,
      [title, description, taskTypeId, priority, dueDate, assignedTo, createdBy, houseId]
    );
    
    const taskId = taskResult.rows[0].id;
    
    // Se houver configuração de recorrência
    if (recurrence) {
      await client.query(
        `INSERT INTO Task_Recurrence (task_id, recurrence_type, interval_value, 
                                     weekdays, day_of_month, month_of_year, end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [taskId, recurrence.type, recurrence.interval, recurrence.weekdays,
         recurrence.dayOfMonth, recurrence.monthOfYear, recurrence.endDate]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ id: taskId, message: 'Tarefa criada com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  } finally {
    client.release();
  }
};

exports.completeTask = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Atualizar status da tarefa para concluído
    const taskResult = await client.query(
      `UPDATE Tasks 
       SET status = 'completed', updated_at = NOW() 
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    if (taskResult.rowCount === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    const task = taskResult.rows[0];
    
    // Se for uma tarefa financeira, marcar a parcela como paga também
    if (task.finance_installment_id) {
      await client.query(
        `UPDATE Finance_Installments 
         SET status = 'paid', updated_at = NOW() 
         WHERE id = $1`,
        [task.finance_installment_id]
      );
      
      // As funções de trigger devem gerenciar automaticamente as consequências
      // como atualizar a carteira do usuário, gerar próxima parcela recorrente, etc.
    }
    
    // Criar uma notificação de conclusão da tarefa
    await client.query(
      `INSERT INTO Notifications (user_id, title, message, related_type, related_id)
       VALUES ($1, 'Tarefa Concluída', $2, 'task', $3)`,
      [req.user.id, `A tarefa "${task.title}" foi concluída.`, task.id]
    );
    
    await client.query('COMMIT');
    
    res.json({ message: 'Tarefa marcada como concluída' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erro ao concluir tarefa' });
  } finally {
    client.release();
  }
};

// Implementações adicionais: updateTask, deleteTask, getTasksForCalendar