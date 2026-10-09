import { useState } from "react";
import { adminLogin } from "../../api/client.js";

export default function AdminLogin({ pesan, onMasuk }) {
  const [username, setUsername] = useState("");
  const [sandi, setSandi] = useState("");
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

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
        <h2>Masuk Admin</h2>
        <p>Khusus petugas Diskominfo Kota Lhokseumawe.</p>
        {pesan && <p className="st wait" role="status">{pesan}</p>}
        <form onSubmit={kirim}>
          <label htmlFor="adm-user">Username</label>
          <input id="adm-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" required />
          <label htmlFor="adm-sandi">Kata sandi</label>
          <input id="adm-sandi" type="password" value={sandi} onChange={(e) => setSandi(e.target.value)} autoComplete="current-password" required />
          <p className="st bad" role="alert">{galat}</p>
          <button className="btn" type="submit" disabled={proses}>{proses ? "Memeriksa..." : "Masuk"}</button>
        </form>
      </div>
    </section>
  );
}
