// This file acts as the "bridge" between our Frontend React app and our Backend Node.js Server.

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

// ==========================================
// People
// ==========================================

export const getPeople = async () => {
  const res = await fetch(`${API_URL}/people`);
  if (!res.ok) throw new Error('Failed to fetch people');
  return res.json();
};

export const addPerson = async (name) => {
  const res = await fetch(`${API_URL}/people`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to add person');
  return res.json();
};

export const deletePerson = async (id) => {
  const res = await fetch(`${API_URL}/people/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete person');
  return res.json();
};

// ==========================================
// Items
// ==========================================

export const getItems = async () => {
  const res = await fetch(`${API_URL}/items`);
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
};

export const addItem = async (itemData) => {
  const res = await fetch(`${API_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  });
  if (!res.ok) throw new Error('Failed to add item');
  return res.json();
};

export const buyItem = async (itemId, actualPrice) => {
  const res = await fetch(`${API_URL}/items/${itemId}/buy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actualPrice }),
  });
  if (!res.ok) throw new Error('Failed to update item');
  return res.json();
};

export const deleteItem = async (id) => {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete item');
  return res.json();
};

// ==========================================
// Authentication
// ==========================================

export const verifyPin = async (pin) => {
  const res = await fetch(`${API_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) throw new Error('Auth request failed');
  return res.json();
};

// ==========================================
// Monthly Ration Management
// ==========================================

export const getMasterItems = async () => {
  const res = await fetch(`${API_URL}/master-items`);
  if (!res.ok) throw new Error('Failed to fetch master items');
  return res.json();
};

export const addMasterItem = async (data) => {
  const res = await fetch(`${API_URL}/master-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add master item');
  return res.json();
};

export const deleteMasterItem = async (id) => {
  const res = await fetch(`${API_URL}/master-items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete master item');
  return res.json();
};

export const getBudgets = async () => {
  const res = await fetch(`${API_URL}/budgets`);
  if (!res.ok) throw new Error('Failed to fetch budgets');
  return res.json();
};

export const getBudgetDetails = async (id) => {
  const res = await fetch(`${API_URL}/budgets/${id}`);
  if (!res.ok) throw new Error('Failed to fetch budget details');
  return res.json();
};

export const addBudget = async (data) => {
  const res = await fetch(`${API_URL}/budgets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add budget');
  return res.json();
};

export const addRationPlan = async (budgetId, data) => {
  const res = await fetch(`${API_URL}/budgets/${budgetId}/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add to plan');
  return res.json();
};

export const addBulkRationPlan = async (budgetId, items) => {
  const res = await fetch(`${API_URL}/budgets/${budgetId}/plan/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error('Failed to bulk add to plan');
  return res.json();
};

export const deleteRationPlan = async (id) => {
  const res = await fetch(`${API_URL}/plans/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete plan');
  return res.json();
};

export const addRationPurchase = async (budgetId, data) => {
  const res = await fetch(`${API_URL}/budgets/${budgetId}/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to log purchase');
  return res.json();
};

export const deleteRationPurchase = async (id) => {
  const res = await fetch(`${API_URL}/purchases/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete purchase');
  return res.json();
};
