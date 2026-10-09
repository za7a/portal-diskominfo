import uuid
from pathlib import Path

from app.config import UPLOAD_DIR

PDF = b"%PDF-1.4\n% isi surat uji\n"


def data_tiket(client, kata="Email Dinas"):
    layanan = next(s for s in client.get("/api/services").json() if kata in s["title"])
    return {"service_id": layanan["id"], "nama": "Budi Santoso", "nip_nik": "198501012010011001",
            "opd": "Dinas Contoh", "whatsapp": "081234567890"}


def kirim(client, data=None, berkas=("surat.pdf", PDF, "application/pdf")):
    """Kirim pengajuan (multipart). berkas=None berarti tanpa surat."""
    return client.post("/api/tickets", data=data or data_tiket(client), files={"surat": berkas} if berkas else None)


def test_daftar_layanan(client):
    r = client.get("/api/services").json()
    assert len(r) == 8 and r[0]["category"] and r[0]["template_url"]


def test_buat_dan_cek_tiket(client):
    kode = kirim(client).json()["kode"]
    assert len(kode) == 12 and kode.startswith("LSM-")
    r = client.get(f"/api/tickets/{kode.lower()}?nip4=1001")
    assert r.status_code == 200
    j = r.json()
    assert j["status"] == "antrean" and j["layanan"].startswith("Pembuatan Email") and len(j["riwayat"]) == 1


def test_nip_salah_atau_kode_tidak_ada(client):
    kode = kirim(client).json()["kode"]
    assert client.get(f"/api/tickets/{kode}?nip4=0000").status_code == 404
    assert client.get("/api/tickets/LSM-AAAAAAAA?nip4=1001").status_code == 404
    assert client.get(f"/api/tickets/{kode}").status_code == 422


def test_data_tidak_valid_dan_layanan_tak_dikenal(client):
    assert kirim(client, {**data_tiket(client), "nip_nik": "abc"}).status_code == 422
    assert kirim(client, {**data_tiket(client), "service_id": str(uuid.uuid4())}).status_code == 404


def test_statistik(client):
    kirim(client)
    s = client.get("/api/stats").json()
    assert s["total"] == 1 and s["per_status"] == {"antrean": 1} and s["per_kategori"] == {"Email dan Akun": 1}


def test_batas_percobaan(client):
    kode = kirim(client).json()["kode"]
    kode_status = [client.get(f"/api/tickets/{kode}?nip4=1001").status_code for _ in range(11)]
    assert kode_status[-1] == 429


def test_surat_tersimpan_dengan_nama_acak(client):
    sebelum = set(UPLOAD_DIR.glob("*"))
    kode = kirim(client, berkas=("../../etc/Surat Permohonan.PDF", PDF, "application/pdf")).json()["kode"]
    baru = set(UPLOAD_DIR.glob("*")) - sebelum
    assert len(baru) == 1
    berkas = baru.pop()
    assert berkas.suffix == ".pdf" and "surat" not in berkas.name.lower() and berkas.read_bytes() == PDF
    assert kode.startswith("LSM-")


def test_surat_wajib_dan_divalidasi(client):
    sebelum = set(UPLOAD_DIR.glob("*"))
    assert kirim(client, berkas=None).status_code == 422
    assert kirim(client, berkas=("surat.exe", b"MZ....", "application/octet-stream")).status_code == 415
    assert kirim(client, berkas=("surat.pdf", b"bukan pdf sungguhan", "application/pdf")).status_code == 415  # isi tidak cocok ekstensi
    assert kirim(client, berkas=("surat.pdf", b"", "application/pdf")).status_code == 415
    assert kirim(client, berkas=("surat.pdf", PDF + b"x" * (5 * 1024 * 1024), "application/pdf")).status_code == 413
    assert kirim(client, berkas=("surat.docx", b"PK\x03\x04isi", "application/zip")).status_code == 201
    assert len(set(UPLOAD_DIR.glob("*")) - sebelum) == 1  # hanya yang valid yang tersimpan
