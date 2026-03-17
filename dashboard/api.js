// api.js - shared API helpers
export const API = '/api';
export async function api(path, options = {}) {
  const response = await fetch(API + path, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  let payload = null;
  try { payload = await response.json(); } catch (e) { payload = null; }
  return { response, payload };
}
