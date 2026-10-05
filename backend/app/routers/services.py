from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Service
from app.schemas import ServiceOut

router = APIRouter(prefix="/api/services", tags=["Layanan"])


@router.get("", response_model=list[ServiceOut])
def daftar_layanan(db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Service).where(Service.active.is_(True)).options(joinedload(Service.category)).order_by(Service.urutan)
    ).all()
    return [
        {
            "id": s.id, "category": s.category.name, "title": s.title, "description": s.description,
            "syarat": s.syarat, "sla_info": s.sla_info, "keywords": s.keywords,
            "template_name": s.template_name, "template_url": s.template_url,
        }
        for s in rows
    ]
