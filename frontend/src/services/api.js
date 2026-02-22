const BASE_URL = process.env.REACT_APP_API_URL || '';

async function request(method, path, body) {
  const token = localStorage.getItem('bp-token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const authAPI = {
  login: (username, password) =>
    request('POST', '/api/auth/login', { username, password }),
  register: (fullName, username, email, password) =>
    request('POST', '/api/auth/register', { fullName, username, email, password }),
};

export const readingsAPI = {
  getAll: () => request('GET', '/api/readings'),
  getByRange: (range) => request('GET', `/api/readings?range=${range}`),
  getByCustomRange: (from, to) => request('GET', `/api/readings?from=${from}&to=${to}`),
  getSummary: (range) => request('GET', `/api/readings/summary?range=${range}`),
  getSummaryCustom: (from, to) => request('GET', `/api/readings/summary?from=${from}&to=${to}`),
  getGraph: (range) => request('GET', `/api/readings/graph?range=${range}`),
  getGraphCustom: (from, to) => request('GET', `/api/readings/graph?from=${from}&to=${to}`),
  create: (data) => request('POST', '/api/readings', data),
  delete: (id) => request('DELETE', `/api/readings/${id}`),
};
