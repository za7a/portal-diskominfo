import { useCallback, useEffect, useState } from "react";
import { adminMe } from "../../api/client.js";
import AdminDashboard from "./AdminDashboard.jsx";
import AdminLogin from "./AdminLogin.jsx";
import { ambilToken, simpanToken } from "./session.js";

export default function AdminPage() {
  const [token, setToken] = useState(ambilToken);
  const [admin, setAdmin] = useState(null);
  const [pesan, setPesan] = useState("");
  const [galatServer, setGalatServer] = useState(false);
  const [ulang, setUlang] = useState(0);

  const keluar = useCallback((alasan = "") => {
    simpanToken(null);
    setToken(null);
    setAdmin(null);
    setPesan(alasan);
  }, []);

  const masuk = (t) => { simpanToken(t); setPesan(""); setToken(t); };

  // Pastikan token masih berlaku dan ambil identitas petugas.
  useEffect(() => {
    if (!token) return;
    let batal = false;
    setGalatServer(false);
    adminMe(token)
      .then(async (r) => {
        if (r.status === 401) return keluar("Sesi berakhir. Silakan masuk kembali.");
        if (!r.ok) throw new Error();
        const a = await r.json();
        if (!batal) setAdmin(a);
      })
      .catch(() => !batal && setGalatServer(true));
    return () => { batal = true; };
  }, [token, ulang, keluar]);

  if (!token) return <AdminLogin pesan={pesan} onMasuk={masuk} />;

  if (galatServer) {
    return (
      <section className="wrap adm-login">
        <div className="panel">
          <h2>Server tidak dapat dihubungi</h2>
          <div className="acts">
            <button className="btn" type="button" onClick={() => setUlang((n) => n + 1)}>Coba lagi</button>
            <button className="btn sec" type="button" onClick={() => keluar("")}>Keluar</button>
          </div>
        </div>
      </section>
    );
  }

  if (!admin) return <section className="wrap adm"><p className="lead">Memuat...</p></section>;

  return <AdminDashboard token={token} admin={admin} onKeluar={keluar} />;
}
