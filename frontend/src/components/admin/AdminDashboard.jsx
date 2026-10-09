import { useCallback, useEffect, useState } from "react";
import { adminTickets, getStats } from "../../api/client.js";
import { STATUS, STATUS_ADMIN } from "../../config.js";
import TicketDialog from "./TicketDialog.jsx";
import { tanggal } from "./session.js";

const LIMIT = 15;

export default function AdminDashboard({ token, admin, onKeluar }) {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [qAktif, setQAktif] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ total: 0, items: [] });
  const [jumlah, setJumlah] = useState({});
  const [muat, setMuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [pilih, setPilih] = useState(null);
  const [versi, setVersi] = useState(0);

  const sesiBerakhir = useCallback(() => onKeluar("Sesi berakhir. Silakan masuk kembali."), [onKeluar]);

  // Tunda pencarian 300 ms supaya tidak memanggil server di setiap ketukan.
  useEffect(() => {
    const t = setTimeout(() => { setQAktif(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let batal = false;
    setMuat(true); setGalat("");
    adminTickets(token, { status, q: qAktif, page, limit: LIMIT })
      .then(async (r) => {
        if (r.status === 401) return sesiBerakhir();
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (!batal) setData(d);
      })
      .catch(() => !batal && setGalat("Data tidak dapat dimuat. Periksa koneksi ke server."))
      .finally(() => !batal && setMuat(false));
    return () => { batal = true; };
  }, [token, status, qAktif, page, versi, sesiBerakhir]);

  useEffect(() => {
    getStats().then((s) => setJumlah({ ...s.per_status, semua: s.total })).catch(() => {});
  }, [versi]);

  const totalHalaman = Math.max(1, Math.ceil(data.total / LIMIT));
  const pilihStatus = (k) => { setStatus(k); setPage(1); };
  const angka = (k) => (jumlah[k || "semua"] ?? 0);

  return (
    <section className="wrap adm">
      <div className="adm-bar">
        <div>
          <h2 className="sec">Pengajuan Layanan</h2>
          <p className="lead">Masuk sebagai {admin.nama_lengkap}.</p>
        </div>
        <button className="btn sec" type="button" onClick={() => onKeluar("")}>Keluar</button>
      </div>

      <div className="tabs" role="tablist" aria-label="Filter status">
        {[["", "Semua"], ...STATUS_ADMIN].map(([k, teks]) => (
          <button key={k} type="button" role="tab" aria-selected={status === k} onClick={() => pilihStatus(k)}>
            {teks} ({angka(k)})
          </button>
        ))}
      </div>

      <label htmlFor="adm-cari" className="adm-cari-label">Cari kode, nama, NIP/NIK, atau OPD</label>
      <input id="adm-cari" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Contoh: LSM-7K4Q atau nama pemohon" />

      <p className="st bad" role="alert">{galat}</p>

      <div className="adm-tabel" aria-busy={muat}>
        <table>
          <thead>
            <tr><th>Kode</th><th>Pemohon</th><th>Layanan</th><th>Diajukan</th><th>Status</th><th><span className="sr">Aksi</span></th></tr>
          </thead>
          <tbody>
            {data.items.map((r) => {
              const [teks, warna] = STATUS[r.status] || [r.status, "wait"];
              return (
                <tr key={r.kode}>
                  <td><b>{r.kode}</b></td>
                  <td>{r.nama}<br /><small>{r.opd}</small></td>
                  <td>{r.layanan}</td>
                  <td>{tanggal(r.tanggal)}</td>
                  <td className={`st ${warna}`}>{teks}</td>
                  <td><button className="btn sec adm-kelola" type="button" onClick={() => setPilih(r.kode)}>Kelola</button></td>
                </tr>
              );
            })}
            {!muat && !galat && data.items.length === 0 && (
              <tr><td colSpan={6} className="adm-kosong">Tidak ada pengajuan yang cocok.</td></tr>
            )}
            {muat && data.items.length === 0 && <tr><td colSpan={6} className="adm-kosong">Memuat...</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="adm-hal">
        <span>{data.total} pengajuan, halaman {Math.min(page, totalHalaman)} dari {totalHalaman}</span>
        <div className="acts">
          <button className="btn sec" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button>
          <button className="btn sec" type="button" disabled={page >= totalHalaman} onClick={() => setPage(page + 1)}>Berikutnya</button>
        </div>
      </div>

      {pilih && (
        <TicketDialog
          token={token}
          kode={pilih}
          onClose={() => setPilih(null)}
          onSaved={() => setVersi((v) => v + 1)}
          onUnauthorized={sesiBerakhir}
        />
      )}
    </section>
  );
}
