import { useState } from "react";
import { getTicket } from "../api/client.js";
import { STATUS } from "../config.js";

export default function TrackPanel() {
  const [kode, setKode] = useState("");
  const [nip4, setNip4] = useState("");
  const [hasil, setHasil] = useState(null); // { tiket } atau { galat }

  async function cek(e) {
    e.preventDefault();
    try {
      const res = await getTicket(kode.trim(), nip4.trim());
      if (res.status === 404) return setHasil({ galat: "tidakcocok" });
      if (!res.ok) throw new Error();
      setHasil({ tiket: await res.json() });
    } catch {
      setHasil({ galat: "server" });
    }
  }

  const t = hasil?.tiket;
  const [teks, warna] = t ? STATUS[t.status] || [t.status, "wait"] : [];

  return (
    <div className="panel" id="cek">
      <h2>Cek status pengajuan</h2>
      <p>Masukkan kode pengajuan yang Anda terima.</p>
      <form onSubmit={cek}>
        <label htmlFor="kode">Kode pengajuan</label>
        <input id="kode" value={kode} onChange={(e) => setKode(e.target.value)} placeholder="LSM-7K4Q9XPD" autoComplete="off" required />
        <label htmlFor="nip4">4 digit terakhir NIP/NIK</label>
        <div className="row">
          <input id="nip4" value={nip4} onChange={(e) => setNip4(e.target.value)} inputMode="numeric" maxLength={4} pattern="[0-9]{4}" autoComplete="off" required />
          <button className="btn" type="submit">Cek</button>
        </div>
      </form>
      <div className="result" aria-live="polite">
        {hasil?.galat === "tidakcocok" && (
          <><span className="st bad">Data tidak ditemukan.</span> Kode atau 4 digit terakhir NIP/NIK tidak cocok. Periksa kembali, atau hubungi Helpdesk.</>
        )}
        {hasil?.galat === "server" && <span className="st bad">Server tidak dapat dihubungi atau terlalu banyak percobaan.</span>}
        {t && (
          <dl>
            <dt>Kode</dt><dd>{t.kode}</dd>
            <dt>Layanan</dt><dd>{t.layanan}</dd>
            <dt>Tanggal pengajuan</dt><dd>{t.tanggal}</dd>
            <dt>Status</dt><dd className={`st ${warna}`}>{teks}</dd>
            <dt>Keterangan</dt><dd>{t.catatan || "-"}</dd>
            <dt>Riwayat</dt>
            <dd>{t.riwayat.map((r, i) => <div key={i}>{(STATUS[r.status] || [r.status])[0]}: {r.notes || "-"}</div>)}</dd>
          </dl>
        )}
      </div>
    </div>
  );
}
