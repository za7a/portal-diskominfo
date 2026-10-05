// Kosong = alamat yang sama dengan situs (dev: lewat proxy Vite, produksi: lewat Nginx).
export const API_URL = import.meta.env.VITE_API_URL ?? "";

// Kode status di database -> [teks tampilan, kelas warna]
export const STATUS = {
  antrean: ["Dalam proses antrean", "wait"],
  verifikasi: ["Dalam proses verifikasi", "wait"],
  disetujui: ["Disetujui dan diterbitkan", "ok"],
  ditolak: ["Ditolak / berkas kurang", "bad"],
};
