// Shared data service for real-time updates across all pages
import { transactionsAPI } from './api';

class DataService {
  constructor() {
    this.listeners = new Set();
    this.transactions = [];
    this.budgets = [];
    this.cache = {
      transactions: [],
      budgets: [],
      lastUpdate: null
    };
  }

  // Subscribe to data changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of data changes
  notify() {
    this.listeners.forEach(callback => {
      try {
        callback({
          transactions: this.cache.transactions,
          budgets: this.cache.budgets
        });
      } catch (err) {
        console.error('Listener error:', err);
      }
    });
  }

  // Load transactions from API or localStorage
  async loadTransactions() {
    try {
      const res = await transactionsAPI?.getAll?.().catch(() => null);
      if (res?.data) {
        const txs = res.data.transactions || res.data || [];
        this.cache.transactions = Array.isArray(txs) ? txs : [];
        this.notify();
        return this.cache.transactions;
      }
    } catch (err) {
      console.warn('Failed to load transactions from API:', err);
    }
    
    // Fallback to localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('tp_transactions') || '[]');
      this.cache.transactions = stored;
      this.notify();
      return stored;
    } catch (e) {
      this.cache.transactions = [];
      return [];
    }
  }

  // Load budgets from localStorage
  loadBudgets() {
    try {
      const stored = JSON.parse(localStorage.getItem('tp_budgets') || '[]');
      this.cache.budgets = stored;
      this.notify();
      return stored;
    } catch (e) {
      this.cache.budgets = [];
      return [];
    }
  }

  // Add transaction
  async addTransaction(transaction) {
    try {
      const res = await transactionsAPI?.create?.(transaction).catch(() => null);
      const newTx = res?.data?.transaction || res?.data || transaction;
      
      // Update cache
      this.cache.transactions = [newTx, ...this.cache.transactions];
      
      // Persist to localStorage
      try {
        localStorage.setItem('tp_transactions', JSON.stringify(this.cache.transactions));
      } catch (e) {}
      
      this.notify();
      return newTx;
    } catch (err) {
      console.error('Failed to save transaction:', err);
      // Still add locally
      const newTx = { ...transaction, id: `local-${Date.now()}` };
      this.cache.transactions = [newTx, ...this.cache.transactions];
      try {
        localStorage.setItem('tp_transactions', JSON.stringify(this.cache.transactions));
      } catch (e) {}
      this.notify();
      return newTx;
    }
  }

  // Update budgets
  updateBudgets(budgets) {
    this.cache.budgets = Array.isArray(budgets) ? budgets : [];
    try {
      localStorage.setItem('tp_budgets', JSON.stringify(this.cache.budgets));
    } catch (e) {}
    this.notify();
  }

  // Calculate spent amounts for budgets based on transactions
  calculateBudgetSpent(budgets, transactions) {
    return budgets.map(budget => {
      const category = budget.category || '';
      const month = budget.month || '';
      
      // Filter transactions matching this budget's category and month
      const matchingTxs = transactions.filter(tx => {
        const txDate = new Date(tx.date || Date.now());
        const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        const matchesCategory = (tx.category || '').toLowerCase() === category.toLowerCase();
        const matchesMonth = !month || txMonth === month;
        const isExpense = tx.type === 'Expense' || (tx.amount && tx.amount < 0);
        
        return matchesCategory && matchesMonth && isExpense;
      });
      
      const spent = matchingTxs.reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
      
      return {
        ...budget,
        spent,
        remaining: (budget.budget || budget.amount || 0) - spent,
        status: spent > (budget.budget || budget.amount || 0) 
          ? `Overbudget by: $${(spent - (budget.budget || budget.amount || 0)).toFixed(2)}`
          : `Remaining by: $${((budget.budget || budget.amount || 0) - spent).toFixed(2)}`
      };
    });
  }

  // Get current data
  getData() {
    return {
      transactions: this.cache.transactions,
      budgets: this.cache.budgets
    };
  }
}

// Export singleton instance
export const dataService = new DataService();

// Initialize on load
if (typeof window !== 'undefined') {
  dataService.loadTransactions();
  dataService.loadBudgets();
  
  // Listen for storage events (cross-tab updates)
  window.addEventListener('storage', (e) => {
    if (e.key === 'tp_transactions' || e.key === 'tp_budgets') {
      dataService.loadTransactions();
      dataService.loadBudgets();
    }
  });
  
  // Listen for custom events
  window.addEventListener('tp_transactions_changed', () => {
    dataService.loadTransactions();
  });
  
  window.addEventListener('tp_budgets_changed', () => {
    dataService.loadBudgets();
  });
}

export default dataService;

