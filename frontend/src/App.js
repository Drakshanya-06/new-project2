// src/App.js
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import SignUp from './SignUp';
import Dashboard from './Dashboard';
import ForgotPassword from './ForgotPassword';
import OTPVerification from './OTPVerification';
import OTPEntry from './OTPEntry';
import ResetPassword from './ResetPassword';
import './App.css';

// Lazy load pages (define each page only once)
const Transactions = React.lazy(() => import('./Transactions'));
const Budgets = React.lazy(() => import('./Budgets'));
const TaxEstimator = React.lazy(() => import('./TaxEstimator'));
const Reports = React.lazy(() => import('./Reports'));

function App() {
  return (
    <Router>
      <div className="App">
        <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/otp-verification" element={<OTPVerification />} />
            <Route path="/otp-entry" element={<OTPEntry />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/tax-estimator" element={<TaxEstimator />} />
            <Route path="/reports" element={<Reports />} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
