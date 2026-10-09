import { useState } from "react";
import { adminLogin } from "../../api/client.js";

export default function AdminLogin({ pesan, onMasuk }) {
  const [username, setUsername] = useState("");
  const [sandi, setSandi] = useState("");
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);
  // Tambahan state untuk melihat kata sandi
  const [lihatSandi, setLihatSandi] = useState(false);

  async function kirim(e) {
    e.preventDefault();
    setGalat("");
    setProses(true);
    try {
      const res = await adminLogin(username.trim(), sandi);
      if (res.status === 401) return setGalat("Username atau kata sandi salah.");
      if (res.status === 429) return setGalat("Terlalu banyak percobaan. Coba lagi beberapa menit lagi.");
      if (!res.ok) throw new Error();
      onMasuk((await res.json()).token);
    } catch {
      setGalat("Server tidak dapat dihubungi. Coba lagi beberapa saat.");
    } finally {
      setProses(false);
    }
  }

  return (
    <section className="wrap adm-login">
      <div className="panel">
        <h2>Masuk</h2>
        <p>Diskominfo Kota Lhokseumawe.</p>
        {pesan && <p className="st wait" role="status">{pesan}</p>}
        <form onSubmit={kirim}>
          <label htmlFor="adm-user">Username</label>
          <input id="adm-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" required />
          <label htmlFor="adm-sandi">Kata sandi</label>
          {/* Pembungkus agar posisi ikon mata berada di dalam input */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input 
              id="adm-sandi" 
              type={lihatSandi ? "text" : "password"} 
              value={sandi} 
              onChange={(e) => setSandi(e.target.value)} 
              autoComplete="current-password" 
              required 
              style={{ width: "100%", paddingRight: "40px" }}
            />
            {/* Tombol ikon mata */}
            <button
              type="button"
              onClick={() => setLihatSandi(!lihatSandi)}
              style={{
                position: "absolute",
                right: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                opacity: 0.6
              }}
            >
              {lihatSandi ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
          <p className="st bad" role="alert">{galat}</p>
          <button className="btn" type="submit" disabled={proses}>{proses ? "Memeriksa..." : "Masuk"}</button>
        </form>
      </div>
    </section>
  );
}