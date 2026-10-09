// Kosong = alamat yang sama dengan situs (dev: lewat proxy Vite, produksi: lewat Nginx).
export const API_URL = import.meta.env.VITE_API_URL ?? "";

// Kode status di database -> [teks tampilan, kelas warna]
// Surat pemohon: batas harus sama dengan MAKS_UPLOAD_MB di backend.
export const SURAT_MAKS_MB = 5;
export const SURAT_JENIS = ".pdf,.doc,.docx";

export const STATUS = {
  antrean: ["Dalam proses antrean", "wait"],
  verifikasi: ["Dalam proses verifikasi", "wait"],
  disetujui: ["Disetujui dan diterbitkan", "ok"],
  ditolak: ["Ditolak / berkas kurang", "bad"],
};

// Urutan alur status dan label singkat (dipakai menu Admin)
export const STATUS_ADMIN = [
  ["antrean", "Antrean"],
  ["verifikasi", "Verifikasi"],
  ["disetujui", "Disetujui"],
  ["ditolak", "Ditolak"],
];

