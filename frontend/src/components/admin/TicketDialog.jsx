import { useEffect, useRef, useState } from "react";
import { adminSurat, adminTicket, adminUpdateStatus } from "../../api/client.js";
import { STATUS, STATUS_ADMIN } from "../../config.js";
import { linkWa, waktu } from "./session.js";

const MAKS_CATATAN = 300;
const namaStatus = (k) => (STATUS[k] || [k])[0];

export default function TicketDialog({ token, kode, onClose, onSaved, onUnauthorized }) {
  const ref = useRef(null);
  const [t, setT] = useState(null);
  const [status, setStatus] = useState("");
  const [catatan, setCatatan] = useState("");
  const [galat, setGalat] = useState("");
  const [ok, setOk] = useState("");
  const [proses, setProses] = useState(false);

  useEffect(() => { ref.current?.showModal(); }, []);

  const isi = (d) => { setT(d); setStatus(d.status); setCatatan(d.catatan || ""); };

  useEffect(() => {
    let batal = false;
    adminTicket(token, kode)
      .then(async (r) => {
        if (r.status === 401) return onUnauthorized();
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (!batal) isi(d);
      })
      .catch(() => !batal && setGalat("Data pengajuan tidak dapat dimuat."));
    return () => { batal = true; };
  }, [token, kode, onUnauthorized]);

  async function unduh() {
    setGalat("");
    try {
      const res = await adminSurat(token, kode);
      if (res.status === 401) return onUnauthorized();
      if (!res.ok) throw new Error();
      const nama = /filename="?([^";]+)"?/.exec(res.headers.get("Content-Disposition") || "")?.[1] || `${kode}-surat`;
      const url = URL.createObjectURL(await res.blob());
      const a = Object.assign(document.createElement("a"), { href: url, download: nama });
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setGalat("Surat tidak dapat diunduh. Berkasnya mungkin sudah tidak ada di server.");
    }
  }

  async function simpan(e) {
    e.preventDefault();
    setGalat(""); setOk(""); setProses(true);
    try {
      const res = await adminUpdateStatus(token, kode, { status, catatan });
      if (res.status === 401) return onUnauthorized();
      if (res.status === 400) return setGalat("Tidak ada perubahan untuk disimpan.");
      if (!res.ok) throw new Error();
      isi(await res.json());
      setOk("Perubahan disimpan.");
      onSaved();
    } catch {
      setGalat("Perubahan gagal disimpan. Coba lagi.");
    } finally {
      setProses(false);
    }
  }

  return (
    <dialog ref={ref} className="adm-dialog" onClose={onClose} aria-labelledby="adm-judul">
      <form onSubmit={simpan}>
        <h3 id="adm-judul">Pengajuan {kode}</h3>
        {!t && !galat && <p className="tpl">Memuat...</p>}
        {t && (
          <>
            <dl className="adm-info">
              <dt>Layanan</dt><dd>{t.layanan} <small>({t.kategori})</small></dd>
              <dt>Pemohon</dt><dd>{t.nama}</dd>
              <dt>NIP/NIK</dt><dd>{t.nip_nik}</dd>
              <dt>Instansi/OPD</dt><dd>{t.opd}</dd>
              <dt>WhatsApp</dt><dd><a href={linkWa(t.whatsapp)} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a></dd>
              <dt>Diajukan</dt><dd>{waktu(t.tanggal)}</dd>
              <dt>Surat</dt>
              <dd>
                {t.ada_surat
                  ? <button className="btn sec adm-kelola" type="button" onClick={unduh}>Unduh surat</button>
                  : "Tidak ada surat terlampir"}
              </dd>
            </dl>

            <label htmlFor="adm-status">Status</label>
            <select id="adm-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_ADMIN.map(([k, teks]) => <option key={k} value={k}>{teks}</option>)}
            </select>
            <label htmlFor="adm-catatan">Keterangan untuk pemohon</label>
            <textarea id="adm-catatan" rows={3} maxLength={MAKS_CATATAN} value={catatan} onChange={(e) => setCatatan(e.target.value)} />
            <p className="tpl">Keterangan ini tampil pada halaman Cek Status Pengajuan. {catatan.length}/{MAKS_CATATAN}</p>

            <h4 className="adm-sub">Riwayat</h4>
            <ol className="adm-log">
              {[...t.riwayat].reverse().map((r, i) => (
                <li key={i}>
                  <b>{namaStatus(r.status)}</b> <span>{waktu(r.waktu)}{r.oleh ? ` oleh ${r.oleh}` : ""}</span>
                  {r.notes && <div>{r.notes}</div>}
                </li>
              ))}
            </ol>
          </>
        )}
        <p className="st bad" role="alert">{galat}</p>
        <p className="st ok" role="status">{ok}</p>
        <div className="acts">
          {t && <button className="btn" type="submit" disabled={proses}>{proses ? "Menyimpan..." : "Simpan"}</button>}
          <button className="btn sec" type="button" onClick={() => ref.current?.close()}>Tutup</button>
        </div>
      </form>
    </dialog>
  );
}
