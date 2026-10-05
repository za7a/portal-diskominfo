import uuid


def data_tiket(client, kata="Email Dinas"):
    layanan = next(s for s in client.get("/api/services").json() if kata in s["title"])
    return {"service_id": layanan["id"], "nama": "Budi Santoso", "nip_nik": "198501012010011001",
            "opd": "Dinas Contoh", "whatsapp": "081234567890"}


def test_daftar_layanan(client):
    r = client.get("/api/services").json()
    assert len(r) == 8 and r[0]["category"] and r[0]["template_url"]


def test_buat_dan_cek_tiket(client):
    kode = client.post("/api/tickets", json=data_tiket(client)).json()["kode"]
    assert len(kode) == 12 and kode.startswith("LSM-")
    r = client.get(f"/api/tickets/{kode.lower()}?nip4=1001")
    assert r.status_code == 200
    j = r.json()
    assert j["status"] == "antrean" and j["layanan"].startswith("Pembuatan Email") and len(j["riwayat"]) == 1


def test_nip_salah_atau_kode_tidak_ada(client):
    kode = client.post("/api/tickets", json=data_tiket(client)).json()["kode"]
    assert client.get(f"/api/tickets/{kode}?nip4=0000").status_code == 404
    assert client.get("/api/tickets/LSM-AAAAAAAA?nip4=1001").status_code == 404
    assert client.get(f"/api/tickets/{kode}").status_code == 422


def test_data_tidak_valid_dan_layanan_tak_dikenal(client):
    assert client.post("/api/tickets", json={**data_tiket(client), "nip_nik": "abc"}).status_code == 422
    assert client.post("/api/tickets", json={**data_tiket(client), "service_id": str(uuid.uuid4())}).status_code == 404


def test_statistik(client):
    client.post("/api/tickets", json=data_tiket(client))
    s = client.get("/api/stats").json()
    assert s["total"] == 1 and s["per_status"] == {"antrean": 1} and s["per_kategori"] == {"Email dan Akun": 1}


def test_batas_percobaan(client):
    kode = client.post("/api/tickets", json=data_tiket(client)).json()["kode"]
    kode_status = [client.get(f"/api/tickets/{kode}?nip4=1001").status_code for _ in range(11)]
    assert kode_status[-1] == 429
