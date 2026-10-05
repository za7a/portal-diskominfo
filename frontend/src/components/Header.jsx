const MENU = [["#beranda", "Beranda"], ["#layanan", "Layanan"], ["#statistik", "Statistik"], ["#bantuan", "FAQ dan Panduan"], ["#cek", "Cek Status Pengajuan"]];

export default function Header() {
  return (
    <header className="top">
      <div className="wrap">
        <a className="brand" href="#beranda">
          <img src="../../public/assets/icon-lhokseumawe.png" alt="Logo Diskominfo Lhokseumawe" width="50" height="52" />
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
