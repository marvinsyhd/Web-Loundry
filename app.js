// ==========================
// DATA
// ==========================
let orders = JSON.parse(localStorage.getItem("orders")) || [];
let chartInstance = null;

// ==========================
// RENDER UI
// ==========================
function render() {
  const grid = document.getElementById("grid");
  if (!grid) return;

  grid.innerHTML = "";

  orders.forEach((o, i) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${o.nama}</h3>
      <small>${o.layanan} • ${o.berat} kg</small><br>
      <small>${o.tanggal} • ${o.waktu} • ${o.pembayaran}</small>

      <div class="price">
        Rp ${Number(o.total).toLocaleString("id-ID")}
      </div>

      <div class="badge ${o.status === "Proses" ? "proses" : "selesai"}">
        ${o.status}
      </div>

      <div class="actions">
        <button onclick="toggleStatus(${i})">Status</button>
        <button onclick="cetakStruk(${i})">Struk</button>
        <button onclick="hapus(${i})">Hapus</button>
      </div>
    `;

    grid.appendChild(card);
  });

  updateDashboard();
  localStorage.setItem("orders", JSON.stringify(orders));
}

// ==========================
// TAMBAH ORDER
// ==========================
function tambahOrder() {
  const namaEl = document.getElementById("nama");
  const beratEl = document.getElementById("berat");
  const layananEl = document.getElementById("layanan");
  const pembayaranEl = document.getElementById("pembayaran");

  if (!namaEl || !beratEl || !layananEl || !pembayaranEl) return;

  const nama = namaEl.value.trim();
  const berat = Number(beratEl.value);
  const harga = Number(layananEl.value);
  const layanan = layananEl.options[layananEl.selectedIndex].text;
  const pembayaran = pembayaranEl.value;

  if (!nama || berat <= 0) return;

  const now = new Date();
  const tanggal = now.toLocaleDateString("id-ID");
  const waktu = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  orders.push({
    nama,
    berat,
    layanan,
    total: berat * harga,
    status: "Proses",
    tanggal,
    waktu,
    pembayaran
  });

  namaEl.value = "";
  beratEl.value = "";

  render();
}

// ==========================
// STATUS
// ==========================
function toggleStatus(i) {
  orders[i].status = orders[i].status === "Proses" ? "Selesai" : "Proses";
  render();
}

// ==========================
// HAPUS
// ==========================
function hapus(i) {
  orders.splice(i, 1);
  render();
}

// ==========================
// DASHBOARD STATISTIK
// ==========================
function updateDashboard() {
  const statOrder = document.getElementById("statOrder");
  const statProses = document.getElementById("statProses");
  const statSelesai = document.getElementById("statSelesai");
  const statPendapatan = document.getElementById("statPendapatan");

  if (!statOrder || !statProses || !statSelesai || !statPendapatan) return;

  const totalOrder = orders.length;
  const proses = orders.filter(o => o.status === "Proses").length;
  const selesai = orders.filter(o => o.status === "Selesai").length;
  const pendapatan = orders
    .filter(o => o.status === "Selesai")
    .reduce((sum, o) => sum + Number(o.total), 0);

  statOrder.innerText = totalOrder;
  statProses.innerText = proses;
  statSelesai.innerText = selesai;
  statPendapatan.innerText = "Rp " + pendapatan.toLocaleString("id-ID");
}

// ==========================
// CETAK STRUK
// ==========================
function cetakStruk(i) {
  const o = orders[i];

  const win = window.open("", "", "width=300,height=400");
  if (!win) {
    alert("Popup diblokir browser.");
    return;
  }

  win.document.write(`
    <html>
    <head>
      <title>Struk Laundry</title>
      <style>
        body { font-family: Arial; font-size: 12px; }
        h3 { text-align: center; margin: 0; }
        hr { border: 1px dashed #000; }
      </style>
    </head>
    <body>
      <h3>LaundryShop</h3>
      <hr>
      Nama: ${o.nama}<br>
      Layanan: ${o.layanan}<br>
      Berat: ${o.berat} kg<br>
      Pembayaran: ${o.pembayaran}<br>
      Tanggal: ${o.tanggal}<br>
      Waktu: ${o.waktu}<br>
      Status: ${o.status}<br>
      <hr>
      <strong>Total: Rp ${Number(o.total).toLocaleString("id-ID")}</strong>
      <hr>
      <p style="text-align:center">Terima kasih</p>
    </body>
    </html>
  `);

  win.document.close();
  win.print();
}

// ==========================
// GRAFIK LINE CHART + ARROW
// ==========================
function renderChart() {
  const ctx = document.getElementById("pendapatanChart");
  if (!ctx) return;

  // destroy chart lama
  if (chartInstance) chartInstance.destroy();

  const daily = {};
  orders.forEach(o => {
    if (o.status === "Selesai") {
      daily[o.tanggal] = (daily[o.tanggal] || 0) + Number(o.total);
    }
  });

  const labels = Object.keys(daily);
  const data = Object.values(daily);

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Pendapatan Harian',
        data,
        fill: false,
        borderColor: '#ee4d2d',
        tension: 0.2,
        pointBackgroundColor: '#ee4d2d',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    },
    plugins: [{
      id: 'arrowEnd',
      afterDatasetDraw(chart) {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset, i) => {
          const meta = chart.getDatasetMeta(i);
          const lastPoint = meta.data[meta.data.length - 1];
          if (!lastPoint) return;

          ctx.save();
          ctx.fillStyle = dataset.borderColor;
          ctx.beginPath();

          const x = lastPoint.x;
          const y = lastPoint.y;

          // panah naik atau turun
          let prevY = meta.data.length > 1 ? meta.data[meta.data.length - 2].y : y + 10;
          if (y < prevY) { // naik
            ctx.moveTo(x - 5, y + 7);
            ctx.lineTo(x + 5, y + 7);
            ctx.lineTo(x, y - 5);
          } else { // turun
            ctx.moveTo(x - 5, y - 7);
            ctx.lineTo(x + 5, y - 7);
            ctx.lineTo(x, y + 5);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      }
    }]
  });
}

// ==========================
// DARK MODE
// ==========================
function toggleDark() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

// load dark mode saat halaman dibuka
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
}

// ==========================
// LOGOUT
// ==========================
function logout() {
  localStorage.removeItem("isLogin");
  window.location.href = "index.html";
}

// ==========================
// SECTION SWITCHING
// ==========================
function showSection(section) {
  document.getElementById("dashboardSection").style.display = "none";
  document.getElementById("orderSection").style.display = "none";
  document.getElementById("laporanSection").style.display = "none";

  if (section === "dashboard") document.getElementById("dashboardSection").style.display = "block";
  if (section === "order") document.getElementById("orderSection").style.display = "block";
  if (section === "laporan") {
    document.getElementById("laporanSection").style.display = "block";
    renderChart(); // chart hanya di laporan
  }
}

function toggleMenu() {
  const nav = document.getElementById("sidebarNav");
  nav.classList.toggle("show");
}
render();