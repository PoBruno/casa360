import React, { useContext, useCallback, useEffect, useState } from 'react';
import { 
  Box, Typography, Grid, Paper, CircularProgress, Alert, 
  Card, CardContent, Button, Chip, Tabs, Tab, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem, TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ptBR } from 'date-fns/locale';
import {
  startOfMonth, endOfMonth, subMonths, format, 
  parseISO, addMonths, isBefore, isAfter, isSameMonth
} from 'date-fns';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { HouseContext } from '../../contexts/HouseContext';
import api from '../../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const { selectedHouseId } = useContext(HouseContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Data states
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [installments, setInstallments] = useState([]);
  
  // Filter states
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(subMonths(new Date(), 2)),
    endDate: endOfMonth(new Date())
  });
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'income', 'expense'

  const fetchDashboardData = useCallback(async () => {
    if (!selectedHouseId) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Fetch data in parallel
      const [usersResponse, transactionsResponse, installmentsResponse] = await Promise.all([
        api.get(`/api/house/${selectedHouseId}/finance-users`),
        api.get(`/api/house/${selectedHouseId}/finance-transactions`),
        api.get(`/api/house/${selectedHouseId}/finance-installments`)
      ]);
      
      setUsers(usersResponse.data);
      setTransactions(transactionsResponse.data);
      setInstallments(installmentsResponse.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Falha ao carregar dados do dashboard. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [selectedHouseId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
  };

  // Add the missing handleQuickDateRange function
  const handleQuickDateRange = (rangeType) => {
    const today = new Date();
    let startDate, endDate;

    switch (rangeType) {
      case 'month':
        // This month
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'last-month':
        // Last month
        startDate = startOfMonth(subMonths(today, 1));
        endDate = endOfMonth(subMonths(today, 1));
        break;
      case 'quarter':
        // Last 3 months
        startDate = startOfMonth(subMonths(today, 2));
        endDate = endOfMonth(today);
        break;
      case 'year':
        // This year
        startDate = new Date(today.getFullYear(), 0, 1); // Jan 1st of current year
        endDate = new Date(today.getFullYear(), 11, 31); // Dec 31st of current year
        break;
      default:
        return;
    }

    setDateRange({ startDate, endDate });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Filter transactions based on date range and other filters
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.transaction_date);
    
    const dateInRange = isAfter(transactionDate, dateRange.startDate) && 
                        isBefore(transactionDate, dateRange.endDate);
                        
    if (!dateInRange) return false;
    
    if (typeFilter === 'income') return transaction.is_income;
    if (typeFilter === 'expense') return !transaction.is_income;
    return true;
  });

  // Calculate summary data
  const totalIncome = filteredTransactions
    .filter(t => t.is_income)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => !t.is_income)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const netBalance = totalIncome - totalExpenses;
  
  // Calculate pending installments
  const pendingInstallments = installments.filter(i => i.status === 'pending');
  const overdueInstallments = installments.filter(i => i.status === 'overdue');
  
  // Group transactions by month for chart
  const monthlyData = {};

  filteredTransactions.forEach(transaction => {
    const date = new Date(transaction.transaction_date);
    const monthYear = format(date, 'MM/yyyy');
    const monthYearLabel = format(date, 'MMM/yy', { locale: ptBR });
    
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = {
        label: monthYearLabel,
        income: 0,
        expense: 0 
      };
    }
    
    if (transaction.is_income) {
      monthlyData[monthYear].income += parseFloat(transaction.amount);
    } else {
      monthlyData[monthYear].expense += parseFloat(transaction.amount);
    }
  });
  
  // Prepare chart data
  const sortedMonths = Object.keys(monthlyData).sort();
  
  const lineChartData = {
    labels: sortedMonths.map(key => monthlyData[key].label),
    datasets: [
      {
        label: 'Receitas',
        data: sortedMonths.map(key => monthlyData[key].income),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      },
      {
        label: 'Despesas',
        data: sortedMonths.map(key => monthlyData[key].expense),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      }
    ]
  };
  
  // Group expense transactions by description for pie chart
  const expensesByDescription = {};
  filteredTransactions
    .filter(t => !t.is_income)
    .forEach(transaction => {
      const description = transaction.description || 'Outros';
      if (!expensesByDescription[description]) {
        expensesByDescription[description] = 0;
      }
      expensesByDescription[description] += parseFloat(transaction.amount);
    });
  
  const pieChartData = {
    labels: Object.keys(expensesByDescription),
    datasets: [
      {
        data: Object.values(expensesByDescription),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(201, 203, 207, 0.6)',
          'rgba(102, 187, 106, 0.6)',
          'rgba(244, 67, 54, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(201, 203, 207, 1)',
          'rgba(102, 187, 106, 1)',
          'rgba(244, 67, 54, 1)',
        ],
        borderWidth: 1,
      }
    ]
  };

  // Get status chip with appropriate color
  const getStatusChip = (status) => {
    let color = 'default';
    let label = status;
    
    switch (status) {
      case 'completed':
      case 'paid':
        color = 'success';
        label = 'Pago';
        break;
      case 'pending':
        color = 'primary';
        label = 'Pendente';
        break;
      case 'overdue':
        color = 'error';
        label = 'Atrasado';
        break;
      case 'canceled':
        color = 'warning';
        label = 'Cancelado';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={label} color={color} size="small" />;
  };

  if (!selectedHouseId) {
    return (
      <Box>
        <Typography variant="h5" component="h2" gutterBottom>
          Selecione uma casa para visualizar o dashboard.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Dashboard Financeiro</Typography>
        
        {/* Filter controls */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2.5}>
              <DatePicker
                label="Data Inicial"
                value={dateRange.startDate}
                onChange={(date) => handleDateChange('startDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={2.5}>
              <DatePicker
                label="Data Final"
                value={dateRange.endDate}
                onChange={(date) => handleDateChange('endDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel id="type-filter-label">Tipo</InputLabel>
                <Select
                  labelId="type-filter-label"
                  id="type-filter"
                  value={typeFilter}
                  label="Tipo"
                  onChange={handleTypeFilterChange}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="income">Receitas</MenuItem>
                  <MenuItem value="expense">Despesas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleQuickDateRange('month')}
              >
                Este Mês
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleQuickDateRange('last-month')}
              >
                Mês Passado
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleQuickDateRange('quarter')}
              >
                Trimestre
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleQuickDateRange('year')}
              >
                Ano
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Summary */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6">Receitas</Typography>
              <Typography variant="h4" color="success.main">{formatCurrency(totalIncome)}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6">Despesas</Typography>
              <Typography variant="h4" color="error.main">{formatCurrency(totalExpenses)}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6">Saldo</Typography>
              <Typography variant="h4" color={netBalance >= 0 ? 'success.main' : 'error.main'}>{formatCurrency(netBalance)}</Typography>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Charts */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Receitas e Despesas Mensais</Typography>
              <Line data={lineChartData} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Despesas por Categoria</Typography>
              <Pie data={pieChartData} />
            </Paper>
          </Grid>
        </Grid>
        
        {/* Installments */}
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>Parcelas Pendentes</Typography>
          <Grid container spacing={2}>
            {pendingInstallments.map(installment => (
              <Grid item xs={12} md={6} key={installment.id}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body1">{installment.description}</Typography>
                  <Typography variant="body2" color="text.secondary">Vencimento: {new Date(installment.due_date).toLocaleDateString()}</Typography>
                  <Typography variant="body2" color="text.secondary">Valor: {formatCurrency(installment.amount)}</Typography>
                  {getStatusChip(installment.status)}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
        
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>Parcelas Atrasadas</Typography>
          <Grid container spacing={2}>
            {overdueInstallments.map(installment => (
              <Grid item xs={12} md={6} key={installment.id}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body1">{installment.description}</Typography>
                  <Typography variant="body2" color="text.secondary">Vencimento: {new Date(installment.due_date).toLocaleDateString()}</Typography>
                  <Typography variant="body2" color="text.secondary">Valor: {formatCurrency(installment.amount)}</Typography>
                  {getStatusChip(installment.status)}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default Dashboard;