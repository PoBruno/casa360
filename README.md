# Casa360

Casa360 é um sistema full-stack para gestão financeira doméstica, ERP doméstico.
A aplicação é composta por um back-end em Express (Node.js/TypeScript).  
O propósito é auxiliar o gerenciamento de transações, contas recorrentes, pagos, carteiras e dashboards para controle financeiro.

---

## Arquitetura do Projeto

- **Backend (server/)**  
  - **src/controllers/**: Lógica dos endpoints para cada entidade (ex.: FinanceEntries, Transactions, etc.).  
  - **src/middleware/**: Autenticação, autorização e validação de acesso às casas.  
  - **src/models/**: Representação das tabelas e esquemas de dados.  
  - **src/routes/**: Definição das rotas da API.  
  - **src/services/**: Funções de interação com o banco de dados.  
  - **src/types/**: Tipos e interfaces TypeScript que garantem integridade dos dados.

- **Frontend (client/)**  
  - **src/components/**: Componentes reutilizáveis, layouts e views para as diferentes telas.  
  - **src/hooks/**: Hooks customizados para comunicação com a API e gerenciamento de estado.  
  - **src/services/api.ts**: Configuração e chamadas para os endpoints do back-end.  
  - **src/utils/**: Funções auxiliares para formatação e validações.

---

## Entidades e Relacionamentos

### Tabelas Principais

- **Users**: Cadastro dos usuários da casa.  
- **Finance_Frequency**: Define a recorrência das transações (ex.: Mensal, Quinzenal, Anual).  
- **Finance_CC**: Centros de Custo – identificação de áreas de gasto (ex.: Moradia, Pets, Saúde, Transporte).  
- **Finance_Category**: Categorias financeiras associadas a um centro de custo (ex.: Água & Esgoto, Alimentação).  
- **Finance_Payer**: Cadastro para definir carteiras ou pagadores (ex.: User1, User2, Casal).  
- **Finance_Payer_Users**: Define a distribuição percentual de pagamento entre os usuários de uma carteira/pagador.  
- **Finance_Currency**: Moedas utilizadas nas transações (ex.: BRL, USD).  
- **Finance_Entries**: Tabela chave para cadastro de entradas e saídas financeiras; vincula informações de moeda, categoria, centro de custo, frequência, usuário, data de início, quantidade de parcelas ou data final e valor.  
- **Finance_Installments**: Geração automática (ou manual) das parcelas derivadas de uma entrada financeira. Acompanham status (pending, paid, overdue) e servem de base para as transações.  
- **Transactions**: Registra as baixas efetivadas nas entradas/saídas. A partir dessa tabela iniciam as automações no DRE e a atualização das carteiras dos usuários.

---

## Funcionalidades do Sistema

### Cadastro e Configuração

- **Usuários**: Cadastro simples com nome, e-mail e, possivelmente, senha.
- **Frequência**: Definir intervalos de pagamento/recebimento, como “Mensal (30 dias)”, “Quinzenal (15 dias)” ou “Anual (365 dias)”.
- **Centros de Custo e Categorias**: 
  - Exemplo:
    - **Moradia**: Categorias como Água e Esgoto.
    - **Pets**: Categorias de Alimentação.
    - **Saúde**: Categorias de Atividades.
    - **Transporte**: Categorias de Deslocamento.
    - **Alimentação**: Pode ter subcategoria para Compras Mensais.
- **Pagadores e Distribuição**:  
  - Cadastrar pagadores em que os usuários podem ser responsáveis por 100% individualmente ou de forma compartilhada (ex.: 50/50 no caso “Casal”).
- **Moedas**: Definir as moedas aceitas, possibilitando conversão e múltiplos tipos de transações.

### Gestão de Entradas e Saídas

- **Finance_Entries**:  
  É aqui que são cadastradas todas as transações recorrentes (ex.: aluguel, salário).  
  - Entrada de salário ou outra receita: Cadastro com data de início, valor, quantidade de parcelas (ou data final) e demais metadados.
  - Saídas como Aluguel: Cadastro similar onde a recorrência e a data determinam a criação das parcelas.
- **Finance_Installments**:  
  A partir dos registros em Finance_Entries, o sistema gera parcelas automáticas.  
  - Cada parcela acompanha a data de vencimento, valor, status (pending, paid, overdue) e, quando realizada uma baixa, será registrada em Transactions.
  
### Registros de Transações e Baixas

- **Transactions**:
  - Sempre que uma parcela for efetivamente baixa (paga ou recebida), um registro é criado nesta tabela.
  - Essa ação trigger automações para atualizar a carteira de cada usuário conforme sua participação (Finance_Payer_Users).
  
### Atualização de Carteiras

- As transações impactam as “wallets” dos usuários, permitindo que o sistema acompanhe o saldo real de cada um.
- Atualizações automáticas ocorrem sempre que há uma baixa na parcela, garantindo a consistência do fluxo financeiro.

---

## Possíveis Telas (Front-end)

1. **Dashboard Geral**  
   - Visão do fluxo de caixa (diário, mensal e anual).
   - Widgets para receita, despesas e saldo.
   - Gráficos e visões Kanban (por exemplo, um Planner para parcelas pendentes).

2. **Tela de Cadastro/Configuração**  
   - **Usuários**: Gerenciamento dos usuários.
   - **Configuração Financeira**: Tela para cadastro das frequências, centros de custo, categorias, pagadores, usuários de pagadores e moedas.
   
3. **Tela de Gestão de Entradas e Saídas**  
   - Formulário para cadastro de novas entradas ou saídas.
   - Listagem dessas entradas com opções de edição ou remoção.
   - Visualização do histórico de parcelas geradas com status (usável também para controle Kanban).

4. **Tela de Transações**  
   - Listagem de todas as transações concretizadas.
   - Filtros por data, status e responsável.
   - Histórico de alterações na carteira dos usuários.

5. **Tela de Relatórios/DRE**  
   - Relatórios dinâmicos de fluxo de caixa.
   - Sumários e gráficos das receitas e despesas.
   - Visualizacao das variações na “wallet” de cada usuário.

---

## Fluxo de Uso do Sistema

1. **Configuração Inicial**  
   O administrador cadastra os dados básicos: usuários, frequências, centros de custo, categorias, pagadores e moedas.

2. **Cadastro de Entradas/Saídas**  
   O usuário cadastra uma nova entrada/saída informando:  
   - Dados financeiros (valor, data de início, recorrência, número de parcelas ou data final).  
   - Vinculação aos cadastros já configurados (categoria, centro de custo, pagador, moeda).

3. **Geração Automática de Parcelas**  
   O sistema gera as parcelas a partir do cadastro.  
   - Verifica, em tempo real, se alguma parcela está vencida ou aberta.
   - Permite a edição manual caso necessário.

4. **Registro de Transações e Atualização de Carteiras**  
   Ao realizar a baixa em uma parcela, o sistema:  
   - Cria um registro na tabela Transactions.  
   - Executa a automação que atualiza a carteira dos usuários conforme as porcentagens definidas.

5. **Acompanhamento Visual (Kanban/Planner)**  
   A tela de Kanban exibe todas as faturas em aberto, pagas e pendentes, facilitando o gerenciamento e tomada de decisão.

---

## Considerações Finais

- **Autenticação e Segurança**: Todas as rotas protegidas exigem autenticação via JWT.
- **Validação e Integridade dos Dados**: Os cadastros são rigorosamente validados (datas, valores positivos, somatória de percentuais igual a 100, etc.).
- **Escalabilidade e Performance**: A separação do sistema em micro-serviços e a estruturação dos relacionamentos no banco de dados visam escalabilidade e performance.
- **Integração com Outras Ferramentas**: Possibilidade de integração com outros sistemas ERP e de relatórios, consolidando uma visão ampla da saúde financeira da casa.









O **Casa360** é um aplicativo de ERP doméstico que combina um front-end React com um back-end Express. Este projeto foi projetado para gerenciar transações financeiras, usuários e categorias com eficiência.

## Project Structure

- **client/**: Contains the React front-end application.
  - **src/**: Source files for the React application.

- **server/**: Contains the Express back-end application.
  - **src/**: Source files for the Express application.
    - **controllers/**: Logic for API endpoints.
    - **middleware/**: Authentication and authorization middleware.
    - **models/**: Data models and database schema.
    - **routes/**: API route definitions.
    - **services/**: Database interaction functions.
    - **types/**: TypeScript types and interfaces.
    - **utils/**: Utility functions for the server.
    - **app.ts**: Entry point of the Express application.
  - **package.json**: Configuration file for npm dependencies.
  - **tsconfig.json**: TypeScript configuration file.

## Backend

  - [Documentation](server/README.md)
  - [API Documentation](server/API.md)

