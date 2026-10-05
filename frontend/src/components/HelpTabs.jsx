import { FAQ } from "../data/faq.js";

const TABS = ["Pertanyaan umum", "Contoh surat permohonan", "Syarat dan ketentuan", "Alur pengajuan"];

export default function HelpTabs({ services, tab, onTab }) {
  return (
    <section id="bantuan">
      <div className="wrap">
        <h2 className="sec">Pertanyaan terkait pengajuan layanan</h2>
        <p className="lead">Jawaban atas pertanyaan yang paling sering diajukan, beserta contoh surat dan alur pengajuan.</p>
        <div className="tabs" role="tablist">
          {TABS.map((t, i) => (
            <button key={t} role="tab" aria-selected={i === tab} onClick={() => onTab(i)}>{t}</button>
          ))}
        </div>

        {tab === 0 && FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><div>{a}</div></details>)}

        {tab === 1 && (
          <table>
            <thead><tr><th>Nama berkas</th><th>Untuk layanan</th><th>Berkas</th></tr></thead>
            <tbody>
              {services.map((v) => (
                <tr key={v.id}><td>{v.template_name}</td><td>{v.title}</td><td><a href={`/${v.template_url}`} download>Unduh</a></td></tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 2 && (
          <ul>
            <li>Pengajuan hanya untuk ASN dan OPD di lingkungan Pemerintah Kota Lhokseumawe.</li>
            <li>Data yang diisi harus benar dan sesuai dokumen resmi. NIP atau NIK diverifikasi oleh tim.</li>
            <li>Pengajuan dengan berkas tidak lengkap dikembalikan disertai catatan perbaikan.</li>
            <li>Kata sandi dan akun adalah tanggung jawab pemohon dan tidak boleh dibagikan.</li>
          </ul>
        )}

        {tab === 3 && (
          <ol>
            <li>Pilih layanan dan baca syaratnya.</li>
            <li>Isi formulir dan unggah dokumen persyaratan.</li>
            <li>Simpan kode pengajuan yang diterima.</li>
            <li>Tim Diskominfo memeriksa kelengkapan berkas dan NIP atau NIK.</li>
            <li>Jika lengkap, pengajuan dikerjakan. Jika kurang, pemohon menerima catatan perbaikan.</li>
            <li>Layanan diterbitkan dan pemohon diberi tahu.</li>
          </ol>
        )}

        <div className="help">
          <p><b>Masih ada kendala?</b><br />Tim Helpdesk Diskominfo siap membantu proses pengajuan Anda pada jam kerja.</p>
          <a className="btn" href="#" style={{ textDecoration: "none" }}>Hubungi Helpdesk</a>
        </div>
      </div>
    </section>
  );
}
