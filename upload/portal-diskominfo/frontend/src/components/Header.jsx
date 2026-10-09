const MENU = [["#beranda", "Beranda"], ["#layanan", "Layanan"], ["#statistik", "Statistik"], ["#bantuan", "FAQ dan Panduan"], ["#cek", "Cek Status Pengajuan"], ["#/admin", "Login"]];

export default function Header({ modeAdmin = false, onNavigate }) {
  return (
    <header className="top">
      <div className="wrap">
        <a className="brand" href="#beranda" onClick={() => onNavigate?.("#beranda")}>
          <img src="/assets/icon-lhokseumawe.png" alt="Logo Diskominfo Lhokseumawe" width="50" height="52" />
          <div>
            <b>Dinas Komunikasi, Informatika dan Persandian</b>
            <span>Pemerintah Kota Lhokseumawe</span>
          </div>
        </a>
        <nav aria-label="Menu utama">
          {MENU.map(([href, teks]) => {
            const admin = href === "#/admin";
            return (
              <a key={href} href={href} onClick={() => onNavigate?.(href)} className={admin ? "admin" : undefined} aria-current={admin && modeAdmin ? "page" : undefined}>
                {teks}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
