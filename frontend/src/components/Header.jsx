const MENU = [["#beranda", "Beranda"], ["#layanan", "Layanan"], ["#statistik", "Statistik"], ["#bantuan", "FAQ dan Panduan"], ["#cek", "Cek Status Pengajuan"]];

export default function Header() {
  return (
    <header className="top">
      <div className="wrap">
        <a className="brand" href="#beranda">
          <svg viewBox="0 0 44 52" aria-hidden="true">
            <path d="M4 4h36v24c0 11-8 18-18 22C12 46 4 39 4 28z" fill="#1e3a8a" stroke="#ff6b00" strokeWidth="3" />
            <path d="M22 14l3 7h8l-6 5 2 8-7-5-7 5 2-8-6-5h8z" fill="#fff" />
          </svg>
          <div>
            <b>Dinas Komunikasi, Informatika dan Persandian</b>
            <span>Pemerintah Kota Lhokseumawe</span>
          </div>
        </a>
        <nav aria-label="Menu utama">
          {MENU.map(([href, teks]) => <a key={href} href={href}>{teks}</a>)}
        </nav>
      </div>
    </header>
  );
}
