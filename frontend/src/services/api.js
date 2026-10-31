const API_BASE = '/api';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };

  const savedUser = localStorage.getItem('brightloop_current_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      headers['x-mock-role'] = user.role;
      headers['x-mock-user-id'] = user.id;
      headers['x-mock-user-email'] = user.email;
    } catch (e) {}
  }

  return headers;
};

export const request = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {})
    }
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.errors = data.errors || [];
      throw err;
    }

    return data;
  } catch (err) {
    throw err;
  }
};
