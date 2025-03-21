const pool = require('../db');
const { addDays, addWeeks, addMonths } = require('date-fns');

exports.generateRecurringTasks = async () => {
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Buscar tarefas recorrentes que precisam de novas instâncias
      const recurringTasks = await client.query(`
        SELECT t.*, r.* FROM Tasks t
        JOIN Task_Recurrence r ON r.task_id = t.id
        WHERE t.status = 'completed'
        AND (r.end_date IS NULL OR r.end_date > CURRENT_DATE)
        AND NOT EXISTS (
          SELECT 1 FROM Tasks 
          WHERE due_date > t.due_date 
          AND created_by = t.created_by
          AND title = t.title
        )
      `);
      
      for (const task of recurringTasks.rows) {
        // Calcular próxima data com base no tipo de recorrência
        let nextDueDate;
        
        switch (task.recurrence_type) {
          case 'daily':
            nextDueDate = addDays(new Date(task.due_date), task.interval_value);
            break;
          case 'weekly':
            nextDueDate = addWeeks(new Date(task.due_date), task.interval_value);
            break;
          case 'monthly':
            nextDueDate = addMonths(new Date(task.due_date), task.interval_value);
            break;
          // Outros casos...
        }
        
        // Criar próxima tarefa
        await client.query(`
          INSERT INTO Tasks (title, description, task_type_id, status, priority, 
                           due_date, assigned_to, created_by, house_id)
          VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8)
        `, [task.title, task.description, task.task_type_id, 
            task.priority, nextDueDate, task.assigned_to, task.created_by, task.house_id]);
      }
      
      await client.query('COMMIT');
      console.log(`${recurringTasks.rowCount} tarefas recorrentes processadas`);
      
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao processar tarefas recorrentes:', err);
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  }
};

exports.markOverdueTasks = async () => {
  try {
    const client = await pool.connect();
    
    try {
      // Marcar tarefas como atrasadas
      const result = await client.query(`
        UPDATE Tasks
        SET status = 'overdue'
        WHERE status = 'pending'
        AND due_date < CURRENT_DATE
        RETURNING id, title, assigned_to
      `);
      
      // Criar notificações para tarefas atrasadas
      if (result.rowCount > 0) {
        const notifications = result.rows.map(task => ({
          user_id: task.assigned_to,
          title: 'Tarefa Atrasada',
          message: `A tarefa "${task.title}" está atrasada.`,
          related_type: 'task',
          related_id: task.id
        }));
        
        for (const notification of notifications) {
          await client.query(`
            INSERT INTO Notifications (user_id, title, message, related_type, related_id)
            VALUES ($1, $2, $3, $4, $5)
          `, [notification.user_id, notification.title, notification.message, 
              notification.related_type, notification.related_id]);
        }
      }
      
      console.log(`${result.rowCount} tarefas marcadas como atrasadas`);
    } catch (err) {
      console.error('Erro ao marcar tarefas atrasadas:', err);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  }
};