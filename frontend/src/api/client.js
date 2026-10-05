import { API_URL } from "../config.js";

export const getServices = () => fetch(`${API_URL}/api/services`).then((r) => r.json());

export const createTicket = (data) =>
  fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const getTicket = (kode, nip4) =>
  fetch(`${API_URL}/api/tickets/${encodeURIComponent(kode)}?nip4=${encodeURIComponent(nip4)}`);

export const getStats = () => fetch(`${API_URL}/api/stats`).then((r) => r.json());
