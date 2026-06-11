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
