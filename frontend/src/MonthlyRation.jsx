import { useState, useEffect } from 'react';
import * as api from './api';

export default function MonthlyRation({ isAdmin, showToast }) {
  const [budgets, setBudgets] = useState([]);
  const [activeBudget, setActiveBudget] = useState(null);
  const [masterItems, setMasterItems] = useState([]);
  
  // Modals / Forms
  const [showNewMonthForm, setShowNewMonthForm] = useState(false);
  const [newMonthData, setNewMonthData] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), allocatedAmount: '' });
  
  const [showMasterItemForm, setShowMasterItemForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');

  const [activeTab, setActiveTab] = useState('plan'); // 'plan' or 'purchases' or 'summary'

  // Load Initial Data
  useEffect(() => {
    loadBudgets();
    loadMasterItems();
  }, []);

  const loadBudgets = async () => {
    try {
      const data = await api.getBudgets();
      setBudgets(data);
      if (data.length > 0 && !activeBudget) {
        selectBudget(data[0].id);
      }
    } catch (err) {
      showToast('Failed to load months', 'error');
    }
  };

  const loadMasterItems = async () => {
    try {
      const data = await api.getMasterItems();
      setMasterItems(data);
    } catch (err) {
      showToast('Failed to load master items', 'error');
    }
  };

  const selectBudget = async (id) => {
    try {
      const data = await api.getBudgetDetails(id);
      setActiveBudget(data);
    } catch (err) {
      showToast('Failed to load budget details', 'error');
    }
  };

  // Actions
  const handleStartMonth = async (e) => {
    e.preventDefault();
    try {
      const newB = await api.addBudget(newMonthData);
      showToast('New month started!', 'success');
      setShowNewMonthForm(false);
      loadBudgets();
      selectBudget(newB.id);
    } catch (err) {
      showToast('Error starting month (maybe already exists?)', 'error');
    }
  };

  const handleAddMasterItem = async (e) => {
    e.preventDefault();
    if (!isAdmin) return showToast('Admin only', 'error');
    try {
      await api.addMasterItem({ name: newItemName, defaultUnit: newItemUnit });
      showToast('Item added to Master List', 'success');
      setNewItemName('');
      setShowMasterItemForm(false);
      loadMasterItems();
    } catch (err) {
      showToast('Error adding item', 'error');
    }
  };

  const handleAddToPlan = async (e) => {
    e.preventDefault();
    if (!isAdmin) return showToast('Admin only', 'error');
    const formData = new FormData(e.target);
    const masterItemId = formData.get('masterItemId');
    const plannedQuantity = formData.get('plannedQuantity');
    
    if (!masterItemId || !plannedQuantity) return;
    
    try {
      await api.addRationPlan(activeBudget.id, { masterItemId, plannedQuantity });
      showToast('Added to plan', 'success');
      e.target.reset();
      selectBudget(activeBudget.id);
    } catch (err) {
      showToast('Error adding to plan', 'error');
    }
  };

  const handleDeletePlan = async (id) => {
    if (!isAdmin) return;
    try {
      await api.deleteRationPlan(id);
      selectBudget(activeBudget.id);
    } catch (err) {
      showToast('Error deleting', 'error');
    }
  };

  const handleLogPurchase = async (e) => {
    e.preventDefault();
    if (!isAdmin) return showToast('Admin only', 'error');
    const formData = new FormData(e.target);
    const masterItemId = formData.get('masterItemId');
    const quantityBought = formData.get('quantityBought');
    const cost = formData.get('cost');

    if (!masterItemId || !quantityBought || !cost) return;

    try {
      await api.addRationPurchase(activeBudget.id, { masterItemId, quantityBought, cost });
      showToast('Purchase logged successfully', 'success');
      e.target.reset();
      selectBudget(activeBudget.id);
    } catch (err) {
      showToast('Error logging purchase', 'error');
    }
  };

  const handleDeletePurchase = async (id) => {
    if (!isAdmin) return;
    try {
      await api.deleteRationPurchase(id);
      selectBudget(activeBudget.id);
    } catch (err) {
      showToast('Error deleting', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getMonthName = (monthNum) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="monthly-ration-container">
      {/* Month Selector Header */}
      <div className="glass-card flex-between no-print">
        <div className="month-selector">
          <select 
            value={activeBudget?.id || ''} 
            onChange={(e) => selectBudget(e.target.value)}
            className="month-dropdown"
          >
            {budgets.map(b => (
              <option key={b.id} value={b.id}>
                {getMonthName(b.month)} {b.year}
              </option>
            ))}
          </select>
          {isAdmin && (
            <button className="btn btn-ghost" onClick={() => setShowNewMonthForm(!showNewMonthForm)}>
              + New Month
            </button>
          )}
        </div>

        {activeBudget && (
          <div className="budget-stats">
            <div className="stat">
              <span className="stat-label">Starting Budget</span>
              <span className="stat-value">Rs {activeBudget.allocatedAmount.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total Spent</span>
              <span className="stat-value text-danger">Rs {activeBudget.totalSpent?.toLocaleString() || 0}</span>
            </div>
            <div className="stat highlight">
              <span className="stat-label">Remaining</span>
              <span className="stat-value text-success">Rs {activeBudget.remainingBalance?.toLocaleString() || 0}</span>
            </div>
          </div>
        )}
      </div>

      {showNewMonthForm && (
        <form onSubmit={handleStartMonth} className="glass-card form-row no-print">
          <div className="form-group">
            <label>Month (1-12)</label>
            <input type="number" min="1" max="12" value={newMonthData.month} onChange={e => setNewMonthData({...newMonthData, month: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Year</label>
            <input type="number" value={newMonthData.year} onChange={e => setNewMonthData({...newMonthData, year: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Budget (Rs)</label>
            <input type="number" value={newMonthData.allocatedAmount} onChange={e => setNewMonthData({...newMonthData, allocatedAmount: e.target.value})} required />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-full">Start Month</button>
          </div>
        </form>
      )}

      {/* Tabs */}
      {activeBudget && (
        <div className="ration-tabs no-print">
          <button className={`tab ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => setActiveTab('plan')}>📝 Planned List</button>
          <button className={`tab ${activeTab === 'purchases' ? 'active' : ''}`} onClick={() => setActiveTab('purchases')}>🛒 Log Purchase</button>
          <button className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>📊 Monthly Summary</button>
          {isAdmin && <button className={`tab ${activeTab === 'master' ? 'active' : ''}`} onClick={() => setActiveTab('master')}>⚙️ Master Items</button>}
        </div>
      )}

      {/* TAB: PLAN */}
      {activeBudget && activeTab === 'plan' && (
        <div className="glass-card print-card">
          <div className="card-header no-print">
            <h2>📝 Planned List for {getMonthName(activeBudget.month)}</h2>
            <button className="btn btn-ghost" onClick={handlePrint}>🖨️ Print List</button>
          </div>

          <div className="print-only-header">
            <h2>Shopping List - {getMonthName(activeBudget.month)} {activeBudget.year}</h2>
          </div>

          {isAdmin && (
            <form onSubmit={handleAddToPlan} className="inline-form mb-4 no-print">
              <select name="masterItemId" required>
                <option value="">-- Select Item --</option>
                {masterItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.defaultUnit})</option>
                ))}
              </select>
              <input type="number" step="0.01" name="plannedQuantity" placeholder="Qty needed" required />
              <button type="submit" className="btn btn-primary">Add to Plan</button>
            </form>
          )}

          <div className="plan-list">
            {activeBudget.plans?.map(plan => (
              <div key={plan.id} className="item-row print-row">
                <div className="print-checkbox"></div>
                <div className="item-info">
                  <h3>{plan.masterItem.name}</h3>
                  <span className="qty">{plan.plannedQuantity} {plan.masterItem.defaultUnit} needed</span>
                </div>
                {isAdmin && (
                  <div className="item-actions no-print">
                    <button className="btn btn-danger-outline" onClick={() => handleDeletePlan(plan.id)}>✕</button>
                  </div>
                )}
              </div>
            ))}
            {(!activeBudget.plans || activeBudget.plans.length === 0) && (
              <div className="empty-state no-print">
                <p>No items planned for this month yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PURCHASES */}
      {activeBudget && activeTab === 'purchases' && (
        <div className="glass-card">
          <div className="card-header">
            <h2>🛒 Log a Purchase</h2>
          </div>

          {isAdmin && (
            <form onSubmit={handleLogPurchase} className="inline-form mb-4">
              <select name="masterItemId" required>
                <option value="">-- What did you buy? --</option>
                {masterItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.defaultUnit})</option>
                ))}
              </select>
              <input type="number" step="0.01" name="quantityBought" placeholder="Qty bought" required />
              <input type="number" step="0.01" name="cost" placeholder="Total Cost (Rs)" required />
              <button type="submit" className="btn btn-success">Save Purchase</button>
            </form>
          )}

          <h3 className="section-label">Purchase History</h3>
          <div className="purchase-list">
            {activeBudget.purchases?.map(p => (
              <div key={p.id} className="item-row">
                <div className="item-info">
                  <h3>{p.masterItem.name}</h3>
                  <span className="qty">{p.quantityBought} {p.masterItem.defaultUnit}</span>
                  <div className="item-meta">
                    <span>📅 {new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="item-result">
                  <div className="cost">Rs {p.cost.toLocaleString()}</div>
                  {isAdmin && (
                    <button className="btn btn-danger-outline" style={{padding: '2px 8px', fontSize: '0.7rem', marginTop: '4px'}} onClick={() => handleDeletePurchase(p.id)}>Delete</button>
                  )}
                </div>
              </div>
            ))}
            {(!activeBudget.purchases || activeBudget.purchases.length === 0) && (
              <div className="empty-state">
                <p>No purchases logged this month.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: SUMMARY */}
      {activeBudget && activeTab === 'summary' && (
        <div className="glass-card">
          <div className="card-header">
            <h2>📊 Monthly Aggregated Summary</h2>
          </div>
          <div className="summary-list">
            <div className="item-row" style={{borderBottom: '2px solid var(--surface-border)'}}>
              <div className="item-info"><strong>Item</strong></div>
              <div className="item-info text-center"><strong>Total Bought</strong></div>
              <div className="item-result"><strong>Total Spent</strong></div>
            </div>
            {activeBudget.summary?.map(sum => (
              <div key={sum.name} className="item-row">
                <div className="item-info">
                  <h3>{sum.name}</h3>
                </div>
                <div className="item-info text-center">
                  <span className="qty">{sum.totalQty} {sum.unit}</span>
                </div>
                <div className="item-result">
                  <div className="cost">Rs {sum.totalCost.toLocaleString()}</div>
                </div>
              </div>
            ))}
            {(!activeBudget.summary || activeBudget.summary.length === 0) && (
              <div className="empty-state">
                <p>No data to summarize yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: MASTER ITEMS (ADMIN ONLY) */}
      {isAdmin && activeTab === 'master' && (
        <div className="glass-card">
          <div className="card-header">
            <h2>⚙️ Master Items Dictionary</h2>
            <button className="btn btn-ghost" onClick={() => setShowMasterItemForm(!showMasterItemForm)}>
              + Add Item
            </button>
          </div>

          {showMasterItemForm && (
            <form onSubmit={handleAddMasterItem} className="inline-form mb-4">
              <input type="text" placeholder="Item Name (e.g. Flour)" value={newItemName} onChange={e => setNewItemName(e.target.value)} required />
              <select value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}>
                <option value="kg">kg</option>
                <option value="liters">liters</option>
                <option value="packets">packets</option>
                <option value="pieces">pieces</option>
                <option value="grams">grams</option>
              </select>
              <button type="submit" className="btn btn-primary">Save</button>
            </form>
          )}

          <div className="people-grid">
            {masterItems.map(item => (
              <div key={item.id} className="person-card neutral">
                <h3>{item.name}</h3>
                <span className="balance-label">Default unit: {item.defaultUnit}</span>
                <button className="delete-btn" onClick={async () => {
                  try {
                    await api.deleteMasterItem(item.id);
                    loadMasterItems();
                  } catch(e) { showToast('Error deleting', 'error') }
                }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
