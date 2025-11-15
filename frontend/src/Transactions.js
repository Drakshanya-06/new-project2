// frontend/src/Transactions.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { FaHome, FaExchangeAlt, FaWallet, FaCalculator, FaChartPie, FaCog, FaSignOutAlt } from "react-icons/fa";
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

  async function fetchCategories() {
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      setCategories(res.data.data || []);
    } catch (e) {
      console.error(e);
      setCategories([]);
    }
  }

  async function fetchTransactions(p = 1) {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (q && q.trim()) params.q = q.trim();
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await axios.get(`${API_BASE}/transactions`, { params });
      setTransactions(res.data.data || []);
      setTotal(res.data.total || 0);
      setPage(p);
    } catch (err) {
      console.error(err);
      setTransactions([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCategories();
    fetchTransactions(1);
    // eslint-disable-next-line
  }, []);

  const onSearchClick = () => fetchTransactions(1);
  const onFilterApply = () => fetchTransactions(1);
  const onClearFilters = () => {
    setQ(""); setFrom(""); setTo(""); setShowDateFilters(false);
    fetchTransactions(1);
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
                window.location.href = '/login';
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
                  <th>Category</th>
                  <th>Status</th>
                  <th style={{ width: 130 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="center">Loading...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan="7" className="center">No transactions</td></tr>
                ) : transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{formatDate(tx.date)}</td>
                    <td>{tx.merchant}</td>
                    <td>${Number(tx.amount).toFixed(2)}</td>
                    <td>{tx.card}</td>
                    <td>{tx.category}</td>
                    <td><span className={`badge ${String(tx.status || '').toLowerCase()}`}>{tx.status}</span></td>
                    <td>
                      <button className="btn small" onClick={async () => {
                        if (!window.confirm("Delete this transaction?")) return;
                        try {
                          await axios.delete(`${API_BASE}/transactions/${tx.id}`);
                        } catch (e) { console.error(e); }
                        fetchTransactions(page);
                      }}>Delete</button>

                      <button className="btn small" onClick={async () => {
                        try {
                          const newStatus = tx.status === "Cancelled" ? "Completed" : "Cancelled";
                          await axios.put(`${API_BASE}/transactions/${tx.id}`, { status: newStatus });
                        } catch (e) { console.error(e); }
                        fetchTransactions(page);
                      }}>{tx.status === "Cancelled" ? "Mark Completed" : "Cancel"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="tp-table-footer">
              <div>Showing {transactions.length} of {total}</div>
              <div className="tp-pagination">
                <button className="btn" disabled={page <= 1} onClick={() => fetchTransactions(page - 1)}>Prev</button>
                <span>Page {page}</span>
                <button className="btn" disabled={(page * limit) >= total} onClick={() => fetchTransactions(page + 1)}>Next</button>
                <button className="btn" onClick={() => fetchTransactions(1)}>View all</button>
              </div>
            </div>
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
