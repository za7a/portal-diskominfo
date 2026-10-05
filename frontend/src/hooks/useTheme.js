import { useEffect, useState } from "react";

// pilihan: null = ikuti sistem, "light" / "dark" = dipilih pengguna
export function useTheme() {
  const mq = "(prefers-color-scheme: dark)";
  const [pilihan, setPilihan] = useState(null);
  const [sistemGelap, setSistemGelap] = useState(() => matchMedia(mq).matches);

  useEffect(() => {
    const m = matchMedia(mq);
    const h = (e) => setSistemGelap(e.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    if (pilihan) document.documentElement.dataset.theme = pilihan;
  }, [pilihan]);

  const dark = pilihan ? pilihan === "dark" : sistemGelap;
  return { dark, toggle: () => setPilihan(dark ? "light" : "dark") };
}
