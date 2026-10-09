# Penerapan React + Vite dan Tahapan Database

Dokumen ini menjelaskan (1) kenapa dan bagaimana frontend dipindah ke React dengan Vite, (2) cara menjalankannya, (3) konsep React yang dipakai dengan contoh dari kode proyek ini, dan (4) tahapan penerapan database dari SQLite sampai PostgreSQL.

---

## 1. Apa yang berubah

| | Sebelumnya | Sekarang |
|---|---|---|
| Teknologi | HTML + JavaScript modul, ditulis tangan | React 19 + Vite |
| Cara menjalankan | Live Server | `npm run dev` |
| Pembuatan tampilan | `innerHTML` dari template string | komponen JSX |
| Pengamanan teks pengguna | fungsi `esc()` manual | otomatis oleh React |
| Backend dan database | tidak berubah | tidak berubah |

Tampilan visual dan CSS tidak diubah. `src/index.css` adalah `style.css` yang lama.

**Apa itu module bundler (Vite)?** Browser tidak bisa langsung menjalankan JSX, dan kode yang terpecah menjadi puluhan berkas lambat jika dimuat satu per satu. Vite punya dua mode:
- **Dev (`npm run dev`)**: menyajikan berkas langsung dan memperbarui halaman seketika saat Anda menyimpan (Hot Module Replacement), jadi tidak perlu refresh.
- **Build (`npm run build`)**: mengubah JSX menjadi JavaScript biasa, menggabungkan 29 modul menjadi satu berkas JS dan satu CSS, dan mengecilkannya. Hasil build proyek ini sekitar 237 kB (74 kB setelah kompresi gzip), ada di folder `dist/`.

---

## 2. Menjalankan

Prasyarat: **Node.js LTS** (cek `node -v`) dan backend sudah berjalan (lihat `README.md`).

```bash
cd frontend
npm install        # sekali saja, mengunduh dependensi ke node_modules/
npm run dev        # buka http://localhost:5173
```

**Kenapa tidak ada masalah CORS lagi?** `vite.config.js` memuat `proxy: { "/api": "http://127.0.0.1:8000" }`. Browser memanggil `localhost:5173/api/...` (asal yang sama dengan halaman), lalu Vite meneruskannya ke backend. Karena itu `API_URL` di `src/config.js` dibiarkan kosong. CORS hanya diperlukan jika frontend memanggil API di alamat lain, dan di situ variabel `VITE_API_URL` dipakai.

---

## 3. Peta file lama ke komponen baru

| Lama (HTML/JS) | Baru (React) |
|---|---|
| markup bagian atas | `TopStrip.jsx`, `Header.jsx` |
| markup hero + pencarian | `Hero.jsx` |
| panel dan logika cek status (`#tf`) | `TrackPanel.jsx` |
| `render()` daftar layanan | `ServiceGrid.jsx` |
| dialog formulir pengajuan | `ServiceDialog.jsx` |
| statistik dan donat | `Stats.jsx` |
| `tabs.js` + `data.js` (FAQ) | `HelpTabs.jsx` + `data/faq.js` |
| footer | `Footer.jsx` |
| tema terang/gelap | `hooks/useTheme.js` (+ tombol di `TopStrip.jsx`) |
| `api.js`, `config.js` | `api/client.js`, `config.js` |
| `state.js` | `useState` di `App.jsx` |
| `style.css` | `src/index.css` (tidak berubah) |

`App.jsx` menjadi "pusat": ia memegang data bersama (daftar layanan, kata pencarian, layanan yang dipilih, tab aktif) dan membagikannya ke komponen lewat props.

---

## 4. Konsep React yang dipakai

**Komponen dan JSX.** Setiap bagian halaman adalah fungsi yang mengembalikan JSX, mis. `Footer()`. Perbedaan dengan HTML: `class` menjadi `className`, `for` menjadi `htmlFor`, dan atribut `style` berupa objek (`style={{ marginTop: 22 }}`).

**State (`useState`).** Data yang jika berubah harus mengubah tampilan. Contoh di `App.jsx`: `const [query, setQuery] = useState("")`. Memanggil `setQuery("tte")` membuat React menggambar ulang komponen yang memakai `query`. Ini menggantikan pola lama "ubah data lalu panggil `render()` sendiri".

**Props dan mengangkat state ke atas.** Kolom pencarian ada di `Hero`, tetapi hasilnya ditampilkan di `ServiceGrid`. Dua komponen saudara tidak bisa saling bicara, jadi state `query` disimpan di induk (`App`). `Hero` memanggil `onSearch(teks)` dan `ServiceGrid` menerima `query` sebagai prop. Pola ini muncul berulang: `tab` (diubah `HelpTabs` dan tombol "Contoh Template Surat" di `Hero`) dan `dipilih` (diubah `ServiceGrid`, dibaca `ServiceDialog`).

**Efek samping (`useEffect`).** Kode yang berinteraksi dengan dunia luar. Di `App.jsx`, `useEffect(() => { getServices()... }, [])` memuat layanan sekali saat halaman terbuka (array kosong `[]` artinya "hanya sekali"). Di `useTheme.js`, efek memasang dan melepas pendengar perubahan tema sistem.

**Input terkendali (controlled input).** Di `TrackPanel.jsx`, `<input value={kode} onChange={...}>` membuat React sebagai satu-satunya pemilik nilai. Keuntungannya: nilai bisa dibaca, divalidasi, dan dikosongkan dari kode.

**Render kondisional dan `key`.** `{tab === 1 && <table>...}` menampilkan bagian hanya jika syaratnya benar. Saat menampilkan daftar dengan `.map()`, setiap item butuh `key` unik (di sini `v.id` dari database) agar React tahu item mana yang berubah.

**Escape otomatis.** Di versi lama, teks pengguna harus dilewatkan `esc()` sebelum masuk `innerHTML`. Di React, `{t.catatan}` otomatis diperlakukan sebagai teks, bukan HTML. Satu pengecualian: `dangerouslySetInnerHTML`, yang sengaja tidak dipakai di proyek ini dan sebaiknya dihindari.

**Ref dan elemen `<dialog>`.** `ServiceDialog.jsx` memakai `useRef` untuk memegang elemen `<dialog>` asli, lalu memanggil `showModal()` atau `close()` saat prop `service` berubah. Ini contoh React yang tetap berbagi tugas dengan fitur bawaan browser.

**Custom hook.** `useTheme()` membungkus logika tema (pilihan pengguna vs pengaturan sistem) dalam satu fungsi yang dipakai `App`. Komponen jadi bersih, dan logikanya bisa dipakai ulang.

### Latihan
1. Ubah teks judul di `Hero.jsx`, simpan, dan lihat browser berubah tanpa refresh (HMR).
2. Tambahkan tab kelima di `HelpTabs.jsx` (tambah nama di `TABS` dan satu blok `tab === 4`).
3. Di `TrackPanel.jsx`, tambahkan tampilan "Memeriksa..." selama menunggu respons: butuh satu `useState` baru.
4. Tambahkan layanan baru lewat database (bukan lewat kode frontend) dan lihat kartunya muncul.

---

## 5. Berkas contoh surat

Letakkan di `frontend/public/assets/templates/` dengan nama persis seperti daftar di README folder itu. Isi folder `public/` disalin Vite apa adanya ke akar situs, sehingga berkas tersedia di `/assets/templates/nama.docx`. Tautan di kode memakai `/${template_url}` karena `template_url` dari database berbentuk `assets/templates/nama.docx`.

---

## 6. Build dan deploy

```bash
cd frontend
npm run build      # hasil di dist/
npm run preview    # mencoba hasil build secara lokal
```

Di server, `dist/` disajikan Nginx dan permintaan `/api/` diteruskan ke Uvicorn. Contoh:

```nginx
server {
  listen 80;
  server_name layanan.contoh.go.id;
  root /var/www/portal/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
  location / { try_files $uri /index.html; }
}
```

Baris `X-Forwarded-For` penting: tanpa itu, backend melihat semua pengunjung berasal dari alamat Nginx (127.0.0.1), sehingga pembatas "10 percobaan cek status per menit" berlaku untuk **semua orang sekaligus**. Dengan header itu, Uvicorn membaca IP asli pengunjung.

---

## 7. Tahapan penerapan database

Proyek mulai dengan **SQLite** (satu berkas, tanpa instalasi) dan dipindah ke **PostgreSQL** untuk penggunaan sungguhan. Kode yang sama dipakai untuk keduanya, hanya `DATABASE_URL` yang berbeda.

### Tahap A: SQLite (pengembangan awal)
1. `cp .env.example .env` (nilai bawaan `sqlite:///./layanan.db`).
2. `alembic upgrade head`: membuat 5 tabel ditambah `alembic_version` (pencatat versi migrasi).
3. `python -m app.seed`: mengisi 5 kategori dan 8 layanan. Aman diulang, tidak menggandakan data.
4. Lihat isinya dengan ekstensi **SQLite Viewer** di VS Code (buka `layanan.db`).

### Tahap B: PostgreSQL
**1. Pasang PostgreSQL** (salah satu):
- Pemasang resmi dari postgresql.org (sertakan pgAdmin dan psql), atau
- Docker:
  ```bash
  docker run --name pg-diskominfo -e POSTGRES_USER=diskominfo -e POSTGRES_PASSWORD=ganti-sandi \
    -e POSTGRES_DB=diskominfo -p 5432:5432 -d postgres:16 | docker run --name pg-diskominfo -e POSTGRES_USER=diskominfo -e POSTGRES_PASSWORD=Layanan@2026! -e POSTGRES_DB=layanan-diskom-lsm -p 5433:5432 -d postgres:16 |
  ```
  (cara Docker sudah membuat user dan database, lompat ke langkah 3).

**2. Buat user dan database** (lewat psql atau pgAdmin, sebagai `postgres`):
```sql
CREATE USER diskominfo WITH PASSWORD 'ganti-dengan-sandi-kuat';
CREATE DATABASE diskominfo OWNER diskominfo ENCODING 'UTF8';
```
Memakai user khusus aplikasi (bukan `postgres`) membatasi kerusakan jika kredensial bocor.

**3. Arahkan aplikasi ke PostgreSQL**, di `backend/.env`:
```
DATABASE_URL=postgresql+psycopg://diskominfo:ganti-dengan-sandi-kuat@localhost:5432/diskominfo
```
Jika sandi memuat karakter khusus (`@`, `:`, `/`, `#`), ubah menjadi bentuk URL (`@` menjadi `%40`). Berkas `.env` sudah ada di `.gitignore`: jangan pernah di-commit.

**4. Buat tabel dan isi data awal:**
```bash
cd backend
pip install -r requirements.txt     # sudah memuat driver psycopg
alembic upgrade head
python -m app.seed
```

**5. Verifikasi:**
```bash
psql -U diskominfo -d diskominfo -c "\dt"                          # 6 tabel
psql -U diskominfo -d diskominfo -c "SELECT count(*) FROM services;"  # 8
```
Lalu jalankan backend dan kirim satu pengajuan lewat situs. Baris baru harus muncul di `service_requests` dan `request_logs`.

### Tahap C: Alur kerja saat skema berubah
1. Ubah `app/models.py` (mis. tambah kolom).
2. `alembic revision --autogenerate -m "tambah kolom x"`
3. **Baca berkas migrasi** di `migrations/versions/` sebelum menjalankannya. Autogenerate bisa salah atau melewatkan sesuatu (di proyek ini pun satu baris perlu diperbaiki manual).
4. `alembic upgrade head`
5. Commit berkas migrasi bersama perubahan model. Jangan edit migrasi yang sudah dijalankan di server lain; buat migrasi baru.

Membatalkan satu langkah: `alembic downgrade -1`. Mengulang dari nol (hanya untuk data uji!): `alembic downgrade base && alembic upgrade head && python -m app.seed`.

### Tahap D: Produksi
- Jalankan `alembic upgrade head` **setiap kali deploy**, sebelum API dijalankan.
- Database jangan dibuka ke internet; izinkan koneksi hanya dari server aplikasi.
- Backup rutin:
  ```bash
  pg_dump -U diskominfo -Fc diskominfo > backup-$(date +%F).dump
  pg_restore -U diskominfo -d diskominfo --clean backup-2026-10-05.dump   # pemulihan
  ```
  Backup yang belum pernah dicoba dipulihkan belum bisa disebut backup.
- Data uji dari SQLite tidak perlu dipindah; cukup seed ulang di PostgreSQL.

### Masalah umum
| Pesan | Penyebab dan solusi |
|---|---|
| `password authentication failed` | sandi atau user di `DATABASE_URL` salah |
| `connection refused` | PostgreSQL belum jalan, atau port bukan 5432 |
| `relation "services" does not exist` | `alembic upgrade head` belum dijalankan |
| `type "status_pengajuan" already exists` | migrasi sebelumnya gagal di tengah; hapus tabel dan tipe sisa (`DROP TYPE status_pengajuan;`), lalu ulangi migrasi |
| Daftar layanan kosong, "Memuat layanan..." terus | backend mati atau seed belum dijalankan; cek `http://127.0.0.1:8000/api/services` |
| Error 404/proxy di Console saat `npm run dev` | backend tidak berjalan di port 8000 |

---

## 8. Yang diuji dan yang belum

- Diuji: `npm run build` berhasil; seluruh komponen berhasil dirender di sisi server tanpa error; migrasi, seed, buat tiket, cek status, statistik, dan downgrade berjalan di PostgreSQL sungguhan; 6 tes backend lolos.
- Belum diuji: interaksi di browser (klik, kirim formulir, ganti tema) bersama backend. Jika ada yang tidak berfungsi, buka Console (F12) dan     kirim pesannya.
- Belum ada: portal admin, unggah dokumen persyaratan ke server, notifikasi WhatsApp.
