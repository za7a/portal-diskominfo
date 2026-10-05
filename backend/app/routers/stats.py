from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Category, Service, ServiceRequest
from app.schemas import StatsOut

router = APIRouter(prefix="/api/stats", tags=["Statistik"])


@router.get("", response_model=StatsOut)
def statistik(db: Session = Depends(get_db)):
    rows = db.execute(select(ServiceRequest.status, func.count()).group_by(ServiceRequest.status)).all()
    per_status = {status.value: jumlah for status, jumlah in rows}
    jumlah = func.count(ServiceRequest.id)
    kat = db.execute(
        select(Category.name, jumlah)
        .select_from(ServiceRequest)
        .join(Service, ServiceRequest.service_id == Service.id)
        .join(Category, Service.category_id == Category.id)
        .group_by(Category.name)
        .order_by(jumlah.desc())
    ).all()
    return {"total": sum(per_status.values()), "per_status": per_status, "per_kategori": dict(kat)}
