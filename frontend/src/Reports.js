// frontend/src/Reports.jsx
import React, { useEffect, useState } from "react";
import { FaHome, FaExchangeAlt, FaWallet, FaCalculator, FaChartPie, FaSyncAlt } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import "./Reports.css";

export default function Reports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({
    totalBalance: 1583,
    expenses: 667,
    income: 2250,
  });

  useEffect(() => {
    loadDemo();
  }, []);

  function loadDemo() {
    // demo rows (fallback)
    const data = [
      { id: 1, start: "2025-06-06", end: "2026-06-06", income: 52.5, balance: 20.5 },
      { id: 2, start: "2025-06-05", end: "2026-06-05", income: 60.8, balance: 27.0 },
      { id: 3, start: "2025-06-04", end: "2026-06-04", income: 150.0, balance: 50.25 },
      { id: 4, start: "2025-06-03", end: "2026-06-03", income: 95.2, balance: 30.5 },
    ];
    setRows(data);
  }

  const handleGenerate = () => {
    // This is demo — in real app call backend with startDate/endDate
    alert("Generate report for range:\n" + (startDate || "any") + " → " + (endDate || "any"));
    // Could filter rows by date here
  };

  const handleRefresh = () => {
    loadDemo();
  };

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
            <div className="avatar">UN</div>
            <div className="user-meta">
              <div className="name">User Name</div>
              <div className="email">useremailid@gmail.com</div>
            </div>
          </div>

          <div className="tp-footer-links">
            <a className="footer-btn" href="#settings">⚙ Settings</a>
            <a className="footer-btn logout" href="#logout">⟲ Log Out</a>
          </div>
        </div>
      </aside>

      <main className="tp-main">
        <div className="page-banner">
          <div className="title-pill">Reports</div>
          <div className="health-pill">Report Filters</div>
        </div>

        {/* Filters card */}
        <section className="create-card filters-card">
          <h3>Report Filters</h3>
          <p className="muted">Select date range to filter payroll runs. Use this for per pay run validation, monthly/quarterly filing reconciliation, or annual reconciliation.</p>

          <div className="filters-row">
            <div className="filter-group">
              <label>Start Date:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="filter-group">
              <label>End Date:</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="filter-actions">
              <button className="btn primary" onClick={handleGenerate}>Generate Report</button>
              <button className="btn outline" onClick={handleRefresh}><FaSyncAlt /> Refresh</button>
            </div>
          </div>
        </section>

        {/* KPI row */}
        <section className="kpi-cards">
          <div className="kpi-card">
            <div className="kpi-title">Total Balance</div>
            <div className="kpi-value">${Number(stats.totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="kpi-sub">Across all accounts</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-title">Expenses</div>
            <div className="kpi-value">${Number(stats.expenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="kpi-sub">Since last month</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-title">Income</div>
            <div className="kpi-value">${Number(stats.income).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="kpi-sub">Since last month</div>
          </div>
        </section>

        {/* table card */}
        <section className="table-card">
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
                <tr><td colSpan="4" style={{ textAlign: "center", padding: 18 }}>No data</td></tr>
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
      </main>
    </div>
  );
}
