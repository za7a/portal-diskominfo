"""Model tabel database (mengikuti ERD di dokumentasi)."""
import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

JsonType = JSON().with_variant(JSONB, "postgresql")


class Status(str, enum.Enum):
    ANTREAN = "antrean"
    VERIFIKASI = "verifikasi"
    DISETUJUI = "disetujui"
    DITOLAK = "ditolak"


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(80))
    slug: Mapped[str] = mapped_column(String(80), unique=True)
    services: Mapped[list["Service"]] = relationship(back_populates="category")


class Service(Base):
    __tablename__ = "services"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id"))
    title: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(Text)
    syarat: Mapped[str | None] = mapped_column(Text)
    sla_info: Mapped[str | None] = mapped_column(String(100))
    keywords: Mapped[str | None] = mapped_column(String(200))
    template_name: Mapped[str | None] = mapped_column(String(150))
    template_url: Mapped[str | None] = mapped_column(String(255))
    require_kak: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    urutan: Mapped[int] = mapped_column(Integer, default=0)
    category: Mapped[Category] = relationship(back_populates="services")


class Admin(Base):
    """Petugas Diskominfo. Dipakai oleh portal admin (belum dibuat)."""
    __tablename__ = "admins"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    nama_lengkap: Mapped[str] = mapped_column(String(150))
    role: Mapped[str] = mapped_column(String(20), default="admin")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ServiceRequest(Base):
    __tablename__ = "service_requests"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    ticket_code: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    service_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("services.id"), index=True)
    nama_pemohon: Mapped[str] = mapped_column(String(150))
    nip_nik: Mapped[str] = mapped_column(String(30), index=True)
    opd: Mapped[str] = mapped_column(String(150))
    whatsapp: Mapped[str] = mapped_column(String(20))
    status: Mapped[Status] = mapped_column(
        Enum(Status, name="status_pengajuan", values_callable=lambda e: [m.value for m in e]),
        default=Status.ANTREAN,
        index=True,
    )
    form_data: Mapped[dict | None] = mapped_column(JsonType)
    attachment_url: Mapped[str | None] = mapped_column(String(255))
    catatan: Mapped[str | None] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    service: Mapped[Service] = relationship()
    logs: Mapped[list["RequestLog"]] = relationship(
        back_populates="request", cascade="all, delete-orphan", order_by="RequestLog.created_at"
    )


class RequestLog(Base):
    """Jejak audit: setiap perubahan status tercatat di sini."""
    __tablename__ = "request_logs"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("service_requests.id", ondelete="CASCADE"), index=True)
    status_from: Mapped[str | None] = mapped_column(String(20))
    status_to: Mapped[str] = mapped_column(String(20))
    notes: Mapped[str | None] = mapped_column(String(300))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("admins.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    request: Mapped[ServiceRequest] = relationship(back_populates="logs")
