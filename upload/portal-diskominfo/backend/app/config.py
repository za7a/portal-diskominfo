"""Konfigurasi aplikasi. Nilai dibaca dari environment / berkas .env."""
import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./layanan.db")
# Folder surat pemohon. Taruh DI LUAR folder yang disajikan web (jangan di frontend/public).
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads")).resolve()
MAKS_UPLOAD_MB = int(os.getenv("MAKS_UPLOAD_MB", "5"))
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173").split(",")
    if o.strip()
]

# Kunci penanda tangan token admin. WAJIB diisi di .env untuk produksi
# (python -c "import secrets; print(secrets.token_urlsafe(48))").
# Jika kosong, dibuat acak per proses: token otomatis tidak berlaku setelah server restart.
SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_urlsafe(48)
ADMIN_TOKEN_MENIT = int(os.getenv("ADMIN_TOKEN_MENIT", "480"))
