import Dashboard from './pages/Dashboard/Dashboard';
import Casa from './pages/Casa/Casa';

// Finance Settings
import Frequency from './pages/FinanceSettings/Frequency';
import CostCenter from './pages/FinanceSettings/CostCenter';
import Category from './pages/FinanceSettings/Category';
import Currency from './pages/FinanceSettings/Currency';

// User Management
import Payer from './pages/UserManagement/Payer';
import Users from './pages/UserManagement/Users';
import PayerUsers from './pages/UserManagement/PayerUsers';

// Finance Operations
import Entries from './pages/FinanceOperations/Entries';
import Installments from './pages/FinanceOperations/Installments';
import Transactions from './pages/FinanceOperations/Transactions';

// Settings
import Configuration from './pages/Settings/Configuration';

const routes = [
  {
    path: '/',
    component: Dashboard,
    exact: true,
    title: 'Dashboard'
  },
  {
    path: '/casa',
    component: Casa,
    title: 'Casa'
  },
  // Finance Settings
  {
    path: '/finance-settings/frequency',
    component: Frequency,
    title: 'Frequência'
  },
  {
    path: '/finance-settings/cost-center',
    component: CostCenter,
    title: 'Centro de Custo'
  },
  {
    path: '/finance-settings/category',
    component: Category,
    title: 'Categorias'
  },
  {
    path: '/finance-settings/currency',
    component: Currency,
    title: 'Moedas'
  },
  // User Management
  {
    path: '/user-management/payer',
    component: Payer,
    title: 'Pagadores'
  },
  {
    path: '/user-management/users',
    component: Users,
    title: 'Usuários'
  },
  {
    path: '/user-management/payer-users',
    component: PayerUsers,
    title: 'Usuários Pagadores'
  },
  // Finance Operations
  {
    path: '/finance-operations/entries',
    component: Entries,
    title: 'Entradas'
  },
  {
    path: '/finance-operations/installments',
    component: Installments,
    title: 'Parcelas'
  },
  {
    path: '/finance-operations/transactions',
    component: Transactions,
    title: 'Transações'
  },
  // Settings
  {
    path: '/settings/configuration',
    component: Configuration,
    title: 'Configurações'
  }
];

export default routes;