-- Conectar ao template
\c data-casa;



CREATE DATABASE casa WITH TEMPLATE house_template;


------------------------------------------------------------
-- Inserção de Dados Iniciais para Simulação
------------------------------------------------------------

-- 1. Inserir Usuários (Joao e Maria)
INSERT INTO users (username, email, password_hash)
VALUES
  ('joao', 'joao@example.com', 'hash_joao'),
  ('maria', 'maria@example.com', 'hash_maria');

-- 2. Inserir Payers (associados aos usuários)
INSERT INTO payers (name, description)
VALUES
  ('Joao', 'Payer referente ao usuário Joao'),
  ('Maria', 'Payer referente à usuária Maria');

-- 3. Inserir Frequência (exemplo: recorrência mensal)
INSERT INTO frequency (name, description, scheduler_cron)
VALUES
  ('Mensal', 'Recorrência mensal', '0 0 1 * *');

-- 4. Inserir Centros de Custo
INSERT INTO cost_center (name, description)
VALUES
  ('Moradia', 'Despesas relacionadas a moradia'),
  ('Alimentação', 'Despesas com alimentação'),
  ('Receitas', 'Fontes de renda');

-- 5. Inserir Categorias
-- Categoria para Aluguel (dentro de Moradia)
INSERT INTO category (cost_center_id, name, description)
VALUES (
  (SELECT id FROM cost_center WHERE name = 'Moradia'),
  'Aluguel',
  'Pagamento de aluguel mensal'
);
-- Categoria para Compras de Supermercado (dentro de Alimentação)
INSERT INTO category (cost_center_id, name, description)
VALUES (
  (SELECT id FROM cost_center WHERE name = 'Alimentação'),
  'Supermercado',
  'Compras de supermercado'
);
-- Categoria para Salário (dentro de Receitas)
INSERT INTO category (cost_center_id, name, description)
VALUES (
  (SELECT id FROM cost_center WHERE name = 'Receitas'),
  'Salário',
  'Renda mensal proveniente do trabalho'
);

-- 6. Inserir Moeda (BRL)
INSERT INTO currency (code, symbol, exchange_rate)
VALUES ('BRL', 'R$', 1.0000);

------------------------------------------------------------
-- Cadastro de Pagamentos e Rateios
------------------------------------------------------------

-- 7. Pagamento individual do Joao (100%)
INSERT INTO payment (payer_id, percentage)
VALUES (
  (SELECT id FROM payers WHERE name = 'Joao'),
  100.00
);

-- 8. Pagamento individual da Maria (100%)
INSERT INTO payment (payer_id, percentage)
VALUES (
  (SELECT id FROM payers WHERE name = 'Maria'),
  100.00
);

-- 9. Pagamento para o casal (rateado: 50% para Joao e 50% para Maria)
-- Aqui inserimos um registro de payment com um dummy payer_id (poderia ser qualquer um dos dois)
INSERT INTO payment (payer_id, percentage)
VALUES (
  (SELECT id FROM payers WHERE name = 'Joao'),
  0.00  -- Valor dummy; rateio definido em payment_details
);
-- Supondo que o pagamento para casal tenha id = 3, insere os detalhes:
INSERT INTO payment_details (payment_id, payer_id, percentage)
VALUES
  (3, (SELECT id FROM payers WHERE name = 'Joao'), 50.00),
  (3, (SELECT id FROM payers WHERE name = 'Maria'), 50.00);

------------------------------------------------------------
-- Lançamentos Financeiros (Finance_Entries) - Período de 3 Meses
------------------------------------------------------------

-- 10. Despesa: Aluguel (utilizando pagamento do casal – 50/50)
INSERT INTO finance_entries (
  user_id,
  category_id,
  currency_id,
  amount,
  frequency_id,
  start_date,
  end_date,
  description,
  type,
  payment_id
)
VALUES (
  (SELECT id FROM users WHERE username = 'joao'),  -- associação apenas para identificação
  (SELECT id FROM category WHERE name = 'Aluguel'),
  (SELECT id FROM currency WHERE code = 'BRL'),
  2000.00,
  (SELECT id FROM frequency WHERE name = 'Mensal'),
  '2025-01-01',  -- data inicial
  '2025-03-01',  -- tasks geradas para 01/01, 01/02 e 01/03
  'Pagamento de aluguel mensal (casal)',
  true,         -- despesa
  3             -- referência ao pagamento rateado (casal)
);

-- 11. Despesa: Compras no Supermercado (utilizando pagamento individual da Maria)
INSERT INTO finance_entries (
  user_id,
  category_id,
  currency_id,
  amount,
  frequency_id,
  start_date,
  end_date,
  description,
  type,
  payment_id
)
VALUES (
  (SELECT id FROM users WHERE username = 'maria'),
  (SELECT id FROM category WHERE name = 'Supermercado'),
  (SELECT id FROM currency WHERE code = 'BRL'),
  800.00,
  (SELECT id FROM frequency WHERE name = 'Mensal'),
  '2025-01-10',
  '2025-03-10',
  'Compras de supermercado',
  true,
  2             -- pagamento individual da Maria (100%)
);

-- 12. Receita: Salário (utilizando pagamento individual do Joao)
INSERT INTO finance_entries (
  user_id,
  category_id,
  currency_id,
  amount,
  frequency_id,
  start_date,
  end_date,
  description,
  type,
  payment_id
)
VALUES (
  (SELECT id FROM users WHERE username = 'joao'),
  (SELECT id FROM category WHERE name = 'Salário'),
  (SELECT id FROM currency WHERE code = 'BRL'),
  5000.00,
  (SELECT id FROM frequency WHERE name = 'Mensal'),
  '2025-01-05',
  '2025-03-05',
  'Salário mensal',
  false,      -- receita
  1             -- pagamento individual do Joao (100%)
);

------------------------------------------------------------
-- Simulação de Finalização de Tasks (Atualizando o Status para true)
------------------------------------------------------------
-- Os triggers associados aos Finance_Entries gerarão tasks recorrentes conforme as datas e recorrência definida.
-- A seguir, simulamos a finalização (status = true) das tasks para disparar a inserção em transactions e a atualização das wallets.

-- Finalizar tasks referentes ao Aluguel (casal)
UPDATE tasks
SET status = true
WHERE entry_type = 'Finance_Entries'
  AND entry_id = (SELECT id FROM finance_entries WHERE description = 'Pagamento de aluguel mensal (casal)')
  AND due_date BETWEEN '2025-01-01' AND '2025-03-01';

-- Finalizar tasks referentes às Compras de Supermercado
UPDATE tasks
SET status = true
WHERE entry_type = 'Finance_Entries'
  AND entry_id = (SELECT id FROM finance_entries WHERE description = 'Compras de supermercado')
  AND due_date BETWEEN '2025-01-10' AND '2025-03-10';

-- Finalizar tasks referentes ao Salário
UPDATE tasks
SET status = true
WHERE entry_type = 'Finance_Entries'
  AND entry_id = (SELECT id FROM finance_entries WHERE description = 'Salário mensal')
  AND due_date BETWEEN '2025-01-05' AND '2025-03-05';

------------------------------------------------------------
-- Observações Finais:
------------------------------------------------------------
-- Após a finalização das tasks:
--   - O trigger "trg_task_status_to_transaction" criará registros em transactions para as tasks finalizadas associadas a Finance_Entries.
--   - O trigger "trg_transaction_insert_wallet_update" atualizará a wallet dos payers de acordo com os rateios:
--       * No caso do aluguel, a wallet de Joao e Maria será atualizada com 50% do valor de cada task.
--       * Para as despesas e receitas individuais, a wallet do respectivo usuário será atualizada em 100%.
--
-- Para conferir os resultados, execute:
--   SELECT * FROM transactions;
--   SELECT * FROM wallet;


------------------------------------------------------------
-- 1. Frequências específicas para tarefas domésticas
------------------------------------------------------------
-- Frequência: Dia do Lixo (todas as quartas e quintas-feiras)
INSERT INTO frequency (name, description, scheduler_cron)
VALUES ('Trash Day', 'Tarefas de tirar o lixo: quartas e quintas-feiras', '0 0 * * 3,4');

-- Frequência: Limpeza Geral (aos sábados)
INSERT INTO frequency (name, description, scheduler_cron)
VALUES ('House Cleaning', 'Limpeza geral da casa aos sábados', '0 0 * * 6');

-- Frequência: Rega das Plantas (aos domingos, por exemplo)
INSERT INTO frequency (name, description, scheduler_cron)
VALUES ('Plant Watering', 'Regar as plantas aos domingos', '0 0 * * 0');

------------------------------------------------------------
-- 2. Criar centro de custo e categoria para tarefas domésticas
------------------------------------------------------------
-- Inserir centro de custo para a casa, se necessário
INSERT INTO cost_center (name, description)
VALUES ('Casa', 'Tarefas e manutenções da residência');

-- Inserir categoria para tarefas domésticas
INSERT INTO category (cost_center_id, name, description)
VALUES (
    (SELECT id FROM cost_center WHERE name = 'Casa'),
    'Tarefas Domésticas',
    'Tarefas relacionadas à manutenção e organização da casa'
);

------------------------------------------------------------
-- 3. Inserir Task_Entries para simulação de tarefas (sem associação com financeiro)
------------------------------------------------------------
-- Exemplo 1: Tarefa "Tirar o lixo" para o usuário Joao (id = 1)
INSERT INTO task_entries (
    user_id,
    category_id,
    currency_id,
    amount,
    frequency_id,
    start_date,
    end_date,
    description
)
VALUES (
    1, -- usuário Joao
    (SELECT id FROM category WHERE name = 'Tarefas Domésticas'),
    1, -- moeda BRL
    0.00, -- valor irrelevante para tarefas
    (SELECT id FROM frequency WHERE name = 'Trash Day'),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'Tirar o lixo (quartas e quintas)'
);

-- Exemplo 2: Tarefa "Limpeza Geral da Casa" para o usuário Maria (id = 2)
INSERT INTO task_entries (
    user_id,
    category_id,
    currency_id,
    amount,
    frequency_id,
    start_date,
    end_date,
    description
)
VALUES (
    2, -- usuário Maria
    (SELECT id FROM category WHERE name = 'Tarefas Domésticas'),
    1,
    0.00,
    (SELECT id FROM frequency WHERE name = 'House Cleaning'),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'Limpeza geral da casa'
);

-- Exemplo 3: Tarefa "Regar as Plantas" para o usuário Joao (id = 1)
INSERT INTO task_entries (
    user_id,
    category_id,
    currency_id,
    amount,
    frequency_id,
    start_date,
    end_date,
    description
)
VALUES (
    1,
    (SELECT id FROM category WHERE name = 'Tarefas Domésticas'),
    1,
    0.00,
    (SELECT id FROM frequency WHERE name = 'Plant Watering'),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '15 days',
    'Regar as plantas'
);

