// frontend/src/Transactions.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaExchangeAlt, FaWallet, FaCalculator, FaChartPie, FaCog, FaSignOutAlt } from "react-icons/fa";
import { dataService } from "./services/dataService";
import "./transactions.css";

const API_BASE = "http://localhost:4000/api";

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* Add Category Modal (small) */
function AddCategoryModal({ open, onClose, onAdded }) {
  const [name, setName] = useState("");
  React.useEffect(() => { if (!open) setName(""); }, [open]);
  if (!open) return null;
  return (
    <div className="tp-modal-backdrop">
      <div className="tp-modal">
        <h3>Add Category</h3>
        <input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="tp-modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={async () => {
            if (!name.trim()) return alert("Enter category name");
            try {
              await axios.post(`${API_BASE}/categories`, { name: name.trim() });
              onAdded && onAdded();
              onClose();
            } catch (err) { console.error(err); alert("Failed"); }
          }}>Add</button>
        </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  // filtering/search states
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showDateFilters, setShowDateFilters] = useState(false);

  // other states
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);

  // modal
  const [showAddCat, setShowAddCat] = useState(false);

  const demoIncome = useMemo(() => [25000, 30000, 32000, 34000, 36000, 38000, 40000, 42000, 44000, 46000, 50000, 48000], []);
  const demoExpense = useMemo(() => [15000, 17000, 18000, 19000, 21000, 22000, 24000, 26000, 28000, 30000, 32000, 31000], []);

  const buildDemoTransactions = () => {
    const now = new Date();
    const demoTxs = [];
    const merchants = ['Amazon', 'Uber', 'Airbnb', 'Starbucks', 'Walmart', 'Netflix', 'Apple', 'Target', 'Shell', 'DoorDash'];
    const cards = ['Visa •••• 1245', 'Mastercard •••• 8421', 'Amex •••• 9001'];
    for (let i = 0; i < 40; i++) {
      const offsetDays = i * 3;
      const date = new Date(now.getTime() - offsetDays * 24 * 60 * 60 * 1000);
      const iso = date.toISOString();
      const incomeIdx = i % demoIncome.length;
      const expenseIdx = i % demoExpense.length;
      const merchant = merchants[i % merchants.length];
      const card = cards[i % cards.length];
      demoTxs.push({
        id: `demo-income-${i}`,
        description: `Deposit ${merchant}`,
        merchant,
        category: 'Demo Income',
        type: 'Income',
        amount: demoIncome[incomeIdx],
        date: iso,
        card,
        status: 'Completed',
      });
      demoTxs.push({
        id: `demo-expense-${i}`,
        description: `Purchase ${merchant}`,
        merchant,
        category: 'Demo Expense',
        type: 'Expense',
        amount: -demoExpense[expenseIdx],
        date: iso,
        card,
        status: i % 7 === 0 ? 'Pending' : 'Completed',
      });
    }
    return demoTxs;
  };

  // Load transactions from data service
  useEffect(() => {
    const loadData = async () => {
      const txs = await dataService.loadTransactions();
      applyFilters(txs);
    };
    
    loadData();
    
    // Subscribe to real-time updates
    const unsubscribe = dataService.subscribe(({ transactions: txs }) => {
      applyFilters(txs);
    });
    
    return unsubscribe;
  }, [q, from, to]);

  const applyFilters = (allTxs) => {
    let filtered = [...allTxs];
    
    // Search filter
    if (q && q.trim()) {
      const query = q.toLowerCase();
      filtered = filtered.filter(tx => 
        (tx.description || '').toLowerCase().includes(query) ||
        (tx.merchant || '').toLowerCase().includes(query) ||
        (tx.category || '').toLowerCase().includes(query)
      );
    }
    
    // Date filters
    if (from) {
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.date || Date.now()).toISOString().slice(0, 10);
        return txDate >= from;
      });
    }
    
    if (to) {
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.date || Date.now()).toISOString().slice(0, 10);
        return txDate <= to;
      });
    }
    
    // Show only expense transactions (as per image)
    filtered = filtered.filter(tx => tx.type === 'Expense' || (tx.amount && tx.amount < 0));

    if (!filtered.length) {
      filtered = buildDemoTransactions().filter(tx => tx.type === 'Expense');
    }
    
    setTransactions(filtered);
    setTotal(filtered.length);
  };

  async function fetchCategories() {
    try {
      const res = await axios.get(`${API_BASE}/categories`).catch(() => null);
      if (res?.data) {
        setCategories(res.data.data || []);
      } else {
        // Fallback categories
        setCategories(['Rent/Mortgage', 'Groceries', 'Transport', 'Utilities', 'Business Expenses', 'Food', 'Others']);
      }
    } catch (e) {
      console.error(e);
      setCategories(['Rent/Mortgage', 'Groceries', 'Transport', 'Utilities', 'Business Expenses', 'Food', 'Others']);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSearchClick = () => {
    const allTxs = dataService.getData().transactions;
    applyFilters(allTxs);
  };
  
  const onFilterApply = () => {
    const allTxs = dataService.getData().transactions;
    applyFilters(allTxs);
  };
  
  const onClearFilters = () => {
    setQ(""); 
    setFrom(""); 
    setTo(""); 
    setShowDateFilters(false);
    const allTxs = dataService.getData().transactions;
    applyFilters(allTxs);
  };

  // helper to read user from localStorage for avatar + info
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  };

  const user = getUser();
  const userName = user?.name || 'demo';
  const userEmail = user?.email || 'demo@gmail.com';
  const initials = userName.split(' ').map(n => n[0] ? n[0].toUpperCase() : '').join('').slice(0,2) || 'U';

  return (
    <div className="tp-root">
      {/* -------------------- SIDEBAR (Dashboard style, includes bottom user block) -------------------- */}
      <aside className="tp-sidebar">
        <div>
          <div className="tp-brand">TAX-PAL</div>

          <nav className="tp-nav" aria-label="Main navigation">
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
              <FaHome className="icon" /> Dashboard
            </NavLink>

            <NavLink to="/transactions" className={({ isActive }) => (isActive ? 'active' : '')}>
              <FaExchangeAlt className="icon" /> Transactions
            </NavLink>

            <NavLink to="/budgets" className={({ isActive }) => (isActive ? 'active' : '')}>
              <FaWallet className="icon" /> Budgets
            </NavLink>

            <NavLink to="/tax-estimator" className={({ isActive }) => (isActive ? 'active' : '')}>
              <FaCalculator className="icon" /> Tax Estimator
            </NavLink>

            <NavLink to="/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
              <FaChartPie className="icon" /> Reports
            </NavLink>
          </nav>
        </div>

        {/* bottom user area — matches Dashboard look */}
        <div className="tp-user-area">
          <div className="tp-user">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <div className="name">{userName}</div>
              <div className="email">{userEmail}</div>
            </div>
          </div>

          <div className="tp-settings">
            <button
              className="settings-btn"
              onClick={() => document.getElementById('settings-panel')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <FaCog /> Settings
            </button>

            <button
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
              }}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </aside>
      {/* -------------------- end sidebar -------------------- */}

      {/* Main content */}
      <main className="tp-main">
        <div className="tp-topbar">
          <div className="tp-topbar-title">Transactions</div>
        </div>

        <div className="tp-content">
          <h2 className="tp-section-title">Your Transactions...</h2>

          {/* --- Action row like your screenshot --- */}
          <div className="tp-action-row" style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 12 }}>
            <button className="btn" onClick={() => setShowAddCat(true)}>+ Add Category</button>

            <button className="btn" onClick={() => setShowDateFilters(prev => !prev)}>Filter Date range</button>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="tp-search-small"
                placeholder="Search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSearchClick(); }}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", minWidth: 220 }}
              />
              <button className="btn" onClick={onSearchClick} title="Search">🔍</button>
            </div>
          </div>

          {/* Compact date row shown when Filter Date range toggled */}
          {showDateFilters && (
            <div className="tp-filters-compact" style={{ gap: 10, marginBottom: 12 }}>
              <input type="date" className="tp-date-input" value={from} onChange={(e) => setFrom(e.target.value)} />
              <input type="date" className="tp-date-input" value={to} onChange={(e) => setTo(e.target.value)} />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn primary" onClick={onFilterApply}>Filter</button>
                <button className="btn" onClick={onClearFilters}>Clear</button>
              </div>
            </div>
          )}

          {/* Table Card */}
          <div className="tp-card" style={{ marginTop: 6 }}>
            <table className="tp-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Amount</th>
                  <th>Card</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="center">Loading...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan="5" className="center">No transactions</td></tr>
                ) : transactions.slice(0, 6).map(tx => (
                  <tr key={tx.id || tx._id || Math.random()}>
                    <td>{formatDate(tx.date)}</td>
                    <td>{tx.merchant || tx.description || 'N/A'}</td>
                    <td>${Math.abs(Number(tx.amount) || 0).toFixed(2)}</td>
                    <td>{tx.card || 'Visa'}</td>
                    <td><span className={`badge ${String(tx.status || 'Completed').toLowerCase()}`}>{tx.status || 'Completed'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {transactions.length > 4 && (
              <div className="tp-table-footer" style={{textAlign: 'right', padding: '12px'}}>
                <a href="#" style={{color: '#666', textDecoration: 'none'}}>View all &gt;</a>
              </div>
            )}
          </div>

          {/* bottom budget row */}
          <div className="tp-budget-row" style={{ marginTop: 26 }}>
            <div>Category</div><div>Budget</div><div>Spent</div><div>Remaining</div><div>Status</div><div>Action</div>
          </div>
        </div>
      </main>

      <AddCategoryModal open={showAddCat} onClose={() => setShowAddCat(false)} onAdded={() => {
        fetchCategories();
      }} />
    </div>
  );
}
