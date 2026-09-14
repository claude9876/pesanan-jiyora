// MASUKKAN URL GOOGLE APPS SCRIPT ANDA DI BAWAH INI
const scriptURL = '‎https://script.google.com/macros/s/AKfycby8gXWk8WL5fXU5Z2HuXw_jLvkqgfGNK7kM3ytL_Ce-83_YaCiuXabWchzUgH4EZAkUVA/exec'; 

let totals = { "Blouse Polkadot Terbaru": 0, "Kemeja Polkadot": 0, "Semua": 0 };

// --- FUNGSI TARIK DATA (MENCEGAH BUG) ---
function loadData() {
    const loadingEl = document.getElementById('loadingText');
    loadingEl.style.display = 'block';
    loadingEl.style.color = '#ee4d2d';
    loadingEl.innerText = '⏳ Menyinkronkan data...';
    
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
                throw new Error("Lupa Deploy 'Versi Baru' di Google Apps Script.");
            }
        })
        .then(data => {
            const tbody = document.querySelector('#tabelPesanan tbody');
            tbody.innerHTML = ''; 
            totals = { "Blouse Polkadot Terbaru": 0, "Kemeja Polkadot": 0, "Semua": 0 };

            data.forEach((row, index) => {
                // Lewati baris header sheet
                if (index === 0 && row[0].toLowerCase().includes("waktu")) return;

                const waktu = row[0];
                const nama = row[1];
                const jenis = row[2];
                const warna = row[3];
                const ukuran = row[4];
                const jumlah = parseInt(row[5]);

                if(!waktu || isNaN(jumlah)) return; 

                if (totals[jenis] !== undefined) totals[jenis] += jumlah;
                totals["Semua"] += jumlah;

                const tr = `<tr>
                    <td>${waktu}</td>
                    <td>${nama}</td>
                    <td>${jenis}</td>
                    <td>${warna}</td>
                    <td>${ukuran}</td>
                    <td>${jumlah}</td>
                    <td style="color: green; font-size:12px; font-weight:bold;">✅ OK</td>
                </tr>`;
                tbody.insertAdjacentHTML('afterbegin', tr);
            });

            document.getElementById('totBlouseBaru').innerText = totals["Blouse Polkadot Terbaru"];
            document.getElementById('totKemejaPolkadot').innerText = totals["Kemeja Polkadot"];
            document.getElementById('totSemua').innerText = totals["Semua"];
            loadingEl.style.display = 'none';
        })
        .catch(error => {
            console.error('Sistem mendeteksi masalah:', error);
            loadingEl.style.color = 'red';
            loadingEl.innerText = `⚠️ Sistem Tertunda: ${error.message}`;
        });
}

// --- NAVIGASI ANTAR HALAMAN ---
function showSection(sectionId) {
    document.getElementById('public-section').style.display = 'none';
    document.getElementById('pin-section').style.display = 'none';
    document.getElementById('admin-section').style.display = 'none';
    
    if(sectionId === 'pin-section') document.getElementById('pinInput').value = '';
    document.getElementById(sectionId).style.display = 'block';
}

function verifyPin() {
    const pin = document.getElementById('pinInput').value;
    if(pin === '1998') {
        document.getElementById('pin-section').style.display = 'none';
        document.getElementById('admin-section').style.display = 'block';
    } else {
        alert('PIN Salah!');
    }
}

// --- EVENT LISTENER (TOMBOL & FORM) ---
document.addEventListener('DOMContentLoaded', () => {
    // Tombol Navigasi Navbar
    document.getElementById('btn-public').addEventListener('click', () => showSection('public-section'));
    document.getElementById('btn-admin').addEventListener('click', () => showSection('pin-section'));
    
    // Tombol Refresh Data
    document.getElementById('btn-refresh').addEventListener('click', loadData);
    
    // Tombol Masuk PIN Admin
    document.getElementById('btn-verify-pin').addEventListener('click', verifyPin);

    // Form Input Pesanan
    const form = document.getElementById('orderForm');
    form.addEventListener('submit', e => {
        e.preventDefault();
        
        const nama = document.getElementById('namaPemesan').value;
        const jenis = document.getElementById('jenisPakaian').value;
        const warna = document.getElementById('warna').value;
        const ukuran = document.getElementById('ukuran').value;
        const jumlah = parseInt(document.getElementById('jumlah').value);
        const waktu = new Date().toLocaleString();

        const tbody = document.querySelector('#tabelPesanan tbody');
        const idUnik = waktu.replace(/\D/g,'') + Math.floor(Math.random() * 1000);
        const row = `<tr>
            <td>${waktu}</td>
            <td>${nama}</td>
            <td>${jenis}</td>
            <td>${warna}</td>
            <td>${ukuran}</td>
            <td>${jumlah}</td>
            <td id="status-${idUnik}" style="color: #e67e22; font-size:12px; font-weight:bold;">Loading..</td>
        </tr>`;
        tbody.insertAdjacentHTML('afterbegin', row);

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
                if(result.status === "success") {
                    document.getElementById(`status-${idUnik}`).innerText = "✅ OK";
                    document.getElementById(`status-${idUnik}`).style.color = "green";
                    loadData(); 
                } else {
                    throw new Error("Gagal tersimpan di Sheet.");
                }
            })
            .catch(error => {
                document.getElementById(`status-${idUnik}`).innerText = "⚠️ Gagal";
                document.getElementById(`status-${idUnik}`).style.color = "red";
            });

        const notif = document.getElementById('notifInput');
        notif.style.display = 'block';
        setTimeout(() => notif.style.display = 'none', 3000);
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
