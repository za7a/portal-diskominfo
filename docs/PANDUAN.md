> Catatan: panduan ini menjelaskan versi 1 (satu tabel `tickets`). Konsepnya tetap berlaku; perubahan versi 2 ada di `PEMBARUAN.md`.

# Panduan Implementasi Portal Layanan Diskominfo Lhokseumawe di VS Code

Panduan ini sengaja dibuat bertahap. Tiap tahap punya satu tujuan, penjelasan "kenapa", dan latihan kecil supaya Anda mengerti logikanya, bukan sekadar menyalin kode.

## 0. Gambaran besar

Sistem ini punya tiga bagian yang bekerja sama:

```
Browser (index.html)  --fetch/JSON-->  API (FastAPI)  --SQL-->  Database
tampilan + interaksi                   aturan + validasi         data permanen
```

Prototipe yang Anda punya sekarang baru bagian paling kiri. Data layanan, kode tiket, dan statistik masih disimpan di memori browser, jadi hilang saat halaman dimuat ulang. Tujuan panduan ini: (1) menjalankan dan memahami bagian kiri, (2) membangun bagian tengah dan kanan, (3) menyambungkan ketiganya.

Struktur folder akhir:

```
portal-diskominfo/
  index.html
  templates/              <- berkas contoh surat (.docx/.pdf)
  backend/
    main.py
    requirements.txt
```

---

## 1. Persiapan alat

1. **VS Code**, lalu pasang ekstensi: **Live Server** (Ritwick Dey), **Python** (Microsoft), dan opsional **SQLite Viewer** untuk melihat isi database.
2. **Python 3.10 atau lebih baru** (kode backend memakai penulisan `str | None`). Cek dengan `python --version`.
3. Browser dengan DevTools (tekan **F12**). Alat ini akan sering dipakai untuk melihat apa yang terjadi.

---

## 2. Tahap 1: jalankan frontend

1. Buat folder `portal-diskominfo`, buka di VS Code (File, Open Folder).
2. Simpan `index.html` di dalamnya.
3. Klik kanan `index.html`, pilih **Open with Live Server**. Halaman terbuka di `http://127.0.0.1:5500`.

Catatan: font Source Sans 3 diambil dari Google Fonts, jadi butuh internet. Tanpa internet, halaman tetap jalan dengan font Arial.

Kenapa memakai Live Server dan bukan klik dua kali berkas? Nanti halaman akan memanggil API lewat `fetch`. Browser menolak sebagian fitur jika halaman dibuka dari `file://`, dan Live Server membuat halaman punya alamat web sungguhan (`http://...`) serta memuat ulang otomatis saat Anda menyimpan.

---

## 3. Memahami `index.html`

Berkas ini terdiri dari tiga lapis: `<style>` (tampilan), badan HTML (struktur), dan `<script>` (perilaku). Berikut konsep-konsep yang membuatnya bekerja. Buka berkasnya sambil membaca.

### 3.1 Variabel CSS dan mode gelap

Di awal `<style>` ada `:root{--bg:...;--primary:...}`. Itu variabel warna. Semua komponen memakai `var(--primary)` dan sejenisnya, jadi mengganti tema cukup mengganti nilai variabelnya.

Ada tiga blok variabel, masing-masing punya tugas:
- `:root` = tema terang (bawaan).
- `@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) ...}` = ikuti pengaturan sistem pengguna, kecuali pengguna sudah memilih terang secara manual.
- `:root[data-theme="dark"]` = pengguna memilih gelap secara manual.

Tombol bulan/matahari hanya mengubah atribut `data-theme` pada elemen `<html>` (lihat fungsi `up` dan `onclick` di `#tg`). CSS yang lain mengikuti otomatis.

**Coba:** ubah `--primary:#1e3a8a` menjadi warna lain, simpan, dan lihat halaman berubah.

### 3.2 Tampilan digerakkan data (`const S=[...]` dan `render()`)

Delapan layanan tidak ditulis satu per satu di HTML. Semuanya ada di array `S`, tiap layanan berupa objek (`t` judul, `c` kategori, `d` deskripsi, `m` waktu, `r` syarat, `k` kata kunci pencarian, `u` nama template surat). Fungsi `render(f)` bekerja dalam tiga langkah:

1. `filter`: ambil layanan yang judul, deskripsi, atau kata kuncinya memuat kata pencarian `f`.
2. `map`: ubah tiap objek menjadi potongan HTML kartu (template literal dengan `` `...${v.t}...` ``).
3. `innerHTML`: tempel hasilnya ke `#sv`.

Inilah pola yang nanti dipakai juga oleh React: data masuk, tampilan keluar. Menambah layanan cukup menambah satu objek.

**Coba:** tambahkan layanan ke-9 ke array `S`, simpan, dan lihat kartunya muncul. Lalu ketik kata kunci di kolom pencarian dan perhatikan kartu menyaring.

### 3.3 Event delegation (`$("#sv").onclick`)

Kartu dibuat ulang setiap `render()` dipanggil, sehingga tombol "Ajukan" lama hilang dan diganti yang baru. Kalau pendengar klik dipasang di tiap tombol, pendengarnya ikut hilang. Solusinya: satu pendengar dipasang di pembungkus `#sv`, lalu `e.target.closest("[data-i]")` mencari tombol mana yang diklik. Atribut `data-i` berisi nomor urut layanan di array `S`, jadi kita tahu layanan mana yang dipilih.

### 3.4 Elemen `<dialog>` dan dua tahap formulir

Formulir pengajuan memakai `<dialog id="dlg">`. Isinya dibuat oleh JavaScript sesuai layanan yang dipilih, lalu dibuka dengan `dlg.showModal()`. Setelah dikirim, isi dialog diganti dengan tampilan "Pengajuan terkirim" beserta kode tiket. Satu dialog dipakai dua tahap hanya dengan mengganti `innerHTML`.

### 3.5 State di memori (`SMP`): bagian yang paling "palsu"

`SMP` adalah objek JavaScript biasa yang menyimpan tiket: kuncinya kode (`LSM-240001`), nilainya data tiket. Saat Anda mengirim formulir, tiket baru ditambahkan ke `SMP`. Saat Anda mengecek status, kode dicari di `SMP`.

Karena hanya hidup di memori halaman, semuanya hilang saat refresh, dan orang lain tidak bisa melihat tiket Anda. **Inilah tepatnya yang digantikan backend dan database** pada Tahap 4 dan 5. Kalau Anda paham bagian ini, Anda paham alasan sistem butuh server.

**Coba:** kirim satu pengajuan, catat kodenya, cek statusnya (berhasil), lalu refresh halaman dan cek lagi (kode hilang).

### 3.6 Fungsi `esc()` dan keamanan

Teks dari pengguna (misalnya kode yang diketik di kolom cek) ditampilkan lewat `innerHTML`. Tanpa perlindungan, orang bisa mengetik kode HTML atau skrip dan itu akan dijalankan oleh browser (serangan XSS). `esc()` mengubah karakter `< > & " '` menjadi bentuk aman, sehingga tampil sebagai teks biasa.

**Coba:** ketik `<b>tes</b>` di kolom cek status. Tampil sebagai teks, bukan huruf tebal. Lalu hapus `esc(...)` sementara di baris itu dan lihat bedanya (kembalikan setelahnya). Data di array `S` tidak perlu di-escape karena kita sendiri yang menulisnya. Data dari pengguna atau server wajib.

### 3.7 Tab dan FAQ

`TABS` adalah array berisi pasangan `[judul, fungsi yang membuat HTML]`. Fungsi `tab(n)` menggambar ulang deretan tombol tab dan isi tab ke-`n`. Tombol "Contoh Template Surat" di bagian atas hanya memanggil `tab(1)` lalu menggulir ke bagian bantuan. FAQ memakai elemen bawaan `<details>`/`<summary>`, jadi buka-tutup tanpa JavaScript sama sekali.

### 3.8 Diagram donat (`conic-gradient`)

Donat digambar dengan CSS: `conic-gradient(warna1 0 64.7%, warna2 0 78.8%, ...)`. Angka di belakang adalah **batas kumulatif**, bukan persentase tiap bagian: 64,7 + 14,1 = 78,8; ditambah 9,6 menjadi 88,4; sisanya sampai 100. Kalau data diubah, hitung ulang batasnya. Nanti angka ini akan datang dari `/api/stats`.

### 3.9 Menyiapkan berkas contoh surat

Tautan "Unduh" sekarang masih `href="#"`. Cara mengisinya:

1. Buat folder `templates/` dan taruh berkasnya, misalnya `templates/surat-email-dinas.docx`.
2. Tambahkan field `f:"templates/surat-email-dinas.docx"` pada tiap objek di `S`.
3. Di dalam template formulir, ubah `<a href="#" download>${v.u}</a>` menjadi `<a href="${v.f}" download>${v.u}</a>`.

Atribut `download` membuat browser mengunduh berkas, bukan membukanya.

---

## 4. Tahap 2: bangun backend FastAPI

Backend punya tiga tugas: menerima pengajuan, mencari tiket berdasarkan kode, dan menghitung statistik. Aturan validasi diletakkan di sini, bukan di browser, karena kode di browser bisa dilewati orang.

### 4.1 Siapkan lingkungan

Dari terminal VS Code (Terminal, New Terminal):

```bash
cd portal-diskominfo
mkdir backend
cd backend
python -m venv .venv
```

Aktifkan lingkungan virtual:
- Windows PowerShell: `.venv\Scripts\Activate.ps1` (jika diblokir, jalankan sekali `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`)
- macOS/Linux: `source .venv/bin/activate`

Lalu pasang pustaka dan pilih interpreter di VS Code (Ctrl+Shift+P, "Python: Select Interpreter", pilih yang ada `.venv`):

```bash
pip install fastapi "uvicorn[standard]" sqlalchemy
pip freeze > requirements.txt
```

Lingkungan virtual membuat pustaka proyek ini terpisah dari proyek Python lain di komputer Anda.

### 4.2 Tulis `backend/main.py`

```python
import random
from datetime import date

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import String, create_engine, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

# --- 1. Koneksi database (SQLite dulu; nanti cukup ganti URL ke PostgreSQL) ---
engine = create_engine("sqlite:///./layanan.db", connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


# --- 2. Model = bentuk tabel "tickets" ---
class Ticket(Base):
    __tablename__ = "tickets"
    id: Mapped[int] = mapped_column(primary_key=True)
    kode: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    layanan: Mapped[str] = mapped_column(String(120))
    nama: Mapped[str] = mapped_column(String(120))
    nip_nik: Mapped[str] = mapped_column(String(30))
    opd: Mapped[str] = mapped_column(String(120))
    whatsapp: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="antrean")
    catatan: Mapped[str | None] = mapped_column(String(300), default=None)
    tanggal: Mapped[date] = mapped_column(default=date.today)


Base.metadata.create_all(engine)  # buat tabel jika belum ada


# --- 3. Skema = aturan validasi data yang masuk ---
class TicketIn(BaseModel):
    layanan: str = Field(min_length=3, max_length=120)
    nama: str = Field(min_length=3, max_length=120)
    nip_nik: str = Field(pattern=r"^\d{8,20}$")
    opd: str = Field(min_length=2, max_length=120)
    whatsapp: str = Field(pattern=r"^[0-9+]{9,16}$")


# --- 4. Aplikasi dan endpoint ---
app = FastAPI(title="API Layanan Diskominfo Lhokseumawe")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/tickets", status_code=201)
def buat_tiket(data: TicketIn):
    with Session() as db:
        while True:
            kode = f"LSM-{random.randint(0, 999999):06d}"
            if not db.scalar(select(Ticket).where(Ticket.kode == kode)):
                break
        db.add(Ticket(kode=kode, **data.model_dump()))
        db.commit()
    return {"kode": kode}


@app.get("/api/tickets/{kode}")
def cek_tiket(kode: str):
    with Session() as db:
        t = db.scalar(select(Ticket).where(Ticket.kode == kode.strip().upper()))
        if t is None:
            raise HTTPException(status_code=404, detail="Kode tidak ditemukan")
        return {
            "kode": t.kode,
            "layanan": t.layanan,
            "status": t.status,
            "tanggal": t.tanggal.isoformat(),
            "catatan": t.catatan,
        }


@app.get("/api/stats")
def statistik():
    with Session() as db:
        rows = db.execute(select(Ticket.status, func.count()).group_by(Ticket.status)).all()
    per_status = {status: jumlah for status, jumlah in rows}
    return {"total": sum(per_status.values()), "per_status": per_status}
```

### 4.3 Logika yang perlu Anda pahami

- **Model vs skema.** `Ticket` menggambarkan tabel di database. `TicketIn` menggambarkan data yang boleh masuk dari luar. Keduanya sengaja dipisah: pengguna tidak boleh menentukan `status` atau `kode` sendiri.
- **Validasi otomatis.** Jika NIP/NIK bukan 8 sampai 20 digit, FastAPI menolak dengan kode **422** sebelum fungsi `buat_tiket` sempat berjalan.
- **Kode HTTP bermakna.** 201 = berhasil dibuat, 404 = tidak ditemukan, 422 = data tidak valid. Frontend memakainya untuk memutuskan tampilan.
- **`with Session() as db`.** Membuka koneksi ke database dan menutupnya otomatis setelah selesai.
- **CORS.** Halaman Anda berjalan di port 5500 dan API di port 8000. Bagi browser itu dua "asal" berbeda, dan permintaan lintas asal diblokir kecuali server mengizinkan. `CORSMiddleware` adalah izin itu. Kalau lupa, di Console akan muncul error CORS.

### 4.4 Jalankan dan uji tanpa frontend

```bash
uvicorn main:app --reload
```

Buka `http://127.0.0.1:8000/docs`. FastAPI membuat halaman uji otomatis (Swagger). Coba:
1. `POST /api/tickets` lewat "Try it out" dengan data contoh, catat `kode` yang dikembalikan.
2. `GET /api/tickets/{kode}` dengan kode tadi (berhasil), lalu dengan `LSM-000000` (404).
3. Kirim `nip_nik` berisi huruf dan lihat respons 422 beserta alasannya.
4. `GET /api/stats`.

Berkas `layanan.db` akan muncul di folder `backend`. Buka dengan SQLite Viewer untuk melihat baris tiket yang tersimpan. Menguji API terpisah dari frontend itu kebiasaan baik: jika ada yang rusak, Anda tahu masalahnya di sisi mana.

---

## 5. Tahap 3: sambungkan frontend ke backend

Di `index.html`, bagian `<script>`, tambahkan di dekat atas:

```js
const API = "http://127.0.0.1:8000";
const LABEL = {
  antrean:     ["Dalam proses antrean", "wait"],
  verifikasi:  ["Dalam proses verifikasi", "wait"],
  disetujui:   ["Disetujui dan diterbitkan", "ok"],
  ditolak:     ["Ditolak / berkas kurang", "bad"],
};
```

`LABEL` menerjemahkan kode status dari database menjadi teks dan warna di layar. Database cukup menyimpan kata pendek, tampilan menentukan kata-katanya.

**Mengirim pengajuan.** Ganti isi `$("#af").onsubmit=...` yang lama (yang membuat kode acak dan mengisi `SMP`) dengan:

```js
$("#af").onsubmit = async ev => {
  ev.preventDefault();
  const res = await fetch(`${API}/api/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      layanan: v.t,
      nama: $("#n").value,
      nip_nik: $("#p").value,
      opd: $("#o").value,
      whatsapp: $("#w").value,
    }),
  });
  if (!res.ok) { alert("Data belum valid. Periksa NIP/NIK dan nomor WhatsApp."); return; }
  const { kode } = await res.json();
  dlg.innerHTML = `<div class="done"><h3>Pengajuan terkirim</h3><p>Simpan kode pengajuan berikut untuk memeriksa status:</p><p style="font-size:28px;font-weight:700;margin:8px 0">${kode}</p><div class="acts"><button class="btn" id="ok">Tutup</button></div></div>`;
  $("#ok").onclick = () => dlg.close();
};
```

**Mengecek status.** Ganti isi `$("#tf").onsubmit=...` dengan:

```js
$("#tf").onsubmit = async e => {
  e.preventDefault();
  const c = $("#kode").value.trim(), o = $("#tr");
  const res = await fetch(`${API}/api/tickets/${encodeURIComponent(c)}`);
  if (res.status === 404) {
    o.innerHTML = `<span class="st bad">Kode "${esc(c)}" tidak ditemukan.</span>`;
    return;
  }
  const t = await res.json(), [teks, warna] = LABEL[t.status];
  o.innerHTML = `<dl><dt>Kode</dt><dd>${esc(t.kode)}</dd><dt>Layanan</dt><dd>${esc(t.layanan)}</dd><dt>Tanggal pengajuan</dt><dd>${esc(t.tanggal)}</dd><dt>Status</dt><dd class="st ${warna}">${teks}</dd><dt>Keterangan</dt><dd>${esc(t.catatan || "-")}</dd></dl>`;
};
```

Setelah itu `SMP` boleh dihapus, tidak dipakai lagi.

Yang berubah secara logika: `await fetch(...)` berarti "kirim permintaan dan tunggu jawaban server tanpa membekukan halaman". Fungsinya harus bertanda `async`. Perhatikan juga bahwa `esc()` sekarang dipakai pada data dari server, karena `catatan` kelak diisi petugas dan tidak boleh dipercaya begitu saja.

### Cara mengamati alurnya

1. Jalankan backend (`uvicorn main:app --reload`) dan frontend (Live Server) bersamaan.
2. Buka DevTools (F12), tab **Network**, lalu kirim satu pengajuan.
3. Klik baris `tickets`: lihat **Payload** (data yang dikirim) dan **Response** (kode yang kembali), dan status 201.
4. Refresh halaman dan cek kode tadi. Sekarang tiket tetap ada, karena tersimpan di `layanan.db`.

Untuk mencoba tampilan status "Disetujui" atau "Ditolak", ubah kolom `status` di SQLite Viewer menjadi `disetujui` atau `ditolak`, lalu cek lagi kodenya. Nanti perubahan ini dilakukan petugas lewat portal admin.

Jika ada error, lihat **Console** di DevTools. Tiga penyebab paling umum: backend belum jalan, port Live Server bukan 5500 (sesuaikan `allow_origins`), atau id input di formulir tidak sama dengan yang dipakai kode.

---

## 6. Tahap 4: dari prototipe ke sistem di dokumen

Urutan yang disarankan, dari yang paling mendasar:

1. **Layanan dari database.** Buat tabel `services`, endpoint `GET /api/services`, dan ganti array `S` dengan hasil `fetch`. Layanan jadi bisa diubah tanpa menyentuh kode.
2. **Statistik asli.** Panggil `/api/stats` dan hitung ulang batas donat dari datanya (lihat 3.8). Angka 940/926/1/13 di prototipe hanyalah contoh.
3. **Unggah berkas.** Di FastAPI pakai `UploadFile` (butuh `pip install python-multipart`), simpan ke folder khusus, dan batasi jenis serta ukuran berkas. Kolom file di formulir saat ini belum mengirim apa pun.
4. **Portal admin.** Login dengan JWT, daftar tiket, dan endpoint `PATCH /api/tickets/{kode}` untuk mengubah `status` dan `catatan`. Endpoint ini wajib dilindungi login, berbeda dengan endpoint publik di atas.
5. **PostgreSQL.** Ganti baris `create_engine` menjadi `create_engine("postgresql+psycopg://user:sandi@localhost:5432/diskominfo")` (hapus `connect_args`, pasang `psycopg[binary]`). Simpan URL di variabel lingkungan, jangan di kode.
6. **Pindah ke React + Vite + Tailwind** sesuai dokumen. Petanya:
   - Setiap bagian halaman menjadi komponen: `Header`, `Hero`, `PanelCekStatus`, `DaftarLayanan`, `DialogPengajuan`, `Statistik`, `TabBantuan`, `Footer`.
   - Array `S` menjadi data dari API; `render()` menjadi `.map()` di JSX.
   - Variabel yang berubah (kata pencarian, tab aktif, dialog terbuka) menjadi `useState`.
   - Fungsi `esc()` tidak lagi dibutuhkan, karena React otomatis meng-escape teks (kecuali Anda memakai `dangerouslySetInnerHTML`).
   - Variabel CSS dan blok tema gelap bisa dibawa apa adanya ke `index.css`.
7. **Deploy** setelah semua di atas stabil.

Kerjakan satu langkah per sesi dan pastikan jalan sebelum lanjut. Setiap langkah di atas hanya menyentuh satu lapisan, sehingga kalau ada yang rusak, penyebabnya mudah dilacak.
