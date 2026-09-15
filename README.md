# 🚌 SICLUS (Sistem Informasi Checklist & Laporan Operasional Supir)

![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.x-38B2AC?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**SICLUS Frontend** adalah aplikasi web modern berbasis React dan Tailwind CSS yang dirancang untuk mengelola inspeksi armada, penugasan driver, dan pelaporan operasional harian secara real-time.

---

## 🌟 Fitur Utama

### 👨‍💼 Panel Admin
- 📊 **Dashboard Real-Time**: Pemantauan status armada, driver aktif, dan statistik harian dengan polling otomatis.
- 👨‍✈️ **Kelola Driver & Penugasan**:
  - Registrasi & manajemen data supir.
  - Penugasan armada harian (Nopol, Jenis Kendaraan, Kapasitas, Trayek).
  - **God Mode Cut-off**: Konfigurasi fleksibel batas waktu pengisian formulir, batas keluar garasi, dan batas kembali.
- 📋 **Rekapitulasi Laporan Driver**:
  - Filter rentang tanggal & status laporan.
  - Modal preview foto selfie & inspeksi armada (Lightbox Modal).
  - Ekspor laporan operasional ke format **Excel (.xlsx)**.
- 👤 **Profil Admin**: Pengaturan foto profil dan detail akun.

### 🚍 Panel Driver
- 📱 **Beranda Operasional**: Informasi penugasan sesi Pagi & Siang, status perjalanan, dan countdown jam *cut-off*.
- 📝 **Form Inspeksi & Checklist**:
  - Checking kondisi fisik kendaraan & peralatan keselamatan.
  - Upload foto selfie saat memulai tugas (dengan kompresi foto otomatis di browser).
  - Input Odometer awal & BBM.
- 📍 **Tracking Checkpoints (CP)**:
  - **CP 1**: Keluar Garasi / Start Sesi.
  - **CP 2**: Tiba di Titik Destination.
  - **CP 3**: Selesai & Kembali ke Garasi.
- 📚 **Riwayat & Profil Driver**: Akses riwayat laporan terdahulu dan manajemen foto profil.

---

## 🛠️ Teknologi & Stack

- **Core Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/) (dilengkapi Request/Response Interceptor, Token Auth, & Auto-Logout 401)
- **Notifikasi**: [React Hot Toast](https://react-hot-toast.com/)
- **Export Data**: [XLSX](https://github.com/SheetJS/sheetjs)
- **Pengolahan Gambar**: [Browser Image Compression](https://github.com/Donaldcwl/browser-image-compression)
- **Linter**: [Oxlint](https://oxc-project.github.org/)

---

## 🚀 Panduan Instalasi & Penggunaan

### 1. Prasyarat
Pastikan komputer Anda sudah terinstal:
- [Node.js](https://nodejs.org/) (Versi 18+ direkomendasikan)
- [npm](https://www.npmjs.com/) atau `yarn` / `pnpm`

### 2. Clone Repository
```bash
git clone https://github.com/cevinnandika/siclus-frontend.git
cd siclus-frontend
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment Variable
Buat file `.env` di direktori utama proyek (atau salin dari `.env.example`):
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 5. Jalankan Mode Pengembangan (Dev Server)
```bash
npm run dev
```
Buka peramban di `http://localhost:5173`.

### 6. Build Produksi
```bash
npm run build
```
Hasil build akan tersimpan pada folder `dist/`.

---

## 📁 Struktur Direktori

```text
c:/Users/Cevin Nur Andika/PROJECT-SICLUS/
├── src/
│   ├── assets/             # Asset statis (gambar, font, logo)
│   ├── components/
│   │   ├── common/         # Komponen umum (Modal Hapus, TimePicker, dll)
│   │   └── layout/         # AppLayout, BottomNav (Sidebar & Navigation)
│   ├── pages/
│   │   ├── admin/          # Halaman khusus Admin (Dashboard, ManageDriver, RekapDriver, Profil)
│   │   ├── auth/           # Halaman Login
│   │   └── driver/         # Halaman khusus Driver (Beranda, Laporan, Riwayat, Profil)
│   ├── services/           # Service API Axios & Interceptors (`api.js`)
│   ├── utils/              # Helper fungsi (dateUtils, exportExcel, dll)
│   ├── App.jsx             # Routing utama & State terpusat
│   ├── main.jsx            # Entry point aplikasi
│   └── index.css           # Styling global & Tailwind CSS imports
├── .env.example
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔗 Integrasi Backend

Aplikasi ini sudah terintegrasi secara penuh dengan REST API backend (FastAPI / Express):
- **Base URL Default**: `http://localhost:8000/api`
- **Autentikasi**: Bearer Token JWT disimpan di `localStorage` (`siclus_token`).
- **Endpoint Utama**:
  - `/api/auth/login`
  - `/api/driver/*`
  - `/api/laporan/*`
  - `/api/admin/*`

---

## 📄 Lisensi

Distributed under the MIT License. See `LICENSE` for more information.
