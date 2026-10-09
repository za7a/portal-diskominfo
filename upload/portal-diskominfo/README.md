# Portal Layanan Diskominfo Kota Lhokseumawe

Portal pengajuan layanan (subdomain/VPS, aplikasi, TTE, email dinas, dan lainnya) dengan pelacakan status tiket.

## Struktur

```
portal-diskominfo/
  backend/                   API (FastAPI + SQLAlchemy + Alembic)
    app/                     main, config, database, models, schemas, ratelimit, security, seed, create_admin
      routers/               services, tickets, stats, admin
    migrations/              migrasi Alembic
    tests/                   pytest
  frontend/                  React + Vite
    index.html
    vite.config.js           proxy /api -> backend
    public/assets/templates/ berkas contoh surat
    src/
      main.jsx, App.jsx, config.js, index.css
      api/client.js
      hooks/useTheme.js
      components/            TopStrip, Header, Hero, TrackPanel, ServiceGrid,
                             ServiceDialog, Stats, HelpTabs, Footer
      components/admin/      AdminPage, AdminLogin, AdminDashboard, TicketDialog
      data/faq.js
  docs/                      PENERAPAN-REACT.md, PEMBARUAN.md, PANDUAN.md
```

## Menjalankan

Backend (terminal 1):

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1        # Windows PowerShell; macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # Windows: copy .env.example .env
alembic upgrade head              # membuat tabel
python -m app.seed                # mengisi kategori dan layanan awal
uvicorn app.main:app --reload
```

Frontend (terminal 2):

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

Dokumentasi API otomatis: http://127.0.0.1:8000/docs. Tes backend: `pip install -r requirements-dev.txt` lalu `pytest`.

Penjelasan lengkap React/Vite dan tahapan database: `docs/PENERAPAN-REACT.md`.

## Menu Admin

Menu **Admin** ada di navigasi atas (alamat `/#/admin`). Petugas masuk dengan username dan kata sandi, lalu dapat mencari dan menyaring pengajuan, mengubah status, dan menulis keterangan yang tampil di halaman Cek Status. Setiap perubahan tercatat di riwayat beserta nama petugasnya.

Persiapan (sekali saja):

```bash
cd backend
# 1. Tambahkan kunci penanda token ke .env (wajib untuk produksi):
#    python -c "import secrets; print(secrets.token_urlsafe(48))"
#    SECRET_KEY=<hasilnya>
#    (opsional) ADMIN_TOKEN_MENIT=480   # masa berlaku sesi, default 8 jam
# 2. Buat akun petugas (kata sandi minimal 8 karakter, diminta lewat prompt):
python -m app.create_admin admin "Nama Lengkap Petugas"
# Ganti kata sandi akun yang sudah ada:
python -m app.create_admin admin --reset
```

Endpoint admin ada di `/api/admin/*` (lihat `/docs`). Login dibatasi 5 percobaan per 5 menit per IP. Tabel `admins` sudah ada di migrasi awal, tidak perlu migrasi baru.

## Surat pengajuan

Pemohon wajib melampirkan surat (PDF, DOC, atau DOCX, maksimal 5 MB) saat mengajukan. Isi berkas diperiksa (bukan hanya ekstensi), lalu disimpan dengan nama acak di folder `backend/uploads/` (diatur lewat `UPLOAD_DIR` di `.env`). Folder ini tidak disajikan web dan tidak masuk git. Petugas mengunduhnya lewat tombol **Unduh surat** di menu Admin (wajib login).

- `.env` (opsional): `UPLOAD_DIR=uploads`, `MAKS_UPLOAD_MB=5` (ubah juga `SURAT_MAKS_MB` di `frontend/src/config.js` agar pesan di browser cocok).
- Pasang dependensi baru sekali: `pip install -r requirements.txt` (menambah `python-multipart`).
- Di produksi, pastikan folder upload ikut dicadangkan dan Nginx mengizinkan `client_max_body_size 6m;` atau lebih.
- Pengajuan lama (sebelum fitur ini) tidak punya surat; dialog admin menampilkan "Tidak ada surat terlampir".

