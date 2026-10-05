const Bulan = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
);
const Matahari = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export default function TopStrip({ dark, onToggle }) {
  const label = dark ? "Ganti ke mode terang" : "Ganti ke mode gelap";
  return (
    <div className="strip">
      <div className="wrap">
        <span>Situs resmi layanan Pemerintah Kota Lhokseumawe. Portal online 24 jam.</span>
        <button type="button" onClick={onToggle} aria-label={label} title={label}>
          {dark ? <Matahari /> : <Bulan />}
        </button>
      </div>
    </div>
  );
}
