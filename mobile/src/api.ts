import { API_BASE_URL } from './config';

export async function getDashboardMetrics(period: string = 'this_month') {
  const res = await fetch(`${API_BASE_URL}/dashboard?period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return res.json();
}

export async function getProducts(query: string = '') {
  const res = await fetch(`${API_BASE_URL}/products?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function getCustomers() {
  const res = await fetch(`${API_BASE_URL}/customers`);
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

export async function submitPOSBill(payload: any) {
  const res = await fetch(`${API_BASE_URL}/billing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to complete POS billing');
  }
  return data;
}

export async function getInvoices() {
  const res = await fetch(`${API_BASE_URL}/invoices`);
  if (!res.ok) throw new Error('Failed to fetch invoices');
  return res.json();
}

export async function getShopSettings() {
  const res = await fetch(`${API_BASE_URL}/settings`);
  if (!res.ok) throw new Error('Failed to fetch shop settings');
  return res.json();
}

export async function updateShopSettings(payload: any) {
  const res = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update settings');
  }
  return data;
}
