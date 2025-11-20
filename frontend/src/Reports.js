// frontend/src/Reports.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FaHome, FaExchangeAlt, FaWallet, FaCalculator, FaChartPie, FaSyncAlt, FaCog, FaSignOutAlt, FaEye, FaDownload, FaPrint } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { dataService } from "./services/dataService";
import "./Reports.css";

export default function Reports() {
  const navigate = useNavigate();
  
  // Date filters - default to May 2025 and Sept 2025 as shown in image
  const [startDate, setStartDate] = useState("2025-05-01");
  const [endDate, setEndDate] = useState("2025-09-30");
  const [rows, setRows] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [reportGenerated, setReportGenerated] = useState(false);

  const budgetSummary = useMemo(() => ([
    { category: 'Salary', budget: 120000, spent: 98000 },
    { category: 'Marketing', budget: 45000, spent: 32000 },
    { category: 'Operations', budget: 38000, spent: 21000 },
    { category: 'Technology', budget: 52000, spent: 43000 },
    { category: 'Travel', budget: 18000, spent: 9000 },
  ].map(item => ({
    ...item,
    remaining: item.budget - item.spent,
    status: item.spent > item.budget ? 'Over' : 'Healthy'
  }))), []);

  const demoIncome = useMemo(() => [25000, 30000, 32000, 34000, 36000, 38000, 40000, 42000, 44000, 46000, 50000, 48000], []);
  const demoExpense = useMemo(() => [15000, 17000, 18000, 19000, 21000, 22000, 24000, 26000, 28000, 30000, 32000, 31000], []);

  const buildDemoTransactions = useCallback(() => {
    const now = new Date();
    const demoTxs = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const isoDate = monthDate.toISOString();
      const idx = (demoIncome.length - 1) - i;
      const incomeVal = demoIncome[idx] || demoIncome[demoIncome.length - 1];
      const expenseVal = demoExpense[idx] || demoExpense[demoExpense.length - 1];
      demoTxs.push({
        id: `demo-income-${i}`,
        description: `Demo Income ${monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`,
        amount: incomeVal,
        category: 'Demo Income',
        date: isoDate,
        type: 'Income',
      });
      demoTxs.push({
        id: `demo-expense-${i}`,
        description: `Demo Expense ${monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`,
        amount: -expenseVal,
        category: 'Demo Expense',
        date: isoDate,
        type: 'Expense',
      });
    }
    return demoTxs;
  }, [demoIncome, demoExpense]);
  
  const [stats, setStats] = useState({
    totalBalance: 0,
    expenses: 0,
    income: 0,
    expenseChange: -13.00,
    incomeChange: 11.94,
  });

  // Format date for display (e.g., "May, 2025.")
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]}, ${d.getFullYear()}.`;
  };

  // Calculate statistics from transactions
  const calculateStats = useCallback((txs) => {
    const income = txs
      .filter(tx => {
        const txType = (tx.type || '').trim();
        const amt = Number(tx.amount) || 0;
        return txType === 'Income' || (txType === '' && amt > 0);
      })
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);

    const expenses = txs
      .filter(tx => {
        const txType = (tx.type || '').trim();
        const amt = Number(tx.amount) || 0;
        return txType === 'Expense' || (txType === '' && amt < 0);
      })
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);

    const balance = income - expenses;

    // Calculate previous period for comparison
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentPeriodIncome = 0;
    let currentPeriodExpenses = 0;
    let prevPeriodIncome = 0;
    let prevPeriodExpenses = 0;

    txs.forEach(tx => {
      try {
        const d = new Date(tx.date || Date.now());
        const txMonth = d.getMonth();
        const txYear = d.getFullYear();
        const amt = Number(tx.amount) || 0;
        const txType = (tx.type || '').trim();

        if (txMonth === currentMonth && txYear === currentYear) {
          if (txType === 'Income' || (txType === '' && amt > 0)) {
            currentPeriodIncome += Math.abs(amt);
          } else if (txType === 'Expense' || (txType === '' && amt < 0)) {
            currentPeriodExpenses += Math.abs(amt);
          }
        } else if (txMonth === prevMonth && txYear === prevYear) {
          if (txType === 'Income' || (txType === '' && amt > 0)) {
            prevPeriodIncome += Math.abs(amt);
          } else if (txType === 'Expense' || (txType === '' && amt < 0)) {
            prevPeriodExpenses += Math.abs(amt);
          }
        }
      } catch (err) {
        // Skip invalid dates
      }
    });

    const incomeChange = prevPeriodIncome > 0 
      ? ((currentPeriodIncome - prevPeriodIncome) / prevPeriodIncome * 100)
      : (currentPeriodIncome > 0 ? 11.94 : 0);
    
    const expenseChange = prevPeriodExpenses > 0
      ? ((currentPeriodExpenses - prevPeriodExpenses) / prevPeriodExpenses * 100)
      : (currentPeriodExpenses > 0 ? -13.00 : 0);

    setStats({
      totalBalance: balance,
      expenses,
      income,
      expenseChange: Math.round(expenseChange * 100) / 100,
      incomeChange: Math.round(incomeChange * 100) / 100,
    });
  }, []);

  // Generate report rows from transactions
  const generateReportRows = useCallback((txs) => {
    // Group transactions by date
    const grouped = {};
    
    txs.forEach(tx => {
      try {
        const d = new Date(tx.date || Date.now());
        const dateStr = d.toISOString().slice(0, 10);
        
        if (!grouped[dateStr]) {
          grouped[dateStr] = {
            start: dateStr,
            end: dateStr,
            income: 0,
            balance: 0,
          };
        }
        
        const amt = Number(tx.amount) || 0;
        const txType = (tx.type || '').trim();
        
        if (txType === 'Income' || (txType === '' && amt > 0)) {
          grouped[dateStr].income += Math.abs(amt);
        }
        grouped[dateStr].balance += amt;
      } catch (err) {
        // Skip invalid dates
      }
    });
    
    // Convert to array and sort by date (newest first)
    let reportRows = Object.values(grouped)
      .sort((a, b) => new Date(b.start) - new Date(a.start))
      .map((item, idx) => {
        // For end date, add one year as shown in image
        const endDate = new Date(item.end);
        endDate.setFullYear(endDate.getFullYear() + 1);
        
        return {
          id: idx + 1,
          start: item.start,
          end: endDate.toISOString().slice(0, 10),
          income: item.income,
          balance: Math.abs(item.balance),
        };
      });
    
    if (!reportRows.length) {
      const demoTxs = buildDemoTransactions();
      const fallbackGrouped = {};
      demoTxs.forEach(tx => {
        const d = new Date(tx.date);
        const dateStr = d.toISOString().slice(0, 10);
        if (!fallbackGrouped[dateStr]) {
          fallbackGrouped[dateStr] = { start: dateStr, end: dateStr, income: 0, balance: 0 };
        }
        if (tx.type === 'Income') {
          fallbackGrouped[dateStr].income += Math.abs(Number(tx.amount) || 0);
        }
        fallbackGrouped[dateStr].balance += Number(tx.amount) || 0;
      });
      reportRows = Object.values(fallbackGrouped)
        .sort((a, b) => new Date(b.start) - new Date(a.start))
        .map((item, idx) => {
          const endDate = new Date(item.end);
          endDate.setFullYear(endDate.getFullYear() + 1);
          return {
            id: `demo-${idx}`,
            start: item.start,
            end: endDate.toISOString().slice(0, 10),
            income: item.income,
            balance: Math.abs(item.balance),
          };
        });
    }

    setRows(reportRows);
  }, []);

  // Apply date filters
  const applyFilters = useCallback((txs) => {
    let filtered = [...txs];
    
    if (startDate) {
      filtered = filtered.filter(tx => {
        try {
          const txDate = new Date(tx.date || Date.now()).toISOString().slice(0, 10);
          return txDate >= startDate;
        } catch {
          return false;
        }
      });
    }
    
    if (endDate) {
      filtered = filtered.filter(tx => {
        try {
          const txDate = new Date(tx.date || Date.now()).toISOString().slice(0, 10);
          return txDate <= endDate;
        } catch {
          return false;
        }
      });
    }
    
    const finalTxs = filtered.length ? filtered : buildDemoTransactions();
    setFilteredTransactions(finalTxs);
    calculateStats(finalTxs);
    generateReportRows(finalTxs);
  }, [startDate, endDate, calculateStats, generateReportRows, buildDemoTransactions]);

  // Load data and subscribe to updates
  useEffect(() => {
    const loadData = async () => {
      const txs = await dataService.loadTransactions();
      setTransactions(txs);
      applyFilters(txs);
    };
    
    loadData();
    
    const unsubscribe = dataService.subscribe(({ transactions: txs }) => {
      setTransactions(txs);
      applyFilters(txs);
    });
    
    return unsubscribe;
  }, [applyFilters]);

  const handleGenerate = () => {
    applyFilters(transactions);
    setReportGenerated(true);
  };
  const handlePrint = () => {
    window.print();
  };

  const handlePreview = () => {
    const previewWindow = window.open('', '_blank', 'width=900,height=700');
    if (!previewWindow) return;

    const tableRows = rows.map(r => `
      <tr>
        <td>${r.start}</td>
        <td>${r.end}</td>
        <td>$${Number(r.income).toFixed(2)}</td>
        <td>$${Number(r.balance).toFixed(2)}</td>
      </tr>
    `).join('');

    previewWindow.document.write(`
      <html>
        <head>
          <title>Report Preview</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h1>Report Preview</h1>
          <p><strong>Date range:</strong> ${startDate || 'N/A'} to ${endDate || 'N/A'}</p>
          <table>
            <thead>
              <tr>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Income</th>
                <th>Balance Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="4" style="text-align:center;">No data</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);
    previewWindow.document.close();
  };

  const handleDownload = () => {
    if (!rows.length) return;
    const header = ['Start Date', 'End Date', 'Income', 'Balance Amount'];
    const csvRows = [
      header.join(','),
      ...rows.map(r => [r.start, r.end, Number(r.income).toFixed(2), Number(r.balance).toFixed(2)].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `taxpal-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    const txs = dataService.getData().transactions;
    setTransactions(txs);
    applyFilters(txs);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (userFromStorage?.name || 'User Name').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'UN';

  return (
    <div className="tp-dashboard-root reports-root">
      <aside className="tp-sidebar">
        <div>
          <div className="tp-brand">TAX-PAL</div>

          <nav className="tp-nav" aria-label="Main navigation">
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
              <FaHome className="icon" /> Dashboard
            </NavLink>
            <NavLink to="/transactions" className={({ isActive }) => (isActive ? "active" : "")}>
              <FaExchangeAlt className="icon" /> Transactions
            </NavLink>
            <NavLink to="/budgets" className={({ isActive }) => (isActive ? "active" : "")}>
              <FaWallet className="icon" /> Budgets
            </NavLink>
            <NavLink to="/tax-estimator" className={({ isActive }) => (isActive ? "active" : "")}>
              <FaCalculator className="icon" /> Tax Estimator
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => (isActive ? "active" : "")}>
              <FaChartPie className="icon" /> Reports
            </NavLink>
          </nav>
        </div>

        <div className="tp-user-area">
          <div className="tp-user">
            <div className="avatar">{initials}</div>
            <div className="user-meta">
              <div className="name">{userFromStorage?.name || 'User Name'}</div>
              <div className="email">{userFromStorage?.email || 'useremailid@gmail.com'}</div>
            </div>
          </div>

          <div className="tp-settings">
            <button className="settings-btn" onClick={()=>document.getElementById('settings-panel')?.scrollIntoView({behavior:'smooth'})}><FaCog/> Settings</button>
            <button className="logout-btn" onClick={logout}><FaSignOutAlt/> Log Out</button>
          </div>
        </div>
      </aside>

      <main className="tp-main">
        {/* Header */}
        <header style={{marginBottom: '24px'}}>
          <h1 style={{fontSize: '28px', fontWeight: '700', marginBottom: '8px'}}>Reports</h1>
        </header>

        {/* Report Filters Section */}
        <section className="create-card filters-card">
          <h3 style={{fontSize: '18px', fontWeight: '700', marginBottom: '8px'}}>Report Filters</h3>
          <p className="muted" style={{fontSize: '14px', lineHeight: '1.6', marginBottom: '16px'}}>
            Select date range to filter payroll runs. Use this for per pay run validation, monthly/quarterly filing reconciliation, or annual reconciliation.
          </p>

          <div className="filters-row">
            <div className="filter-group">
              <label>Start Date:</label>
              <div style={{position: 'relative', display: 'inline-block', width: '100%'}}>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{paddingRight: '32px'}}
                />
                <span style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none'}}>📅</span>
              </div>
              {startDate && (
                <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                  {formatDisplayDate(startDate)}
                </div>
              )}
            </div>

            <div className="filter-group">
              <label>End Date:</label>
              <div style={{position: 'relative', display: 'inline-block', width: '100%'}}>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{paddingRight: '32px'}}
                />
                <span style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none'}}>📅</span>
              </div>
              {endDate && (
                <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                  {formatDisplayDate(endDate)}
                </div>
              )}
            </div>

            <div className="filter-actions">
              <button className="btn primary" onClick={handleGenerate}>Generate Report</button>
              <button className="btn outline" onClick={handleRefresh}>
                <FaSyncAlt style={{marginRight: '6px'}} /> Refresh
              </button>
            </div>
          </div>
          {reportGenerated && (
            <div className="report-actions">
              <button className="btn outline" onClick={handlePreview}><FaEye style={{marginRight: 6}} /> Preview</button>
              <button className="btn outline" onClick={handleDownload}><FaDownload style={{marginRight: 6}} /> Download</button>
              <button className="btn primary" onClick={handlePrint}><FaPrint style={{marginRight: 6}} /> Print</button>
            </div>
          )}
        </section>

        {/* KPI Cards */}
        <section className="kpi-cards">
          <div className="kpi-card">
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
              <div style={{width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'}}>👁️</div>
              <div className="kpi-title">Total Balance</div>
            </div>
            <div className="kpi-value">${Number(stats.totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="kpi-sub">Across all accounts</div>
            <div className="kpi-change" style={{color: '#10b981', marginTop: '4px'}}>↑12.73%</div>
          </div>

          <div className="kpi-card">
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
              <div style={{width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'}}>📉</div>
              <div className="kpi-title">Expenses</div>
            </div>
            <div className="kpi-value">${Number(stats.expenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="kpi-sub">Since last month</div>
            <div className="kpi-change" style={{color: '#ef4444', marginTop: '4px'}}>↓{Math.abs(stats.expenseChange).toFixed(2)}%</div>
          </div>

          <div className="kpi-card">
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
              <div style={{width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'}}>📈</div>
              <div className="kpi-title">Income</div>
            </div>
            <div className="kpi-value">${Number(stats.income).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="kpi-sub">Since last month</div>
            <div className="kpi-change" style={{color: '#10b981', marginTop: '4px'}}>↑{stats.incomeChange.toFixed(2)}%</div>
          </div>
        </section>

        {/* Data Table */}
        <section className="table-card" style={{marginTop: '24px'}}>
          <table className="reports-table">
            <thead>
              <tr>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Income</th>
                <th>Balance Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: "center", padding: 18 }}>No data available. Add transactions to see reports.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.start}</td>
                  <td>{r.end}</td>
                  <td>${Number(r.income).toFixed(2)}</td>
                  <td>${Number(r.balance).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Budget Overview */}
        <section className="reports-budget-card">
          <div className="reports-budget-row header">
            <div>Category</div>
            <div>Budget</div>
            <div>Spent</div>
            <div>Remaining</div>
            <div>Status</div>
            <div>Action</div>
          </div>
          {budgetSummary.map((item, idx) => (
            <div className="reports-budget-row" key={item.category}>
              <div>{item.category}</div>
              <div>${item.budget.toLocaleString()}</div>
              <div>${item.spent.toLocaleString()}</div>
              <div>${item.remaining.toLocaleString()}</div>
              <div>
                <span className={`status-pill ${item.status === 'Over' ? 'negative' : 'positive'}`}>
                  {item.status === 'Over' ? 'Over budget' : 'On track'}
                </span>
              </div>
              <div>
                <button className="btn outline mini">View</button>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
