import { useEffect, useState } from "react";
import { getStats } from "../api/client.js";

const PALET = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "#5b6b8c", "#b9c4e6"];

export default function Stats() {
  const [s, setS] = useState(null);
  useEffect(() => { getStats().then(setS).catch(() => {}); }, []);

  const total = s?.total ?? 0;
  const p = s?.per_status ?? {};
  const kategori = Object.entries(s?.per_kategori ?? {});
  let batas = 0;
  const potongan = kategori.map(([, n], i) => {
    const dari = batas;
    batas += (n / total) * 100;
    return `${PALET[i % PALET.length]} ${dari}% ${batas}%`;
  });
  const latar = total ? `conic-gradient(${potongan.join(",")})` : "var(--line)";
  const angka = (v) => (s ? v : "-");

  return (
    <section className="alt" id="statistik">
      <div className="wrap">
        <h2 className="sec">Data jumlah pengajuan layanan</h2>
        <p className="lead">Rekapitulasi permohonan dari seluruh Organisasi Perangkat Daerah.</p>
        <div className="stats">
          <div>
            <div className="donut" data-total={total} style={{ background: latar }} role="img" aria-label="Diagram pengajuan berdasarkan kategori" />
            <ul className="legend">
              {kategori.map(([nama, n], i) => (
                <li key={nama}><i style={{ background: PALET[i % PALET.length] }} />{nama}<b>{((n / total) * 100).toFixed(1).replace(".", ",")}%</b></li>
              ))}
            </ul>
          </div>
          <div className="nums">
            <div><b>{angka(total)}</b><span>Pengajuan masuk</span></div>
            <div><b>{angka(p.disetujui || 0)}</b><span>Disetujui</span></div>
            <div><b>{angka(p.ditolak || 0)}</b><span>Ditolak</span></div>
            <div><b>{angka((p.antrean || 0) + (p.verifikasi || 0))}</b><span>Dalam proses</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
