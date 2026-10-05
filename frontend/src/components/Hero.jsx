import { useState } from "react";
import TrackPanel from "./TrackPanel.jsx";

const POPULER = [["Subdomain", "subdomain"], ["TTE ASN", "tte"], ["Email dinas", "email"]];
const TAUTAN = { textDecoration: "none", display: "inline-block" };

export default function Hero({ onSearch, onTemplates }) {
  const [teks, setTeks] = useState("");
  return (
    <div className="hero" id="beranda">
      <div className="wrap">
        <div>
          <h1>Layanan Pengajuan Domain, VPS, Aplikasi, dan Tanda Tangan Elektronik</h1>
          <p>Ajukan permohonan layanan Diskominfo secara mandiri. Setiap pengajuan mendapat kode untuk memantau statusnya.</p>
          <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); onSearch(teks); }}>
            <input type="search" value={teks} onChange={(e) => setTeks(e.target.value)} placeholder="Cari layanan, misalnya TTE atau VPS" aria-label="Cari layanan" />
            <button type="submit">Cari</button>
          </form>
          <div className="tags">
            Pencarian populer:
            {POPULER.map(([label, q]) => (
              <button key={q} type="button" onClick={() => { setTeks(q); onSearch(q); }}>{label}</button>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            <a className="btn" href="#layanan" style={TAUTAN}>Lihat layanan</a>{" "}
            <a className="btn sec" href="#bantuan" style={TAUTAN} onClick={(e) => { e.preventDefault(); onTemplates(); }}>Contoh Template Surat</a>
          </p>
        </div>
        <TrackPanel />
      </div>
    </div>
  );
}
