import { useEffect, useState } from "react";

// Alamat setelah tanda # (mis. "#/admin"). Dipakai sebagai pengalih halaman tanpa pustaka router.
export function useHash() {
  const [hash, setHash] = useState(() => location.hash);
  useEffect(() => {
    const h = () => setHash(location.hash);
    addEventListener("hashchange", h);
    return () => removeEventListener("hashchange", h);
  }, []);
  return hash;
}
