// frontend/src/TaxEstimator.jsx
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FaHome, FaExchangeAlt, FaWallet, FaCalculator, FaChartPie } from "react-icons/fa";
import "./TaxEstimator.css";

/**
 * Small SVG line chart renderer.
 * props:
 * - width, height
 * - series: [{ name, color, data: [numbers] }]
 * - labels: ['Jan','Feb',...]
 */
function LineChart({ width = 900, height = 280, series = [], labels = [] }) {
  const all = series.flatMap((s) => s.data);
  const max = Math.max(...all, 1);
  const pad = 24;
  const innerW = Math.max(width - pad * 2, 10);
  const innerH = Math.max(height - pad * 2, 10);

  const pointsFor = (data) =>
    data.map((v, i) => {
      const x = pad + (i / Math.max(data.length - 1, 1)) * innerW;
      const y = pad + innerH - (v / max) * innerH;
      return [x, y];
    });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="te-linechart" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Income vs Expenses">
      {[0.0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = pad + innerH * (1 - t);
        return <line key={i} x1={pad} x2={pad + innerW} y1={y} y2={y} stroke="#eee" strokeWidth={1} />;
      })}

      {series.map((s, idx) => {
        const pts = pointsFor(s.data);
        const pathD = `M ${pts.map((p) => p.join(" ")).join(" L ")}`;
        return (
          <g key={idx}>
            <path d={pathD} fill="none" stroke={s.color} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={3.2} fill={s.color} />
            ))}
          </g>
        );
      })}

      {labels.map((lab, i) => {
        const x = pad + (i / Math.max(labels.length - 1, 1)) * innerW;
        const y = pad + innerH + 18;
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
  // filters
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");
  const [q, setQ] = useState("");

  // data / loading
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalBalance: 1583.0,
    income: 2250.0,
    expenses: 667.0,
    monthlyLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    incomeSeries: [800, 900, 700, 1100, 1200, 1500, 1300, 1700, 1400, 1600, 1800, 2400],
    expenseSeries: [300, 280, 260, 310, 320, 350, 300, 410, 370, 420, 430, 510],
  });

  // user from localStorage (so sidebar shows same logged-in user as other pages)
  const userObj = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const userName = userObj.name || userObj.fullName || userObj.username || userObj.email || "User Name";
  const userEmail = userObj.email || "useremailid@gmail.com";
  const initials = (userName || "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || (userEmail[0] || "U").toUpperCase();

  useEffect(() => {
    // try to load real summary if backend exists
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("year", year);
        if (month) params.set("month", month);
        const url = `/api/tax/summary?${params.toString()}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setSummary((prev) => ({
              totalBalance: data.totalBalance ?? prev.totalBalance,
              income: data.income ?? prev.income,
              expenses: data.expenses ?? prev.expenses,
              monthlyLabels: data.labels ?? prev.monthlyLabels,
              incomeSeries: data.incomeSeries ?? prev.incomeSeries,
              expenseSeries: data.expenseSeries ?? prev.expenseSeries,
            }));
          }
        }
      } catch (err) {
        // keep demo data if network fails
        console.debug("Tax summary fetch failed", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [year, month]);

  const onSearch = () => {
    console.log("Search:", q);
  };

  const money = (v) => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const chartSeries = [
    { name: "Income", color: "#111827", data: summary.incomeSeries },
    { name: "Expenses", color: "#9CA3AF", data: summary.expenseSeries },
  ];

  return (
    <div className="tp-root te-root">
      {/* Sidebar */}
      <aside className="tp-sidebar">
        <div>
          <div className="tp-brand">TAX-PAL</div>
          <nav className="tp-nav" aria-label="main nav">
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
              <div className="name">{userName}</div>
              <div className="email">{userEmail}</div>
            </div>
          </div>
          <div className="tp-footer-links">
            <a className="footer-btn" href="/settings">
              ⚙ Settings
            </a>
            <a className="footer-btn logout" href="/logout">
              ⟲ Logout
            </a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="tp-main">
        <div className="tp-topbar">
          <div className="tp-topbar-title">Tax Estimator</div>
        </div>

        <div className="tp-content">
          <h2 className="tp-section-title">Estimate Taxes</h2>

          {/* filters row */}
          <div className="te-filters">
            <select className="te-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[...Array(6)].map((_, i) => {
                const y = new Date().getFullYear() - (5 - i);
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>

            <select className="te-select" value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">Month</option>
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>

            <div className="te-search">
              <input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSearch()} />
              <button className="btn" onClick={onSearch} title="Search">
                🔍
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="te-kpis">
            <div className="kpi-card">
              <div className="kpi-title">Total Balance</div>
              <div className="kpi-value">{money(summary.totalBalance)}</div>
              <div className="kpi-note">Across all accounts</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">Income</div>
              <div className="kpi-value">{money(summary.income)}</div>
              <div className="kpi-note">Since last month</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">Expenses</div>
              <div className="kpi-value">{money(summary.expenses)}</div>
              <div className="kpi-note">Since last month</div>
            </div>
          </div>

          {/* chart */}
          <div className="te-card chart-card">
            <div className="chart-head">
              <div>Financial Overview</div>
              <div className="chart-legends">
                <span className="legend-dot black" /> Income
                <span style={{ width: 10 }} />
                <span className="legend-dot gray" /> Expenses
                <select className="te-select small" style={{ marginLeft: 12 }}>
                  <option>Monthly View</option>
                  <option>Quarterly View</option>
                </select>
              </div>
            </div>

            <div className="chart-area">{loading ? <div className="center">Loading...</div> : <LineChart width={900} height={300} series={chartSeries} labels={summary.monthlyLabels} />}</div>
          </div>

          {/* bottom budget row */}
          <div className="tp-budget-row" style={{ marginTop: 26 }}>
            <div>Category</div>
            <div>Budget</div>
            <div>Spent</div>
            <div>Remaining</div>
            <div>Status</div>
            <div>Action</div>
          </div>
        </div>
      </main>
    </div>
  );
}
