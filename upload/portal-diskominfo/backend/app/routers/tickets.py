import secrets
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import MAKS_UPLOAD_MB, UPLOAD_DIR
from app.database import get_db
from app.models import RequestLog, Service, ServiceRequest, Status
from app.ratelimit import batasi_cek
from app.schemas import TicketCreated, TicketOut

router = APIRouter(prefix="/api/tickets", tags=["Tiket"])

# Tanpa karakter yang mudah tertukar (0/O, 1/I). 32^8 = sekitar 1,1 triliun kemungkinan.
ALFABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"


def _kode_unik(db: Session) -> str:
    while True:
        kode = "LSM-" + "".join(secrets.choice(ALFABET) for _ in range(8))
        if db.scalar(select(ServiceRequest.id).where(ServiceRequest.ticket_code == kode)) is None:
            return kode


# Jenis surat yang diterima dan tanda awal isi berkasnya (bukan hanya cek ekstensi).
JENIS_SURAT = {".pdf": b"%PDF-", ".docx": b"PK\x03\x04", ".doc": b"\xd0\xcf\x11\xe0"}


def _baca_surat(surat: UploadFile) -> tuple[bytes, str]:
    ext = Path(surat.filename or "").suffix.lower()
    isi = surat.file.read(MAKS_UPLOAD_MB * 1024 * 1024 + 1)
    if len(isi) > MAKS_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Ukuran berkas melebihi {MAKS_UPLOAD_MB} MB")
    if ext not in JENIS_SURAT or not isi.startswith(JENIS_SURAT[ext]):
        raise HTTPException(status_code=415, detail="Berkas harus berupa PDF, DOC, atau DOCX yang tidak rusak")
    return isi, ext


@router.post("", status_code=201, response_model=TicketCreated)
def buat_tiket(
    service_id: Annotated[uuid.UUID, Form()],
    nama: Annotated[str, Form(min_length=3, max_length=150)],
    nip_nik: Annotated[str, Form(pattern=r"^\d{8,20}$")],
    opd: Annotated[str, Form(min_length=2, max_length=150)],
    whatsapp: Annotated[str, Form(pattern=r"^[0-9+]{9,16}$")],
    surat: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Aturan isian sama dengan skema TicketIn (dipakai sebagai acuan pada versi JSON).
    layanan = db.get(Service, service_id)
    if layanan is None or not layanan.active:
        raise HTTPException(status_code=404, detail="Layanan tidak ditemukan")
    isi, ext = _baca_surat(surat)
    # Nama berkas acak: nama asli dari pemohon tidak pernah dipakai di disk.
    nama_berkas = secrets.token_hex(16) + ext
    req = ServiceRequest(
        ticket_code=_kode_unik(db), service_id=layanan.id, nama_pemohon=nama,
        nip_nik=nip_nik, opd=opd, whatsapp=whatsapp, attachment_url=nama_berkas,
    )
    req.logs.append(RequestLog(status_from=None, status_to=Status.ANTREAN.value, notes="Pengajuan diterima"))
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    tujuan = UPLOAD_DIR / nama_berkas
    tujuan.write_bytes(isi)
    try:
        db.add(req)
        db.commit()
    except Exception:
        tujuan.unlink(missing_ok=True)  # jangan tinggalkan berkas yatim bila database gagal
        raise
    return {"kode": req.ticket_code}


@router.get("/{kode}", response_model=TicketOut, dependencies=[Depends(batasi_cek)])
def cek_tiket(kode: str, nip4: str = Query(pattern=r"^\d{4}$"), db: Session = Depends(get_db)):
    req = db.scalar(select(ServiceRequest).where(ServiceRequest.ticket_code == kode.strip().upper()))
    # Pesan sama untuk "kode salah" dan "NIP/NIK salah", agar kode tidak bisa ditebak satu per satu.
    if req is None or not req.nip_nik.endswith(nip4):
        raise HTTPException(status_code=404, detail="Kode atau 4 digit NIP/NIK tidak cocok")
    return {
        "kode": req.ticket_code, "layanan": req.service.title, "status": req.status.value,
        "tanggal": req.created_at.date(), "catatan": req.catatan,
        "riwayat": [{"status": l.status_to, "notes": l.notes, "waktu": l.created_at} for l in req.logs],
    }
