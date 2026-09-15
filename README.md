# SICLUS Frontend 🚍

**SICLUS (Sistem Informasi Catatan Layanan & Operasional Bus Sekolah)** adalah aplikasi web modern berbasis **React** dan **Vite** yang dirancang untuk mendigitalkan pelaporan operasional pengemudi (driver) bus sekolah serta memberikan dashboard monitoring, penjadwalan armada, dan rekapitulasi kinerja terperinci bagi Administrator Dinas Perhubungan.

---

## 🚀 Fitur Utama

### 👨‍💼 Panel Admin
- **Beranda & Statistik Real-time**: Monitoring trip harian, keterlambatan, konsumsi BBM, dan performa armada.
- **Kelola Driver & Akun**: Manajemen master akun driver dengan sistem CRUD terintegrasi.
- **Penugasan & Jadwal Armada**: Pengaturan jadwal rute trayek, penugasan supir, kapasitas bus, dan toleransi jam cut-off operasional (Sesi Pagi & Siang).
- **Rekapitulasi Kinerja & Export**: Filter rentang tanggal fleksibel (presets & kalender kustom), rincian bukti checkpoint per sesi, dan ekspor data ke format **Excel (.xlsx)** standar Dishub.

### 🚌 Portal Driver (Mobile-First)
- **Alur Pelaporan Operasional**: Checkpoint CP1 (Keluar Garasi), CP2 (Sekolah), dan CP3 (Kembali ke Garasi).
- **Inspeksi Kelayakan Armada**: Formulir inspeksi pra-perjalanan dengan validasi foto selfie / speedometer.
- **Riwayat Perjalanan**: Log lengkap ritase yang telah diselesaikan beserta detail odometer.

---

## 📂 Struktur Direktori (Modular Clean Architecture)

Frontend ini telah direfaktor menggunakan prinsip **Clean Code & Feature-Based Modularity**:

```text
siclus-frontend/
├── public/                  # Asset publik statis
├── src/
│   ├── assets/              # Gambar & logo aplikasi
│   ├── components/
│   │   ├── common/          # Komponen reusable global (TimePickerInput, DeleteConfirmModal, dll.)
│   │   └── layout/          # Layout template (AppLayout, BottomNav)
│   ├── pages/
│   │   ├── admin/           # Halaman & fitur zona Admin
│   │   │   ├── BerandaAdmin.jsx
│   │   │   ├── ProfilAdmin.jsx
│   │   │   ├── ManageDriver.jsx
│   │   │   ├── manage-driver/    # Sub-komponen modular kelola supir & penugasan
│   │   │   │   └── components/
│   │   │   ├── RekapDriver.jsx
│   │   │   └── rekap-driver/     # Sub-komponen modular rekapitulasi & ekspor
│   │   │       ├── components/
│   │   │       └── utils/
│   │   ├── auth/            # Halaman otentikasi (Login)
│   │   └── driver/          # Halaman & fitur zona Driver
│   │       ├── BerandaDriver.jsx
│   │       ├── LaporanDriver.jsx
│   │       ├── DetailLaporan.jsx
│   │       ├── ProfilDriver.jsx
│   │       └── RiwayatDriver.jsx
│   ├── services/            # Komunikasi API Backend (Axios Client)
│   │   └── api.js
│   ├── utils/               # Fungsi bantuan murni (dateUtils, exportExcel)
│   ├── App.jsx              # Routing & proteksi hak akses (RBAC)
│   └── main.jsx             # Entry point React
├── .env.example             # Contoh konfigurasi environment
├── package.json
└── vite.config.js
```

---

## 🛠️ Panduan Memulai (Getting Started)

### 1. Prasyarat
- Node.js versi 18.x atau yang lebih baru
- npm, yarn, atau pnpm

### 2. Instalasi
```bash
# Clone repository
git clone https://github.com/cevinnandika/siclus-frontend.git
cd siclus-frontend

# Install dependencies
npm install
```

### 3. Konfigurasi Environment
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan `VITE_API_BASE_URL` mengarah ke server backend Anda (default: `http://localhost:8000/api`).

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Aplikasi akan aktif di `http://localhost:5173`.

### 5. Build untuk Produksi
```bash
npm run build
```
Hasil build siap *deploy* akan berada di folder `dist/`.
