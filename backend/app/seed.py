"""Mengisi data awal (kategori dan layanan). Aman dijalankan berulang kali.

Jalankan: python -m app.seed
"""
import json
from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Category, Service

DATA = json.loads((Path(__file__).parent / "seed_data.json").read_text(encoding="utf-8"))


def seed():
    with SessionLocal() as db:
        kategori = {}
        for c in DATA["categories"]:
            obj = db.scalar(select(Category).where(Category.slug == c["slug"])) or Category(**c)
            db.add(obj)
            kategori[c["slug"]] = obj
        db.flush()
        for i, s in enumerate(DATA["services"]):
            d = dict(s)
            slug = d.pop("category")
            if db.scalar(select(Service.id).where(Service.title == d["title"])) is None:
                db.add(Service(urutan=i, category_id=kategori[slug].id, **d))
        db.commit()


if __name__ == "__main__":
    seed()
    print("Seed selesai.")
