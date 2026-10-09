"""Skema validasi data masuk dan keluar."""
import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models import Status


class ServiceOut(BaseModel):
    id: uuid.UUID
    category: str
    title: str
    description: str | None = None
    syarat: str | None = None
    sla_info: str | None = None
    keywords: str | None = None
    template_name: str | None = None
    template_url: str | None = None


class TicketIn(BaseModel):
    service_id: uuid.UUID
    nama: str = Field(min_length=3, max_length=150)
    nip_nik: str = Field(pattern=r"^\d{8,20}$")
    opd: str = Field(min_length=2, max_length=150)
    whatsapp: str = Field(pattern=r"^[0-9+]{9,16}$")


class TicketCreated(BaseModel):
    kode: str


class LogOut(BaseModel):
    status: str
    notes: str | None = None
    waktu: datetime


class TicketOut(BaseModel):
    kode: str
    layanan: str
    status: str
    tanggal: date
    catatan: str | None = None
    riwayat: list[LogOut]


class StatsOut(BaseModel):
    total: int
    per_status: dict[str, int]
    per_kategori: dict[str, int]


# ---------- Admin ----------
class LoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=200)


class TokenOut(BaseModel):
    token: str
    expires_in: int


class AdminOut(BaseModel):
    username: str
    nama_lengkap: str
    role: str

    model_config = {"from_attributes": True}


class TicketRow(BaseModel):
    kode: str
    layanan: str
    nama: str
    nip_nik: str
    opd: str
    status: str
    tanggal: date


class TicketPage(BaseModel):
    total: int
    page: int
    limit: int
    items: list[TicketRow]


class AdminLogOut(BaseModel):
    status_dari: str | None = None
    status: str
    notes: str | None = None
    waktu: datetime
    oleh: str | None = None


class TicketDetail(BaseModel):
    kode: str
    layanan: str
    kategori: str
    nama: str
    nip_nik: str
    opd: str
    whatsapp: str
    status: str
    tanggal: datetime
    diperbarui: datetime | None = None
    catatan: str | None = None
    ada_surat: bool = False
    riwayat: list[AdminLogOut]


class StatusUpdateIn(BaseModel):
    status: Status
    catatan: str | None = Field(default=None, max_length=300)
