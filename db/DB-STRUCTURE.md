
## 1. Listagens (Cadastros)

**Usuários:**
```sql

SELECT * FROM users;


SELECT * FROM Finance_Entries;

SELECT * FROM users;

SELECT * FROM users;
```


```sql
SELECT 
    u.nome,
    u.salario,
    COALESCE(SUM(CASE WHEN l.tipo = 'DESPESA' THEN l.valor ELSE 0 END), 0) AS total_despesas,
    u.salario - COALESCE(SUM(CASE WHEN l.tipo = 'DESPESA' THEN l.valor ELSE 0 END), 0) AS saldo
FROM users u
LEFT JOIN lancamentos l 
    ON u.id = l.usuario_id
    AND l.data BETWEEN '2024-12-01' AND '2024-12-31'
GROUP BY u.id, u.nome, u.salario;

```


---


# Análise de RFP

```SQL
-- 1) Listar todas as RFPs com seus status e data de aprovação, 
--    exibindo o total estimado de custos (somatório dos produtos associados).
SELECT
    r.id AS rfp_id,
    r.title,
    r.status,
    r.approved_at,
    COALESCE(SUM(p.total_price), 0) AS total_estimated_cost
FROM RFP r
LEFT JOIN Products p ON p.rfp_id = r.id
GROUP BY r.id, r.title, r.status, r.approved_at;

-- 2) Listar RFPs classificadas por status (pending, approved, rejected) 
--    com quem criou e quem aprovou, se houver.
SELECT
    r.id AS rfp_id,
    r.title,
    r.status,
    r.created_by,
    r.approved_by
FROM RFP r
ORDER BY r.status;

-- 3) Detalhar cada RFP com os produtos associados, 
--    incluindo categorias financeiras (quando presentes).
SELECT
    r.id AS rfp_id,
    r.title,
    p.id AS product_id,
    p.name AS product_name,
    fc.name AS finance_category
FROM RFP r
LEFT JOIN Products p ON p.rfp_id = r.id
LEFT JOIN Finance_Category fc ON fc.id = p.category_id
ORDER BY r.id;

-- 4) Relacionar cada RFP ao impacto financeiro potencial, 
--    agrupando por categorias de receita/despesa (ex.: se a RFP implica gastos em certa categoria).
--    Obs.: Em um cenário real, haveria uma tabela intermediária ou link mais claro com Finance_Entries. 
--    Este exemplo assume que as categorias do produto refletem as mesmas da parte financeira.
SELECT
    r.id AS rfp_id,
    r.title,
    fc.name AS finance_category,
    COALESCE(SUM(p.total_price), 0) AS total_amount
FROM RFP r
JOIN Products p ON p.rfp_id = r.id
JOIN Finance_Category fc ON fc.id = p.category_id
GROUP BY r.id, r.title, fc.name
ORDER BY r.id, fc.name;

```













# Analise de DRE
```SQL
-- 1) Sumário de receitas e despesas em determinado período, 
--    usando is_income para separar entradas (TRUE = receitas, FALSE = despesas).
--    Ajuste as datas conforme necessário (ex.: um mês, trimestre, etc.).
SELECT
    SUM(CASE WHEN fe.is_income THEN fe.amount ELSE 0 END) AS total_receitas,
    SUM(CASE WHEN NOT fe.is_income THEN fe.amount ELSE 0 END) AS total_despesas
FROM Finance_Entries fe
WHERE fe.start_date BETWEEN '2025-01-01' AND '2025-12-31';

-- 2) Agrupar receitas e despesas por categoria (finance_category_id).
SELECT
    fc.name AS categoria,
    SUM(CASE WHEN fe.is_income THEN fe.amount ELSE 0 END) AS total_receitas,
    SUM(CASE WHEN NOT fe.is_income THEN fe.amount ELSE 0 END) AS total_despesas
FROM Finance_Entries fe
JOIN Finance_Category fc ON fc.id = fe.finance_category_id
WHERE fe.start_date BETWEEN '2025-01-01' AND '2025-12-31'
GROUP BY fc.name
ORDER BY fc.name;

-- 3) Calcular Lucros e Perdas Operacionais (receitas - despesas). 
--    Use a lógica de "recorrência" se finance_frequency_id indicar despesa/receita recorrente.
SELECT
    (SELECT SUM(fe2.amount)
     FROM Finance_Entries fe2
     WHERE fe2.is_income
       AND fe2.start_date BETWEEN '2025-01-01' AND '2025-12-31') AS total_receitas,
    (SELECT SUM(fe2.amount)
     FROM Finance_Entries fe2
     WHERE NOT fe2.is_income
       AND fe2.start_date BETWEEN '2025-01-01' AND '2025-12-31') AS total_despesas,
    (
      (SELECT COALESCE(SUM(fe2.amount), 0)
       FROM Finance_Entries fe2
       WHERE fe2.is_income
         AND fe2.start_date BETWEEN '2025-01-01' AND '2025-12-31')
      -
      (SELECT COALESCE(SUM(fe2.amount), 0)
       FROM Finance_Entries fe2
       WHERE NOT fe2.is_income
         AND fe2.start_date BETWEEN '2025-01-01' AND '2025-12-31')
    ) AS lucros_ou_perdas
;

-- 4) Margem de lucro (sob o total de receitas), considerando custo das vendas 
--    (assumindo que certas categorias representam "custo de vendas").
--    Ajuste as categorias conforme necessário (ex.: ID 1 ou nome "Custo de Vendas").
WITH custo_vendas AS (
    SELECT COALESCE(SUM(fe.amount), 0) AS total_custo
    FROM Finance_Entries fe
    JOIN Finance_Category fc ON fc.id = fe.finance_category_id
    WHERE fc.name ILIKE '%custo de vendas%'
      AND fe.start_date BETWEEN '2025-01-01' AND '2025-12-31'
      AND NOT fe.is_income
),
receitas_totais AS (
    SELECT COALESCE(SUM(fe.amount), 0) AS total_receitas
    FROM Finance_Entries fe
    WHERE fe.is_income
      AND fe.start_date BETWEEN '2025-01-01' AND '2025-12-31'
)
SELECT
    r.total_receitas,
    c.total_custo,
    (r.total_receitas - c.total_custo) AS lucro_bruto,
    CASE 
        WHEN r.total_receitas = 0 THEN 0
        ELSE ROUND(((r.total_receitas - c.total_custo) / r.total_receitas) * 100, 2)
    END AS margem_lucro_percentual
FROM receitas_totais r, custo_vendas c;

```

```sql
WITH custo_vendas AS (
    SELECT COALESCE(SUM(fe.amount), 0) AS total_custo
    FROM Finance_Entries fe
    JOIN Finance_Category fc ON fc.id = fe.finance_category_id
    WHERE fc.name ILIKE '%custo de vendas%'
      AND fe.start_date BETWEEN '2024-10-01' AND '2024-12-31'
      AND NOT fe.is_income
),
receitas_totais AS (
    SELECT COALESCE(SUM(fe.amount), 0) AS total_receitas
    FROM Finance_Entries fe
    WHERE fe.is_income
      AND fe.start_date BETWEEN '2024-10-01' AND '2024-12-31'
)
SELECT
    r.total_receitas,
    c.total_custo,
    (r.total_receitas - c.total_custo) AS lucro_bruto,
    CASE 
        WHEN r.total_receitas = 0 THEN 0
        ELSE ROUND(((r.total_receitas - c.total_custo) / r.total_receitas) * 100, 2)
    END AS margem_lucro_percentual
FROM receitas_totais r, custo_vendas c;
```



























```sql

-- Criação do banco de dados e seleção dele
CREATE DATABASE IF NOT EXISTS controle_despesas;
USE controle_despesas;

------------------------------------
-- Tabela de Usuários
------------------------------------
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    salario DECIMAL(10,2) NOT NULL,
    data_inicio DATE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exemplo de inserção dos dois usuários:
INSERT INTO usuarios (nome, salario, data_inicio) VALUES
('Bruno', 3400.00, '2024-10-01'),
('Tacy', 3400.00, '2024-10-01');

------------------------------------
-- Tabela de Fornecedores
------------------------------------
CREATE TABLE fornecedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    contato VARCHAR(100),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (Os fornecedores poderão ser cadastrados quando houver uma compra – por exemplo, lojas virtuais para geladeira, video card, etc.)

------------------------------------
-- Tabela de Despesas
------------------------------------
/*
  Campos importantes:
  - descricao: nome ou descrição da despesa;
  - tipo: 'FIXA' para despesas eventuais (ex: chocolate, cabeleireiro),
          'RECORRENTE' para contas mensais (ex: aluguel, luz, internet, uber),
          'PARCELADA' para compras que serão pagas em parcelas (ex: geladeira, notebook, placa de vídeo).
  - data_inicio: data da primeira parcela ou do início do débito.
  - data_fim: pode ser utilizada para definir o fim de uma despesa recorrente (NULL para indefinido).
  - periodicidade: para determinar o intervalo – aqui usamos 'MENSAL' (poderia ser extendido para SEMANAL, ANUAL etc.).
  - total_parcelas: número total de parcelas (para despesas parceladas).
  - parcelas_geradas: contador interno para sabermos quantas parcelas já foram criadas.
  - valor_total e valor_parcela: conforme a condição de pagamento.
  - compartilhada: se TRUE, significa que a conta é dividida entre os usuários.
  - usuario_id: para despesas individuais (quando não é compartilhada).
  - condicao_pagamento: informações adicionais (ex.: “12x sem juros”).
*/
CREATE TABLE despesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    tipo ENUM('FIXA','RECORRENTE','PARCELADA') NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE DEFAULT NULL,
    periodicidade ENUM('MENSAL','ANUAL','SEMANAL','UNICO') NOT NULL DEFAULT 'MENSAL',
    total_parcelas INT DEFAULT NULL,      -- somente para despesas parceladas
    parcelas_geradas INT DEFAULT 0,         -- contador de parcelas já geradas
    valor_total DECIMAL(10,2) NOT NULL,
    valor_parcela DECIMAL(10,2) NOT NULL,
    compartilhada BOOLEAN DEFAULT FALSE,
    condicao_pagamento VARCHAR(255),
    fornecedor_id INT DEFAULT NULL,
    usuario_id INT DEFAULT NULL,            -- para despesa individual
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Exemplos de inserção:
-- Contas da casa (divididas meio a meio):
INSERT INTO despesas (descricao, tipo, data_inicio, periodicidade, valor_total, valor_parcela, compartilhada, condicao_pagamento)
VALUES
  ('Aluguel', 'RECORRENTE', '2024-10-10', 'MENSAL', 2000.00, 2000.00, TRUE, 'Mensal sem data final'),
  ('Condomínio', 'RECORRENTE', '2024-10-10', 'MENSAL', 250.00, 250.00, TRUE, 'Mensal'),
  ('Luz', 'RECORRENTE', '2024-10-10', 'MENSAL', 270.00, 270.00, TRUE, 'Mensal'),
  ('Internet', 'RECORRENTE', '2024-10-10', 'MENSAL', 115.00, 115.00, TRUE, 'Mensal');

-- Compra da geladeira (compartilhada em 12x de 250 – total 3000), iniciando em 12/12/2024:
INSERT INTO despesas (descricao, tipo, data_inicio, periodicidade, total_parcelas, valor_total, valor_parcela, compartilhada, condicao_pagamento)
VALUES
  ('Geladeira', 'PARCELADA', '2024-12-12', 'MENSAL', 12, 3000.00, 250.00, TRUE, '12x sem juros');

-- Bruno: Compra de placa de vídeo (12x de 187,50 – total 2250)
-- Supondo que esta despesa é individual do Bruno (usuario_id = 1):
INSERT INTO despesas (descricao, tipo, data_inicio, periodicidade, total_parcelas, valor_total, valor_parcela, compartilhada, condicao_pagamento, usuario_id)
VALUES
  ('Placa de Vídeo', 'PARCELADA', '2024-10-17', 'MENSAL', 12, 2250.00, 187.50, FALSE, '12x sem juros', 1);

-- Tacy: Compra de notebook (12x de 210 – total 2520) e despesa recorrente com uber (mensal de 340)
-- Notebook:
INSERT INTO despesas (descricao, tipo, data_inicio, periodicidade, total_parcelas, valor_total, valor_parcela, compartilhada, condicao_pagamento, usuario_id)
VALUES
  ('Notebook', 'PARCELADA', '2024-10-15', 'MENSAL', 12, 2520.00, 210.00, FALSE, '12x sem juros', 2);

-- Uber:
INSERT INTO despesas (descricao, tipo, data_inicio, periodicidade, valor_total, valor_parcela, compartilhada, condicao_pagamento, usuario_id)
VALUES
  ('Uber', 'RECORRENTE', '2024-10-15', 'MENSAL', 340.00, 340.00, FALSE, 'Mensal', 2);

------------------------------------
-- Tabela de Transações (Parcelas)
------------------------------------
/*
  Cada registro nesta tabela representa uma parcela (ou fatura) gerada para uma despesa.
  Os campos:
  - despesa_id: referencia a qual despesa esta parcela pertence.
  - parcela_numero: número da parcela (1, 2, 3, …).
  - data_vencimento: data em que a parcela deve ser paga.
  - valor: valor da parcela.
  - status: controle se está PENDENTE, PAGO ou ATRASADO.
  - data_pagamento: quando a parcela foi paga (caso aplicável).
*/
CREATE TABLE transacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    despesa_id INT NOT NULL,
    parcela_numero INT NOT NULL,
    data_vencimento DATE NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status ENUM('PENDENTE','PAGO','ATRASADO') DEFAULT 'PENDENTE',
    data_pagamento DATE DEFAULT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (despesa_id) REFERENCES despesas(id)
);

------------------------------------
-- Trigger: Após inserir uma despesa recorrente ou parcelada,
--           gera automaticamente a primeira parcela.
------------------------------------
DELIMITER $$
CREATE TRIGGER trg_despesa_after_insert
AFTER INSERT ON despesas
FOR EACH ROW
BEGIN
    IF NEW.tipo IN ('RECORRENTE', 'PARCELADA') THEN
        INSERT INTO transacoes (despesa_id, parcela_numero, data_vencimento, valor, status)
        VALUES (NEW.id, 1, NEW.data_inicio, NEW.valor_parcela, 'PENDENTE');
        -- Atualiza o contador de parcelas geradas para 1.
        UPDATE despesas SET parcelas_geradas = 1 WHERE id = NEW.id;
    END IF;
END$$
DELIMITER ;

------------------------------------
-- Trigger: Após atualizar uma transação, se o status mudar de PENDENTE para PAGO,
--           verifica se a despesa é recorrente ou parcelada (com parcelas restantes)
--           e gera automaticamente a próxima parcela.
------------------------------------
DELIMITER $$
CREATE TRIGGER trg_transacao_after_update
AFTER UPDATE ON transacoes
FOR EACH ROW
BEGIN
    -- Se a parcela estava pendente e foi paga
    IF OLD.status = 'PENDENTE' AND NEW.status = 'PAGO' THEN
        DECLARE v_tipo ENUM('FIXA','RECORRENTE','PARCELADA');
        DECLARE v_total_parcelas INT;
        DECLARE v_parcelas_geradas INT;
        DECLARE v_periodicidade VARCHAR(20);
        DECLARE v_data_base DATE;
        DECLARE v_next_parcela INT;
        DECLARE v_next_vencimento DATE;
        
        -- Obter dados da despesa associada à transação
        SELECT tipo, total_parcelas, parcelas_geradas, periodicidade, data_inicio
          INTO v_tipo, v_total_parcelas, v_parcelas_geradas, v_periodicidade, v_data_base
          FROM despesas
         WHERE id = NEW.despesa_id;
        
        SET v_next_parcela = v_parcelas_geradas + 1;
        
        -- Se a despesa for RECORRENTE (contínua) OU for PARCELADA e ainda não atingiu o número total de parcelas
        IF v_tipo = 'RECORRENTE' OR (v_tipo = 'PARCELADA' AND (v_total_parcelas IS NULL OR v_next_parcela <= v_total_parcelas)) THEN
            /*
              Calcula a próxima data de vencimento.
              Para simplificar, estamos considerando que a periodicidade é MENSAL, 
              ou seja, a próxima parcela vence 1 mês após a parcela atual.
            */
            SET v_next_vencimento = DATE_ADD(NEW.data_vencimento, INTERVAL 1 MONTH);
            
            INSERT INTO transacoes (despesa_id, parcela_numero, data_vencimento, valor, status)
            VALUES (NEW.despesa_id, v_next_parcela, v_next_vencimento, NEW.valor, 'PENDENTE');
            
            -- Atualiza o contador de parcelas geradas na despesa
            UPDATE despesas SET parcelas_geradas = v_next_parcela WHERE id = NEW.despesa_id;
        END IF;
    END IF;
END$$
DELIMITER ;

------------------------------------
-- Exemplo de Views para Relatórios
------------------------------------
/*
  View para Fluxo de Caixa (RFP Doméstico): 
  Exibe todas as transações e, no caso de contas compartilhadas, o valor individual (metade).
*/
CREATE OR REPLACE VIEW v_fluxo_caixa AS
SELECT 
    t.id,
    d.descricao,
    t.data_vencimento,
    t.valor,
    t.status,
    CASE 
      WHEN d.compartilhada THEN t.valor/2 
      ELSE t.valor 
    END AS valor_individual
FROM transacoes t
JOIN despesas d ON t.despesa_id = d.id;

-- View simplificada para DRE Doméstico (resultado mensal para cada usuário)
CREATE OR REPLACE VIEW v_dre AS
SELECT 
    u.nome,
    u.salario AS receita,
    /* Soma das despesas pagas do usuário ou das contas compartilhadas (divididas meio a meio) */
    (SELECT IFNULL(SUM(t.valor),0)
       FROM transacoes t
       JOIN despesas d ON t.despesa_id = d.id
      WHERE t.status = 'PAGO'
        AND ( (d.compartilhada = TRUE) OR (d.usuario_id = u.id) )
    ) AS despesas_pagas,
    (u.salario - 
     (SELECT IFNULL(SUM(t.valor),0)
        FROM transacoes t
        JOIN despesas d ON t.despesa_id = d.id
       WHERE t.status = 'PAGO'
         AND ( (d.compartilhada = TRUE) OR (d.usuario_id = u.id) )
     )
    ) AS saldo
FROM usuarios u;

```































```sql
-- 1. Inserindo Usuários
INSERT INTO Users (name, email, password_hash) VALUES
('Bruno', 'bruno@email.com', 'hash123'),
('Tacy', 'tacy@email.com', 'hash123');

-- 2. Inserindo Frequências
INSERT INTO Finance_Frequency (name, days_interval) VALUES 
('Mensal', 30),
('Quinzenal', 15),
('Anual', 365);

-- 3. Inserindo Centros de Custo
INSERT INTO Finance_CC (name, description) VALUES
('Moradia', 'Despesas relacionadas à habitação'),
('Pets', 'Despesas com animais de estimação'),
('Saúde', 'Despesas médicas e bem-estar'),
('Transporte', 'Despesas com locomoção'),
('Alimentação', 'Despesas com alimentação'),
('Educação', 'Despesas com formação'),
('Investimentos', 'Aplicações financeiras'),
('Lazer', 'Despesas com entretenimento'),
('Receita', 'Entradas financeiras');

-- 4. Inserindo Categorias (com suas relações hierárquicas)
WITH inserted_categories AS (
    INSERT INTO Finance_Category (name, parent_category_id) VALUES
    ('Água e Esgoto', NULL) RETURNING id
)
INSERT INTO Finance_Category (name, parent_category_id)
SELECT 'Moradia', id FROM inserted_categories;

WITH inserted_categories AS (
    INSERT INTO Finance_Category (name, parent_category_id) VALUES
    ('Alimentação', NULL) RETURNING id
)
INSERT INTO Finance_Category (name, parent_category_id)
SELECT 'Pets', id FROM inserted_categories;

-- ... continuar com as demais categorias ...
INSERT INTO Finance_Category (name) VALUES
('Atividades'),
('Deslocamento'),
('Compras Mensais'),
('Cursos'),
('Energia Elétrica'),
('Impostos e Taxas'),
('Internet e TV'),
('Moradia'),
('Passagem'),
('Poupança'),
('Renda Fixa'),
('Renda Freelance'),
('Streaming'),
('Plano de Saúde'),
('Trabalho'),
('Atividades Físicas'),
('Seguro Saúde'),
('Combustível');

-- 5. Inserindo Pagadores
INSERT INTO Finance_Payer (name) VALUES
('Bruno'),
('Tacy'),
('Casal');

-- 6. Inserindo relação Pagador-Usuário
INSERT INTO Finance_Payer_Users (finance_payer_id, user_id, percentage) VALUES
((SELECT id FROM Finance_Payer WHERE name = 'Bruno'), 
 (SELECT id FROM Users WHERE name = 'Bruno'), 100),
((SELECT id FROM Finance_Payer WHERE name = 'Tacy'), 
 (SELECT id FROM Users WHERE name = 'Tacy'), 100),
((SELECT id FROM Finance_Payer WHERE name = 'Casal'), 
 (SELECT id FROM Users WHERE name = 'Bruno'), 50),
((SELECT id FROM Finance_Payer WHERE name = 'Casal'), 
 (SELECT id FROM Users WHERE name = 'Tacy'), 50);

-- 7. Inserindo Moeda (apenas Real brasileiro por enquanto)
INSERT INTO Finance_Currency (name, symbol, exchange_rate) VALUES
('Real', 'R$', 1.0000);
```
























































```markdown
# Tabelas	

## `Users`
Vamos ter os cadastros:
	- Bruno
	- Tacy

## `Finance_Frequency`
Vamos ter os cadastros:
	- "Mensal" "30" dias
	- "Quinzenal" "15" dias
	- "Anual" "365" dias
		
## `Finance_CC`
Vamos ter os cadastros:
	- Moradia
	- Pets
	- Saúde
	- Transporte
	- Alimentação
	- Educação
	- Investimentos
	- Lazer
	- Receita

## `Finance_Category`
Vamos ter os cadastros de categorias associados a `Fiance_CC`:
	- Água e Esgoto		<-	Moradia
	- Alimentação		<-	Pets
	- Atividades		<-	Saúde
	- Deslocamento		<-	Transporte
	- Compras Mensais	<-	Alimentação
	- Cursos			<-	Educação
	- Energia Elétrica	<-	Moradia
	- Impostos e Taxas	<-	Moradia
	- Internet e TV		<-	Moradia
	- Moradia			<-	Moradia
	- Passagem			<-	Transporte
	- Poupança			<-	Investimentos
	- Renda Fixa		<-	Receita
	- Renda Freelance	<-	Receita
	- Streaming			<-	Lazer
	- Plano de Saúde	<-	Saúde

## `Finance_Payer` `Finance_Payer_Users`
- Vamos ter os cadastros unico cada um Tacy 100% e Bruno 100% e vamos ter um com nome Casal que é Tacy 50% e Bruno 50%
		
## `Finance_Currency`
- Temos que analisar a estrutura do banco e o que ja foi cadastrado para inserir corretamente os dados:
	```csv
	Responsavel,Pagador,Descricao,Centro de Custo,Categoria,Entrada,Saida,Data de inicio,Quantidade de parcelas,Dia de Vencimento,Recorrencia
	Bruno,Casal (50/50 Bruno Tacy),Supermercado,Alimentação,Compras Mensais,,650.00,15/10/2024,Não tem valor definido,15,Mensal
	Tacy,Casal (50/50 Bruno Tacy),Reserva de Emergência,Investimentos,Poupança,,200.00,15/10/2024,Não tem valor definido,15,Mensal
	Bruno,Casal (50/50 Bruno Tacy),Netflix,Lazer,Streaming,,35.00,07/10/2024,Não tem valor definido,10,Mensal
	Bruno,Bruno,HBO Max,Lazer,Streaming,,32.00,10/10/2024,Não tem valor definido,10,Mensal
	Tacy,Tacy,YouTube Premium,Lazer,Streaming,,15.00,10/10/2024,Não tem valor definido,10,Mensal
	Bruno,Casal (50/50 Bruno Tacy),Aluguel,Moradia,Moradia,,1200.00,07/10/2024,Não tem valor definido,10,Mensal
	Bruno,Casal (50/50 Bruno Tacy),Conta de Água,Moradia,Água e Esgoto,,40.00,10/10/2024,Não tem valor definido,10,Mensal
	Tacy,Casal (50/50 Bruno Tacy),Conta de Luz,Moradia,Energia Elétrica,,240.00,12/10/2024,Não tem valor definido,12,Mensal
	Bruno,Casal (50/50 Bruno Tacy),Internet,Moradia,Internet e TV,,115.75,10/10/2024,Não tem valor definido,10,Mensal
	Tacy,Casal (50/50 Bruno Tacy),Taxa de Lixo,Moradia,Impostos e Taxas,,32.50,15/10/2024,Não tem valor definido,15,Anual
	Tacy,Casal (50/50 Bruno Tacy),Ração e Petiscos,Pets,Alimentação,,250.00,15/10/2024,Não tem valor definido,15,Mensal
	Bruno,Casal (50/50 Bruno Tacy),Salário,Receita,Trabalho,3200.00,,07/10/2024,Não tem valor definido,7,Mensal
	Tacy,Casal (50/50 Bruno Tacy),Salário,Receita,Trabalho,3400.00,,07/10/2024,Não tem valor definido,7,Mensal
	Bruno,Bruno,Academia,Saúde,Atividades Físicas,,120.00,10/10/2024,Não tem valor definido,5,Mensal
	Tacy,Casal (50/50 Bruno Tacy),Plano de Saúde,Saúde,Seguro Saúde,,95.00,15/10/2024,Não tem valor definido,15,Mensal
	Bruno,Casal (50/50 Bruno Tacy),Gasolina,Transporte,Combustível,,300.00,20/10/2024,Não tem valor definido,20,Mensal
	Tacy,Tacy,Transporte Público,Transporte,Passagem,,180.00,15/10/2024,Não tem valor definido,15,Mensal
	Bruno,Bruno,IPVA,Transporte,Impostos e Taxas,,1200.00,15/10/2024,Não tem valor definido,15,Anual
	Bruno,Casal (50/50 Bruno Tacy),Galadeira,Moradia,Moradia,,3500.00,15/10/2024,12 vezes,15,Mensal
	```

## `Transactions`
Vamos avaliar todas as parcelas pendentes:
	- Vamos dar baixa em todas as parcelas geradas do mes 10/2024 do mes 11/2024 e do mes 12/2024 vamos dar baixa em todas menos da conta Galadeira, no mes 01/2025 vamos dar baixa em todas menos "HBO Max", "Conta de Luz" e "Academia"
```

1. Faça um script completo para insert nesse banco do arquivo `01-insert-tables.sql`, analise a estrutura do banco para associar as informações corretamente e cadastrar na sequencia correta, para pegar o id de associação do item ja cadastrado quando precisa, faça o insert adaptando todas as informações no banco de todas as entradas








