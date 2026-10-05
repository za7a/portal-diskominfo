import { useEffect, useState } from "react";
import { getServices } from "./api/client.js";
import { useTheme } from "./hooks/useTheme.js";
import TopStrip from "./components/TopStrip.jsx";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import ServiceGrid from "./components/ServiceGrid.jsx";
import Stats from "./components/Stats.jsx";
import HelpTabs from "./components/HelpTabs.jsx";
import Footer from "./components/Footer.jsx";
import ServiceDialog from "./components/ServiceDialog.jsx";

const gulir = (id) => document.getElementById(id)?.scrollIntoView();

export default function App() {
  const { dark, toggle } = useTheme();
  const [services, setServices] = useState([]);
  const [galat, setGalat] = useState(false);
  const [query, setQuery] = useState("");
  const [dipilih, setDipilih] = useState(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    getServices().then(setServices).catch(() => setGalat(true));
  }, []);

  const cari = (q) => { setQuery(q); gulir("layanan"); };
  const keContohSurat = () => { setTab(1); gulir("bantuan"); };

  return (
    <>
      <TopStrip dark={dark} onToggle={toggle} />
      <Header />
      <main>
        <Hero onSearch={cari} onTemplates={keContohSurat} />
        <ServiceGrid services={services} query={query} galat={galat} onPick={setDipilih} />
        <Stats />
        <HelpTabs services={services} tab={tab} onTab={setTab} />
      </main>
      <Footer />
      <ServiceDialog service={dipilih} onClose={() => setDipilih(null)} />
    </>
  );
}
