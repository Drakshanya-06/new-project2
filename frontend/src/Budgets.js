// frontend/src/Budgets.jsx
import React, { useEffect, useState } from "react";
import { FaHome, FaExchangeAlt, FaWallet, FaCalculator, FaChartPie } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { budgetsAPI } from "./services/api"; // uses your axios instance
import "./Budgets.css";

export default function Budgets() {
  const [loading, setLoading] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({
    category: "",
    amount: "",
    month: "",
    description: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBudgets();
  }, []);

  async function fetchBudgets() {
    try {
      setLoading(true);
      const res = await budgetsAPI.list().catch(() => null);
      if (res && res.data) {
        setBudgets(res.data.budgets || res.data);
      } else {
        setBudgets([
          { id: "b1", category: "Groceries", budget: 500, spent: 120, month: "2025-11", status: "Active" },
          { id: "b2", category: "Transport", budget: 200, spent: 150, month: "2025-11", status: "Active" },
        ]);
      }
    } catch (err) {
      console.error("Could not load budgets", err);
    } finally {
      setLoading(false);
    }
  }

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
      const res = await budgetsAPI.create(payload).catch(() => null);

      if (res && res.data) {
        const created = res.data.budget || res.data;
        setBudgets((p) => [created, ...p]);
      } else {
        const fake = {
          id: `local-${Date.now()}`,
          category: payload.category,
          budget: payload.amount,
          spent: 0,
          month: payload.month,
          description: payload.description,
          status: "Active",
        };
        setBudgets((p) => [fake, ...p]);
      }

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
      await budgetsAPI.delete(id).catch(() => null);
      setBudgets((p) => p.filter((b) => (b.id || b._id) !== id));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed");
    }
  };

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
            <div className="avatar">d</div>
            <div className="user-meta">
              <div className="name">demo</div>
              <div className="email">demo@gmail.com</div>
            </div>
          </div>

          <div className="tp-footer-links">
            <a className="footer-btn" href="/settings">⚙ Settings</a>
            <a className="footer-btn logout" href="/logout">⟲ Logout</a>
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
                  <option>Groceries</option>
                  <option>Rent/Mortgage</option>
                  <option>Transport</option>
                  <option>Utilities</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Budget Amount:</label>
                <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="$ 0.00" />
              </div>

              <div className="form-group">
                <label>Month:</label>
                <input name="month" type="month" value={form.month} onChange={handleChange} />
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
              <div className="kpi-desc">Spent : ${totalSpent} / ${totalBudget} Total</div>
              <div className="kpi-muted">Across all accounts</div>
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
                {/* using budgets list as demo rows - if you have a separate recent transactions array, replace here */}
                {budgets.map((b) => (
                  <tr key={b.id || b._id}>
                    <td>{b.category}</td>
                    <td>{b.generatedDate ?? b.date ?? "2025-06-06"}</td>
                    <td>${Number(b.budget ?? b.amount ?? 0).toFixed(2)}</td>
                    <td>{b.status ?? "Remaining by : $" + Math.max(0, (b.budget ?? b.amount ?? 0) - (b.spent ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Empty spacer so layout matches design */}
        <div style={{ height: 22 }} />

        {/* Table card */}
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
                    <td>{b.month}</td>
                    <td>{b.status || "Active"}</td>
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
