"""Skema validasi data masuk dan keluar."""
import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


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
