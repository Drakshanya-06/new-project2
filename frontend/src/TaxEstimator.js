// frontend/src/TaxEstimator.jsx
import React, { useEffect, useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaExchangeAlt, FaWallet, FaCalculator, FaChartPie, FaCog, FaSignOutAlt, FaSearch } from "react-icons/fa";
import { dataService } from "./services/dataService";
import "./TaxEstimator.css";

// Line Chart Component
function LineChart({ width = 900, height = 300, series = [], labels = [] }) {
  const all = series.flatMap((s) => s.data || []);
  const max = Math.max(...all, 1);
  const pad = 40;
  const innerW = Math.max(width - pad * 2, 10);
  const innerH = Math.max(height - pad * 2, 10);

  const pointsFor = (data) =>
    data.map((v, i) => {
      const x = pad + (i / Math.max(data.length - 1, 1)) * innerW;
      const y = pad + innerH - (v / max) * innerH;
      return [x, y];
    });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="te-linechart" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Financial Overview">
      {/* Grid lines */}
      {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t, i) => {
        const y = pad + innerH * (1 - t);
        const value = Math.round(max * t);
        return (
          <g key={i}>
            <line x1={pad} x2={pad + innerW} y1={y} y2={y} stroke="#eee" strokeWidth={1} />
            <text x={pad - 8} y={y + 4} fontSize="11" textAnchor="end" fill="#666">
              {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
            </text>
          </g>
        );
      })}

      {/* Lines */}
      {series.map((s, idx) => {
        const pts = pointsFor(s.data || []);
        const pathD = `M ${pts.map((p) => p.join(" ")).join(" L ")}`;
        return (
          <g key={idx}>
            <path d={pathD} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill={s.color} />
            ))}
          </g>
        );
      })}

      {/* X-axis labels */}
      {labels.map((lab, i) => {
        const x = pad + (i / Math.max(labels.length - 1, 1)) * innerW;
        const y = pad + innerH + 20;
        return (
          <text key={i} x={x} y={y} fontSize="11" textAnchor="middle" fill="#666">
            {lab}
          </text>
        );
      })}
    </svg>
  );
}

export default function TaxEstimator() {
  const navigate = useNavigate();
  
  // Filters
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("Monthly View");

  // Data
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalBalance: 0,
    income: 0,
    expenses: 0,
    incomeChange: 0,
    expenseChange: 0,
  });

  // Chart data
  const [chartData, setChartData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    incomeSeries: Array(12).fill(0),
    expenseSeries: Array(12).fill(0),
  });

  // Aggregate transactions by month
  const aggregateByMonth = useCallback((txs) => {
    const incomeByMonth = Array(12).fill(0);
    const expenseByMonth = Array(12).fill(0);
    const currentYear = year;

    txs.forEach(tx => {
      try {
        const d = new Date(tx.date || Date.now());
        if (d.getFullYear() === currentYear) {
          const monthIdx = d.getMonth();
          const amt = Number(tx.amount) || 0;
          const txType = (tx.type || '').trim();

          if (txType === 'Income' || (txType === '' && amt > 0)) {
            incomeByMonth[monthIdx] += Math.abs(amt);
          } else if (txType === 'Expense' || (txType === '' && amt < 0)) {
            expenseByMonth[monthIdx] += Math.abs(amt);
          }
        }
      } catch (err) {
        console.warn('Error processing transaction:', tx, err);
      }
    });

    return { incomeByMonth, expenseByMonth };
  }, [year]);

  // Calculate statistics
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
      income,
      expenses,
      incomeChange: Math.round(incomeChange * 100) / 100,
      expenseChange: Math.round(expenseChange * 100) / 100,
    });
  }, []);

  // Load and process data
  useEffect(() => {
    const loadData = async () => {
      const txs = await dataService.loadTransactions();
      setTransactions(txs);
      
      // Apply filters
      let filtered = [...txs];
      if (month) {
        const monthNum = parseInt(month);
        filtered = filtered.filter(tx => {
          const d = new Date(tx.date || Date.now());
          return d.getMonth() + 1 === monthNum && d.getFullYear() === year;
        });
      } else {
        filtered = filtered.filter(tx => {
          const d = new Date(tx.date || Date.now());
          return d.getFullYear() === year;
        });
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(tx =>
          (tx.description || '').toLowerCase().includes(query) ||
          (tx.category || '').toLowerCase().includes(query)
        );
      }

      calculateStats(filtered);
      const { incomeByMonth, expenseByMonth } = aggregateByMonth(filtered);
      setChartData({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        incomeSeries: incomeByMonth,
        expenseSeries: expenseByMonth,
      });
    };

    loadData();

    const unsubscribe = dataService.subscribe(({ transactions: txs }) => {
      setTransactions(txs);
      let filtered = [...txs];
      
      if (month) {
        const monthNum = parseInt(month);
        filtered = filtered.filter(tx => {
          const d = new Date(tx.date || Date.now());
          return d.getMonth() + 1 === monthNum && d.getFullYear() === year;
        });
      } else {
        filtered = filtered.filter(tx => {
          const d = new Date(tx.date || Date.now());
          return d.getFullYear() === year;
        });
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(tx =>
          (tx.description || '').toLowerCase().includes(query) ||
          (tx.category || '').toLowerCase().includes(query)
        );
      }

      calculateStats(filtered);
      const { incomeByMonth, expenseByMonth } = aggregateByMonth(filtered);
      setChartData({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        incomeSeries: incomeByMonth,
        expenseSeries: expenseByMonth,
      });
    });

    return unsubscribe;
  }, [year, month, searchQuery, calculateStats, aggregateByMonth]);

  const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (userFromStorage?.name || 'User Name').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'UN';

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatMoney = (val) => `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const chartSeries = [
    { name: "Income", color: "#111827", data: chartData.incomeSeries },
    { name: "Expenses", color: "#9CA3AF", data: chartData.expenseSeries },
  ];

  return (
    <div className="tp-dashboard-root">
      <aside className="tp-sidebar">
        <div className="tp-brand">TAX-PAL</div>
        <nav className="tp-nav">
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

        <div className="tp-user">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="name">{userFromStorage?.name || 'User Name'}</div>
            <div className="email">{userFromStorage?.email || 'useremailid@gmail.com'}</div>
          </div>
        </div>

        <div className="tp-settings">
          <button className="settings-btn" onClick={()=>document.getElementById('settings-panel')?.scrollIntoView({behavior:'smooth'})}><FaCog/> Settings</button>
          <button className="logout-btn" onClick={logout}><FaSignOutAlt/> Log Out</button>
        </div>
      </aside>

      <main className="tp-main">
        {/* Header */}
        <header className="tp-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
          <div>
            <h1 style={{fontSize: '28px', fontWeight: '700', marginBottom: '4px'}}>Tax Estimator</h1>
            <h2 style={{fontSize: '18px', fontWeight: '600', color: '#666'}}>Estimate Taxes</h2>
          </div>
          
          {/* Filters */}
          <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
            <select 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              style={{padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px'}}
            >
              {[...Array(6)].map((_, i) => {
                const y = new Date().getFullYear() - (5 - i);
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
            
            <select 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              style={{padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px'}}
            >
              <option value="">Month</option>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                <option key={i} value={String(i + 1)}>{m}</option>
              ))}
            </select>
            
            <div style={{display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '6px', padding: '8px 12px', background: '#fff'}}>
              <FaSearch style={{marginRight: '8px', color: '#666'}} />
              <input 
                type="text" 
                placeholder="Search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{border: 'none', outline: 'none', fontSize: '14px', width: '150px'}}
              />
            </div>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="tp-cards" style={{marginBottom: '24px'}}>
          <div className="card">
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
              <div style={{width: '24px', height: '24px', background: '#e5e7eb', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                🔒
              </div>
              <div className="card-title">Total Balance</div>
            </div>
            <div className="card-value">{formatMoney(stats.totalBalance)}</div>
            <div className="card-change" style={{color: '#10b981'}}>↑12.73%</div>
            <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>Across all accounts</div>
          </div>

          <div className="card">
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
              <div style={{width: '24px', height: '24px', background: '#e5e7eb', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                📈
              </div>
              <div className="card-title">Income</div>
            </div>
            <div className="card-value">{formatMoney(stats.income)}</div>
            <div className="card-change" style={{color: '#10b981'}}>↑{stats.incomeChange}%</div>
            <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>Since last month</div>
          </div>

          <div className="card">
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
              <div style={{width: '24px', height: '24px', background: '#e5e7eb', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                📉
              </div>
              <div className="card-title">Expenses</div>
            </div>
            <div className="card-value">{formatMoney(stats.expenses)}</div>
            <div className="card-change" style={{color: '#ef4444'}}>↓{Math.abs(stats.expenseChange)}%</div>
            <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>Since last month</div>
          </div>
        </section>

        {/* Financial Overview Chart */}
        <section className="panel" style={{marginBottom: '24px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <h3 style={{fontSize: '18px', fontWeight: '700', margin: 0}}>Financial Overview</h3>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div style={{width: '12px', height: '12px', background: '#111827', borderRadius: '2px'}}></div>
                <span style={{fontSize: '14px'}}>Income</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div style={{width: '12px', height: '12px', background: '#9CA3AF', borderRadius: '2px'}}></div>
                <span style={{fontSize: '14px'}}>Expenses</span>
              </div>
              <select 
                value={viewMode} 
                onChange={(e) => setViewMode(e.target.value)}
                style={{padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', marginLeft: '12px'}}
              >
                <option>Monthly View</option>
                <option>Quarterly View</option>
              </select>
            </div>
          </div>
          <div style={{width: '100%', overflow: 'auto'}}>
            <LineChart width={900} height={300} series={chartSeries} labels={chartData.labels} />
          </div>
        </section>

        {/* Bottom Table Headers */}
        <div className="tp-budget-row" style={{marginTop: '24px', padding: '12px', background: '#f9f9f9', borderRadius: '6px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', fontWeight: '600', fontSize: '14px'}}>
          <div>Category</div>
          <div>Budget</div>
          <div>Spent</div>
          <div>Remaining</div>
          <div>Status</div>
          <div>Action</div>
        </div>
      </main>
    </div>
  );
}
