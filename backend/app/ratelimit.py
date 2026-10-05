"""Pembatas percobaan cek status per alamat IP.

Disimpan di memori proses, cukup untuk satu server. Jika dijalankan di belakang
proxy atau dengan banyak worker, ganti dengan Redis dan baca IP dari header proxy.
"""
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

BATAS = 10      # percobaan
JENDELA = 60    # detik
_catatan: dict[str, deque] = defaultdict(deque)


def batasi_cek(request: Request):
    ip = request.client.host if request.client else "?"
    sekarang = time.monotonic()
    antrean = _catatan[ip]
    while antrean and sekarang - antrean[0] > JENDELA:
        antrean.popleft()
    if len(antrean) >= BATAS:
        raise HTTPException(status_code=429, detail="Terlalu banyak percobaan. Coba lagi sebentar lagi.")
    antrean.append(sekarang)
