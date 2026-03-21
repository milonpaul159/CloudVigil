/**
 * CloudVigil — API Service Layer
 * Handles all HTTP communication with the Express backend.
 */

const API_BASE = 'http://localhost:5000/api';

/**
 * Get stored JWT token from localStorage.
 */
const getToken = () => localStorage.getItem('cloudvigil_token');

/**
 * Build headers with Authorization if token exists.
 */
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
});

/**
 * Generic fetch wrapper with error handling.
 */
const apiFetch = async (endpoint, options = {}) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: authHeaders(),
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
};

// ── Auth ──────────────────────────────────────────────────────

export const login = async (username, password) => {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (data.token) {
    localStorage.setItem('cloudvigil_token', data.token);
    localStorage.setItem('cloudvigil_user', JSON.stringify(data.user));
  }

  return data;
};

export const register = async (username, password) => {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (data.token) {
    localStorage.setItem('cloudvigil_token', data.token);
    localStorage.setItem('cloudvigil_user', JSON.stringify(data.user));
  }

  return data;
};

export const logout = () => {
  localStorage.removeItem('cloudvigil_token');
  localStorage.removeItem('cloudvigil_user');
};

export const getUser = () => {
  const user = localStorage.getItem('cloudvigil_user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => !!getToken();

// ── Analytics ─────────────────────────────────────────────────

export const fetchAnalytics = (hours = 24) =>
  apiFetch(`/analytics?hours=${hours}`);

// ── Targets ───────────────────────────────────────────────────

export const fetchTargets = () => apiFetch('/targets');

export const addTarget = (url, name) =>
  apiFetch('/targets', {
    method: 'POST',
    body: JSON.stringify({ url, name }),
  });

export const deleteTarget = (id) =>
  apiFetch(`/targets/${id}`, { method: 'DELETE' });

// ── Pings ─────────────────────────────────────────────────────

export const triggerPing = () =>
  apiFetch('/pings/trigger', { method: 'POST' });

// ── Health ────────────────────────────────────────────────────

export const checkHealth = () => apiFetch('/health');

// ── Traffic ────────────────────────────────────────────

export const fetchTraffic = (hours = 24) =>
  apiFetch(`/traffic?hours=${hours}`);

// ── API Tester ────────────────────────────────────────────────

export const testUrl = (url, method = 'GET') =>
  apiFetch('/apitest/url', {
    method: 'POST',
    body: JSON.stringify({ url, method }),
  });

export const testSpec = (spec) =>
  apiFetch('/apitest/spec', {
    method: 'POST',
    body: JSON.stringify({ spec }),
  });
