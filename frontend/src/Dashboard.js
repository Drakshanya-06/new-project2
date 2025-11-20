// frontend/src/Dashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import { FaHome, FaExchangeAlt, FaWallet, FaCalculator, FaChartPie, FaPlus, FaTimes, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { useNavigate, NavLink } from 'react-router-dom';
import { transactionsAPI } from './services/api';
import { dataService } from './services/dataService';
import './Dashboard.css';
import BarChart from './BarChart';

export default function Dashboard() {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('Income');
  const [loadingSave, setLoadingSave] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [stats, setStats] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    estimatedTax: 0,
    savingsRate: 0,
    incomeChange: 0,
    expenseChange: 0,
  });

  const [chartSeries, setChartSeries] = useState([
    { name: 'Income', color: '#111827', data: Array(12).fill(0) },
    { name: 'Expenses', color: '#9CA3AF', data: Array(12).fill(0) },
  ]);

  const [pieDataRaw, setPieDataRaw] = useState([]);
  const [timeFilter, setTimeFilter] = useState('Month'); // Year, Quarter, Month

  // categories: merge from localStorage tp_categories, budgets and transactions, fallback defaults
  const defaultCategories = ['Salary', 'Rent', 'Groceries', 'Utilities', 'Other'];
  const [categories, setCategories] = useState(() => {
    try {
      const fromStorage = JSON.parse(localStorage.getItem('tp_categories') || 'null') || [];
      const savedBudgets = JSON.parse(localStorage.getItem('tp_budgets') || '[]');
      const fromBudgets = (savedBudgets || []).map(b => b.category).filter(Boolean);
      // combined unique
      const combined = Array.from(new Set([...fromStorage, ...fromBudgets, ...defaultCategories]));
      return combined.length ? combined : defaultCategories;
    } catch (e) {
      return defaultCategories;
    }
  });

  const [newCategory, setNewCategory] = useState('');

  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'Salary',
    date: '',
    notes: '',
    type: 'Income',
  });

  const classifyTransaction = useCallback((tx = {}) => {
    const raw = (tx.type || '').toString().trim().toLowerCase();
    const amt = Number(tx.amount);

    if (raw.startsWith('inc') || raw.includes('credit') || raw.includes('deposit')) {
      return 'income';
    }
    if (raw.startsWith('exp') || raw.includes('debit') || raw.includes('withdraw')) {
      return 'expense';
    }

    if (!Number.isNaN(amt)) {
      if (amt > 0) return 'income';
      if (amt < 0) return 'expense';
    }

    return 'unknown';
  }, []);

  // aggregation helpers
  const aggregateTransactions = useCallback((txs = [], filter = 'Month') => {
    const now = new Date();
    const currentYear = now.getFullYear();
    let labels = [];
    let inc = [];
    let exp = [];
    
    if (filter === 'Year') {
      // Last 12 months
      labels = [];
      inc = Array(12).fill(0);
      exp = Array(12).fill(0);
      for (let i = 11; i >= 0; i--) {
        const d = new Date(currentYear, now.getMonth() - i, 1);
        labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
      }
      (txs || []).forEach(t => {
        const d = new Date(t.date || Date.now());
        const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (monthsAgo >= 0 && monthsAgo < 12) {
          const idx = 11 - monthsAgo;
          const amt = Number(t.amount) || 0;
          const nature = classifyTransaction(t);
          if (nature === 'income') inc[idx] += Math.abs(amt);
          else if (nature === 'expense') exp[idx] += Math.abs(amt);
        }
      });

      // Fill empty months with demo data so the chart is never flat (very large, obvious values)
      // Index 10 (November in the last-12-months window) is especially tall for easier comparison
      const demoIncome = [12000, 14000, 15000, 16000, 17000, 18000, 19500, 21000, 22500, 24000, 26000, 25000];
      const demoExpense = [7000, 8000, 8500, 9000, 9500, 10000, 11000, 12000, 13000, 14000, 15000, 14500];
      for (let i = 0; i < 12; i++) {
        if (inc[i] === 0 && exp[i] === 0) {
          inc[i] = demoIncome[i];
          exp[i] = demoExpense[i];
        }
      }
    } else if (filter === 'Quarter') {
      // Last 4 quarters
      labels = ['Q1', 'Q2', 'Q3', 'Q4'];
      inc = Array(4).fill(0);
      exp = Array(4).fill(0);
      (txs || []).forEach(t => {
        const d = new Date(t.date || Date.now());
        if (d.getFullYear() === currentYear) {
          const quarter = Math.floor(d.getMonth() / 3);
          const amt = Number(t.amount) || 0;
          const nature = classifyTransaction(t);
          if (nature === 'income') inc[quarter] += Math.abs(amt);
          else if (nature === 'expense') exp[quarter] += Math.abs(amt);
        }
      });
    } else {
      // Month - last 12 months
      labels = [];
      inc = Array(12).fill(0);
      exp = Array(12).fill(0);
      for (let i = 11; i >= 0; i--) {
        const d = new Date(currentYear, now.getMonth() - i, 1);
        labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
      }
      (txs || []).forEach(t => {
        const d = new Date(t.date || Date.now());
        const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (monthsAgo >= 0 && monthsAgo < 12) {
          const idx = 11 - monthsAgo;
          const amt = Number(t.amount) || 0;
          const nature = classifyTransaction(t);
          if (nature === 'income') inc[idx] += Math.abs(amt);
          else if (nature === 'expense') exp[idx] += Math.abs(amt);
        }
      });

      // Fill empty months with demo data so all previous months have bars (very large values for clarity)
      // Index 10 (November) is intentionally one of the highest income points.
      const demoIncome = [12000, 14000, 15000, 16000, 17000, 18000, 19500, 21000, 22500, 24000, 26000, 25000];
      const demoExpense = [7000, 8000, 8500, 9000, 9500, 10000, 11000, 12000, 13000, 14000, 15000, 14500];
      for (let i = 0; i < 12; i++) {
        if (inc[i] === 0 && exp[i] === 0) {
          inc[i] = demoIncome[i];
          exp[i] = demoExpense[i];
        }
      }
    }
    
    return { inc, exp, labels };
  }, [classifyTransaction]);

  const aggregateBudgets = useCallback((b = []) => {
    const categoryMap = {};
    (b || []).forEach(item => {
      const cat = item.category || 'Uncategorized';
      const amt = Number(item.budget ?? item.amount ?? 0) || 0;
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    });

    const catEntries = Object.entries(categoryMap).map(([label, value]) => ({ label, value }));
    return { catEntries };
  }, []);

  const recomputeCharts = useCallback((txs, bgs, filter = 'Month') => {
    const aggTx = aggregateTransactions(txs, filter);
    const { catEntries } = aggregateBudgets(bgs);

    // Calculate totals for current period (all months in filter)
    const incomeTotal = aggTx.inc.reduce((s, x) => s + x, 0);
    const expensesTotal = aggTx.exp.reduce((s, x) => s + x, 0);
    
    // Calculate current month totals for summary cards
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let currentMonthIncome = 0;
    let currentMonthExpenses = 0;
    
    (txs || []).forEach(t => {
      try {
        let d;
        if (t.date) {
          d = new Date(t.date);
          if (isNaN(d.getTime())) {
            d = new Date();
          }
        } else {
          d = new Date();
        }
        
        const txMonth = d.getMonth();
        const txYear = d.getFullYear();
        
        if (txMonth === currentMonth && txYear === currentYear) {
          const amt = Number(t.amount) || 0;
          const nature = classifyTransaction(t);
          
          if (nature === 'income') {
            currentMonthIncome += Math.abs(amt);
          } else if (nature === 'expense') {
            currentMonthExpenses += Math.abs(amt);
          }
        }
      } catch (err) {
        console.warn('Error processing transaction:', t, err);
      }
    });
    
    // Calculate previous month for comparison
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    let prevMonthIncome = 0;
    let prevMonthExpenses = 0;
    
    (txs || []).forEach(t => {
      const d = new Date(t.date || Date.now());
      const txMonth = d.getMonth();
      const txYear = d.getFullYear();
      
      if (txMonth === prevMonth && txYear === prevYear) {
        const amt = Number(t.amount) || 0;
        const nature = classifyTransaction(t);
        if (nature === 'income') {
          prevMonthIncome += Math.abs(amt);
        } else if (nature === 'expense') {
          prevMonthExpenses += Math.abs(amt);
        }
      }
    });
    
    // Calculate percentage changes
    const incomeChange = prevMonthIncome > 0 
      ? ((currentMonthIncome - prevMonthIncome) / prevMonthIncome * 100) 
      : (currentMonthIncome > 0 ? 14 : 0); // Default to 14% if no previous data
    const expenseChange = prevMonthExpenses > 0 
      ? ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses * 100) 
      : (currentMonthExpenses > 0 ? -8 : 0); // Default to -8% if no previous data

    // Debug logging
    console.log('Current month calculation:', {
      currentMonth,
      currentYear,
      currentMonthIncome,
      currentMonthExpenses,
      totalTransactions: txs.length,
      expenseTransactions: txs.filter(t => (t.type || '').trim() === 'Expense').length
    });
    
    setStats({
      monthlyIncome: currentMonthIncome,
      monthlyExpenses: currentMonthExpenses,
      estimatedTax: Math.round(currentMonthIncome * 0.03),
      savingsRate: currentMonthIncome > 0 ? Math.round(((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100) : 0,
      incomeChange: Math.round(incomeChange),
      expenseChange: Math.round(expenseChange),
    });

    setPieDataRaw(catEntries || []);

    // Ensure both series have the same length
    const maxLength = Math.max(aggTx.inc.length, aggTx.exp.length);
    const incomeData = [...aggTx.inc];
    const expenseData = [...aggTx.exp];
    
    // Pad arrays to same length
    while (incomeData.length < maxLength) incomeData.push(0);
    while (expenseData.length < maxLength) expenseData.push(0);

    setChartSeries([
      { name: 'Income', color: '#111827', data: incomeData },
      { name: 'Expenses', color: '#9CA3AF', data: expenseData },
    ]);

    // also refresh categories list with any new categories found in budgets
    const foundFromBudgets = (bgs || []).map(b => b.category).filter(Boolean);
    const combined = Array.from(new Set([...categories, ...foundFromBudgets]));
    if (combined.length && combined.length !== categories.length) {
      setCategories(combined);
      try { localStorage.setItem('tp_categories', JSON.stringify(combined)); } catch(e){/*ignore*/ }
    }
    
    return aggTx.labels;
  }, [aggregateBudgets, aggregateTransactions, categories, classifyTransaction]);

  // Subscribe to data service for real-time updates
  useEffect(() => {
    // Initial load
    const loadData = async () => {
      const txs = await dataService.loadTransactions();
      const bgs = dataService.loadBudgets();
      setTransactions(txs);
      setBudgets(bgs);
      recomputeCharts(txs, bgs, timeFilter);
    };
    
    loadData();
    
    // Subscribe to real-time updates
    const unsubscribe = dataService.subscribe(({ transactions: txs, budgets: bgs }) => {
      setTransactions(txs);
      setBudgets(bgs);
      recomputeCharts(txs, bgs, timeFilter);
    });
    
    return unsubscribe;
  }, [recomputeCharts, timeFilter]);

  // categories management
  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) { alert('Category exists'); return; }
    const updated = [...categories, trimmed];
    setCategories(updated);
    try { localStorage.setItem('tp_categories', JSON.stringify(updated)); } catch(e){/*ignore*/ }
    setNewCategory('');
  };
  const deleteCategory = (c) => {
    const updated = categories.filter(x => x !== c);
    setCategories(updated);
    try { localStorage.setItem('tp_categories', JSON.stringify(updated)); } catch(e){/*ignore*/ }
  };

  const saveTransaction = async () => {
    if (!form.description || form.amount === '' || isNaN(Number(form.amount))) {
      alert('Please provide description and numeric amount.');
      return;
    }
    
    // Ensure type is set correctly from modalType if form.type is not set
    const transactionType = form.type || modalType || 'Income';
    
    setLoadingSave(true);
    try {
      const payload = {
        description: form.description,
        amount: Number(form.amount) * (transactionType === 'Income' ? 1 : -1),
        category: form.category,
        date: form.date || new Date().toISOString(),
        notes: form.notes,
        type: transactionType, // Always set the type explicitly
      };
      
      console.log('Saving transaction:', payload); // Debug log
      console.log('Transaction type:', transactionType, 'Amount:', payload.amount); // Debug log
      
      // Use data service to add transaction (will trigger real-time updates)
      const savedTx = await dataService.addTransaction(payload);
      console.log('Saved transaction:', savedTx); // Debug log
      
      // Reset form
      setForm({
        description: '',
        amount: '',
        category: 'Salary',
        date: '',
        notes: '',
        type: 'Income',
      });
      
      setShowModal(false);
    } catch (err) {
      console.error('Save failed', err);
      alert('Save failed');
    } finally {
      setLoadingSave(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (userFromStorage?.name || 'Demo User').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  
  // Get labels based on time filter
  const [chartLabels, setChartLabels] = useState(['Jan','Feb','Mar','Apr','May','Jun']);
  
  // Update labels when filter changes
  useEffect(() => {
    const aggTx = aggregateTransactions(transactions, timeFilter);
    setChartLabels(aggTx.labels || ['Jan','Feb','Mar','Apr','May','Jun']);
  }, [timeFilter, transactions, aggregateTransactions]);

  const totalPieValue = pieDataRaw.reduce((s, p) => s + (Number(p.value) || 0), 0) || 1;
  const pieEntriesForRender = pieDataRaw.length > 0
    ? pieDataRaw.map(p => ({ label: p.label, value: Number(p.value) || 0, pct: Math.round(((Number(p.value) || 0)/totalPieValue) * 100) }))
    : [];

  return (
    <div className="tp-dashboard-root">
      <aside className="tp-sidebar">
        <div className="tp-brand">TAX-PAL</div>

        <nav className="tp-nav">
          <NavLink to="/dashboard" className={({isActive})=> isActive ? 'active' : ''}><FaHome className="icon"/> Dashboard</NavLink>
          <NavLink to="/transactions" className={({isActive})=> isActive ? 'active' : ''}><FaExchangeAlt className="icon"/> Transactions</NavLink>
          <NavLink to="/budgets" className={({isActive})=> isActive ? 'active' : ''}><FaWallet className="icon"/> Budgets</NavLink>
          <NavLink to="/tax-estimator" className={({isActive})=> isActive ? 'active' : ''}><FaCalculator className="icon"/> Tax Estimator</NavLink>
          <NavLink to="/reports" className={({isActive})=> isActive ? 'active' : ''}><FaChartPie className="icon"/> Reports</NavLink>
        </nav>

        <div className="tp-user">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="name">{userFromStorage?.name || 'demo'}</div>
            <div className="email">{userFromStorage?.email || 'demo@gmail.com'}</div>
          </div>
        </div>

        <div className="tp-settings">
          <button className="settings-btn" onClick={()=>document.getElementById('settings-panel')?.scrollIntoView({behavior:'smooth'})}><FaCog/> Settings</button>
          <button className="logout-btn" onClick={logout}><FaSignOutAlt/> Logout</button>
        </div>
      </aside>

      <main className="tp-main">
        <header className="tp-header">
          <h1>Dashboard</h1>
          <div className="tp-actions">
            <button className="btn primary" onClick={()=>{ setModalType('Income'); setForm({...form, type: 'Income'}); setShowModal(true); }}><FaPlus/> Record Income</button>
            <button className="btn outline" onClick={()=>{ setModalType('Expense'); setForm({...form, type: 'Expense'}); setShowModal(true); }}><FaPlus/> Record Expense</button>
          </div>
        </header>

        <section className="tp-cards">
          <div className="card">
            <div className="card-title">Monthly Income</div>
            <div className="card-value">${Number(stats.monthlyIncome || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            <div className="card-change" style={{color: stats.incomeChange >= 0 ? '#10b981' : '#ef4444'}}>
              {stats.incomeChange >= 0 ? '↑' : '↓'}{Math.abs(stats.incomeChange || 0)}% from last month
            </div>
          </div>
          <div className="card">
            <div className="card-title">Monthly Expenses</div>
            <div className="card-value">${Number(stats.monthlyExpenses || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            <div className="card-change" style={{color: stats.expenseChange <= 0 ? '#10b981' : '#ef4444'}}>
              {stats.expenseChange <= 0 ? '↓' : '↑'}{Math.abs(stats.expenseChange || 0)}% from last month
            </div>
          </div>
          <div className="card">
            <div className="card-title">Estimated Tax Due</div>
            <div className="card-value">${Number(stats.estimatedTax || 0).toLocaleString()}</div>
            <div className="card-change" style={{color: '#6b7280'}}>No upcoming taxes</div>
          </div>
          <div className="card">
            <div className="card-title">Savings Rate</div>
            <div className="card-value">{Number(stats.savingsRate || 0)}%</div>
            <div className="card-change" style={{color: '#10b981'}}>↑3% from your goal</div>
          </div>
        </section>

        <section className="tp-grid">
          <div className="panel chart-panel">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <h3>Income vs Expenses</h3>
              <div style={{display: 'flex', gap: '8px'}}>
                <button 
                  className={`btn ${timeFilter === 'Year' ? 'primary' : 'outline'}`}
                  onClick={() => setTimeFilter('Year')}
                  style={{padding: '6px 12px', fontSize: '12px'}}
                >
                  Year
                </button>
                <button 
                  className={`btn ${timeFilter === 'Quarter' ? 'primary' : 'outline'}`}
                  onClick={() => setTimeFilter('Quarter')}
                  style={{padding: '6px 12px', fontSize: '12px'}}
                >
                  Quarter
                </button>
                <button 
                  className={`btn ${timeFilter === 'Month' ? 'primary' : 'outline'}`}
                  onClick={() => setTimeFilter('Month')}
                  style={{padding: '6px 12px', fontSize: '12px'}}
                >
                  Month
                </button>
              </div>
            </div>
            <div className="barchart-wrap">
              <BarChart 
                width={900} 
                height={320} 
                labels={chartLabels} 
                series={chartSeries}
                key={`chart-${chartSeries[0]?.data?.join(',')}-${chartSeries[1]?.data?.join(',')}`}
              />
            </div>
          </div>

          <div className="panel pie-panel">
            <h3>Expense Breakdown</h3>
            <div className="pie-and-legend">
              <div className="pie-wrap">
                {pieEntriesForRender.length === 0 ? (
                  <div className="pie-empty">No budgets yet</div>
                ) : (
                  <svg viewBox="0 0 32 32" className="tp-pie" aria-hidden>
                    {(() => {
                      let start = 0;
                      const colors = ['#4CAF50','#2196F3','#FF9800','#E91E63','#9C27B0','#00BCD4','#C084FC','#F59E0B'];
                      return pieEntriesForRender.map((slice, i) => {
                        const value = slice.value / (totalPieValue || 1);
                        const end = start + value;
                        const large = value > 0.5 ? 1 : 0;
                        const x1 = 16 + 16 * Math.cos(2 * Math.PI * start);
                        const y1 = 16 + 16 * Math.sin(2 * Math.PI * start);
                        const x2 = 16 + 16 * Math.cos(2 * Math.PI * end);
                        const y2 = 16 + 16 * Math.sin(2 * Math.PI * end);
                        const d = `M16 16 L ${x1} ${y1} A 16 16 0 ${large} 1 ${x2} ${y2} Z`;
                        start = end;
                        return <path key={i} d={d} fill={colors[i % colors.length]} />;
                      });
                    })()}
                  </svg>
                )}
              </div>

              <ul className="legend">
                {pieEntriesForRender.length === 0 ? (
                  <li className="muted">Add budgets to see breakdown</li>
                ) : pieEntriesForRender.map((p, i) => (
                  <li key={i}><span className="dot" style={{background: ['#4CAF50','#2196F3','#FF9800','#E91E63','#9C27B0','#00BCD4'][i%6]}}></span>{p.label} <strong>{p.pct}%</strong></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="panel transactions-panel">
            <h3>Recent Transactions</h3>
            <table className="transactions">
              <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead>
              <tbody>
                {transactions.length === 0 && <tr><td colSpan="4" style={{textAlign:'center'}}>No transactions yet</td></tr>}
                {transactions.map((t,i)=>(
                  <tr key={i} className={t.type === 'Income' ? 'income-row' : 'expense-row'}>
                    <td>{(t.date || '').slice(0,10)}</td>
                    <td>{t.description}</td>
                    <td>{t.category}</td>
                    <td className="amount">{Number(t.amount) >= 0 ? `$${Number(t.amount)}` : `-$${Math.abs(Number(t.amount))}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="settings-panel" className="settings-panel panel">
          <h3>Category management</h3>
          <div className="category-grid">
            <div className="category-list">
              {categories.map((c,i)=>(
                <div className="category-row" key={i}>
                  <div className="swatch" />
                  <div className="cat-name">{c}</div>
                  <div className="cat-actions"><button title="delete" onClick={()=>deleteCategory(c)}>x</button></div>
                </div>
              ))}
            </div>
            <div className="category-add">
              <input placeholder="New category" value={newCategory} onChange={e=>setNewCategory(e.target.value)} />
              <button className="btn primary" onClick={addCategory}>Add New Category</button>
            </div>
          </div>
        </section>
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h4>{modalType === 'Income' ? 'Record New Income' : 'Record New Expense'}</h4>
              <button className="icon-btn" onClick={()=>setShowModal(false)}><FaTimes/></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <input placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
                <input placeholder="Amount" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} type="number" step="0.01" />
              </div>
              <div className="form-row">
                {/* explicit placeholder + map categories */}
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  <option value="" disabled>Select category</option>
                  {categories.map((c,i)=>(<option value={c} key={i}>{c}</option>))}
                </select>
                <input 
                  type="date" 
                  value={form.date || new Date().toISOString().split('T')[0]} 
                  onChange={e=>setForm({...form,date:e.target.value})} 
                />
              </div>
              <div className="form-row">
                <textarea placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn outline" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn primary" onClick={saveTransaction} disabled={loadingSave}>{loadingSave ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
