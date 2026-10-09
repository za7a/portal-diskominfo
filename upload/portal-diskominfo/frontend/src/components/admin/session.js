// Token disimpan di sessionStorage: hilang saat tab ditutup. Dibungkus try/catch agar aman bila penyimpanan diblokir.
const KUNCI = "diskominfo_admin_token";

export const ambilToken = () => {
  try { return sessionStorage.getItem(KUNCI); } catch { return null; }
};

export const simpanToken = (token) => {
  try { token ? sessionStorage.setItem(KUNCI, token) : sessionStorage.removeItem(KUNCI); } catch { /* abaikan */ }
};

// Datetime tanpa zona (SQLite saat dev) dianggap UTC.
const ZONA = /([zZ]|[+-]\d\d:?\d\d)$/;
export const waktu = (iso) =>
  iso ? new Date(ZONA.test(iso) ? iso : `${iso}Z`).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

export const tanggal = (ymd) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export const linkWa = (nomor) => {
  const d = nomor.replace(/\D/g, "");
  return `https://wa.me/${d.startsWith("0") ? `62${d.slice(1)}` : d}`;
};
