# Jiyora — Pesanan Shopee

Aplikasi web (PWA) untuk input & rekap pesanan Shopee, tersinkron ke Google Sheet.
Desain: tema "boutique ledger" — kertas gading, aksen berry/emas, motif polkadot, font Lora + Poppins.

## Struktur
- `index.html`, `app.js`, `sw.js`, `manifest.json` → file frontend (dihosting statis, mis. GitHub Pages/Netlify).
- `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`, `favicon-32.png` → icon aplikasi (monogram "J." bergaya, jangan diganti nama filenya karena dirujuk di `manifest.json` & `index.html`).
- `Code.gs` → backend, ditempel ke **Google Sheet > Extensions > Apps Script**.

## Setup singkat
1. Buka Google Sheet tujuan.
2. Extensions > Apps Script > tempel isi `Code.gs`.
3. Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone.
4. Salin URL `.../exec`, tempel ke variabel `scriptURL` di `app.js`.
5. Upload ulang folder ini ke hosting Anda.
6. PIN default untuk masuk form Admin: `1998` (ubah di `app.js` fungsi `verifyPin`).

## Catatan
Setiap kali `Code.gs` diedit, buat **deployment versi baru** (Deploy > Manage deployments > Edit > New version), atau perubahan tidak akan aktif di URL lama.
