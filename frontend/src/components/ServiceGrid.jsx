export default function ServiceGrid({ services, query, galat, onPick }) {
  const k = query.trim().toLowerCase();
  const daftar = services.filter((v) => !k || `${v.title} ${v.description} ${v.keywords}`.toLowerCase().includes(k));

  let isi;
  if (galat) isi = <div className="empty">Daftar layanan tidak dapat dimuat. Pastikan server API berjalan.</div>;
  else if (!services.length) isi = <div className="empty">Memuat layanan...</div>;
  else if (!daftar.length) isi = <div className="empty">Layanan dengan kata kunci "{query}" tidak ditemukan. Coba kata kunci lain, misalnya TTE, email, atau VPS.</div>;
  else
    isi = daftar.map((v) => (
      <article className="card" key={v.id}>
        <small>{v.category}</small>
        <h3>{v.title}</h3>
        <p>{v.description}</p>
        <dl><dt>Waktu:</dt><dd>{v.sla_info}</dd><dt>Syarat:</dt><dd>{v.syarat}</dd></dl>
        <button className="btn" onClick={() => onPick(v)}>Ajukan</button>
      </article>
    ));

  return (
    <section id="layanan">
      <div className="wrap">
        <h2 className="sec">Layanan Diskominfo Kota Lhokseumawe</h2>
        <p className="lead">Pilih layanan yang dibutuhkan, lalu lengkapi formulir dan dokumen persyaratan.</p>
        <div className="grid">{isi}</div>
      </div>
    </section>
  );
}
