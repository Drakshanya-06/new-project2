// frontend/src/Budgets.jsx
import React, { useEffect, useState } from "react";
import { FaHome, FaExchangeAlt, FaWallet, FaCalculator, FaChartPie, FaCog, FaSignOutAlt } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { budgetsAPI } from "./services/api";
import { dataService } from "./services/dataService";
import "./Budgets.css";

export default function Budgets() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    category: "",
    amount: "",
    month: "",
    description: "",
  });
  const [error, setError] = useState("");

  // Load data and subscribe to updates
  useEffect(() => {
    const loadData = async () => {
      const txs = await dataService.loadTransactions();
      const bgs = dataService.loadBudgets();
      setTransactions(txs);
      updateBudgetsWithSpent(bgs, txs);
    };
    
    loadData();
    
    // Subscribe to real-time updates
    const unsubscribe = dataService.subscribe(({ transactions: txs, budgets: bgs }) => {
      setTransactions(txs);
      updateBudgetsWithSpent(bgs, txs);
    });
    
    return unsubscribe;
  }, []);

  // Calculate spent amounts from transactions
  const updateBudgetsWithSpent = (bgs, txs) => {
    const updated = dataService.calculateBudgetSpent(bgs, txs);
    setBudgets(updated);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.category || !form.amount || !form.month) {
      setError("Category, amount and month are required");
      return;
    }

    const payload = {
      category: form.category,
      amount: Number(form.amount),
      month: form.month,
      description: form.description,
    };

    try {
      setLoading(true);
      const res = await budgetsAPI?.create?.(payload).catch(() => null);

      let created;
      if (res && res.data) {
        created = res.data.budget || res.data;
      } else {
        created = {
          id: `local-${Date.now()}`,
          category: payload.category,
          budget: payload.amount,
          spent: 0,
          month: payload.month,
          description: payload.description,
          status: "Active",
        };
      }

      // Update via data service (triggers real-time updates)
      const updated = [created, ...budgets];
      dataService.updateBudgets(updated);
      updateBudgetsWithSpent(updated, transactions);

      setForm({ category: "", amount: "", month: "", description: "" });
    } catch (err) {
      console.error("Create budget failed", err);
      setError("Save failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ category: "", amount: "", month: "", description: "" });
    setError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this budget?")) return;
    try {
      await budgetsAPI?.delete?.(id).catch(() => null);
      const newArr = budgets.filter((b) => (b.id || b._id) !== id);
      dataService.updateBudgets(newArr);
      updateBudgetsWithSpent(newArr, transactions);
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed");
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (userFromStorage?.name || 'User Name').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'UN';

  // compute overall KPI
  const totalBudget = budgets.reduce((s, b) => s + (b.budget ?? b.amount ?? 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent ?? 0), 0);

  return (
    <div className="tp-dashboard-root">
      {/* Sidebar */}
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
            <button className="logout-btn" onClick={logout}><FaSignOutAlt/> Logout</button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="tp-main budgets-page">
        <header className="tp-header">
          <h1>BUDGETS</h1>
          <div className="top-right-health">Budget Health <span className="pill good">Good</span></div>
        </header>

        {/* Create Budget Inline */}
        <section className="create-card tp-card">
          <h3>Create Budget</h3>

          <form className="create-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label>Category:</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="">Select a Category</option>
                  <option>Rent/Mortgage</option>
                  <option>Groceries</option>
                  <option>Transport</option>
                  <option>Utilities</option>
                  <option>Business Expenses</option>
                  <option>Food</option>
                  <option>Others</option>
                </select>
              </div>

              <div className="form-group">
                <label>Budget Amount:</label>
                <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="$ 0.00" />
              </div>

              <div className="form-group">
                <label>Month:</label>
                <input name="month" type="month" value={form.month} onChange={handleChange} placeholder="May, 2025" />
              </div>

              <div className="form-group">
                <label>Description (optional):</label>
                <input name="description" value={form.description} onChange={handleChange} placeholder="Add any additional details" />
              </div>
            </div>

            {error && <div className="error-inline">{error}</div>}

            <div className="form-actions">
              <button type="button" className="btn outline" onClick={handleCancel}>Cancel</button>
              <button type="submit" className="btn primary">Create New Budget</button>
            </div>
          </form>
        </section>

        {/* Overall KPI & recent transactions */}
        <section className="overall-card tp-card">
          <div className="overall-left">
            <h4>Overall Budget</h4>
            <div className="kpi-small">
              <div className="kpi-desc">Spent : ${totalSpent.toFixed(2)} / ${totalBudget.toFixed(2)} Total</div>
              <div className="kpi-muted">Across all accounts</div>
              <div className="kpi-change" style={{color: '#10b981', marginTop: '4px'}}>↑ 12.73%</div>
            </div>
          </div>

          <div className="overall-table-wrap">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Expense Type</th>
                  <th>Date Generated</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {budgets.length === 0 && (
                  <tr><td colSpan="4" style={{textAlign: 'center'}}>No budgets found</td></tr>
                )}
                {budgets.slice(0, 4).map((b) => {
                  const budgetAmt = b.budget ?? b.amount ?? 0;
                  const spent = b.spent ?? 0;
                  const remaining = budgetAmt - spent;
                  const date = b.generatedDate ?? b.date ?? new Date().toISOString().slice(0, 10);
                  return (
                    <tr key={b.id || b._id}>
                      <td>{b.category}</td>
                      <td>{date}</td>
                      <td>${budgetAmt.toFixed(2)}</td>
                      <td>{remaining >= 0 ? `Remaining by: $${remaining.toFixed(2)}` : `Overbudget by: $${Math.abs(remaining).toFixed(2)}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ height: 22 }} />

        <section className="tp-card table-card">
          <table className="budgets-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>Month</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {budgets.length === 0 && (
                <tr><td colSpan="7">No budgets found.</td></tr>
              )}
              {budgets.map((b) => {
                const id = b.id || b._id;
                const budgetAmt = b.budget ?? b.amount ?? 0;
                const spent = b.spent ?? 0;
                return (
                  <tr key={id}>
                    <td>{b.category}</td>
                    <td>${Number(budgetAmt).toFixed(2)}</td>
                    <td>${Number(spent).toFixed(2)}</td>
                    <td>${(budgetAmt - spent).toFixed(2)}</td>
                    <td>{b.month || new Date().toISOString().slice(0, 7)}</td>
                    <td>{b.status || (spent > budgetAmt ? `Overbudget by: $${(spent - budgetAmt).toFixed(2)}` : `Remaining by: $${(budgetAmt - spent).toFixed(2)}`)}</td>
                    <td>
                      <button className="btn small" onClick={() => alert("Edit not implemented")}>Edit</button>{" "}
                      <button className="btn danger small" onClick={() => handleDelete(id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
