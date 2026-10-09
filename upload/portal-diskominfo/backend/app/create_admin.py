"""Membuat akun petugas admin.

Jalankan: python -m app.create_admin <username> "<Nama Lengkap>"
Tambahkan --reset untuk mengganti kata sandi akun yang sudah ada.
"""
import argparse
import getpass
import sys

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Admin
from app.security import MIN_SANDI, hash_password


def main():
    ap = argparse.ArgumentParser(description="Buat atau reset akun admin")
    ap.add_argument("username")
    ap.add_argument("nama_lengkap", nargs="?")
    ap.add_argument("--role", default="admin")
    ap.add_argument("--reset", action="store_true", help="ganti kata sandi akun yang sudah ada")
    a = ap.parse_args()
    username = a.username.strip().lower()

    sandi = getpass.getpass("Kata sandi: ")
    if len(sandi) < MIN_SANDI:
        sys.exit(f"Kata sandi minimal {MIN_SANDI} karakter.")
    if sandi != getpass.getpass("Ulangi kata sandi: "):
        sys.exit("Kata sandi tidak sama.")

    with SessionLocal() as db:
        admin = db.scalar(select(Admin).where(Admin.username == username))
        if admin and not a.reset:
            sys.exit(f"Username '{username}' sudah ada. Pakai --reset untuk mengganti kata sandi.")
        if admin:
            admin.password_hash = hash_password(sandi)
        else:
            db.add(Admin(username=username, nama_lengkap=a.nama_lengkap or username,
                         role=a.role, password_hash=hash_password(sandi)))
        db.commit()
    print("Akun diperbarui." if admin else "Akun admin dibuat.")


if __name__ == "__main__":
    main()
