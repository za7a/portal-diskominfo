import { useEffect, useState } from "react";
import { createTicket } from "../api/client.js";
import { SURAT_JENIS, SURAT_MAKS_MB } from "../config.js";

const KOSONG = { nama: "", nip_nik: "", opd: "", whatsapp: "" };

export default function ServiceDialog({ service, onClose }) {
  const [form, setForm] = useState(KOSONG);
  const [galat, setGalat] = useState("");
  const [kode, setKode] = useState(null);
  const [mengirim, setKirim] = useState(false);

  useEffect(() => {
    if (service) {
      setForm(KOSONG); setGalat(""); setKode(null);
      window.scrollTo(0, 0);
    }
  }, [service]);

  const ubah = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function kirim(e) {
    e.preventDefault();
    setGalat("");
    const data = new FormData();
    data.append("service_id", service.id);
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    const berkas = e.currentTarget.elements.surat.files[0];
    if (!berkas) return setGalat("Pilih berkas surat permohonan terlebih dahulu.");
    if (berkas.size > SURAT_MAKS_MB * 1024 * 1024) return setGalat(`Ukuran berkas melebihi ${SURAT_MAKS_MB} MB.`);
    data.append("surat", berkas);
    setKirim(true);
    try {
      const res = await createTicket(data);
      if (res.status === 413) return setGalat(`Ukuran berkas melebihi ${SURAT_MAKS_MB} MB.`);
      if (res.status === 415) return setGalat("Berkas harus berupa PDF, DOC, atau DOCX yang tidak rusak.");
      if (!res.ok) return setGalat("Data belum valid. Periksa kembali isian Anda.");
      setKode((await res.json()).kode);
    } catch {
      setGalat("Server tidak dapat dihubungi. Coba lagi beberapa saat.");
    } finally {
      setKirim(false);
    }
  }

  if (!service) return null;

  return (
    <section className="wrap">
      {!kode && (
        <form onSubmit={kirim}>
          <h3>{service.title}</h3>
          <div className="need">Dokumen yang disiapkan: {service.syarat}</div>
          <label htmlFor="n">Nama lengkap</label>
          <input id="n" name="nama" value={form.nama} onChange={ubah} required minLength={3} />
          <label htmlFor="p">NIP atau NIK</label>
          <input id="p" name="nip_nik" value={form.nip_nik} onChange={ubah} required inputMode="numeric" pattern="[0-9]{8,20}" title="8 sampai 20 digit angka" />
          <label htmlFor="o">Instansi atau OPD</label>
          <input id="o" name="opd" value={form.opd} onChange={ubah} required />
          <label htmlFor="w">Nomor WhatsApp</label>
          <input id="w" name="whatsapp" value={form.whatsapp} onChange={ubah} required inputMode="tel" pattern="[0-9+]{9,16}" title="9 sampai 16 karakter angka" />
          <label>Contoh Template Surat</label>
          <p className="tpl"><a href={`/${service.template_url}`} download>{service.template_name}</a><br />Unduh dan sesuaikan isinya sebelum diunggah.</p>
          <label htmlFor="f">Surat permohonan (PDF, DOC, atau DOCX, maksimal {SURAT_MAKS_MB} MB)</label>
          <input id="f" name="surat" type="file" accept={SURAT_JENIS} required />
          <p className="st bad" role="alert">{galat}</p>
          <div className="acts">
            <button className="btn" type="submit" disabled={mengirim}>{mengirim ? "Mengirim..." : "Kirim pengajuan"}</button>
            <button className="btn sec" type="button" onClick={onClose}>Batal</button>
          </div>
        </form>
      )}
      {kode && (
        <div className="done">
          <h3>Pengajuan terkirim</h3>
          <p>Simpan kode pengajuan berikut untuk memeriksa status:</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: "8px 0" }}>{kode}</p>
          <div className="acts"><button className="btn" onClick={onClose}>Tutup</button></div>
        </div>
      )}
    </section>
  );
}