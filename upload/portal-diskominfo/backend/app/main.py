from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routers import admin, services, stats, tickets

# Tabel dibuat lewat migrasi Alembic: alembic upgrade head

app = FastAPI(title="API Layanan Diskominfo Lhokseumawe", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)
app.include_router(services.router)
app.include_router(tickets.router)
app.include_router(stats.router)
app.include_router(admin.router)


@app.get("/api/health", tags=["Sistem"])
def health():
    return {"status": "ok"}
