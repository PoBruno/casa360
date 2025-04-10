const pool = require('../db');

exports.sendDailyTaskNotifications = async () => {
  try {
    const client = await pool.connect();
    
    try {
      // Buscar tarefas do dia atual
      const tasks = await client.query(`
        SELECT t.id, t.title, t.assigned_to, u.name AS user_name, tt.is_financial,
               CASE WHEN tt.is_financial THEN fi.amount ELSE NULL END AS amount
        FROM Tasks t
        JOIN Task_Types tt ON t.task_type_id = tt.id
        JOIN Users u ON t.assigned_to = u.id
        LEFT JOIN Finance_Installments fi ON t.finance_installment_id = fi.id
        WHERE t.status = 'pending'
        AND t.due_date = CURRENT_DATE
      `);
      
      // Criar notificações para cada usuário com tarefas hoje
      const userTasks = {};
      
      for (const task of tasks.rows) {
        if (!userTasks[task.assigned_to]) {
          userTasks[task.assigned_to] = [];
        }
        userTasks[task.assigned_to].push(task);
      }
      
      for (const [userId, tasks] of Object.entries(userTasks)) {
        // Criar uma notificação resumida para o usuário
        await client.query(`
          INSERT INTO Notifications (user_id, title, message, is_read)
          VALUES ($1, 'Tarefas para hoje', $2, false)
        `, [
          userId, 
          `Você tem ${tasks.length} tarefa(s) para hoje. ${tasks.map(t => t.title).join(', ')}`
        ]);
      }
      
      console.log(`Notificações enviadas para ${Object.keys(userTasks).length} usuários`);
    } catch (err) {
      console.error('Erro ao enviar notificações diárias:', err);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  }
};