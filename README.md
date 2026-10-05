# Portal Layanan Diskominfo Kota Lhokseumawe

Portal pengajuan layanan (subdomain/VPS, aplikasi, TTE, email dinas, dan lainnya) dengan pelacakan status tiket.

## Struktur

```
portal-diskominfo/
  backend/                   API (FastAPI + SQLAlchemy + Alembic)
    app/                     main, config, database, models, schemas, ratelimit, seed
      routers/               services, tickets, stats
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
