// MASUKKAN URL GOOGLE APPS SCRIPT ANDA DI BAWAH INI
const scriptURL = 'https://script.google.com/macros/s/AKfycbxDM_zBc9lj5xb9SOYopUUnciW5ljKdI5EIqzu6nZ2F9MPNEJEzS1fc1dUaOFC9Rh62iA/exec';

let totals = { "Blouse Polkadot Terbaru": 0, "Kemeja Polkadot": 0, "Semua": 0 };

// --- IKON STATUS (SVG inline, 1 sistem visual konsisten) ---
const ICONS = {
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  pending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  fail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
  sync: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>'
};

function statusTag(kind, label) {
  return `<span class="status-tag status-${kind}">${ICONS[kind]} ${label}</span>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

// --- BANTUAN PENGELOMPOKAN TANGGAL ---
const BULAN_PENDEK = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
const BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI_PANJANG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Memecah "15 Sep 2026, 14.05" -> { tanggal: "15 Sep 2026", jam: "14.05" }
function splitWaktu(waktu) {
  const str = String(waktu);
  const idx = str.indexOf(',');
  if (idx === -1) return { tanggal: str.trim(), jam: '' };
  return { tanggal: str.slice(0, idx).trim(), jam: str.slice(idx + 1).trim() };
}

// Mengubah "15 Sep 2026" -> objek Date (tengah malam, waktu lokal)
function parseTanggalPendek(tanggalStr) {
  const match = String(tanggalStr).trim().match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (!match) return null;
  const bulanIdx = BULAN_PENDEK.indexOf(match[2].toLowerCase().slice(0, 3));
  if (bulanIdx === -1) return null;
  return new Date(parseInt(match[3]), bulanIdx, parseInt(match[1]));
}

function samaHari(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Label grup lengkap dengan hari, tanggal, tahun -> "Hari ini · Selasa, 15 September 2026"
function formatLabelTanggal(tanggalStr) {
  const d = parseTanggalPendek(tanggalStr);
  if (!d) return tanggalStr;

  const now = new Date();
  const kemarin = new Date(now);
  kemarin.setDate(kemarin.getDate() - 1);

  const teks = `${HARI_PANJANG[d.getDay()]}, ${d.getDate()} ${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`;
  if (samaHari(d, now)) return `Hari ini · ${teks}`;
  if (samaHari(d, kemarin)) return `Kemarin · ${teks}`;
  return teks;
}

function dateGroupHtml(tanggalStr) {
  return `<div class="date-group" data-tanggal="${escapeHtml(tanggalStr)}">${escapeHtml(formatLabelTanggal(tanggalStr))}</div>`;
}

function orderRowHtml({ waktu, nama, jenis, warna, ukuran, jumlah, statusKind, statusLabel, statusId }) {
  return `<div class="order-row" ${statusId ? `id="${statusId}"` : ''}>
      <div class="order-main">
        <span class="order-buyer">${escapeHtml(nama)}</span>
        <span class="order-qty">${jumlah} pcs</span>
      </div>
      <div class="order-product">${escapeHtml(jenis)}</div>
      <div class="order-variant">${escapeHtml(warna)}, ${escapeHtml(ukuran)}</div>
      <div class="order-foot">
        <span class="order-time">${escapeHtml(waktu)}</span>
        <span class="row-status">${statusTag(statusKind, statusLabel)}</span>
      </div>
    </div>`;
}

function setEmptyState(isEmpty) {
  document.getElementById('emptyState').classList.toggle('hidden', !isEmpty);
}

// --- FUNGSI TARIK DATA ---
function loadData() {
  const loadingEl = document.getElementById('loadingText');
  const refreshBtn = document.getElementById('btn-refresh');
  loadingEl.classList.remove('error');
  loadingEl.innerHTML = `${ICONS.sync} Menyinkronkan data…`;
  refreshBtn.classList.add('spinning');

  fetch(scriptURL)
    .then(response => {
      if (!response.ok) throw new Error("Gagal terhubung ke Google Server.");
      return response.text();
    })
    .then(text => {
      try {
        const json = JSON.parse(text);
        if (json.status === "error") throw new Error("Error dari Sheet: " + json.message);
        return json.data;
      } catch (e) {
        throw new Error("Lupa deploy 'Versi Baru' di Google Apps Script.");
      }
    })
    .then(data => {
      const wrap = document.getElementById('tabelPesanan');
      wrap.innerHTML = '';
      totals = { "Blouse Polkadot Terbaru": 0, "Kemeja Polkadot": 0, "Semua": 0 };

      const pesanan = [];

      data.forEach((row, index) => {
        // Lewati baris header sheet
        if (index === 0 && row[0] && row[0].toString().toLowerCase().includes("waktu")) return;

        const waktu = row[0];
        const nama = row[1];
        const jenis = row[2];
        const warna = row[3];
        const ukuran = row[4];
        const jumlah = parseInt(row[5]);

        if (!waktu || isNaN(jumlah)) return;

        if (totals[jenis] !== undefined) totals[jenis] += jumlah;
        totals["Semua"] += jumlah;

        pesanan.push({ waktu, nama, jenis, warna, ukuran, jumlah });
      });

      // Pesanan terbaru ditampilkan di atas, dikelompokkan per hari/tanggal/tahun
      let rowsHtml = '';
      let tanggalSebelumnya = null;

      pesanan.slice().reverse().forEach(p => {
        const { tanggal, jam } = splitWaktu(p.waktu);
        if (tanggal !== tanggalSebelumnya) {
          rowsHtml += dateGroupHtml(tanggal);
          tanggalSebelumnya = tanggal;
        }
        rowsHtml += orderRowHtml({
          waktu: jam || p.waktu, nama: p.nama, jenis: p.jenis, warna: p.warna, ukuran: p.ukuran, jumlah: p.jumlah,
          statusKind: 'ok', statusLabel: 'Tersimpan'
        });
      });

      wrap.innerHTML = rowsHtml;
      setEmptyState(pesanan.length === 0);

      document.getElementById('totBlouseBaru').innerText = totals["Blouse Polkadot Terbaru"];
      document.getElementById('totKemejaPolkadot').innerText = totals["Kemeja Polkadot"];
      document.getElementById('totSemua').innerText = totals["Semua"];

      loadingEl.innerHTML = `${ICONS.ok} Data tersinkron`;
      refreshBtn.classList.remove('spinning');
    })
    .catch(error => {
      console.error('Sistem mendeteksi masalah:', error);
      loadingEl.classList.add('error');
      loadingEl.innerHTML = `${ICONS.fail} ${error.message}`;
      refreshBtn.classList.remove('spinning');
    });
}

// --- TOAST ---
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  document.getElementById('toastText').innerText = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// --- NAVIGASI ANTAR HALAMAN ---
function showSection(sectionId) {
  ['public-section', 'pin-section', 'admin-section'].forEach(id => {
    document.getElementById(id).classList.toggle('hidden', id !== sectionId);
  });

  document.getElementById('btn-public').classList.toggle('active', sectionId === 'public-section');
  document.getElementById('btn-admin').classList.toggle('active', sectionId === 'admin-section' || sectionId === 'pin-section');

  if (sectionId === 'pin-section') {
    const pinInput = document.getElementById('pinInput');
    pinInput.value = '';
    document.getElementById('pinError').innerText = '';
    setTimeout(() => pinInput.focus(), 50);
  }
}

function verifyPin() {
  const pinInput = document.getElementById('pinInput');
  const pin = pinInput.value;
  if (pin === '1998') {
    showSection('admin-section');
  } else {
    document.getElementById('pinError').innerText = 'PIN salah. Coba lagi.';
    pinInput.classList.remove('shake');
    void pinInput.offsetWidth; // restart animasi
    pinInput.classList.add('shake');
    pinInput.value = '';
    pinInput.focus();
  }
}

// --- EVENT LISTENER ---
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-public').addEventListener('click', () => showSection('public-section'));
  document.getElementById('btn-admin').addEventListener('click', () => showSection('pin-section'));
  document.getElementById('btn-back-dashboard').addEventListener('click', () => showSection('public-section'));

  document.getElementById('btn-refresh').addEventListener('click', loadData);

  document.getElementById('btn-verify-pin').addEventListener('click', verifyPin);
  document.getElementById('pinInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') verifyPin();
  });

  const form = document.getElementById('orderForm');
  form.addEventListener('submit', e => {
    e.preventDefault();

    const nama = document.getElementById('namaPemesan').value;
    const jenis = document.getElementById('jenisPakaian').value;
    const warna = document.getElementById('warna').value;
    const ukuran = document.getElementById('ukuran').value;
    const jumlah = parseInt(document.getElementById('jumlah').value);
    const waktu = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    const { tanggal: tanggalIni, jam: jamIni } = splitWaktu(waktu);
    const idUnik = 'row-' + Date.now() + Math.floor(Math.random() * 1000);
    const rowHtml = orderRowHtml({
      waktu: jamIni, nama, jenis, warna, ukuran, jumlah,
      statusKind: 'pending', statusLabel: 'Menyimpan…', statusId: idUnik
    });

    const wrap = document.getElementById('tabelPesanan');
    const grupPertama = wrap.querySelector('.date-group');
    if (grupPertama && grupPertama.dataset.tanggal === tanggalIni) {
      grupPertama.insertAdjacentHTML('afterend', rowHtml);
    } else {
      wrap.insertAdjacentHTML('afterbegin', dateGroupHtml(tanggalIni) + rowHtml);
    }
    document.getElementById(idUnik).classList.add('entering');
    setEmptyState(false);

    const formData = new FormData();
    formData.append('waktu', waktu);
    formData.append('nama', nama);
    formData.append('jenis', jenis);
    formData.append('warna', warna);
    formData.append('ukuran', ukuran);
    formData.append('jumlah', jumlah);

    fetch(scriptURL, { method: 'POST', body: formData })
      .then(response => response.json())
      .then(result => {
        if (result.status === "success") {
          const el = document.getElementById(idUnik).querySelector('.row-status');
          el.innerHTML = statusTag('ok', 'Tersimpan');
          showToast('Pesanan tersimpan');
          loadData();
        } else {
          throw new Error("Gagal tersimpan di Sheet.");
        }
      })
      .catch(error => {
        const el = document.getElementById(idUnik).querySelector('.row-status');
        el.innerHTML = statusTag('fail', 'Gagal, coba lagi');
      });

    form.reset();
  });

  // Jalankan saat web pertama kali dimuat
  loadData();

  // Registrasi PWA (Service Worker)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log("Service Worker terdaftar."))
      .catch(err => console.error("SW Gagal:", err));
  }
});
