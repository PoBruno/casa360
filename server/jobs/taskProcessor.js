const cron = require('node-cron');
const taskRecurrenceService = require('../services/taskRecurrenceService');
const notificationService = require('../services/notificationService');

// Processar tarefas recorrentes todos os dias à meia-noite
cron.schedule('0 0 * * *', async () => {
  console.log('Executando job de processamento de tarefas recorrentes...');
  try {
    await taskRecurrenceService.generateRecurringTasks();
  } catch (error) {
    console.error('Erro no job de tarefas recorrentes:', error);
  }
});

// Enviar notificações de tarefas do dia atual às 7 da manhã
cron.schedule('0 7 * * *', async () => {
  console.log('Enviando notificações de tarefas diárias...');
  try {
    await notificationService.sendDailyTaskNotifications();
  } catch (error) {
    console.error('Erro no job de notificações:', error);
  }
});

// Verificar tarefas atrasadas às 23h
cron.schedule('0 23 * * *', async () => {
  console.log('Verificando tarefas atrasadas...');
  try {
    await taskRecurrenceService.markOverdueTasks();
  } catch (error) {
    console.error('Erro ao marcar tarefas atrasadas:', error);
  }
});

console.log('Jobs de tarefas agendados com sucesso');