import { useState, useEffect, useCallback } from 'react';
import * as api from './api';

function App() {
  // ==========================================
  // STATE
  // ==========================================
  const [people, setPeople] = useState([]);
  const [items, setItems] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(true);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [toasts, setToasts] = useState([]);

  // Form state
  const [newPersonName, setNewPersonName] = useState('');
  const [newItem, setNewItem] = useState({ itemName: '', quantity: '', personId: '', moneyGiven: '' });
  const [actualPrices, setActualPrices] = useState({});

  // ==========================================
  // TOAST SYSTEM
  // ==========================================
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // ==========================================
  // DATA LOADING
  // ==========================================
  const loadData = useCallback(async () => {
    try {
      const [peopleData, itemsData] = await Promise.all([
        api.getPeople(),
        api.getItems()
      ]);
      setPeople(peopleData);
      setItems(itemsData);
    } catch (err) {
      showToast('Failed to load data. Is the server running?', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==========================================
  // AUTH HANDLERS
  // ==========================================
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await api.verifyPin(pinValue);
      if (result.valid) {
        setIsAdmin(true);
        setShowPinModal(false);
        setPinError('');
        showToast('🔓 Admin access granted');
      } else {
        setPinError('Incorrect PIN. Try again.');
        setPinValue('');
      }
    } catch {
      setPinError('Server not reachable.');
    }
  };

  const handleSkipPin = () => {
    setShowPinModal(false);
    setIsAdmin(false);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setPinValue('');
    showToast('🔒 Admin access locked');
  };

  // ==========================================
  // PEOPLE HANDLERS
  // ==========================================
  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    try {
      await api.addPerson(newPersonName.trim());
      setNewPersonName('');
      await loadData();
      showToast(`✅ ${newPersonName.trim()} added!`);
    } catch {
      showToast('Failed to add member', 'error');
    }
  };

  const handleDeletePerson = async (person) => {
    if (!confirm(`Remove ${person.name} and all their items?`)) return;
    try {
      await api.deletePerson(person.id);
      await loadData();
      showToast(`🗑️ ${person.name} removed`);
    } catch {
      showToast('Failed to delete member', 'error');
    }
  };

  // ==========================================
  // ITEM HANDLERS
  // ==========================================
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.itemName || !newItem.personId || !newItem.moneyGiven) return;
    try {
      await api.addItem(newItem);
      setNewItem({ itemName: '', quantity: '', personId: '', moneyGiven: '' });
      await loadData();
      showToast('🛒 Item added to shopping list');
    } catch {
      showToast('Failed to add item', 'error');
    }
  };

  const handleBuyItem = async (itemId) => {
    const price = actualPrices[itemId];
    if (!price) {
      showToast('Enter the actual price first', 'error');
      return;
    }
    try {
      await api.buyItem(itemId, parseFloat(price));
      setActualPrices(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      await loadData();
      showToast('✅ Item marked as bought');
    } catch {
      showToast('Failed to update item', 'error');
    }
  };

  const handleDeleteItem = async (item) => {
    if (!confirm(`Delete "${item.itemName}"?`)) return;
    try {
      await api.deleteItem(item.id);
      await loadData();
      showToast('🗑️ Item removed');
    } catch {
      showToast('Failed to delete item', 'error');
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================
  const formatPKR = (amount) => {
    return `₨ ${Math.abs(amount).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
  };

  const pendingItems = items.filter(i => i.status === 'PENDING');
  const boughtItems = items.filter(i => i.status === 'BOUGHT');

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <>
      {/* --- TOAST NOTIFICATIONS --- */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              {t.message}
            </div>
          ))}
        </div>
      )}

      {/* --- PIN MODAL --- */}
      {showPinModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="lock-icon">🔐</div>
            <h2>Admin Access</h2>
            <p>Enter your 4-digit PIN to unlock admin features, or skip to view only.</p>
            <form onSubmit={handlePinSubmit}>
              <input
                type="password"
                className="pin-input"
                maxLength={4}
                placeholder="• • • •"
                value={pinValue}
                onChange={e => {
                  setPinValue(e.target.value.replace(/\D/g, ''));
                  setPinError('');
                }}
                autoFocus
              />
              {pinError && <div className="pin-error">{pinError}</div>}
              <button type="submit" className="btn btn-primary btn-full">Unlock</button>
            </form>
            <button className="skip-link" onClick={handleSkipPin}>
              Skip — view only mode
            </button>
          </div>
        </div>
      )}

      {/* --- MAIN APP --- */}
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div>
            <h1>🏠 Household Purchases</h1>
            <p>Track market requests and settle balances</p>
          </div>
          {isAdmin ? (
            <button className="admin-toggle active" onClick={handleLogout}>
              🔓 Admin Mode
            </button>
          ) : (
            <button className="admin-toggle" onClick={() => { setShowPinModal(true); setPinValue(''); setPinError(''); }}>
              🔒 Locked
            </button>
          )}
        </header>

        {/* --- BALANCES SECTION --- */}
        <div className="glass-card">
          <div className="card-header">
            <h2><span className="icon">👥</span> Family Members</h2>
          </div>

          {people.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <p>No family members yet. Add one below!</p>
            </div>
          ) : (
            <div className="people-grid">
              {people.map(person => (
                <div
                  key={person.id}
                  className={`person-card ${person.currentBalance > 0 ? 'positive' : person.currentBalance < 0 ? 'negative' : 'neutral'}`}
                >
                  {isAdmin && (
                    <button className="delete-btn" onClick={() => handleDeletePerson(person)} title="Remove member">✕</button>
                  )}
                  <h3>{person.name}</h3>
                  <div className="balance-amount" style={{ color: person.currentBalance > 0 ? 'var(--success)' : person.currentBalance < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {person.currentBalance >= 0 ? '+' : '-'}{formatPKR(person.currentBalance)}
                  </div>
                  <div className="balance-label">
                    {person.currentBalance > 0 ? 'Uncle owes them' : person.currentBalance < 0 ? 'They owe Uncle' : 'All settled'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Person Form */}
          {isAdmin && (
            <form onSubmit={handleAddPerson} className="inline-form">
              <input
                type="text"
                placeholder="Add new family member..."
                value={newPersonName}
                onChange={e => setNewPersonName(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">+ Add</button>
            </form>
          )}
        </div>

        {/* --- NEW REQUEST SECTION --- */}
        <div className="glass-card">
          <div className="card-header">
            <h2><span className="icon">📝</span> New Request</h2>
          </div>
          <form onSubmit={handleAddItem}>
            <div className="form-row">
              <div className="form-group">
                <label>Item Name</label>
                <input type="text" placeholder="e.g. Milk, Rice..." value={newItem.itemName} onChange={e => setNewItem({ ...newItem, itemName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input type="text" placeholder="e.g. 2 Liters, 1 kg..." value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Who Requested</label>
                <select value={newItem.personId} onChange={e => setNewItem({ ...newItem, personId: e.target.value })}>
                  <option value="">— Select Person —</option>
                  {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Money Given (₨)</label>
                <input type="number" step="1" placeholder="0" value={newItem.moneyGiven} onChange={e => setNewItem({ ...newItem, moneyGiven: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full">🛒 Add to Shopping List</button>
          </form>
        </div>

        {/* --- SHOPPING LIST SECTION --- */}
        <div className="glass-card">
          <div className="card-header">
            <h2><span className="icon">🛍️</span> Shopping List</h2>
            {items.length > 0 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {pendingItems.length} pending · {boughtItems.length} bought
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <p>No items requested yet. Add a request above!</p>
            </div>
          ) : (
            <>
              {/* PENDING ITEMS */}
              {pendingItems.length > 0 && (
                <>
                  <div className="section-label">⏳ Pending</div>
                  {pendingItems.map(item => (
                    <div key={item.id} className="item-row">
                      <div className="item-info">
                        <h3>
                          {item.itemName}
                          {item.quantity && <span className="qty">({item.quantity})</span>}
                          <span className="badge badge-pending">Pending</span>
                        </h3>
                        <div className="item-meta">
                          <span>👤 {item.person?.name}</span>
                          <span>💰 {formatPKR(item.moneyGiven)} given</span>
                          <span>📅 {formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                      <div className="item-actions">
                        {isAdmin && (
                          <>
                            <input
                              type="number"
                              step="1"
                              placeholder="Actual cost..."
                              value={actualPrices[item.id] || ''}
                              onChange={e => setActualPrices({ ...actualPrices, [item.id]: e.target.value })}
                            />
                            <button className="btn btn-success" onClick={() => handleBuyItem(item.id)}>✓ Bought</button>
                            <button className="btn btn-danger-outline" onClick={() => handleDeleteItem(item)} title="Delete item">✕</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* BOUGHT ITEMS */}
              {boughtItems.length > 0 && (
                <>
                  <div className="section-label" style={{ marginTop: pendingItems.length > 0 ? '1.5rem' : '0' }}>✅ Bought</div>
                  {boughtItems.map(item => (
                    <div key={item.id} className="item-row">
                      <div className="item-info">
                        <h3>
                          {item.itemName}
                          {item.quantity && <span className="qty">({item.quantity})</span>}
                          <span className="badge badge-bought">Bought</span>
                        </h3>
                        <div className="item-meta">
                          <span>👤 {item.person?.name}</span>
                          <span>💰 {formatPKR(item.moneyGiven)} given</span>
                          <span>📅 {formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                      <div className="item-result">
                        <div className="cost">{formatPKR(item.actualPrice)}</div>
                        <div className="cost-label">actual cost</div>
                        {isAdmin && (
                          <button
                            className="btn btn-danger-outline"
                            style={{ marginTop: '6px', padding: '4px 10px', fontSize: '0.75rem' }}
                            onClick={() => handleDeleteItem(item)}
                          >
                            ✕ Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
