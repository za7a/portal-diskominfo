import time

from app import security
from app.database import SessionLocal
from app.models import Admin
from app.security import buat_token, hash_password

from tests.test_tickets import PDF, data_tiket, kirim


def buat_admin(username="petugas", sandi="rahasia123", nama="Petugas Satu"):
    with SessionLocal() as db:
        a = Admin(username=username, nama_lengkap=nama, password_hash=hash_password(sandi))
        db.add(a)
        db.commit()
        return a.id


def masuk(client, username="petugas", sandi="rahasia123"):
    r = client.post("/api/admin/login", json={"username": username, "password": sandi})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def tiket(client, kata="Email Dinas"):
    return kirim(client, data_tiket(client, kata)).json()["kode"]


def test_login_benar_dan_salah(client):
    buat_admin()
    assert client.post("/api/admin/login", json={"username": "petugas", "password": "salah"}).status_code == 401
    assert client.post("/api/admin/login", json={"username": "tidakada", "password": "rahasia123"}).status_code == 401
    h = masuk(client)
    assert client.get("/api/admin/me", headers=h).json()["nama_lengkap"] == "Petugas Satu"


def test_username_tidak_peka_huruf_besar(client):
    buat_admin()
    masuk(client, username="  PETUGAS ")


def test_endpoint_admin_wajib_token(client):
    kode = tiket(client)
    assert client.get("/api/admin/me").status_code == 401
    assert client.get("/api/admin/tickets").status_code == 401
    assert client.get(f"/api/admin/tickets/{kode}").status_code == 401
    assert client.patch(f"/api/admin/tickets/{kode}/status", json={"status": "disetujui"}).status_code == 401
    assert client.get("/api/admin/me", headers={"Authorization": "Bearer ngawur"}).status_code == 401


def test_token_kedaluwarsa_atau_dipalsukan(client, monkeypatch):
    admin_id = buat_admin()
    token, _ = buat_token(admin_id)
    assert client.get("/api/admin/me", headers={"Authorization": f"Bearer {token}"}).status_code == 200
    isi, tanda = token.split(".")
    palsu = f"{isi}.{tanda[:-2]}aa"
    assert client.get("/api/admin/me", headers={"Authorization": f"Bearer {palsu}"}).status_code == 401
    monkeypatch.setattr(time, "time", lambda: time.monotonic() + 10**10)
    assert client.get("/api/admin/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_batas_percobaan_login(client):
    buat_admin()
    kode = [client.post("/api/admin/login", json={"username": "petugas", "password": "x"}).status_code for _ in range(6)]
    assert kode[:5] == [401] * 5 and kode[5] == 429


def test_daftar_filter_dan_cari(client):
    buat_admin()
    h = masuk(client)
    k1 = tiket(client, "Email Dinas")
    assert client.get(f"/api/admin/tickets?q={k1[4:].lower()}", headers=h).json()["total"] == 1
    tiket(client, "Video Conference")
    r = client.get("/api/admin/tickets", headers=h).json()
    assert r["total"] == 2 and len(r["items"]) == 2 and r["items"][0]["status"] == "antrean"
    assert client.get("/api/admin/tickets?q=video", headers=h).json()["total"] == 0  # yang dicari data pemohon, bukan layanan
    assert client.get(f"/api/admin/tickets?q=lsm-", headers=h).json()["total"] == 2
    assert client.get("/api/admin/tickets?q=budi", headers=h).json()["total"] == 2
    assert client.get("/api/admin/tickets?q=%25", headers=h).json()["total"] == 0  # % dianggap huruf biasa
    assert client.get("/api/admin/tickets?status=disetujui", headers=h).json()["total"] == 0
    assert client.get("/api/admin/tickets?status=ngawur", headers=h).status_code == 422
    assert len(client.get("/api/admin/tickets?limit=1&page=2", headers=h).json()["items"]) == 1


def test_ubah_status_tercatat_dan_terlihat_pemohon(client):
    buat_admin()
    h = masuk(client)
    kode = tiket(client)
    r = client.patch(f"/api/admin/tickets/{kode}/status", headers=h, json={"status": "verifikasi", "catatan": "Berkas lengkap"})
    assert r.status_code == 200
    j = r.json()
    assert j["status"] == "verifikasi" and j["catatan"] == "Berkas lengkap" and len(j["riwayat"]) == 2
    assert j["riwayat"][-1]["oleh"] == "Petugas Satu" and j["riwayat"][-1]["status_dari"] == "antrean"
    publik = client.get(f"/api/tickets/{kode}?nip4=1001").json()
    assert publik["status"] == "verifikasi" and publik["catatan"] == "Berkas lengkap" and len(publik["riwayat"]) == 2
    assert client.get("/api/stats").json()["per_status"] == {"verifikasi": 1}
    assert client.get(f"/api/admin/tickets/{kode.lower()}", headers=h).json()["whatsapp"] == "081234567890"


def test_ubah_status_tanpa_perubahan_atau_tidak_valid(client):
    buat_admin()
    h = masuk(client)
    kode = tiket(client)
    assert client.patch(f"/api/admin/tickets/{kode}/status", headers=h, json={"status": "antrean"}).status_code == 400
    assert client.patch(f"/api/admin/tickets/{kode}/status", headers=h, json={"status": "selesai"}).status_code == 422
    assert client.patch(f"/api/admin/tickets/{kode}/status", headers=h, json={"status": "ditolak", "catatan": "x" * 301}).status_code == 422
    assert client.patch("/api/admin/tickets/LSM-AAAAAAAA/status", headers=h, json={"status": "ditolak"}).status_code == 404
    assert client.get("/api/admin/tickets/LSM-AAAAAAAA", headers=h).status_code == 404


def test_hash_password():
    h = hash_password("rahasia123")
    assert security.verify_password("rahasia123", h) and not security.verify_password("lain", h)
    assert not security.verify_password("x", "bukan-hash")


def test_unduh_surat_wajib_login_dan_isi_sama(client):
    buat_admin()
    kode = tiket(client)
    assert client.get(f"/api/admin/tickets/{kode}/surat").status_code == 401
    h = masuk(client)
    assert client.get(f"/api/admin/tickets/{kode}", headers=h).json()["ada_surat"] is True
    r = client.get(f"/api/admin/tickets/{kode.lower()}/surat", headers=h)
    assert r.status_code == 200 and r.content == PDF and r.headers["content-type"] == "application/pdf"
    assert f"{kode}-surat.pdf" in r.headers["content-disposition"] and r.headers["x-content-type-options"] == "nosniff"
    assert client.get("/api/admin/tickets/LSM-AAAAAAAA/surat", headers=h).status_code == 404


def test_surat_hilang_atau_jalur_berbahaya_ditolak(client):
    from app.config import UPLOAD_DIR
    from app.models import ServiceRequest
    from sqlalchemy import select

    buat_admin()
    h = masuk(client)
    kode = tiket(client)
    with SessionLocal() as db:
        req = db.scalar(select(ServiceRequest))
        berkas = UPLOAD_DIR / req.attachment_url
        req.attachment_url = "../" + UPLOAD_DIR.name + "/../.env"
        db.commit()
    assert client.get(f"/api/admin/tickets/{kode}/surat", headers=h).status_code == 404
    with SessionLocal() as db:
        req = db.scalar(select(ServiceRequest))
        req.attachment_url = berkas.name
        db.commit()
    berkas.unlink()
    assert client.get(f"/api/admin/tickets/{kode}/surat", headers=h).status_code == 404
