"""Pembatas percobaan cek status per alamat IP.

Disimpan di memori proses, cukup untuk satu server. Jika dijalankan di belakang
proxy atau dengan banyak worker, ganti dengan Redis dan baca IP dari header proxy.
"""
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

BATAS = 10      # percobaan cek status
JENDELA = 60    # detik
BATAS_LOGIN = 5     # percobaan masuk admin
JENDELA_LOGIN = 300  # detik
_catatan: dict[str, deque] = defaultdict(deque)
_catatan_login: dict[str, deque] = defaultdict(deque)


def _periksa(catatan: dict[str, deque], request: Request, batas: int, jendela: int):
    ip = request.client.host if request.client else "?"
    sekarang = time.monotonic()
    antrean = catatan[ip]
    while antrean and sekarang - antrean[0] > jendela:
        antrean.popleft()
    if len(antrean) >= batas:
        raise HTTPException(status_code=429, detail="Terlalu banyak percobaan. Coba lagi sebentar lagi.")
    antrean.append(sekarang)


def batasi_cek(request: Request):
    _periksa(_catatan, request, BATAS, JENDELA)


def batasi_login(request: Request):
    _periksa(_catatan_login, request, BATAS_LOGIN, JENDELA_LOGIN)
