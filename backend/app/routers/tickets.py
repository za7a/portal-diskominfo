import secrets

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RequestLog, Service, ServiceRequest, Status
from app.ratelimit import batasi_cek
from app.schemas import TicketCreated, TicketIn, TicketOut

router = APIRouter(prefix="/api/tickets", tags=["Tiket"])

# Tanpa karakter yang mudah tertukar (0/O, 1/I). 32^8 = sekitar 1,1 triliun kemungkinan.
ALFABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"


def _kode_unik(db: Session) -> str:
    while True:
        kode = "LSM-" + "".join(secrets.choice(ALFABET) for _ in range(8))
        if db.scalar(select(ServiceRequest.id).where(ServiceRequest.ticket_code == kode)) is None:
            return kode


@router.post("", status_code=201, response_model=TicketCreated)
def buat_tiket(data: TicketIn, db: Session = Depends(get_db)):
    layanan = db.get(Service, data.service_id)
    if layanan is None or not layanan.active:
        raise HTTPException(status_code=404, detail="Layanan tidak ditemukan")
    req = ServiceRequest(
        ticket_code=_kode_unik(db), service_id=layanan.id, nama_pemohon=data.nama,
        nip_nik=data.nip_nik, opd=data.opd, whatsapp=data.whatsapp,
    )
    req.logs.append(RequestLog(status_from=None, status_to=Status.ANTREAN.value, notes="Pengajuan diterima"))
    db.add(req)
    db.commit()
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
