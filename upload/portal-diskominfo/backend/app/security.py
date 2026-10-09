"""Hash kata sandi dan token masuk admin. Hanya memakai pustaka standar Python."""
import base64
import hashlib
import hmac
import json
import secrets
import time
import uuid

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import ADMIN_TOKEN_MENIT, SECRET_KEY
from app.database import get_db
from app.models import Admin

_N, _R, _P = 2**14, 8, 1
MIN_SANDI = 8


def hash_password(sandi: str) -> str:
    garam = secrets.token_bytes(16)
    h = hashlib.scrypt(sandi.encode(), salt=garam, n=_N, r=_R, p=_P)
    return f"scrypt${_N}${_R}${_P}${garam.hex()}${h.hex()}"


def verify_password(sandi: str, tersimpan: str) -> bool:
    try:
        algo, n, r, p, garam, h = tersimpan.split("$")
        if algo != "scrypt":
            return False
        calon = hashlib.scrypt(sandi.encode(), salt=bytes.fromhex(garam), n=int(n), r=int(r), p=int(p))
        return hmac.compare_digest(calon, bytes.fromhex(h))
    except (ValueError, TypeError):
        return False


# Dipakai saat username tidak ada, supaya waktu respons tidak membocorkan username yang valid.
HASH_PALSU = hash_password(secrets.token_urlsafe(16))


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(teks: str) -> bytes:
    return base64.urlsafe_b64decode(teks + "=" * (-len(teks) % 4))


def _tanda(isi: str) -> bytes:
    return hmac.new(SECRET_KEY.encode(), isi.encode(), hashlib.sha256).digest()


def buat_token(admin_id: uuid.UUID) -> tuple[str, int]:
    detik = ADMIN_TOKEN_MENIT * 60
    isi = _b64(json.dumps({"sub": str(admin_id), "exp": int(time.time()) + detik}).encode())
    return f"{isi}.{_b64(_tanda(isi))}", detik


def baca_token(token: str) -> uuid.UUID | None:
    try:
        isi, tanda = token.split(".")
        if not hmac.compare_digest(_tanda(isi), _unb64(tanda)):
            return None
        data = json.loads(_unb64(isi))
        if data["exp"] < time.time():
            return None
        return uuid.UUID(data["sub"])
    except (ValueError, KeyError, TypeError):
        return None


_bearer = HTTPBearer(auto_error=False)


def admin_aktif(cred: HTTPAuthorizationCredentials | None = Depends(_bearer), db: Session = Depends(get_db)) -> Admin:
    """Dependency: wajib login admin. Dipakai di semua endpoint /api/admin selain login."""
    admin_id = baca_token(cred.credentials) if cred else None
    admin = db.get(Admin, admin_id) if admin_id else None
    if admin is None:
        raise HTTPException(status_code=401, detail="Sesi tidak valid atau sudah berakhir", headers={"WWW-Authenticate": "Bearer"})
    return admin
