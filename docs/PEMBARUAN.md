# Daftar Pembaruan v2 (dari v1)

Ringkasan: skema database naik dari 1 tabel menjadi 5 tabel (sesuai ERD dokumen), migrasi memakai Alembic, daftar layanan dan statistik kini dari database, dan cek status diamankan.

## A. Backend

### File baru
| File | Fungsi |
|---|---|
| `app/routers/services.py` | `GET /api/services`: daftar layanan aktif dari database |
| `app/ratelimit.py` | pembatas 10 percobaan cek status per menit per IP |
| `app/seed.py`, `app/seed_data.json` | data awal 5 kategori dan 8 layanan (`python -m app.seed`, aman diulang) |
| `alembic.ini`, `migrations/` | migrasi database; `versions/0001_skema_awal.py` membuat semua tabel |

### File yang berubah
| File | Perubahan |
|---|---|
| `app/models.py` | `Ticket` diganti 5 model: `Category`, `Service`, `Admin`, `ServiceRequest`, `RequestLog`. Status memakai enum `status_pengajuan`; `form_data` bertipe JSONB di PostgreSQL |
| `app/schemas.py` | `TicketIn` memakai `service_id` (bukan nama layanan teks). Ditambah `ServiceOut`, `LogOut`; `TicketOut` memuat `riwayat`; `StatsOut` memuat `per_kategori` |
| `app/routers/tickets.py` | kode tiket jadi `LSM-` + 8 karakter acak aman (`secrets`), mis. `LSM-7K4Q9XPD`. Membuat pengajuan juga membuat baris pertama di `request_logs`. **Cek status wajib `?nip4=` (4 digit terakhir NIP/NIK)**; kode salah dan NIP salah memberi 404 yang sama |
| `app/routers/stats.py` | membaca dari `service_requests`; menambah hitungan per kategori untuk diagram donat |
| `app/main.py` | `create_all` dihapus (tabel dibuat Alembic); router `services` didaftarkan; versi 2.0.0 |
| `requirements.txt` | + `alembic` |
| `tests/` | diperbarui, 6 tes (layanan, buat/cek, NIP salah, validasi, statistik, batas percobaan) |

### File yang tidak dipakai lagi
Tabel `tickets` dari v1. Data uji lama tidak dimigrasi.

## B. Frontend

| File | Perubahan |
|---|---|
| `assets/js/state.js` | **baru**: menyimpan daftar layanan yang dimuat dari API |
| `assets/js/data.js` | tinggal FAQ (array layanan dihapus) |
| `assets/js/api.js` | + `getServices`; `getTicket(kode, nip4)` |
| `assets/js/main.js` | layanan dimuat dari API (nama field berubah: `title`, `description`, `sla_info`, `syarat`, `template_name`, `template_url`); formulir mengirim `service_id`; cek status mengirim 4 digit NIP/NIK dan menampilkan riwayat; donat dan legenda dihitung dari `per_kategori` |
| `assets/js/tabs.js` | membaca layanan dari `state.js` |
| `index.html` | kolom "4 digit terakhir NIP/NIK" di panel cek status; legenda donat dikosongkan (diisi JS); angka rekap awal `-` |
| `assets/css/style.css` | angka tengah donat dari atribut `data-total` (bukan teks tetap) |

## C. Cara memperbarui proyek v1 Anda

1. Ganti folder `backend/` dan `frontend/` dengan isi zip ini (atau salin file sesuai tabel di atas). Berkas contoh surat di `frontend/assets/templates/` dan `.env` Anda jangan tertimpa.
2. Di `backend/`, dengan lingkungan virtual aktif: `pip install -r requirements.txt`
3. Hapus `layanan.db` lama (hanya berisi data uji v1).
4. Buat tabel dan isi data awal:
   ```bash
   alembic upgrade head
   python -m app.seed
   ```
5. Jalankan `uvicorn app.main:app --reload`, lalu muat ulang halaman di Live Server.

Tiap kali model di `models.py` berubah: `alembic revision --autogenerate -m "pesan"` lalu `alembic upgrade head`. Periksa berkas migrasi hasil autogenerate sebelum dijalankan.

## D. Yang diuji dan yang belum
- Diuji: 6 tes pytest lolos; migrasi `upgrade`, `downgrade`, `upgrade` ulang berhasil di SQLite dan di PostgreSQL (server PostgreSQL sungguhan lewat pustaka `pgserver`), termasuk alur buat tiket, cek status, dan statistik; `alembic check` tidak menemukan selisih model.
- Belum diuji: tampilan di browser bersama backend.

## E. Masih belum ada
Portal admin (login dan ubah status), unggah dokumen persyaratan ke server, `form_data` per layanan, notifikasi WhatsApp/email. Tabel `admins` dan `request_logs` sudah siap untuk portal admin.
