import { API_URL } from "../config.js";

export const getServices = () => fetch(`${API_URL}/api/services`).then((r) => r.json());

// formData: service_id, nama, nip_nik, opd, whatsapp, dan berkas surat (field "surat").
// Content-Type tidak diisi manual agar browser menambahkan batas multipart sendiri.
export const createTicket = (formData) =>
  fetch(`${API_URL}/api/tickets`, { method: "POST", body: formData });

export const getTicket = (kode, nip4) =>
  fetch(`${API_URL}/api/tickets/${encodeURIComponent(kode)}?nip4=${encodeURIComponent(nip4)}`);

export const getStats = () => fetch(`${API_URL}/api/stats`).then((r) => r.json());

// ---------- Admin ----------
const JSON_HEADER = { "Content-Type": "application/json" };
const auth = (token) => ({ Authorization: `Bearer ${token}` });

export const adminLogin = (username, password) =>
  fetch(`${API_URL}/api/admin/login`, { method: "POST", headers: JSON_HEADER, body: JSON.stringify({ username, password }) });

export const adminMe = (token) => fetch(`${API_URL}/api/admin/me`, { headers: auth(token) });

export const adminTickets = (token, { status = "", q = "", page = 1, limit = 15 }) => {
  const p = new URLSearchParams({ page, limit });
  if (status) p.set("status", status);
  if (q) p.set("q", q);
  return fetch(`${API_URL}/api/admin/tickets?${p}`, { headers: auth(token) });
};

export const adminTicket = (token, kode) =>
  fetch(`${API_URL}/api/admin/tickets/${encodeURIComponent(kode)}`, { headers: auth(token) });

export const adminSurat = (token, kode) =>
  fetch(`${API_URL}/api/admin/tickets/${encodeURIComponent(kode)}/surat`, { headers: auth(token) });

export const adminUpdateStatus = (token, kode, data) =>
  fetch(`${API_URL}/api/admin/tickets/${encodeURIComponent(kode)}/status`, {
    method: "PATCH",
    headers: { ...JSON_HEADER, ...auth(token) },
    body: JSON.stringify(data),
  });

