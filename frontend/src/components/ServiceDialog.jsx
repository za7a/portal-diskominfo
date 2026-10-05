import { useEffect, useRef, useState } from "react";
import { createTicket } from "../api/client.js";

const KOSONG = { nama: "", nip_nik: "", opd: "", whatsapp: "" };

export default function ServiceDialog({ service, onClose }) {
  const ref = useRef(null);
  const [form, setForm] = useState(KOSONG);
  const [galat, setGalat] = useState("");
  const [kode, setKode] = useState(null);

  // Buka/tutup elemen <dialog> mengikuti prop `service`.
  useEffect(() => {
    const d = ref.current;
    if (service) {
      setForm(KOSONG); setGalat(""); setKode(null);
      if (!d.open) d.showModal();
    } else if (d.open) d.close();
  }, [service]);

  const ubah = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function kirim(e) {
    e.preventDefault();
    setGalat("");
    try {
      const res = await createTicket({ service_id: service.id, ...form });
      if (!res.ok) return setGalat("Data belum valid. Periksa kembali isian Anda.");
      setKode((await res.json()).kode);
    } catch {
      setGalat("Server tidak dapat dihubungi. Coba lagi beberapa saat.");
    }
  }

  return (
    <dialog ref={ref} onClose={onClose}>
      {service && !kode && (
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
          <label htmlFor="f">Dokumen persyaratan</label>
          <input id="f" type="file" />
          <p className="st bad" role="alert">{galat}</p>
          <div className="acts">
            <button className="btn" type="submit">Kirim pengajuan</button>
            <button className="btn sec" type="button" onClick={onClose}>Batal</button>
          </div>
        </form>
      )}
      {service && kode && (
        <div className="done">
          <h3>Pengajuan terkirim</h3>
          <p>Simpan kode pengajuan berikut untuk memeriksa status:</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: "8px 0" }}>{kode}</p>
          <div className="acts"><button className="btn" onClick={onClose}>Tutup</button></div>
        </div>
      )}
    </dialog>
  );
}
