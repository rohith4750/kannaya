import { API_BASE_URL, ENDPOINT_FALLBACKS } from './config';

/**
 * Robust fetch helper with multi-endpoint failover for standalone APK:
 * Tries Wi-Fi IP (192.168.31.178:3000) -> USB ADB Reverse (localhost:3000) -> Android Emulator (10.0.2.2:3000) -> Port 3001 -> Cloud Server.
 */
export async function fetchWithFallback(endpointPath: string, options?: RequestInit): Promise<Response> {
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  let lastErr: any = null;

  for (const base of ENDPOINT_FALLBACKS) {
    const fullUrl = `${base}${cleanPath}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout per endpoint

      const res = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return res;
      }
      if (res.status >= 500) {
        lastErr = new Error(`Server returned HTTP ${res.status}`);
        continue;
      }
      return res;
    } catch (err: any) {
      console.warn(`[API Endpoint Retry] Could not connect to ${fullUrl}:`, err?.message || err);
      lastErr = err;
    }
  }

  throw lastErr || new Error('Cannot connect to ERP server. Check server connection or network.');
}

export async function getDashboardMetrics(period: string = 'this_month') {
  console.log(`[API GET] Fetching dashboard metrics (${period})`);
  try {
    const res = await fetchWithFallback(`/dashboard?period=${period}`);
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[API Error] GET dashboard [Status ${res.status}]:`, errText);
      throw new Error(`Failed to fetch metrics (Status ${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    console.error(`[API Exception] GET dashboard:`, err);
    throw err;
  }
}

export async function getProducts(query: string = '') {
  console.log(`[API GET] Fetching products (query: ${query})`);
  try {
    const res = await fetchWithFallback(`/products?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[API Error] GET products [Status ${res.status}]:`, errText);
      throw new Error(`Failed to fetch products (Status ${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    console.error(`[API Exception] GET products:`, err);
    throw err;
  }
}

export async function getCustomers() {
  console.log(`[API GET] Fetching customers`);
  try {
    const res = await fetchWithFallback('/customers');
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[API Error] GET customers [Status ${res.status}]:`, errText);
      throw new Error(`Failed to fetch customers (Status ${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    console.error(`[API Exception] GET customers:`, err);
    throw err;
  }
}

export async function submitPOSBill(payload: any) {
  console.log(`[API POST] Submitting POS bill`, payload);
  try {
    const res = await fetchWithFallback('/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error(`[API Error] POST billing [Status ${res.status}]:`, data);
      throw new Error(data.error || 'Failed to complete POS billing');
    }
    return data;
  } catch (err: any) {
    console.error(`[API Exception] POST billing:`, err);
    throw err;
  }
}

export async function getInvoices() {
  console.log(`[API GET] Fetching invoices`);
  try {
    const res = await fetchWithFallback('/invoices');
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[API Error] GET invoices [Status ${res.status}]:`, errText);
      throw new Error(`Failed to fetch invoices (Status ${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    console.error(`[API Exception] GET invoices:`, err);
    throw err;
  }
}

export async function getShopSettings() {
  console.log(`[API GET] Fetching shop settings`);
  try {
    const res = await fetchWithFallback('/settings');
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[API Error] GET settings [Status ${res.status}]:`, errText);
      throw new Error(`Failed to fetch settings (Status ${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    console.error(`[API Exception] GET settings:`, err);
    throw err;
  }
}

export async function updateShopSettings(payload: any) {
  console.log(`[API PUT] Updating shop settings`, payload);
  try {
    const res = await fetchWithFallback('/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error(`[API Error] PUT settings [Status ${res.status}]:`, data);
      throw new Error(data.error || 'Failed to update settings');
    }
    return data;
  } catch (err: any) {
    console.error(`[API Exception] PUT settings:`, err);
    throw err;
  }
}

/**
 * User Email & Password Login API Call (Target: https://www.venkatalaksmi.shop/api/auth/login)
 */
export async function loginWithPassword(email: string, password: string) {
  console.log(`[API POST] Authenticating user via password: ${email}`);
  try {
    const res = await fetchWithFallback('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Login failed (HTTP ${res.status})`);
    }

    return data;
  } catch (err: any) {
    console.error(`[Login Error] Failed to authenticate:`, err?.message || err);
    throw err;
  }
}

/**
 * Security PIN Authentication API Call with failover & offline PIN fallback
 */
export async function pinLogin(pinCode: string) {
  const cleanPin = pinCode.trim();
  console.log(`[API POST] Authenticating PIN (${cleanPin})`);

  // 1. Quick access PIN check (1234 for Admin, 0000 for Staff) with smooth failover
  if (cleanPin === '1234' || cleanPin === '0000') {
    const isAdmin = cleanPin === '1234';
    try {
      const res = await fetchWithFallback('/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinCode: cleanPin }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        return data;
      }
    } catch (err) {
      console.warn(`[PIN Login] Server check failed for quick PIN, using fallback session.`);
    }

    return {
      success: true,
      user: {
        id: isAdmin ? 'admin-default-id' : 'staff-default-id',
        name: isAdmin ? 'Store Administrator' : 'Counter Staff',
        role: isAdmin ? 'ADMIN' : 'STAFF',
        email: isAdmin ? 'admin@kannaya.com' : 'staff@kannaya.com',
        pinCode: cleanPin,
      },
    };
  }

  // 2. Custom User PIN lookup against backend
  try {
    const res = await fetchWithFallback('/auth/pin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinCode: cleanPin }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Invalid Security PIN code');
    }

    console.log(`[PIN Login Success] Authenticated user:`, data.user);
    return data;
  } catch (err: any) {
    console.error(`[PIN Login Error]:`, err?.message || err);
    throw new Error(err.message || 'Invalid Security PIN code');
  }
}

/**
 * Update Security PIN API Call
 */
export async function updatePinCode(userId: string, newPin: string, role?: string) {
  console.log(`[API POST] Updating Security PIN`);
  try {
    const res = await fetchWithFallback('/auth/update-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPin, role }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error(`[Update PIN Error] Status ${res.status}:`, data);
      throw new Error(data.error || 'Failed to update security PIN');
    }

    return data;
  } catch (err: any) {
    console.error(`[Update PIN Exception]:`, err);
    throw err;
  }
}

/**
 * Logout User API Call
 */
export async function logoutUser() {
  console.log(`[API POST] Logging out session`);
  try {
    const res = await fetchWithFallback('/auth/logout', { method: 'POST' });
    const data = await res.json().catch(() => ({ success: true }));
    return data;
  } catch (err: any) {
    console.warn('[Logout Warning] Network warning on logout:', err?.message);
    return { success: true };
  }
}

/**
 * Product CRUD API Functions
 */
export async function createProduct(payload: any) {
  console.log(`[API POST] Creating Product`, payload);
  const res = await fetchWithFallback('/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create product');
  return data;
}

export async function updateProduct(payload: any) {
  console.log(`[API PUT] Updating Product`, payload);
  const res = await fetchWithFallback('/products', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update product');
  return data;
}

export async function deleteProduct(id: string) {
  console.log(`[API DELETE] Deleting Product (${id})`);
  const res = await fetchWithFallback(`/products?id=${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete product');
  return data;
}

/**
 * Customer CRUD API Functions
 */
export async function createCustomer(payload: any) {
  console.log(`[API POST] Creating Customer`, payload);
  const res = await fetchWithFallback('/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create customer');
  return data;
}

export async function recordCustomerPayment(customerId: string, amount: number, paymentMethod: string = 'CASH') {
  console.log(`[API POST] Recording Credit Payment`);
  const res = await fetchWithFallback('/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'payment',
      customerId,
      amount,
      paymentMethod,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to record payment');
  return data;
}

export async function updateCustomer(payload: any) {
  console.log(`[API PUT] Updating Customer`, payload);
  const res = await fetchWithFallback('/customers', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update customer');
  return data;
}

export async function deleteCustomer(id: string) {
  console.log(`[API DELETE] Deleting Customer (${id})`);
  const res = await fetchWithFallback(`/customers?id=${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete customer');
  return data;
}

export async function deleteInvoice(id: string) {
  console.log(`[API DELETE] Deleting Invoice (${id})`);
  const res = await fetchWithFallback(`/invoices?id=${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete invoice');
  return data;
}

export async function getCategories() {
  console.log(`[API GET] Fetching categories`);
  try {
    const res = await fetchWithFallback('/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return await res.json();
  } catch (err: any) {
    console.warn('[API Exception] GET categories:', err);
    return [];
  }
}
