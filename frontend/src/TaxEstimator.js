import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaExchangeAlt, FaWallet, FaCalculator, FaChartPie, FaCog, FaSignOutAlt } from "react-icons/fa";
import "./TaxEstimator.css";

// Utility function to format money (used for display, not core logic)
const formatMoney = (val) => `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Mock data service functions are removed as they are not needed for a static form layout.
// The actual component logic is focused on the form and presentation from the image.

export default function TaxEstimator() {
  const navigate = useNavigate();
  
  // State for the form inputs
  const [country, setCountry] = useState("United States");
  const [state, setState] = useState("California");
  const [filingStatus, setFilingStatus] = useState("Single");
  const [quarter, setQuarter] = useState("May, 2025.");
  const [grossIncome, setGrossIncome] = useState("");
  const [businessExpenses, setBusinessExpenses] = useState("");
  const [retirementContributions, setRetirementContributions] = useState("");
  const [healthPremium, setHealthPremium] = useState("");
  const [homeOfficeDeduction, setHomeOfficeDeduction] = useState("");

  // Placeholder logic to simulate tax calculation (AGI = Gross - Expenses - Contributions - Premium - HomeOffice)
  const calculateTaxSummary = () => {
    const gross = Number(grossIncome || 0);
    const expenses = Number(businessExpenses || 0);
    const retirement = Number(retirementContributions || 0);
    const premium = Number(healthPremium || 0);
    const homeOffice = Number(homeOfficeDeduction || 0);
    
    const totalGrossIncome = gross;
    const adjustedGrossIncome = gross - expenses - retirement - premium - homeOffice;
    
    // Mock tax liability calculation for the UI
    const estimatedTaxDue = adjustedGrossIncome > 0 ? adjustedGrossIncome * 0.20 : 0;
    const estimatedTaxRate = totalGrossIncome > 0 ? (estimatedTaxDue / totalGrossIncome) * 100 : 0;

    return {
      totalGrossIncome: formatMoney(totalGrossIncome),
      adjustedGrossIncome: formatMoney(adjustedGrossIncome),
      estimatedTaxDue: formatMoney(estimatedTaxDue),
      estimatedTaxRate: `${estimatedTaxRate.toFixed(2)}%`,
    };
  };

  const taxSummary = calculateTaxSummary();

  const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (userFromStorage?.name || 'User Name').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'UN';

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleEstimateTax = () => {
    // In a real application, this would send the data to a backend API
    console.log("Estimating Tax with current inputs...");
    alert("Tax Estimation Initiated (Placeholder action)");
  };

  // --- UI Structure from the Image ---
  return (
    <div className="tp-dashboard-root">
      {/* Sidebar (Kept as is) */}
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
          <NavLink to="/tax-estimator" className={({ isActive }) => (isActive ? "active" : "active")}>
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
        
        {/* Settings/Logout moved to match the image's bottom left */}
        <div className="tp-settings-image-style">
           <NavLink to="/settings" className="image-style-link">
               <FaCog className="icon" /> Settings
           </NavLink>
           <button className="image-style-link" onClick={logout}>
               <FaSignOutAlt className="icon" /> Log Out
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="tp-main-estimator">
        <header className="tp-header-estimator">
          <div className="tp-header-title">Tax Estimator</div>
          <div className="tp-header-subtitle">Estimate your tax liability for the current fiscal year.</div>
        </header>

        <div className="tp-content-layout">
          {/* Left Panel: Tax Calculator Form */}
          <div className="tp-calculator-panel">
            
            <section className="tp-quarterly-calculator">
              <h3 className="section-title">Quarterly Tax Calculator</h3>
              
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="country">Country/Region</label>
                  <select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option>United States</option>
                    <option>Canada</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="state">State/Province</label>
                  <select id="state" value={state} onChange={(e) => setState(e.target.value)}>
                    <option>California</option>
                    <option>Texas</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="filingStatus">Filing Status</label>
                  <select id="filingStatus" value={filingStatus} onChange={(e) => setFilingStatus(e.target.value)}>
                    <option>Single</option>
                    <option>Married Filing Jointly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="quarter">Quarter</label>
                  <select id="quarter" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                    <option>May, 2025.</option>
                    <option>Aug, 2025.</option>
                  </select>
                </div>
              </div>
            </section>
            
            <section className="tp-income-section">
              <h3 className="section-title">Income</h3>
              
              <div className="form-grid-2">
                {/* Row 1 */}
                <div className="form-group">
                  <label htmlFor="grossIncome">Gross Income for Quarter</label>
                  <input type="number" id="grossIncome" placeholder="$ 0.00" value={grossIncome} onChange={(e) => setGrossIncome(e.target.value)} />
                </div>
                {/* Empty spot in the image layout */}
                <div></div> 
                
                {/* Row 2 */}
                <div className="form-group">
                  <label htmlFor="businessExpenses">Business Expenses</label>
                  <input type="number" id="businessExpenses" placeholder="$ 0.00" value={businessExpenses} onChange={(e) => setBusinessExpenses(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="retirementContributions">Retirement Contributions</label>
                  <input type="number" id="retirementContributions" placeholder="$ 0.00" value={retirementContributions} onChange={(e) => setRetirementContributions(e.target.value)} />
                </div>
                
                {/* Row 3 */}
                <div className="form-group">
                  <label htmlFor="healthPremium">Health Insurance Premium</label>
                  <input type="number" id="healthPremium" placeholder="$ 0.00" value={healthPremium} onChange={(e) => setHealthPremium(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="homeOfficeDeduction">Home Office Deduction</label>
                  <input type="number" id="homeOfficeDeduction" placeholder="$ 0.00" value={homeOfficeDeduction} onChange={(e) => setHomeOfficeDeduction(e.target.value)} />
                </div>
              </div>
            </section>
            
            <div className="tp-create-button-container">
              <button onClick={handleEstimateTax} className="tp-create-button">
                Create Estimated Tax
              </button>
            </div>
            
          </div>

          {/* Right Panel: Tax Summary */}
          <div className="tp-summary-panel">
            
            <div className="tp-summary-section">
              <div className="tp-summary-header">
                <div className="tp-summary-title">Tax Summary</div>
                <div className="tp-summary-icon">📝</div>
              </div>
              <p className="tp-summary-description">
                Calculate your Estimating tax, it is the process of forecasting your total annual income and 
                calculating your potential tax liability before the end of the fiscal year.
              </p>
            </div>

            <div className="tp-important-info-section">
              <div className="tp-important-info-title">Important Info</div>
              <ul className="tp-important-info-list">
                <li>
                  <div className="info-label">Total Gross Income:</div>
                  <div className="info-value">{taxSummary.totalGrossIncome}</div>
                </li>
                <li>
                  <div className="info-label">Adjusted Gross Income (AGI):</div>
                  <div className="info-value">{taxSummary.adjustedGrossIncome}</div>
                </li>
                <li>
                  <div className="info-label">Estimated Tax Due/Refund:</div>
                  <div className="info-value">{taxSummary.estimatedTaxDue}</div>
                </li>
                <li>
                  <div className="info-label">Estimated Tax Rate:</div>
                  <div className="info-value">{taxSummary.estimatedTaxRate}</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}