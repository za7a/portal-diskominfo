"""Endpoint khusus petugas Diskominfo. Semua (kecuali login) wajib token admin."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.config import UPLOAD_DIR
from app.database import get_db
from app.models import Admin, RequestLog, Service, ServiceRequest, Status
from app.ratelimit import batasi_login
from app.schemas import (
    AdminOut, LoginIn, StatusUpdateIn, TicketDetail, TicketPage, TokenOut,
)
from app.security import HASH_PALSU, admin_aktif, buat_token, verify_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.post("/login", response_model=TokenOut, dependencies=[Depends(batasi_login)])
def login(data: LoginIn, db: Session = Depends(get_db)):
    admin = db.scalar(select(Admin).where(Admin.username == data.username.strip().lower()))
    # Pesan dan waktu proses sama untuk "username salah" dan "sandi salah".
    benar = verify_password(data.password, admin.password_hash if admin else HASH_PALSU)
    if admin is None or not benar:
        raise HTTPException(status_code=401, detail="Username atau kata sandi salah")
    token, detik = buat_token(admin.id)
    return {"token": token, "expires_in": detik}


@router.get("/me", response_model=AdminOut)
def saya(admin: Admin = Depends(admin_aktif)):
    return admin


@router.get("/tickets", response_model=TicketPage)
def daftar_tiket(
    status: Status | None = None,
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    _: Admin = Depends(admin_aktif),
    db: Session = Depends(get_db),
):
    filt = []
    if status:
        filt.append(ServiceRequest.status == status)
    if q and q.strip():
        kata = q.strip().lower()
        filt.append(or_(*[
            func.lower(kolom).contains(kata, autoescape=True)
            for kolom in (ServiceRequest.ticket_code, ServiceRequest.nama_pemohon, ServiceRequest.nip_nik, ServiceRequest.opd)
        ]))
    total = db.scalar(select(func.count()).select_from(ServiceRequest).where(*filt)) or 0
    rows = db.scalars(
        select(ServiceRequest).where(*filt)
        .options(joinedload(ServiceRequest.service))
        .order_by(ServiceRequest.created_at.desc(), ServiceRequest.ticket_code)
        .offset((page - 1) * limit).limit(limit)
    ).all()
    return {
        "total": total, "page": page, "limit": limit,
        "items": [
            {"kode": r.ticket_code, "layanan": r.service.title, "nama": r.nama_pemohon, "nip_nik": r.nip_nik,
             "opd": r.opd, "status": r.status.value, "tanggal": r.created_at.date()}
            for r in rows
        ],
    }


def _ambil(db: Session, kode: str) -> ServiceRequest:
    req = db.scalar(
        select(ServiceRequest).where(ServiceRequest.ticket_code == kode.strip().upper())
        .options(joinedload(ServiceRequest.service).joinedload(Service.category))
    )
    if req is None:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    return req


def _detail(db: Session, req: ServiceRequest) -> dict:
    ids = {l.updated_by for l in req.logs if l.updated_by}
    nama = {a.id: a.nama_lengkap for a in db.scalars(select(Admin).where(Admin.id.in_(ids)))} if ids else {}
    return {
        "kode": req.ticket_code, "layanan": req.service.title, "kategori": req.service.category.name,
        "nama": req.nama_pemohon, "nip_nik": req.nip_nik, "opd": req.opd, "whatsapp": req.whatsapp,
        "status": req.status.value, "tanggal": req.created_at, "diperbarui": req.updated_at, "catatan": req.catatan,
        "ada_surat": bool(req.attachment_url),
        "riwayat": [
            {"status_dari": l.status_from, "status": l.status_to, "notes": l.notes, "waktu": l.created_at,
             "oleh": nama.get(l.updated_by)}
            for l in req.logs
        ],
    }


@router.get("/tickets/{kode}", response_model=TicketDetail)
def detail_tiket(kode: str, _: Admin = Depends(admin_aktif), db: Session = Depends(get_db)):
    return _detail(db, _ambil(db, kode))


MIME_SURAT = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@router.get("/tickets/{kode}/surat")
def unduh_surat(kode: str, _: Admin = Depends(admin_aktif), db: Session = Depends(get_db)):
    req = _ambil(db, kode)
    tidak_ada = HTTPException(status_code=404, detail="Surat tidak tersedia")
    if not req.attachment_url:
        raise tidak_ada
    jalur = (UPLOAD_DIR / req.attachment_url).resolve()
    # Pastikan berkas benar-benar berada di folder upload (cegah path traversal).
    if jalur.parent != UPLOAD_DIR or not jalur.is_file():
        raise tidak_ada
    return FileResponse(
        jalur, media_type=MIME_SURAT.get(jalur.suffix, "application/octet-stream"),
        filename=f"{req.ticket_code}-surat{jalur.suffix}", headers={"X-Content-Type-Options": "nosniff"},
    )


@router.patch("/tickets/{kode}/status", response_model=TicketDetail)
def ubah_status(kode: str, data: StatusUpdateIn, admin: Admin = Depends(admin_aktif), db: Session = Depends(get_db)):
    req = _ambil(db, kode)
    catatan = (data.catatan or "").strip() or None
    if data.status == req.status and catatan == req.catatan:
        raise HTTPException(status_code=400, detail="Tidak ada perubahan")
    dari = req.status.value
    req.status = data.status
    req.catatan = catatan
    req.logs.append(RequestLog(status_from=dari, status_to=data.status.value, notes=catatan, updated_by=admin.id))
    db.commit()
    db.refresh(req)
    return _detail(db, req)
