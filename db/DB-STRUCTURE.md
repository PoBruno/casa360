
## 1. Listagens (Cadastros)

**Usuários:**
```sql
SELECT * FROM users ORDER BY created_at;
```

**Contas:**
```sql
SELECT a.*, u.name AS owner, c.code AS currency_code
FROM accounts a
JOIN users u ON a.user_id = u.id
JOIN currencies c ON a.currency_id = c.id
ORDER BY a.created_at;
```

**Categorias:**
```sql
SELECT c.*, u.name AS owner,
       (SELECT name FROM categories WHERE id = c.parent_id) AS parent_category
FROM categories c
JOIN users u ON c.user_id = u.id
ORDER BY c.created_at;
```

**Recorrências:**
```sql
SELECT * FROM recurrences ORDER BY start_date;
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

