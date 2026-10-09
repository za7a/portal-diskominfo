import { Component } from "react";

// Jika ada galat saat menampilkan halaman, tampilkan pesannya (bukan layar kosong)
// supaya mudah dilaporkan. Tombol memuat ulang halaman dari awal.
export default class ErrorBoundary extends Component {
  state = { galat: null };

  static getDerivedStateFromError(galat) {
    return { galat };
  }

  componentDidCatch(galat, info) {
    console.error("Galat tampilan:", galat, info?.componentStack);
  }

  render() {
    const { galat } = this.state;
    if (!galat) return this.props.children;
    return (
      <section className="wrap" style={{ padding: "40px 20px" }} role="alert">
        <h2>Halaman gagal ditampilkan</h2>
        <p>Terjadi galat pada aplikasi. Mohon kirim tangkapan layar pesan di bawah ini ke pengembang.</p>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", padding: 12, border: "1px solid currentColor" }}>
          {String(galat?.stack || galat?.message || galat).split("\n").slice(0, 8).join("\n")}
        </pre>
        <button className="btn" type="button" onClick={() => { location.hash = ""; location.reload(); }}>
          Muat ulang
        </button>
      </section>
    );
  }
}
