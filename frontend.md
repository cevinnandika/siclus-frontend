# Dokumentasi Source Code Frontend SICLUS

Total file: 21

## Daftar File
- [src/App.jsx](#srcappjsx)
- [src/components/icons/Icon.jsx](#srccomponentsiconsiconjsx)
- [src/components/layout/AppLayout.jsx](#srccomponentslayoutapplayoutjsx)
- [src/components/layout/BottomNav.jsx](#srccomponentslayoutbottomnavjsx)
- [src/components/ui/InspectionToggle.jsx](#srccomponentsuiinspectiontogglejsx)
- [src/index.css](#srcindexcss)
- [src/main.jsx](#srcmainjsx)
- [src/pages/admin/BerandaAdmin.jsx](#srcpagesadminberandaadminjsx)
- [src/pages/admin/ManageDriver.jsx](#srcpagesadminmanagedriverjsx)
- [src/pages/admin/ProfilAdmin.jsx](#srcpagesadminprofiladminjsx)
- [src/pages/admin/RegisterDriver.jsx](#srcpagesadminregisterdriverjsx)
- [src/pages/admin/RekapDriver.jsx](#srcpagesadminrekapdriverjsx)
- [src/pages/admin/RiwayatAdmin.jsx](#srcpagesadminriwayatadminjsx)
- [src/pages/auth/Login.jsx](#srcpagesauthloginjsx)
- [src/pages/beranda/RingkasanHarian.jsx](#srcpagesberandaringkasanharianjsx)
- [src/pages/driver/BerandaDriver.jsx](#srcpagesdriverberandadriverjsx)
- [src/pages/driver/DetailLaporan.jsx](#srcpagesdriverdetaillaporanjsx)
- [src/pages/driver/LaporanDriver.jsx](#srcpagesdriverlaporandriverjsx)
- [src/pages/driver/ProfilDriver.jsx](#srcpagesdriverprofildriverjsx)
- [src/pages/driver/RiwayatDriver.jsx](#srcpagesdriverriwayatdriverjsx)
- [src/services/api.js](#srcservicesapijs)

---

### src/App.jsx

jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { apiService } from "./services/api";

// Layouts
import AppLayout from "./components/layout/AppLayout";
import BottomNav from "./components/layout/BottomNav";

// Pages - Auth
import Login from "./pages/auth/Login";

// Pages - Admin
import BerandaAdmin from "./pages/admin/BerandaAdmin";
import RiwayatAdmin from "./pages/admin/RiwayatAdmin";
import ManageDriver from "./pages/admin/ManageDriver";
import RekapAdmin from "./pages/admin/RekapDriver";
import ProfilAdmin from "./pages/admin/ProfilAdmin";

// Pages - Driver
import Beranda from "./pages/driver/BerandaDriver";
import Laporan from "./pages/driver/LaporanDriver";
import RiwayatDriver from "./pages/driver/RiwayatDriver";
import DetailLaporan from "./pages/driver/DetailLaporan";
import ProfilDriver from "./pages/driver/ProfilDriver";

// (PROTECTED ROUTE)
const isRoleMatch = (userRole, allowedRole) => {
  if (!userRole) return false;
  const u = userRole.toLowerCase();
  const a = allowedRole.toLowerCase();
  if (a === "driver") return u === "driver" || u === "pengemudi";
  return u === a;
};

const ProtectedRoute = ({ user, allowedRole, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!isRoleMatch(user.role, allowedRole)) {
    const isAdmin = (user.role || "").toLowerCase() === "admin";
    return <Navigate to={isAdmin ? "/admin/dashboard" : "/driver/beranda"} replace />;
  }
  return children;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [tripStatus, setTripStatus] = useState("belum_mulai");
  const [driverReports, setDriverReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [currentShift, setCurrentShift] = useState(() => localStorage.getItem("siclus_shift") || "pagi");
  const [isLaporanLocked, setIsLaporanLocked] = useState(() => localStorage.getItem("siclus_locked") === "true");
  const [shiftRules, setShiftRules] = useState({ pagi: 5, siang: 12 });

  useEffect(() => {
    localStorage.setItem("siclus_shift", currentShift);
    localStorage.setItem("siclus_locked", isLaporanLocked);
  }, [currentShift, isLaporanLocked]);

  useEffect(() => {
    const token = localStorage.getItem("siclus_token");
    const savedUser = localStorage.getItem("siclus_user");

    if (token && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      if (parsedUser?.role?.toLowerCase() !== "admin") {
        apiService
          .getJadwalDriver()
          .then((resJadwal) => {
            if (resJadwal && resJadwal.data) {
              const jadwalPagi = resJadwal.data.find((j) => j.tipe_sesi === "PAGI");
              const jadwalSiang = resJadwal.data.find((j) => j.tipe_sesi === "SIANG");
              setShiftRules({
                pagi: jadwalPagi ? parseInt(jadwalPagi.batas_keluar_dishub.split(":")[0]) : 5,
                siang: jadwalSiang ? parseInt(jadwalSiang.batas_keluar_dishub.split(":")[0]) : 12,
              });
            }
          })
          .catch((err) => console.error("Gagal refresh jadwal:", err));
      }
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = async (userInfo) => {
    setUser(userInfo);
    localStorage.setItem("siclus_user", JSON.stringify(userInfo));
    setTripStatus("belum_mulai");

    if (userInfo?.role?.toLowerCase() !== "admin") {
      try {
        const resJadwal = await apiService.getJadwalDriver();
        if (resJadwal && resJadwal.data) {
          const jadwalPagi = resJadwal.data.find((j) => j.tipe_sesi === "PAGI");
          const jadwalSiang = resJadwal.data.find((j) => j.tipe_sesi === "SIANG");
          setShiftRules({
            pagi: jadwalPagi ? parseInt(jadwalPagi.batas_keluar_dishub.split(":")[0]) : 5,
            siang: jadwalSiang ? parseInt(jadwalSiang.batas_keluar_dishub.split(":")[0]) : 12,
          });
        }
      } catch (err) {
        console.error("Gagal narik jadwal dari server:", err);
      }
      navigate("/driver/beranda");
    } else {
      navigate("/admin/dashboard");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("siclus_token");
    localStorage.removeItem("siclus_user");
    localStorage.removeItem("siclus_shift");
    localStorage.removeItem("siclus_locked");
    localStorage.removeItem("siclus_draft_step");
    localStorage.removeItem("siclus_draft_form");
    localStorage.removeItem("siclus_active_laporan_id");
    setUser(null);
    setTripStatus("belum_mulai");
    navigate("/login");
  };

  const handleMenuClick = (menuId) => {
    const baseRoute = user?.role?.toLowerCase() === "admin" ? "/admin" : "/driver";
    let targetRoute = menuId;
    if (menuId === "riwayatdriver") targetRoute = "dashboard";
    if (menuId === "kelolauser") targetRoute = "kelola";
    navigate(`${baseRoute}/${targetRoute}`);
  };

  const renderLockedScreen = () => {
    // Tampilan khusus jika sudah kelar semua shift hari ini
    if (currentShift === "selesai") {
      return (
        <div className="flex flex-col items-center justify-center p-8 mt-16 text-center space-y-5 animate-[fadeIn_0.3s]">
          <div className="w-24 h-24 bg-[#E6F7ED] text-[#137333] rounded-full flex items-center justify-center border-4 border-[#BCECD2] shadow-sm">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-black text-[#00206B] uppercase m-0">TUGAS SELESAI</h2>
          <div className="bg-white border-2 border-slate-200 w-full max-w-sm p-4 rounded-2xl shadow-sm">
            <p className="text-xs font-bold text-slate-500 mb-1">Anda telah menyelesaikan semua perjalanan hari ini.</p>
            <p className="text-sm font-black text-[#00206B]">Laporan akan dibuka kembali besok pagi.</p>
          </div>
          <button onClick={() => navigate("/driver/beranda")} className="mt-2 w-full max-w-xs bg-[#00206B] text-white py-4 rounded-xl font-extrabold text-sm shadow-md">
            Kembali ke Beranda
          </button>
        </div>
      );
    }

    // Tampilan jeda antara shift Pagi ke Siang (Existing logic)
    const nextShiftName = currentShift === "siang" ? "Siang" : "Pagi (Besok)";
    const nextShiftTime = currentShift === "siang" ? shiftRules.siang : shiftRules.pagi;
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-16 text-center space-y-5 animate-[fadeIn_0.3s]">
        <div className="w-24 h-24 bg-[#FCE8E6] text-[#C5221F] rounded-full flex items-center justify-center border-4 border-[#FAD2CF] shadow-sm">🔒</div>
        <h2 className="text-2xl font-black text-[#00206B] uppercase m-0">Laporan Dikunci</h2>
        <div className="bg-white border-2 border-slate-200 w-full max-w-sm p-4 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Jadwal Pengisian Selanjutnya:</p>
          <p className="text-xl font-black text-[#C5221F]">
            Shift {nextShiftName} - {nextShiftTime}:00 WIB
          </p>
        </div>
        <button onClick={() => navigate("/driver/beranda")} className="mt-2 w-full max-w-xs bg-[#00206B] text-white py-4 rounded-xl font-extrabold text-sm shadow-md">
          Kembali ke Beranda
        </button>
      </div>
    );
  };

  if (isInitializing) return <div className="min-h-screen bg-[#131314] text-white flex items-center justify-center">Memuat Sistem...</div>;

  return (
    <div className="min-h-screen w-full bg-[#131314] font-sans antialiased overflow-hidden">
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <AppLayout user={user} title={"SICLUS"} onBack={location.pathname.includes("detail") ? () => navigate(-1) : null} activeMenu={location.pathname.split("/").pop()} onMenuClick={handleMenuClick}>
          <Routes>
            {/* ZONA KHUSUS DRIVER */}
            <Route path="/" element={<Navigate to={user?.role?.toLowerCase() === "admin" ? "/admin/dashboard" : "/driver/beranda"} replace />} />
            <Route
              path="/driver/*"
              element={
                <ProtectedRoute user={user} allowedRole="driver">
                  <Routes>
                    <Route
                      path="beranda"
                      element={
                        <Beranda
                          activeUser={user}
                          tripStatus={tripStatus}
                          currentShift={currentShift}
                          isLaporanLocked={isLaporanLocked}
                          shiftRules={shiftRules}
                          onLogout={handleLogout}
                          onStartInspection={() => navigate("/driver/laporan")}
                          onStartSiang={() => {
                            setIsLaporanLocked(false);
                            navigate("/driver/laporan");
                          }}
                        />
                      }
                    />
                    <Route
                      path="laporan"
                      element={
                        isLaporanLocked ? (
                          renderLockedScreen()
                        ) : (
                          <Laporan
                            user={user}
                            currentShift={currentShift}
                            onFinishShift={() => {
                              if (currentShift === "pagi") {
                                setCurrentShift("siang");
                                setIsLaporanLocked(true);
                              } else {
                                // Jika shift siang beres, gembok laporan sampai besok!
                                setCurrentShift("selesai");
                                setIsLaporanLocked(true);
                              }
                              setTripStatus("belum_mulai");
                              navigate("/driver/beranda");
                            }}
                          />
                        )
                      }
                    />
                    <Route
                      path="riwayat"
                      element={
                        <RiwayatDriver
                          user={user}
                          driverReports={driverReports}
                          onViewDetail={(report) => {
                            setSelectedReport(report);
                            navigate("/driver/detail-laporan");
                          }}
                        />
                      }
                    />
                    <Route path="detail-laporan" element={<DetailLaporan report={selectedReport} onBack={() => navigate("/driver/riwayat")} />} />
                    <Route path="akun" element={<ProfilDriver user={user} onLogout={handleLogout} onUpdateUser={setUser} />} /> {/* ✅ FIX: Pake ProfilDriver */}
                    <Route path="*" element={<Navigate to="/driver/beranda" replace />} />
                  </Routes>
                </ProtectedRoute>
              }
            />

            {/* ZONA KHUSUS ADMIN */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute user={user} allowedRole="admin">
                  <Routes>
                    <Route path="dashboard" element={<BerandaAdmin user={user} />} />
                    <Route path="riwayat" element={<RiwayatAdmin />} />
                    <Route path="rekap" element={<RekapAdmin user={user} />} />
                    <Route path="kelola" element={<ManageDriver onBack={() => navigate("/admin/dashboard")} />} />
                    <Route path="akun" element={<ProfilAdmin user={user} onLogout={handleLogout} />} />
                    
                    {/* FIX KRUSIAL: Gunakan Absolute Path "/admin/dashboard" BUKAN "dashboard" */}
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              }
            />
          </Routes>
          <BottomNav user={user} />
        </AppLayout>
      )}
    </div>
  );
}

export default App;


---

### src/components/icons/Icon.jsx

jsx


---

### src/components/layout/AppLayout.jsx

jsx
import React, { useState } from 'react';

const AppLayout = ({ children, title = 'SICLUS', onBack = null, activeMenu = 'beranda', onMenuClick = () => {}, user = null }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const adminMenuItems = [
    { id: 'dashboard', label: 'Beranda', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /> },
    { id: 'riwayat', label: 'Riwayat Harian', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { id: 'rekap', label: 'Rekap Data', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
    { id: 'kelola', label: 'Kelola', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
    { id: 'akun', label: 'Akun', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> }
  ];

  const driverMenuItems = [
    { id: 'beranda', label: 'Beranda', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { id: 'laporan', label: 'Laporan', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
    { id: 'riwayat', label: 'Riwayat', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { id: 'akun', label: 'Akun', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> }
  ];

  const menuItems = user?.role?.toLowerCase() === 'admin' ? adminMenuItems : driverMenuItems;

  return (
    <div className="flex h-screen w-full bg-[#131314] font-sans overflow-hidden">
      <aside className={`hidden md:flex flex-col h-full bg-[#131314] text-[#C4C7C5] transition-all duration-300 ease-in-out border-r border-white/5 z-50 ${isSidebarOpen ? 'w-64' : 'w-[72px]'}`}>
        <div className={`flex items-center h-20 ${isSidebarOpen ? 'px-4 justify-between' : 'justify-center'}`}>
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
            <span className="text-xl font-black text-white tracking-widest uppercase">SICLUS</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex-shrink-0 focus:outline-none">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isReportTabActive = item.id === 'laporan' && ['persiapan', 'inspeksi', 'kendala', 'laporan'].includes(activeMenu);
            const isRiwayatTabActive = (item.id === 'riwayat' || item.id === 'riwayatdriver') && ['ringkasan', 'riwayat', 'detaillaporan'].includes(activeMenu);
            const isActive = activeMenu === item.id || isReportTabActive || isRiwayatTabActive;
            return (
              <button key={item.id} onClick={() => onMenuClick(item.id)} className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-[#A8C7FA]/10 text-[#A8C7FA]' : 'hover:bg-white/5 hover:text-white'}`} title={!isSidebarOpen ? item.label : ''}>
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{item.icon}</svg>
                </div>
                <div className={`overflow-hidden transition-all duration-300 flex items-center ${isSidebarOpen ? 'ml-4 opacity-100 w-full' : 'opacity-0 w-0'}`}>
                  <span className="text-sm font-semibold whitespace-nowrap text-left">{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
        {/* BLOK PROFIL SIDEBAR POJOK KIRI BAWAH */}
        <div className="p-3 mb-2 border-t border-slate-800 mt-auto">
          <div onClick={() => onMenuClick('akun')} className="flex items-center p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-colors group" title={!isSidebarOpen ? 'Buka Akun' : ''}>
            {/* RENDER AVATAR AMAN */}
            {user?.foto_profil ? (
              <img 
                src={user.foto_profil} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full object-cover border border-slate-600 bg-white flex-shrink-0" 
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00206B] to-blue-500 text-white flex items-center justify-center font-black text-sm shadow-sm border border-slate-600 flex-shrink-0">
                {/* Pengecekan multi-key untuk nama dari database */}
                {(user?.nama_lengkap || user?.nama || user?.name || "A").charAt(0).toUpperCase()}
              </div>
            )}

            {/* RENDER NAMA AMAN */}
            <div className={`overflow-hidden transition-all duration-300 flex flex-col justify-center ${isSidebarOpen ? 'ml-3 w-full opacity-100' : 'w-0 opacity-0'}`}>
              <p className="text-sm font-bold text-white truncate w-full group-hover:text-cyan-200 transition-colors m-0">
                {user?.nama_lengkap || user?.nama || user?.name || "Pengguna"}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest truncate w-full mt-0.5 m-0">
                {user?.role || "USER"}
              </p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-screen relative bg-[#F5F7FB] md:rounded-l-[2.5rem] md:my-2 md:mr-2 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300">
        <header className="sticky top-0 z-40 flex items-center justify-between bg-white/80 backdrop-blur-xl px-6 py-4 border-b border-slate-200/50">
          <div className="w-10 flex items-center justify-start">
            {onBack && (
              <button onClick={onBack} className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all duration-200 text-slate-600 active:scale-95 focus:outline-none">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}
          </div>
          <div className="text-center flex-1">
            <span className="text-lg font-black tracking-widest text-[#00206B] block uppercase">{title}</span>
          </div>
          <div className="w-10"></div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-28 md:pb-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;


---

### src/components/layout/BottomNav.jsx

jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNav = ({ user = null }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.split("/").pop(); // Ambil path terakhir

  const adminNavItems = [
    { id: 'dashboard', label: 'Beranda', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg> },
    { id: 'riwayat', label: 'Riwayat', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'rekap', label: 'Rekap', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: 'kelola', label: 'Kelola', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { id: 'akun', label: 'Akun', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> }
  ];

  const driverNavItems = [
    { id: 'beranda', label: 'Beranda', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { id: 'laporan', label: 'Laporan', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
    { id: 'riwayat', label: 'Riwayat', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'akun', label: 'Akun', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> }
  ];

  const navItems = user?.role?.toLowerCase() === 'admin' ? adminNavItems : driverNavItems;
  const baseRoute = user?.role?.toLowerCase() === 'admin' ? '/admin' : '/driver';

  const handleNavClick = (menuId) => {
    navigate(`${baseRoute}/${menuId}`);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-lg pb-safe">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          // Cek apakah item aktif berdasarkan path URL saat ini
          const isReportTabActive = item.id === 'laporan' && currentPath === 'laporan';
          const isRiwayatTabActive = item.id === 'riwayat' && (currentPath === 'riwayat' || currentPath === 'detail-laporan');
          const isActive = currentPath === item.id || isReportTabActive || isRiwayatTabActive;

          return (
            <button 
              key={item.id} 
              onClick={() => handleNavClick(item.id)} 
              className={`flex flex-col items-center justify-center flex-1 py-2.5 rounded-2xl transition-all duration-200 ${isActive ? 'bg-[#66FFAA]/40 text-[#006633] shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              <div className={`mb-1 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[11px] font-bold whitespace-nowrap ${isActive ? 'font-extrabold' : 'font-medium'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;


---

### src/components/ui/InspectionToggle.jsx

jsx
import React from 'react';

const InspectionToggle = ({ label, isChecked, onChange }) => {
  return (
    <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl cursor-pointer transition-all duration-200 select-none group">
      <span className="text-xs font-bold text-slate-700 group-hover:text-[#00206B] transition-colors duration-150">
        {label}
      </span>
      <div className="relative">
        <input 
          type="checkbox" 
          checked={isChecked} 
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        {/* Track */}
        <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${isChecked ? 'bg-[#34A853]' : 'bg-slate-300'}`}></div>
        {/* Thumb */}
        <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow transition-transform duration-200 ${isChecked ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </div>
    </label>
  );
};

export default InspectionToggle;


---

### src/index.css

css
@import "tailwindcss";

:root {
  --font-sans: 'Poppins', sans-serif;
}

body {
  font-family: var(--font-sans);
  background-color: #f1f5f9;
}

/* Hide scrollbar untuk horizontal scroll */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}


---

### src/main.jsx

jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' 
import './index.css'
import App from './App.jsx'

// Import Font
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)


---

### src/pages/admin/BerandaAdmin.jsx

jsx
import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";

const BerandaAdmin = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({
    total_supir_terdaftar: 0,
    total_supir_jalan: 0,
    total_supir_telat: 0,
  });
  const [riwayatHarian, setRiwayatHarian] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchData = async (showRefreshPulse = false) => {
    if (showRefreshPulse) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // 1. Fetch Dashboard Stats
      const resDashboard = await apiService.getDashboardAdmin();
      if (resDashboard) {
        // Support response structure either { data: {...} } or direct {...}
        const data = resDashboard.data || resDashboard;
        setDashboardData({
          total_supir_terdaftar: data.total_supir_terdaftar ?? data.total_driver ?? data.total_supir ?? data.total_pengemudi ?? 0,
          total_supir_jalan: data.total_supir_jalan ?? data.jalan_hari_ini ?? data.supir_aktif ?? 0,
          total_supir_telat: data.total_supir_telat ?? data.telat_hari_ini ?? data.supir_telat ?? 0,
        });
      }

      // 2. Fetch Daily Sessions for Discipline Alerts
      const resHarian = await apiService.getRiwayatHarianAdmin();
      if (resHarian) {
        const rawList = resHarian.data || (Array.isArray(resHarian) ? resHarian : []);
        const flattened = [];
        rawList.forEach((group) => {
          (group.laporan || []).forEach((lap) => {
            const sessions = lap.trip_sessions || [];
            if (sessions.length > 0) {
              sessions.forEach((sesi) => {
                flattened.push({
                  id: sesi.id || lap.id,
                  tanggal: group.tanggal || lap.tanggal,
                  id_supir: lap.id_supir,
                  nama_supir: lap.users?.nama || lap.nama_supir || lap.id_supir,
                  trayek: lap.trayek || "-",
                  bus: lap.bus || "-",
                  tipe_sesi: sesi.tipe_sesi || "PAGI",
                  status_kedisiplinan: sesi.status_waktu || "TEPAT WAKTU",
                  status: sesi.status_waktu,
                  jam_berangkat_kantor: sesi.jam_berangkat_kantor,
                  jam_berangkat_start: sesi.jam_berangkat_start,
                  jam_tiba_finish: sesi.jam_tiba_finish,
                  jam_tiba_kantor: sesi.jam_tiba_kantor,
                });
              });
            } else {
              flattened.push({
                id: lap.id,
                tanggal: group.tanggal || lap.tanggal,
                id_supir: lap.id_supir,
                nama_supir: lap.users?.nama || lap.nama_supir || lap.id_supir,
                trayek: lap.trayek || "-",
                bus: lap.bus || "-",
                tipe_sesi: "PAGI",
                status_operasional: "BELUM_JALAN",
                status: "belum_mulai",
              });
            }
          });
        });
        setRiwayatHarian(flattened);
      }
    } catch (error) {
      console.error("Gagal mengambil data dashboard admin:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter driver yang terdeteksi TERLAMBAT atau BELUM MEMULAI SESI
  const lateOrNotStartedList = riwayatHarian.filter((item) => {
    const isLate =
      item.status_kedisiplinan === "TERLAMBAT" ||
      item.is_late === true ||
      item.terlambat === true ||
      item.status?.toUpperCase() === "TERLAMBAT" ||
      item.cp1_late === true ||
      item.cp2_late === true;

    const notStarted =
      item.status === "belum_mulai" ||
      item.status === "BELUM_MULAI" ||
      item.status_operasional === "BELUM_JALAN" ||
      (!item.jam_berangkat_kantor && !item.cp1_time);

    return isLate || notStarted;
  });

  // Jika daftar dari API memiliki field kedisiplinan umum, pisahkan list peringatan
  const displayAlerts = lateOrNotStartedList.length > 0 ? lateOrNotStartedList : riwayatHarian;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-6 animate-[fadeIn_0.3s]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-[#00206B] m-0 tracking-wide uppercase">
            Selamat Datang, Administrator ({user?.nama_lengkap || user?.nama || user?.name || "Admin"})
          </h2>
          <p className="text-sm text-slate-500 font-semibold">{currentDate} • Pusat Kontrol Operasional SICLUS</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={isLoading || isRefreshing}
          className="self-start sm:self-auto flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-[#00206B] px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRefreshing ? "Memperbarui..." : "Segarkan Data"}
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Supir */}
        <div className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">TOTAL SUPIR</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#00206B]">
                {isLoading ? "..." : dashboardData.total_supir_terdaftar}
              </span>
              <span className="text-xs font-bold text-slate-400">Driver</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500">Terdaftar di sistem master data</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#00206B] flex-shrink-0 text-2xl shadow-inner">
            🚌
          </div>
        </div>

        {/* Card 2: Jalan Hari Ini */}
        <div className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider block">JALAN HARI INI</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700">
                {isLoading ? "..." : dashboardData.total_supir_jalan}
              </span>
              <span className="text-xs font-bold text-emerald-600">Armada Aktif</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600/80">Driver sedang bertugas</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 text-2xl shadow-inner">
            🟢
          </div>
        </div>

        {/* Card 3: Telat Hari Ini */}
        <div className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-black text-rose-600 uppercase tracking-wider block">TELAT HARI INI</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-700">
                {isLoading ? "..." : dashboardData.total_supir_telat}
              </span>
              <span className="text-xs font-bold text-rose-600">Insiden Telat</span>
            </div>
            <p className="text-[11px] font-semibold text-rose-600/80">Melewati toleransi jam cut-off</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0 text-2xl shadow-inner">
            🔴
          </div>
        </div>
      </div>

      {/* Peringatan Kedisiplinan Terkini */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-black text-base">
              ⚠️
            </div>
            <div>
              <h3 className="text-lg font-black text-[#00206B] m-0 tracking-wide uppercase">
                Peringatan Kedisiplinan Terkini
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Pemantauan toleransi waktu CP1 & CP2 driver hari ini
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
            {displayAlerts.length} Data Terpantau
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-[#00206B] font-bold animate-pulse">
            Memuat Data Kedisiplinan Terkini... ⏳
          </div>
        ) : displayAlerts.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-black">
              ✓
            </div>
            <h4 className="text-base font-extrabold text-emerald-800 m-0">Semua Driver Disiplin & Tepat Waktu</h4>
            <p className="text-xs text-emerald-600 font-semibold max-w-md mx-auto">
              Tidak ada driver yang terdeteksi terlambat pada CP1/CP2 untuk jadwal hari ini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAlerts.map((item, index) => {
              const driverName = item.nama_supir || item.nama || item.driver_name || item.id_supir || `Driver #${index + 1}`;
              const trayek = item.trayek || item.nama_trayek || "-";
              const bus = item.bus || item.armada || item.nopol || "-";
              const sesi = item.tipe_sesi || item.sesi || "PAGI";
              
              const isLate =
                item.status_kedisiplinan === "TERLAMBAT" ||
                item.is_late === true ||
                item.terlambat === true ||
                item.status?.toUpperCase() === "TERLAMBAT" ||
                item.cp1_late ||
                item.cp2_late;

              const notStarted =
                item.status === "belum_mulai" ||
                item.status === "BELUM_MULAI" ||
                item.status_operasional === "BELUM_JALAN" ||
                (!item.jam_berangkat_kantor && !item.cp1_time);

              return (
                <div
                  key={item.id || index}
                  className={`border rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isLate
                      ? "bg-rose-50/50 border-rose-200 hover:border-rose-300"
                      : notStarted
                      ? "bg-amber-50/40 border-amber-200 hover:border-amber-300"
                      : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm ${
                        isLate
                          ? "bg-gradient-to-br from-rose-600 to-red-700"
                          : notStarted
                          ? "bg-gradient-to-br from-amber-500 to-orange-600"
                          : "bg-gradient-to-br from-slate-700 to-[#00206B]"
                      }`}
                    >
                      {driverName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-[#00206B] m-0">{driverName}</h4>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          Sesi {sesi}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Trayek {trayek} • {bus}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {isLate ? (
                      <div className="text-left sm:text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                          TERLAMBAT
                        </span>
                        <p className="text-[11px] font-bold text-rose-600 mt-1">
                          {item.keterangan || item.alasan_telat || "Melewati toleransi batas waktu CP"}
                        </p>
                      </div>
                    ) : notStarted ? (
                      <div className="text-left sm:text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                          ⏳ BELUM JALAN
                        </span>
                        <p className="text-[11px] font-bold text-amber-700 mt-1">
                          Belum memulai checklist inspeksi
                        </p>
                      </div>
                    ) : (
                      <div className="text-left sm:text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                          ✓ TEPAT WAKTU
                        </span>
                        <p className="text-[11px] font-bold text-emerald-700 mt-1">
                          Sesuai toleransi jadwal
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BerandaAdmin;


---

### src/pages/admin/ManageDriver.jsx

jsx
import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";

const ManageDriver = ({ onBack }) => {
  // PENTING: Jika sebelumnya menggunakan nama state selain 'activeTab' (misal: 'tab'),  
  // sesuaikan nama variabel di bawah ini dengan UI Tab yang sudah ada. 
  const [activeTab, setActiveTab] = useState('supir');  
  const [drivers, setDrivers] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [isLoadingJadwals, setIsLoadingJadwals] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STATE JADWAL CUT-OFF (SESUAI INSTRUKSI) ---
  const [showJadwalModal, setShowJadwalModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editJadwalId, setEditJadwalId] = useState(null);
  const [jadwalList, setJadwalList] = useState([]);
  const jadwals = jadwalList;
  const setJadwals = setJadwalList;

  // Alerts / Notifications
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    const msgStr = typeof message === "string" ? message : JSON.stringify(message);
    setToast({ show: true, message: msgStr, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  // --- MODAL STATES: SUPIR ---
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const initialUserForm = {
    id: "",
    nama: "",
    name: "",
    email: "",
    password: "",
    role: "driver",
    trayek: "",
    bus: "",
  };
  const [userForm, setUserForm] = useState(initialUserForm);

  // --- FORM STATE: JADWAL ---
  const initialJadwalForm = {
    trayek: "",
    tipe_sesi: "PAGI",
    batas_keluar_dishub: "",
    batas_tiba_start: "",
  };
  const [formJadwal, setFormJadwal] = useState({
    trayek: "",
    tipe_sesi: "PAGI",
    batas_keluar_dishub: "",
    batas_tiba_start: "",
  });

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getUsersAdmin();
      console.log("CEK DATA MENTAH DARI SERVER:", res); // Alat interogasi

      let dataSupir = [];

      // Ekstraksi data super agresif (menangani berbagai bentuk JSON dari Backend)
      if (Array.isArray(res)) {
        dataSupir = res;
      } else if (res && Array.isArray(res.data)) {
        dataSupir = res.data;
      } else if (res && res.users && Array.isArray(res.users)) {
        dataSupir = res.users;
      }

      console.log("DATA YANG BERHASIL DIEKSTRAK:", dataSupir);
      setDrivers(dataSupir);

      if (dataSupir.length === 0) {
        console.warn("Server merespons sukses, tapi data supir kosong dari database.");
      }
    } catch (error) {
      console.error("Gagal menarik data driver:", error);
      setDrivers([]);
      const errMsg = error.response?.data?.detail || error.message || "Gagal menarik data driver";
      showToast(typeof errMsg === "string" ? errMsg : "Gagal menarik data driver", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []); 

  const fetchJadwals = async () => {
    setIsLoadingJadwals(true);
    try {
      const res = await apiService.getJadwalAdmin();
      let data = [];
      if (Array.isArray(res)) {
        data = res;
      } else if (res && Array.isArray(res.data)) {
        data = res.data;
      } else if (res && Array.isArray(res.jadwal)) {
        data = res.jadwal;
      } else if (res && Array.isArray(res.items)) {
        data = res.items;
      }
      setJadwalList(data);
    } catch (err) {
      console.error("Gagal mengambil data jadwal:", err);
      setJadwalList([]);
      showToast("Gagal memuat data jadwal cut-off", "error");
    } finally {
      setIsLoadingJadwals(false);
    }
  };

  useEffect(() => {
    fetchJadwals();
  }, []);

  // --- HANDLER USER (TAB 1) ---
  const handleOpenAddUser = () => {
    const randomId = `DRV-${Math.floor(1000 + Math.random() * 9000)}`;
    setUserForm({
      ...initialUserForm,
      id: randomId,
    });
    setShowAddUserModal(true);
  };

  const handleOpenEditUser = (u) => {
    setSelectedUser(u);
    const namaSupir = u.nama_lengkap || u.nama || u.name || "";
    setUserForm({
      id: u.id || u.id_supir || "",
      nama: namaSupir,
      name: namaSupir,
      email: u.email || "",
      password: "", // kosongkan jika tidak ingin ganti password
      role: "driver",
      trayek: u.trayek || "",
      bus: u.bus || u.armada || "",
    });
    setShowEditUserModal(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const generatedId = userForm.id?.trim() || `DRV-${Math.floor(1000 + Math.random() * 9000)}`;
      const namaDriver = userForm.nama || userForm.name || userForm.nama_lengkap || "";

      // Payload MATCH 100% dengan skema Pydantic backend
      const payload = {
        id: generatedId, // WAJIB ADA
        nama_lengkap: namaDriver, // PERHATIKAN: Backend meminta 'nama_lengkap', bukan 'nama'
        email: userForm.email, // WAJIB format email
        password: userForm.password, // WAJIB ADA
        role: "driver",
        trayek: userForm.trayek || null,
        bus: null,
      };

      await apiService.createUserAdmin(payload);
      showToast(`Driver ${payload.nama_lengkap} berhasil ditambahkan!`);
      setShowAddUserModal(false);
      fetchDrivers();
    } catch (err) {
      console.error("Gagal menambahkan user:", err);
      let errorMsg = "Gagal menambahkan driver. Periksa koneksi/data.";
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(", ");
        } else if (typeof err.response.data.detail === "string") {
          errorMsg = err.response.data.detail;
        }
      }
      showToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const namaDriver = userForm.nama || userForm.name || userForm.nama_lengkap || "";
      const payload = {
        id: userForm.id || selectedUser.id || selectedUser.id_supir,
        nama_lengkap: namaDriver,
        email: userForm.email,
        role: "driver",
        trayek: userForm.trayek || null,
        bus: null,
      };
      if (userForm.password && userForm.password.trim() !== "") {
        payload.password = userForm.password;
      }

      const targetId = selectedUser.id || selectedUser._id || selectedUser.id_supir;
      await apiService.updateUserAdmin(targetId, payload);
      showToast(`Data driver ${payload.nama_lengkap} berhasil diperbarui!`);
      setShowEditUserModal(false);
      fetchDrivers();
    } catch (err) {
      console.error("Gagal update user:", err);
      let errorMsg = "Gagal memperbarui driver";
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(", ");
        } else if (typeof err.response.data.detail === "string") {
          errorMsg = err.response.data.detail;
        }
      }
      showToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      const targetId = userToDelete.id || userToDelete._id || userToDelete.id_supir;
      await apiService.deleteUserAdmin(targetId);
      showToast(`Akun driver ${userToDelete.nama_lengkap || userToDelete.nama || userToDelete.name} berhasil dihapus!`);
      setUserToDelete(null);
      fetchDrivers();
    } catch (err) {
      console.error("Gagal hapus user:", err);
      showToast("Gagal menghapus driver", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLER JADWAL (TAB 2) ---
  const handleOpenAddJadwal = () => {
    setIsEditMode(false);
    setEditJadwalId(null);
    setFormJadwal({
      trayek: "",
      tipe_sesi: "PAGI",
      batas_keluar_dishub: "",
      batas_tiba_start: "",
    });
    setShowJadwalModal(true);
  };
  const handleEditClick = (jadwal) => {
    setFormJadwal({
      trayek: jadwal?.trayek || "",
      tipe_sesi: (jadwal?.tipe_sesi || jadwal?.sesi || "PAGI").toUpperCase(),
      batas_keluar_dishub: jadwal?.batas_keluar_dishub || "",
      batas_tiba_start: jadwal?.batas_tiba_start || "",
    });
    setIsEditMode(true);
    setEditJadwalId(jadwal?.id || jadwal?._id);
    setShowJadwalModal(true);
  };
  const handleOpenEditJadwal = handleEditClick;

  const handleSubmitJadwal = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        trayek: (formJadwal?.trayek || "").trim(),
        tipe_sesi: (formJadwal?.tipe_sesi || "PAGI").toUpperCase(),
        batas_keluar_dishub: formJadwal?.batas_keluar_dishub || "",
        batas_tiba_start: formJadwal?.batas_tiba_start || "",
      };

      if (isEditMode) {
        await apiService.updateJadwalAdmin(editJadwalId, payload);
        showToast(`Jadwal cut-off Trayek ${payload.trayek} berhasil diperbarui!`);
      } else {
        await apiService.createJadwalAdmin(payload);
        showToast(`Jadwal cut-off Trayek ${payload.trayek} (${payload.tipe_sesi}) berhasil ditambahkan!`);
      }

      setShowJadwalModal(false);
      setIsEditMode(false);
      setEditJadwalId(null);
      setFormJadwal(initialJadwalForm);
      fetchJadwals();
    } catch (err) {
      console.error("Gagal menyimpan jadwal:", err);
      let errorMsg = isEditMode ? "Gagal memperbarui jadwal cut-off" : "Gagal menambahkan jadwal cut-off";
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(", ");
        } else if (typeof err.response.data.detail === "string") {
          errorMsg = err.response.data.detail;
        }
      }
      showToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-8 animate-[fadeIn_0.3s]">
      {/* Toast Alert */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm border animate-[slideDown_0.2s] ${
            toast.type === "success"
              ? "bg-[#E6F7ED] border-[#BCECD2] text-[#137333]"
              : "bg-[#FCE8E6] border-[#FAD2CF] text-[#C5221F]"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header (Tanpa Tombol Back) */}
      <div className="space-y-1 mb-6">
        <h2 className="text-2xl md:text-3xl font-black text-[#00206B] m-0 tracking-wide uppercase">
          Kelola Pengguna & Jadwal
        </h2>
        <p className="text-sm text-slate-400 font-semibold mt-0.5">
          Manajemen master akun driver dan konfigurasi toleransi waktu cut-off operasional
        </p>
      </div>

      {/* Navigation Tabs (Tab 1: DAFTAR DRIVER | Tab 2: JADWAL CUT-OFF) */}
      <div className="flex items-center gap-2 bg-slate-200/70 p-1.5 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab("supir")}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "supir"
              ? "bg-[#00206B] text-white shadow-md scale-[1.02]"
              : "text-slate-600 hover:text-[#00206B] hover:bg-white/50"
          }`}
        >
          <span>🚌</span>
          <span>Daftar Driver</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-extrabold">
            {(drivers || []).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("jadwal")}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "jadwal"
              ? "bg-[#00206B] text-white shadow-md scale-[1.02]"
              : "text-slate-600 hover:text-[#00206B] hover:bg-white/50"
          }`}
        >
          <span>⏱️</span>
          <span>Jadwal Cut-Off</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-extrabold">
            {(jadwalList || []).length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAFTAR DRIVER                                                     */}
      {/* ========================================================================= */}
      {activeTab === "supir" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
            <div>
              <h3 className="text-base font-black text-[#00206B] m-0 uppercase tracking-wide">
                Master Data Driver
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Kelola kredensial login, penugasan trayek, dan armada bus
              </p>
            </div>
            <button
              onClick={handleOpenAddUser}
              className="bg-[#00206B] hover:bg-[#00174E] text-white font-black py-3.5 px-5 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              + TAMBAH DRIVER BARU
            </button>
          </div>

          {/* TAB 1 CONTENT: DAFTAR DRIVER TABLE */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
            {isLoading ? (
              <div className="text-center py-10 font-bold text-[#00206B] animate-pulse">Memuat data driver...</div>
            ) : (drivers || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50">
                      <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase rounded-tl-xl">Nama Driver</th>
                      <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase">Email Terdaftar</th>
                      <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase text-center">Trayek</th>
                      <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase text-center">Armada</th>
                      <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase text-center rounded-tr-xl">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(drivers || []).map((driver, index) => (
                      <tr key={driver?.id || driver?._id || driver?.id_supir || index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-5 font-black text-[#00206B] uppercase">{driver?.nama_lengkap || driver?.nama || driver?.name || "-"}</td>
                        <td className="py-4 px-5 text-sm font-bold text-slate-500">{driver?.email || "-"}</td>
                        <td className="py-4 px-5 text-center text-sm font-black text-[#00206B] uppercase">{driver?.trayek || "-"}</td>
                        <td className="py-4 px-5 text-center text-sm font-bold text-slate-600 uppercase">{driver?.bus || driver?.armada || "-"}</td>
                        <td className="py-4 px-5 text-center space-x-2">
                          <button
                            onClick={() => handleOpenEditUser(driver)}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setUserToDelete(driver)}
                            className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-2xl">🚌</div>
                 <h3 className="text-lg font-black text-[#00206B]">Belum Ada Data Driver</h3>
                 <p className="text-sm text-slate-400 font-medium mt-1">Klik tombol "+ TAMBAH DRIVER BARU" untuk mendaftarkan akun driver pertama.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: JADWAL CUT-OFF                                                    */}
      {/* ========================================================================= */}
      {activeTab === "jadwal" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
            <div>
              <h3 className="text-base font-black text-[#00206B] m-0 uppercase tracking-wide">
                Konfigurasi Batas Waktu Cut-Off Per Trayek
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Tentukan batas toleransi waktu keberangkatan dari Dishub dan tiba di titik start untuk deteksi keterlambatan otomatis
              </p>
            </div>
            <button
              onClick={() => {
                setIsEditMode(false); // Pastikan bukan dalam mode edit
                setEditJadwalId(null);
                setFormJadwal({ trayek: "", tipe_sesi: "PAGI", batas_keluar_dishub: "", batas_tiba_start: "" }); // Kosongkan form
                setShowJadwalModal(true); // Tampilkan modal
              }}
              className="bg-[#00206B] hover:bg-[#00174E] text-white font-black py-3.5 px-5 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              + TAMBAH JADWAL BARU
            </button>
          </div>

          {/* Tabel Jadwal */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {isLoadingJadwals ? (
              <div className="p-16 text-center text-[#00206B] font-bold animate-pulse">
                Memuat Konfigurasi Jadwal... ⏳
              </div>
            ) : (jadwalList || []).length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto text-2xl">
                  ⏱️
                </div>
                <h4 className="text-base font-extrabold text-slate-700 m-0">Belum Ada Jadwal Dikonfigurasi</h4>
                <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
                  Belum ada data cut-off jadwal operasional di server. Silakan gunakan tombol di atas untuk menambahkan jadwal pertama.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b-2 border-slate-200">
                      <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase tracking-wider">TRAYEK</th>
                      <th className="py-4 px-4 text-xs font-black text-[#00206B] uppercase tracking-wider text-center">SESI</th>
                      <th className="py-4 px-4 text-xs font-black text-[#00206B] uppercase tracking-wider text-center">BATAS KELUAR</th>
                      <th className="py-4 px-4 text-xs font-black text-[#00206B] uppercase tracking-wider text-center">BATAS TIBA START</th>
                      <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase tracking-wider text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(jadwalList || []).map((jadwal, index) => (
                      <tr key={jadwal?.id || jadwal?._id || index} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-5 font-black text-sm text-[#00206B] uppercase">
                          {jadwal?.trayek || jadwal?.nama_trayek || `Trayek ${jadwal?.id || index + 1}`}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black uppercase ${
                            (jadwal?.tipe_sesi || jadwal?.sesi || "").toUpperCase() === "PAGI"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {jadwal?.tipe_sesi || jadwal?.sesi || "PAGI"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                            🕒 {jadwal?.batas_keluar_dishub || "-"} WIB
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block text-xs font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            📍 {jadwal?.batas_tiba_start || "-"} WIB
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => handleEditClick(jadwal)}
                            className="inline-flex items-center gap-1.5 bg-[#00206B] hover:bg-[#00174E] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH SUPIR BARU                                                 */}
      {/* ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#00206B] tracking-wider block">
                  REGISTRASI DRIVER
                </span>
                <h3 className="text-xl font-black text-[#00206B] m-0">Tambah Driver Baru</h3>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    ID Driver
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.id}
                    onChange={(e) => setUserForm({ ...userForm, id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] focus:bg-white focus:outline-none focus:border-[#00206B]"
                    placeholder="SUP001"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.nama || userForm.name || ""}
                    onChange={(e) => setUserForm({ ...userForm, nama: e.target.value, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] focus:bg-white focus:outline-none focus:border-[#00206B]"
                    placeholder="Budi Santoso"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Email Akun
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] focus:bg-white focus:outline-none focus:border-[#00206B]"
                  placeholder="budi@siclus.id"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Password Login
                </label>
                <input
                  type="password"
                  required
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] focus:bg-white focus:outline-none focus:border-[#00206B]"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Trayek Tugas
                </label>
                <input
                  type="text"
                  required
                  value={userForm.trayek}
                  onChange={(e) => setUserForm({ ...userForm, trayek: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] focus:bg-white focus:outline-none focus:border-[#00206B]"
                  placeholder="Trayek A"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-[#00206B] hover:bg-[#00174E] text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT DRIVER                                                       */}
      {/* ========================================================================= */}
      {showEditUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block">
                  PERBARUI DRIVER
                </span>
                <h3 className="text-xl font-black text-[#00206B] m-0">Edit Data Driver</h3>
              </div>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={userForm.nama || userForm.name || ""}
                  onChange={(e) => setUserForm({ ...userForm, nama: e.target.value, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] focus:bg-white focus:outline-none focus:border-[#00206B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Email Akun
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] focus:bg-white focus:outline-none focus:border-[#00206B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Password Baru (Kosongkan jika tidak ingin mengubah)
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] focus:bg-white focus:outline-none focus:border-[#00206B]"
                  placeholder="Opsional - ganti password"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Trayek
                </label>
                <input
                  type="text"
                  required
                  value={userForm.trayek}
                  onChange={(e) => setUserForm({ ...userForm, trayek: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] focus:bg-white focus:outline-none focus:border-[#00206B]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-[#00206B] hover:bg-[#00174E] text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS SUPIR                                             */}
      {/* ========================================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.15s]">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl">
              🗑️
            </div>
            <div>
              <h3 className="text-lg font-black text-[#00206B] m-0">Hapus Akun Driver?</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Apakah Anda yakin ingin menghapus akun driver{" "}
                <span className="font-black text-rose-600">{userToDelete.nama_lengkap || userToDelete.nama || userToDelete.name}</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs uppercase shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORM JADWAL CUT-OFF (TAMBAH & EDIT GOD MODE)                      */}
      {/* ========================================================================= */}
      {showJadwalModal && (
        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider block ${isEditMode ? "text-amber-700" : "text-[#00206B]"}`}>
                  {isEditMode ? "EDIT CUT-OFF (GOD MODE)" : "KONFIGURASI CUT-OFF"}
                </span>
                <h3 className="text-xl font-black text-[#00206B] m-0">
                  {isEditMode ? "Edit Toleransi Jadwal" : "Tambah Jadwal Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowJadwalModal(false);
                  setIsEditMode(false);
                  setEditJadwalId(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitJadwal} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Trayek
                </label>
                <input
                  type="text"
                  required
                  value={formJadwal?.trayek || ""}
                  onChange={(e) => setFormJadwal({ ...(formJadwal || {}), trayek: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] focus:bg-white focus:outline-none focus:border-[#00206B]"
                  placeholder="cth: AEROX, Trayek A"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Tipe Sesi
                </label>
                <select
                  value={formJadwal?.tipe_sesi || "PAGI"}
                  onChange={(e) => setFormJadwal({ ...(formJadwal || {}), tipe_sesi: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] focus:bg-white focus:outline-none focus:border-[#00206B]"
                >
                  <option value="PAGI">PAGI</option>
                  <option value="SIANG">SIANG</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Batas Keluar Dishub
                  </label>
                  <input
                    type="time"
                    required
                    value={formJadwal?.batas_keluar_dishub || ""}
                    onChange={(e) => setFormJadwal({ ...(formJadwal || {}), batas_keluar_dishub: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-rose-700 focus:bg-white focus:outline-none focus:border-[#00206B]"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Format: JJ:MM (cth: 06:00)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Batas Tiba di Titik Start
                  </label>
                  <input
                    type="time"
                    required
                    value={formJadwal?.batas_tiba_start || ""}
                    onChange={(e) => setFormJadwal({ ...(formJadwal || {}), batas_tiba_start: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-amber-800 focus:bg-white focus:outline-none focus:border-[#00206B]"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Format: JJ:MM (cth: 06:30)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowJadwalModal(false);
                    setIsEditMode(false);
                    setEditJadwalId(null);
                  }}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-[#00206B] hover:bg-[#00174E] text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDriver;


---

### src/pages/admin/ProfilAdmin.jsx

jsx
import React, { useState, useRef } from "react";
import { apiService } from "../../services/api";
import imageCompression from "browser-image-compression";

const ProfilAdmin = ({ user, onLogout }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(user?.foto_profil || null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Kompresi Gambar (Max 200KB)
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      // Kirim ke Backend Admin
      const res = await apiService.updateFotoProfilAdmin(compressedFile);
      
      // Update UI dengan URL baru
      if (res && res.foto_profil) {
        setFotoPreview(res.foto_profil);
        const savedUser = JSON.parse(localStorage.getItem("siclus_user"));
        if (savedUser) {
          savedUser.foto_profil = res.foto_profil;
          localStorage.setItem("siclus_user", JSON.stringify(savedUser));
          
          // BARIS TAMBAHAN: Paksa sinkronisasi global state aplikasi
          window.location.reload();
        }
      }
    } catch (error) {
      alert("Gagal upload foto profil admin: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto pb-6 relative">
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-black text-[#00206B] m-0 tracking-wide uppercase">Profil Akun Admin</h2>
        <p className="text-sm text-slate-400 font-semibold mt-0.5">Informasi kredensial dan hak akses administrator operasional SICLUS</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-[#00206B]"></div>
        <div className="relative z-10 flex flex-col items-center mt-12 px-6 pb-8">
          
          {/* INPUT FILE HIDDEN */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          {/* WADAH AVATAR BISA DIKLIK */}
          <div 
            onClick={() => !isUploading && fileInputRef.current.click()}
            className="w-28 h-28 rounded-full bg-white p-1.5 shadow-lg cursor-pointer group relative"
            title="Klik untuk ubah foto profil"
          >
            <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 relative">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-[#00206B]">{(user?.nama_lengkap || user?.nama || user?.name || "A").charAt(0).toUpperCase()}</span>
              )}
              
              {/* OVERLAY LOADING ATAU HOVER */}
              <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white transition-opacity duration-200 ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {isUploading ? (
                  <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Uploading...</span>
                ) : (
                  <>
                    <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-widest">Ubah Foto</span>
                  </>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-amber-400 border-4 border-white rounded-full flex items-center justify-center" title="Akun Terverifikasi">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h3 className="mt-4 text-2xl font-black text-[#00206B]">{user?.nama_lengkap || user?.nama || user?.name || "Administrator"}</h3>
          <span className="bg-[#00206B] text-white font-black px-4 py-1.5 rounded-full text-[10px] mt-2 uppercase tracking-widest shadow-md">🛡️ ADMINISTRATOR UTAMA</span>

          <div className="mt-8 space-y-3 w-full">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Email Terdaftar</span>
              <span className="font-extrabold text-[#00206B] text-sm">{user?.email || "admin@siclus.id"}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Hak Akses & Otoritas</span>
              <span className="font-extrabold text-[#00206B] text-sm text-center">Full Akses Monitoring, Rekap, & Manajemen Data</span>
            </div>
          </div>

          <div className="w-full mt-8 pt-6 border-t border-slate-100">
            <button onClick={onLogout} className="w-full bg-[#FCE8E6] hover:bg-[#FAD2CF] transition-colors text-[#C5221F] font-extrabold py-4 px-4 rounded-2xl cursor-pointer">
              🚪 KELUAR APLIKASI (LOGOUT)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilAdmin;


---

### src/pages/admin/RegisterDriver.jsx

jsx
import React, { useState } from "react";

const Register = ({ onRegisterSuccess, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin",
    phone: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok!");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter!");
      return;
    }

    // Simpan ke localStorage (nanti bisa diganti backend)
    const users = JSON.parse(localStorage.getItem("siclus_users") || "[]");

    if (users.find((u) => u.email === formData.email)) {
      setError("Email sudah terdaftar!");
      return;
    }

    const newUser = {
      id: `USR${Date.now()}`,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phone: formData.phone,
    };

    users.push(newUser);
    localStorage.setItem("siclus_users", JSON.stringify(users));

    onRegisterSuccess(newUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#00206B] to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white tracking-widest uppercase">SICLUS</h1>
          <p className="text-slate-300 text-sm mt-2">Sistem Informasi Angkutan Sekolah</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-[#00206B]">Buat Akun Admin</h2>
            <p className="text-xs text-slate-400 mt-1">Daftar untuk mengelola sistem</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#00206B] focus:bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none transition-all"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#00206B] focus:bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none transition-all"
                placeholder="admin@siclus.id"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">No. Telepon</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#00206B] focus:bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none transition-all"
                placeholder="081234567890"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#00206B] focus:bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none transition-all"
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Konfirmasi Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#00206B] focus:bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none transition-all"
                placeholder="Ulangi password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#00206B] hover:bg-[#00174E] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md active:scale-[0.98] transition-all text-sm cursor-pointer mt-2"
            >
              DAFTAR SEKARANG
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Sudah punya akun?{" "}
              <button onClick={onBackToLogin} className="text-[#00206B] font-bold hover:underline cursor-pointer">
                Login di sini
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;


---

### src/pages/admin/RekapDriver.jsx

jsx
import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { apiService } from "../../services/api";

const RekapAdmin = () => {
  const [rawData, setRawData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPeriode, setFilterPeriode] = useState(7); // Default: 7 Hari (1 Minggu)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchRekap = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getRekapAdmin();
        if (response) {
          const list = response.data || (Array.isArray(response) ? response : []);
          setRawData(list);
        }
      } catch (error) {
        console.error("Gagal menarik data rekap:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRekap();
  }, []);

  // FUNGSI SAKTI: Filter waktu & Grouping by Driver
  const groupedData = useMemo(() => {
    const now = new Date();

    // 1. Filter berdasarkan rentang hari (1 Minggu / 1 Bulan / Semua Waktu)
    const filtered = rawData.filter((item) => {
      if (filterPeriode === "all") return true;
      if (!item.tanggal && !item.created_at) return true;
      const itemDate = new Date(item.tanggal || item.created_at);
      const diffTime = Math.abs(now - itemDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= filterPeriode;
    });

    // 2. Grouping per Supir
    const groups = filtered.reduce((acc, curr) => {
      const supirId = curr.id_supir || curr.user_id || "ANONIM";
      const driverName = curr.users?.nama || curr.users?.name || curr.nama_supir || curr.nama || supirId;
      if (!acc[supirId]) {
        acc[supirId] = {
          id_supir: supirId,
          nama_supir: driverName,
          nama_lengkap: driverName,
          trayek_utama: curr.trayek || curr.users?.trayek || "-",
          bus_utama: curr.bus || curr.users?.bus || "-",
          total_hari_jalan: 0,
          total_penumpang: 0,
          total_telat: 0,
          total_tepat: 0,
          list_laporan: [],
          riwayat: [],
        };
      }

      acc[supirId].total_hari_jalan += 1;

      // Hitung Metrik dari Sesi
      let passengerCount = 0;
      let isLate = false;

      if (curr.trip_sessions && curr.trip_sessions.length > 0) {
        curr.trip_sessions.forEach((sesi) => {
          passengerCount += sesi.jumlah_penumpang || 0;
          const late =
            sesi.status_waktu === "TERLAMBAT" ||
            sesi.status_kedisiplinan === "TERLAMBAT" ||
            sesi.status?.toUpperCase() === "TERLAMBAT" ||
            sesi.is_late === true ||
            sesi.terlambat === true ||
            sesi.cp1_late ||
            sesi.cp2_late;

          if (late) {
            acc[supirId].total_telat += 1;
            isLate = true;
          } else {
            acc[supirId].total_tepat += 1;
          }
        });
        acc[supirId].total_penumpang += passengerCount;
      } else {
        // Fallback jika tidak ada trip_sessions terpisah
        passengerCount = curr.jumlah_penumpang || 0;
        acc[supirId].total_penumpang += passengerCount;
        isLate =
          curr.status_waktu === "TERLAMBAT" ||
          curr.status_kedisiplinan === "TERLAMBAT" ||
          curr.status?.toUpperCase() === "TERLAMBAT" ||
          curr.is_late === true ||
          curr.terlambat === true;

        if (isLate) {
          acc[supirId].total_telat += 1;
        } else {
          acc[supirId].total_tepat += 1;
        }
      }

      const totalSesi = curr.sesi_terlaksana ?? curr.trip_sessions?.length ?? 0;
      const statusKedisiplinan = curr.status_waktu || (isLate ? "TERLAMBAT" : "TEPAT WAKTU");
      const normalizedReport = {
        ...curr,
        tanggal: curr.tanggal || (curr.created_at ? curr.created_at.split("T")[0] : "-"),
        bus: curr.bus || curr.users?.bus || "-",
        sesi_terlaksana: totalSesi,
        siswa_diangkut: passengerCount,
        status_waktu: statusKedisiplinan,
      };

      acc[supirId].list_laporan.push(normalizedReport);
      acc[supirId].riwayat.push(normalizedReport);

      return acc;
    }, {});

    let result = Object.values(groups).sort((a, b) => b.total_hari_jalan - a.total_hari_jalan);

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.nama_supir.toLowerCase().includes(q) ||
          s.id_supir.toLowerCase().includes(q) ||
          s.trayek_utama.toLowerCase().includes(q)
      );
    }

    return result;
  }, [rawData, filterPeriode, searchQuery]);

  const handleExportPerDriver = () => {
    const riwayatList = selectedDriver?.riwayat || selectedDriver?.list_laporan;
    if (!selectedDriver || !riwayatList || riwayatList.length === 0) return;

    // Susun data baris per baris untuk Excel
    const excelData = riwayatList.map((laporan) => ({
      "Tanggal": laporan.tanggal,
      "Armada / Bus": laporan.bus || "-",
      "Total Sesi": laporan.sesi_terlaksana || 0,
      "Siswa Diangkut": laporan.siswa_diangkut || 0,
      "Status Kedisiplinan": laporan.status_waktu || "TEPAT WAKTU",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap_Mingguan");

    // Nama file dinamis menggunakan nama supir
    const namaSupir = selectedDriver.nama_lengkap || selectedDriver.nama_supir || "Driver";
    const namaFile = `Rekap_${namaSupir.replace(/\s+/g, "_")}.xlsx`;
    XLSX.writeFile(workbook, namaFile);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    try {
      const d = new Date(timeString);
      if (!isNaN(d.getTime())) return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      return timeString;
    } catch {
      return timeString;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8 animate-[fadeIn_0.3s] text-left">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-[#00206B] m-0 tracking-wide uppercase">
            Rekapitulasi Kinerja
          </h2>
          <p className="text-sm text-slate-400 font-semibold mt-0.5">
            Pantau akumulasi performa driver per rentang waktu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Supir */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari supir / trayek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-bold text-[#00206B] rounded-xl px-3.5 py-3 pl-9 outline-none focus:border-[#00206B] shadow-sm placeholder:text-slate-400"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Periode */}
          <select
            value={filterPeriode}
            onChange={(e) => setFilterPeriode(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="bg-white border border-slate-200 text-xs font-bold text-[#00206B] rounded-xl px-4 py-3 outline-none focus:border-[#00206B] shadow-sm cursor-pointer"
          >
            <option value={7}>1 Minggu Terakhir</option>
            <option value={30}>1 Bulan Terakhir</option>
            <option value="all">Semua Waktu</option>
          </select>
        </div>
      </div>

      {/* Tabel Akumulasi per Supir */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center text-[#00206B] font-bold py-14 animate-pulse">
            Menghitung akumulasi data server... ⏳
          </div>
        ) : groupedData.length === 0 ? (
          <div className="text-center text-slate-400 font-medium py-14 space-y-2">
            <div className="text-3xl">📂</div>
            <p className="font-bold text-slate-600 m-0">Belum ada data di periode ini.</p>
            <p className="text-xs text-slate-400">Silakan pilih rentang waktu lainnya pada filter di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50">
                  <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase rounded-tl-xl tracking-wider">
                    Nama Driver
                  </th>
                  <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase tracking-wider">Trayek</th>
                  <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase text-center tracking-wider">
                    Hari Jalan
                  </th>
                  <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase text-center tracking-wider">
                    Total Siswa
                  </th>
                  <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase text-center tracking-wider">
                    Disiplin Waktu
                  </th>
                  <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase text-center rounded-tr-xl tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedData.map((supir, index) => (
                  <tr
                    key={supir.id_supir || index}
                    onClick={() => setSelectedDriver(supir)}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00206B] to-blue-500 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
                          {supir.nama_supir.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-black text-[#00206B] block uppercase tracking-wide group-hover:text-blue-700 transition-colors">
                            {supir.nama_supir}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{supir.id_supir}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-xs font-extrabold text-slate-700 uppercase bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg inline-block">
                        {supir.trayek_utama}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="text-base font-black text-[#00206B]">{supir.total_hari_jalan}</span>{" "}
                      <span className="text-xs text-slate-400 font-semibold">Hari</span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="text-base font-black text-[#00206B]">{supir.total_penumpang}</span>{" "}
                      <span className="text-xs text-slate-400 font-semibold">Siswa</span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className="bg-[#E6F7ED] text-[#137333] border border-[#BCECD2] font-black text-[10px] px-2.5 py-1 rounded-lg shadow-sm"
                          title="Total Sesi Tepat Waktu"
                        >
                          🟢 {supir.total_tepat} Tepat
                        </span>
                        {supir.total_telat > 0 ? (
                          <span
                            className="bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF] font-black text-[10px] px-2.5 py-1 rounded-lg shadow-sm"
                            title="Total Sesi Terlambat"
                          >
                            🔴 {supir.total_telat} Telat
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">0 Telat</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDriver(supir);
                        }}
                        className="inline-flex items-center gap-1.5 bg-[#00206B] hover:bg-[#00174E] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <span>Lihat Log</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: RINCIAN LOG HARIAN SUPIR */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00206B] to-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                  {selectedDriver.nama_supir.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-[#00206B] tracking-wider block">
                    AKUMULASI LOGBOOK DRIVER
                  </span>
                  <h3 className="text-xl font-black text-[#00206B] m-0">{selectedDriver.nama_supir}</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    ID: {selectedDriver.id_supir} • Trayek: {selectedDriver.trayek_utama} • Total {selectedDriver.total_hari_jalan} Laporan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriver(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* DI DALAM MODAL DETAIL DRIVER (Dekat Header/Nama) */}
            <div className="mt-4 flex justify-center w-full">
              <button
                onClick={handleExportPerDriver}
                className="flex items-center gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-black px-4 py-2 rounded-xl transition-colors border border-emerald-200 w-full justify-center shadow-sm cursor-pointer"
              >
                <span>📊 DOWNLOAD EXCEL ({selectedDriver?.nama_lengkap || selectedDriver?.nama_supir})</span>
              </button>
            </div>

            {/* Metric Summary Cards for this driver */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Total Hari Tugas</span>
                {/* Total Hari Tugas */}
                <span className="text-xl font-black">{selectedDriver?.total_hari_jalan || 0} Hari</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Total Siswa Diangkut</span>
                {/* Total Siswa Diangkut */}
                <span className="text-xl font-black">{selectedDriver?.total_penumpang || 0} Orang</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Disiplin Waktu</span>
                {/* Disiplin Waktu */}
                <div className="flex flex-col items-center justify-center">
                  <span className="text-sm font-bold text-emerald-600">✓ {selectedDriver?.total_tepat || 0} Tepat</span>
                  <span className="text-sm font-bold text-rose-600">⚠️ {selectedDriver?.total_telat || 0} Telat</span>
                </div>
              </div>
            </div>

            {/* Bagian RIWAYAT TANGGAL LAPORAN OPERASIONAL */}
            <div className="space-y-3 mt-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              <h4 className="text-xs font-black text-[#00206B] uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                📅 Riwayat Tanggal Laporan Operasional
              </h4>
              {selectedDriver?.list_laporan && selectedDriver.list_laporan.length > 0 ? (
                selectedDriver.list_laporan.map((lap, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-white flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="text-sm font-black text-[#00206B]">Tanggal: {lap.tanggal || (lap.created_at ? lap.created_at.split("T")[0] : "-")}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Armada: {lap.bus || "-"}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {lap.trip_sessions?.length || 0} Sesi Terlaksana
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedReportDetail(lap)}
                      className="text-[10px] font-black uppercase tracking-widest text-[#00206B] border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      Detail Checkpoint 🔍
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 font-bold text-xs">Belum ada riwayat operasional.</div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDriver(null)}
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL CHECKPOINT LAPORAN SPESIFIK */}
      {selectedReportDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.15s]">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-5 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#00206B] tracking-wider block">
                  RINCIAN CHECKPOINT & INSPEKSI
                </span>
                <h3 className="text-xl font-black text-[#00206B] m-0">
                  Laporan {selectedReportDetail.tanggal || selectedReportDetail.date || "Harian"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sesi & CP */}
            <div className="space-y-4">
              {(selectedReportDetail.trip_sessions || []).map((sesi, idx) => (
                <div key={sesi.id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="font-black text-xs uppercase text-[#00206B]">
                      Sesi {sesi.tipe_sesi || idx + 1}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      👥 {sesi.jumlah_penumpang || 0} Siswa
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">CP1 Keluar Dishub</span>
                      <span className="font-bold text-slate-800">
                        {formatTime(sesi.jam_berangkat_kantor || sesi.cp1_time)} WIB ({sesi.km_berangkat_kantor || sesi.cp1_km || 0} KM)
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">CP2 Tiba Start</span>
                      <span className="font-bold text-slate-800">
                        {formatTime(sesi.jam_berangkat_start || sesi.cp2_time)} WIB ({sesi.km_berangkat_start || sesi.cp2_km || 0} KM)
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">CP3 Tiba Sekolah</span>
                      <span className="font-bold text-slate-800">
                        {formatTime(sesi.jam_tiba_finish || sesi.cp3_time)} WIB ({sesi.km_tiba_finish || sesi.cp3_km || 0} KM)
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">CP4 Kembali Dishub</span>
                      <span className="font-bold text-slate-800">
                        {formatTime(sesi.jam_tiba_kantor || sesi.cp4_time)} WIB ({sesi.km_tiba_kantor || sesi.cp4_km || 0} KM)
                      </span>
                    </div>
                  </div>

                  {/* Foto Validasi Sesi */}
                  {(sesi.foto_awal || sesi.foto_akhir) && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {sesi.foto_awal && (
                        <div
                          onClick={() => setSelectedImage(sesi.foto_awal)}
                          className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 cursor-pointer group"
                        >
                          <img src={sesi.foto_awal} alt="Foto CP1" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            Foto CP1 🔍
                          </span>
                        </div>
                      )}
                      {sesi.foto_akhir && (
                        <div
                          onClick={() => setSelectedImage(sesi.foto_akhir)}
                          className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 cursor-pointer group"
                        >
                          <img src={sesi.foto_akhir} alt="Foto CP4" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            Foto CP4 🔍
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase cursor-pointer"
              >
                Kembali ke Ringkasan Supir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out animate-[fadeIn_0.15s]"
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img src={selectedImage} alt="Zoom" className="rounded-2xl max-w-full max-h-[85vh] object-contain shadow-2xl" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RekapAdmin;



---

### src/pages/admin/RiwayatAdmin.jsx

jsx
import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";

const RiwayatAdmin = () => {
  const [laporanHarian, setLaporanHarian] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPantauan = async () => {
      try {
        // Pastikan memanggil API yang benar dari apiService
        const res = await (apiService.getPantauanHarian ? apiService.getPantauanHarian() : apiService.getRiwayatHarianAdmin());
        // Amankan mapping data
        const dataTarget = res?.data || res || [];
        const rawList = Array.isArray(dataTarget) ? dataTarget : [];

        // Jika data dikelompokkan berdasarkan tanggal: [{ tanggal, laporan: [...] }], lakukan flattening secara aman
        let flattened = [];
        if (rawList.length > 0 && Array.isArray(rawList[0]?.laporan)) {
          rawList.forEach((group) => {
            (group.laporan || []).forEach((lap) => {
              flattened.push({
                ...lap,
                tanggal: lap.tanggal || group.tanggal,
              });
            });
          });
        } else {
          flattened = [...rawList];
        }

        // Normalisasi data laporan agar pengemudi, status, dan catatan inspeksi selalu siap diakses
        const normalized = flattened.map((lap) => {
          const catatanInspeksi =
            lap?.inspeksi?.catatan ||
            lap?.catatan_inspeksi ||
            (Array.isArray(lap?.inspections) ? lap.inspections.find((i) => i?.catatan)?.catatan : null) ||
            (Array.isArray(lap?.trip_sessions) ? lap.trip_sessions.find((s) => s?.catatan)?.catatan : null) ||
            lap?.catatan ||
            "";

          const namaSupir =
            lap?.pengemudi?.nama_lengkap ||
            lap?.pengemudi?.nama ||
            lap?.users?.nama ||
            lap?.nama_supir ||
            lap?.id_supir ||
            "Supir";

          const sesiAkhir = lap.trip_sessions?.[lap.trip_sessions.length - 1];
          const isSelesai = sesiAkhir?.jam_tiba_kantor !== null && sesiAkhir?.jam_tiba_kantor !== undefined;
          const status = lap.status || (isSelesai ? "SELESAI DIREKAM" : "SEDANG BERJALAN");
          const statusWaktu = sesiAkhir?.status_waktu || lap.status_waktu || "BELUM ADA";

          return {
            ...lap,
            pengemudi: {
              nama_lengkap: namaSupir,
              ...(lap.pengemudi || {}),
            },
            inspeksi: catatanInspeksi ? { ...(lap.inspeksi || {}), catatan: catatanInspeksi } : lap.inspeksi,
            status,
            status_waktu: statusWaktu,
          };
        });

        setLaporanHarian(normalized);
      } catch (error) {
        console.error("Gagal menarik data pantauan:", error);
        setLaporanHarian([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPantauan();
  }, []);

  if (isLoading) {
    return <div className="text-center p-10 font-bold text-[#00206B] animate-pulse">Menghubungkan ke Live Feed Server... ⏳</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-black text-[#00206B] m-0 tracking-wide uppercase">Pantauan Harian</h2>
        <p className="text-sm text-slate-400 font-semibold mt-0.5">Live feed status laporan operasional driver per hari.</p>
      </div>

      {laporanHarian.length === 0 ? (
        /* EMPTY STATE YANG SEKARANG ADA DI LAYAR */
        <div className="text-center py-16 bg-white border-2 border-slate-200 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-black text-slate-400 uppercase tracking-widest">BELUM ADA PANTAUAN HARIAN</span>
        </div>
      ) : (
        /* RENDER LIST CARD LAPORAN DI SINI */
        <div className="space-y-4">
          {laporanHarian.map((laporan, index) => {
            const namaSupir = laporan?.pengemudi?.nama_lengkap || "Supir";
            const statusText = laporan?.status || "PROSES";
            const isSelesai = statusText === "SELESAI DIREKAM" || statusText === "SELESAI";
            const isLate = laporan?.status_waktu === "TERLAMBAT";

            return (
              <div key={laporan.id || index} className="p-5 bg-white border-2 border-slate-100 hover:border-blue-200 rounded-2xl shadow-sm transition-all">
                {/* Header Card: Nama Supir, Trayek, dan Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00206B] to-blue-500 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
                      {(namaSupir || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#00206B] text-sm md:text-base uppercase m-0 leading-tight">
                        {namaSupir}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          TRAYEK {laporan?.trayek || "-"} • {laporan?.bus || "-"}
                        </span>
                        {laporan?.tanggal && (
                          <>
                            <span className="text-slate-300 text-[10px]">•</span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {laporan.tanggal}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isSelesai ? (
                      <span className="bg-[#E6F7ED] text-[#137333] border border-[#BCECD2] text-[10px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-wider">
                        {statusText}
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        {statusText}
                      </span>
                    )}
                    {isLate && (
                      <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-rose-500"></span> TERLAMBAT
                      </span>
                    )}
                  </div>
                </div>

                {/* Tampilkan Catatan Krusial (Inspeksi) Jika Ada */}
                {laporan?.inspeksi?.catatan && (
                  <div className="bg-rose-50 border border-rose-200 p-2 rounded-lg mt-2">
                    <p className="text-[10px] text-rose-600 font-bold uppercase">⚠️ Catatan Inspeksi:</p>
                    <p className="text-xs text-rose-800 font-semibold">{laporan.inspeksi.catatan}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RiwayatAdmin;


---

### src/pages/auth/Login.jsx

jsx
import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";

const Login = ({ onLoginSuccess }) => {
  const [driverId, setDriverId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. Tembak API Login (ngelewatin apiService yang udah disetting axios)
      const response = await apiService.login(driverId, pin);

      // 2. SIMPAN TIKET VIP (JWT) KE BRANKAS BROWSER!
      localStorage.setItem("siclus_token", response.access_token);

      // 3. Rapihin data dari Backend lu biar gampang dibaca FE Cevin
      const userData = {
        id: response.user.id,
        name: response.user.nama_lengkap,
        email: response.user.email,
        role: response.user.role,
        trayek: response.user.trayek,
        bus: response.user.bus,
        foto_profil: response.user.foto_profil,
      };

      setTimeout(() => {
        onLoginSuccess(userData);
      }, 500);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        if (Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(", "));
        } else if (typeof err.response.data.detail === "string") {
          setError(err.response.data.detail);
        } else {
          setError("Format data login tidak valid.");
        }
      } else {
        setError(err.message || "Terjadi kesalahan!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 sm:-top-32 w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] bg-gradient-to-b from-blue-500 via-cyan-500 to-indigo-600 rounded-full blur-[80px] sm:blur-[120px] opacity-60 animate-pulse"></div>
      <div
        className="absolute -bottom-24 left-1/2 -translate-x-1/2 sm:-bottom-32 w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] bg-gradient-to-t from-purple-600 via-indigo-700 to-pink-500 rounded-full blur-[80px] sm:blur-[120px] opacity-50 animate-pulse"
        style={{ animationDelay: "2.5s" }}
      ></div>
      <div
        className={`relative w-full max-w-[360px] xs:max-w-[390px] sm:max-w-[440px] md:max-w-[480px] lg:max-w-[520px] bg-white/85 backdrop-blur-2xl rounded-[2.2rem] sm:rounded-[2.5rem] p-5 sm:p-8 lg:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white/70 transition-all duration-1000 ease-out transform ${isMounted ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}
      >
        <div className="flex flex-col items-center text-center mt-1 mb-5 sm:mb-8">
          <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br from-[#00206B] via-[#00174E] to-[#000F33] flex items-center justify-center shadow-md border border-white/20">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <rect x="4" y="3" width="16" height="15" rx="3" />
              <line x1="4" y1="13" x2="20" y2="13" />
              <circle cx="8" cy="9" r="1.5" fill="currentColor" />
              <circle cx="16" cy="9" r="1.5" fill="currentColor" />
              <path d="M6 18v1.5a0.5 0 000.5 0.5h1a0.5 0 000.5-0.5V18H6zM16 18v1.5a0.5 0 000.5 0.5h1a0.5 0 000.5-0.5V18h-2z" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-4xl sm:text-3xl lg:text-4xl font-black text-[#00206B] tracking-tight mt-3 sm:mt-5 uppercase">SICLUS</h2>
          <p className="text-[7px] sm:text-xs font-bold text-slate-500 mt-1 tracking-widest leading-relaxed uppercase">School Integrated Check-in & Logbook Unit System</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className={`overflow-hidden transition-all duration-300 ${error ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="p-3 bg-red-500/10 border border-red-200/80 backdrop-blur-sm rounded-2xl text-xs text-red-600 font-bold text-center flex items-center justify-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
          <div className="space-y-1 group">
            <label className="text-[11px] sm:text-sm font-bold text-[#00206B] ml-1 uppercase tracking-wide">ID Driver / Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#00206B] transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="9" cy="11" r="2.5" />
                  <path d="M15 9h3M15 13h3M15 17h3" />
                </svg>
              </div>
              <input
                type="text"
                required
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full bg-slate-100/80 border-2 border-slate-200/70 focus:border-[#00206B] focus:bg-white focus:ring-4 focus:ring-[#00206B]/10 rounded-2xl pl-10 sm:pl-11 pr-4 py-3 sm:py-4 text-xs sm:text-base font-bold text-[#00206B] placeholder-slate-400 outline-none transition-all duration-300"
                placeholder="Contoh: admin@siclus.id"
              />
            </div>
          </div>
          <div className="space-y-1 group">
            <label className="text-[11px] sm:text-sm font-bold text-[#00206B] ml-1 uppercase tracking-wide">PIN / Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#00206B] transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <input
                type={showPin ? "text" : "password"}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-100/80 border-2 border-slate-200/70 focus:border-[#00206B] focus:bg-white focus:ring-4 focus:ring-[#00206B]/10 rounded-2xl pl-10 sm:pl-11 pr-11 py-3 sm:py-4 text-xs sm:text-base font-bold text-[#00206B] placeholder-slate-400 outline-none transition-all duration-300 tracking-wider"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-3.5 sm:pr-4 flex items-center text-slate-400 hover:text-[#00206B] transition-colors focus:outline-none"
              >
                {showPin ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative overflow-hidden bg-gradient-to-r from-[#00206B] via-[#001D60] to-[#001240] text-white font-black py-3.5 sm:py-4 px-4 rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,32,107,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(0,32,107,0.6)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 mt-3 sm:mt-6 group"
          >
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/30 opacity-20 group-hover:animate-[shine_1s] pointer-events-none" />
            <div className="flex items-center justify-center gap-2 relative z-10 text-xs sm:text-base">
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white/70" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>MEMPROSES...</span>
                </>
              ) : (
                <>
                  <span>MASUK SISTEM</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </div>
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200/60">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="text-[9px] sm:text-xs font-bold text-slate-500 tracking-wide uppercase">Siclus 1.0</span>
        </div>
      </div>
    </div>
  );
};

export default Login;


---

### src/pages/beranda/RingkasanHarian.jsx

jsx
import React from "react";

const RingkasanHarian = ({ inspections = [], trips = [], currentShift, onResetAllLogs }) => {
  const latestTrip = trips[0];
  const latestInspection = inspections[0];
  const odometerStart = latestInspection?.odometer || "";
  const passengerCount = latestTrip?.passengers?.total || latestTrip?.passengers?.seated || 0;
  const departureTime = latestTrip?.departure || "";
  const arrivalTime = latestTrip?.arrival || "";
  const odometerDeparture = latestTrip?.odometerDeparture || "";
  const odometerArrival = latestTrip?.odometerArrival || "";

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-6">
      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-black text-[#00206B] m-0 tracking-wide uppercase">RINGKASAN LAPORAN HARIAN</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          {/* Card 1: Perjalanan Pagi */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-[#00206B] m-0 pb-2 border-b border-slate-100">Perjalanan Pagi</h3>

            {/* Start / Mulai Row */}
            <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-slate-400">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <rect x="4" y="3" width="16" height="15" rx="3" />
                  <line x1="4" y1="13" x2="20" y2="13" />
                  <circle cx="8" cy="9" r="1.5" fill="currentColor" />
                  <circle cx="16" cy="9" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <div className="flex-1 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">Mulai (Dishub)</span>
                <div className="text-right">
                  <span className="font-black text-[#00206B] block">05:30 WIB</span>
                  <span className="text-xs text-slate-400 font-semibold block mt-0.5">KM {odometerStart ? parseInt(odometerStart).toLocaleString("id-ID") : "-"}</span>
                </div>
              </div>
            </div>

            {/* Departure from Start Point */}
            <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-slate-400">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" fill="currentColor" />
                </svg>
              </div>
              <div className="flex-1 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">Berangkat dari Titik Start</span>
                <div className="text-right">
                  <span className="font-black text-[#00206B] block">{departureTime} WIB</span>
                  <span className="text-xs text-slate-400 font-semibold block mt-0.5">KM {odometerDeparture ? parseInt(odometerDeparture).toLocaleString("id-ID") : "-"}</span>
                </div>
              </div>
            </div>

            {/* End / Selesai Row */}
            <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-slate-400">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </div>
              <div className="flex-1 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">Selesai (Sekolah)</span>
                <div className="text-right">
                  <span className="font-black text-[#00206B] block">{arrivalTime} WIB</span>
                  <span className="text-xs text-slate-400 font-semibold block mt-0.5">KM {odometerArrival ? parseInt(odometerArrival).toLocaleString("id-ID") : "-"}</span>
                </div>
              </div>
            </div>

            {/* Total Passengers Row */}
            <div className="flex items-center justify-between pt-2 text-sm">
              <span className="font-bold text-slate-500">Total Penumpang</span>
              <span className="text-base font-black text-[#00206B]">{passengerCount} Siswa</span>
            </div>
          </div>

          {/* 🔥 BELAJAR DISINI: Card Perjalanan Siang beserta tombolnya 
              UDAH GUE BUMI HANGUSKAN DARI SINI BIAR HALAMANNYA BERSIH! 🧹 */}
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-4">
          {/* Complete Data Check Box */}
          <div className="bg-[#E6F7ED] border border-[#BCECD2] rounded-xl p-4 flex items-center gap-2 text-[#137333] shadow-sm">
            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            <span className="text-sm font-extrabold uppercase tracking-wide">Data Pagi Lengkap</span>
          </div>

          {/* Statistics */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <h4 className="text-sm font-extrabold text-[#00206B] mb-3">Statistik Hari Ini</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Perjalanan</span>
                <span className="font-bold text-[#00206B]">1/2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Siswa</span>
                <span className="font-bold text-[#00206B]">{passengerCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jarak Tempuh</span>
                <span className="font-bold text-[#00206B]">{odometerArrival && odometerStart ? (parseInt(odometerArrival) - parseInt(odometerStart)).toLocaleString("id-ID") + " KM" : "30 KM"}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => alert("Laporan harian berhasil disimpan ke server!")}
              className="w-full bg-[#00206B] hover:bg-[#00174E] text-white font-extrabold py-4 px-4 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              SIMPAN LAPORAN HARIAN
            </button>
            {inspections.length > 0 && (
              <button
                onClick={onResetAllLogs}
                className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Hapus Log Percobaan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RingkasanHarian;


---

### src/pages/driver/BerandaDriver.jsx

jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../../services/api";

const Beranda = ({
  activeUser,
  onQuickAction,
  onLogout,
  tripStatus = "belum_mulai",
  onStartInspection,
  currentShift,
  isLaporanLocked,
  shiftRules,
  onStartSiang,
  laporanHariIni,
  laporan,
}) => {
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [jamSekarang, setJamSekarang] = useState(new Date());
  const [jadwalSesi, setJadwalSesi] = useState({ pagi: null, siang: null });
  const [isStartingReport, setIsStartingReport] = useState(false);

  // Ticking Clock & Fetch Data
  useEffect(() => {
    const timer = setInterval(() => setJamSekarang(new Date()), 1000);

    const fetchJadwal = async () => {
      try {
        const res = await apiService.getJadwalDriver();
        const rawList = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        if (rawList.length > 0) {
          const pagi = rawList.find((j) => (j?.tipe_sesi || "").toUpperCase() === "PAGI") || null;
          const siang = rawList.find((j) => (j?.tipe_sesi || "").toUpperCase() === "SIANG") || null;
          setJadwalSesi({ pagi, siang });
        }
      } catch (error) {
        console.error("Gagal menarik jadwal:", error);
      }
    };
    fetchJadwal();

    return () => clearInterval(timer);
  }, []);

  // Format jam ke "HH:MM" (contoh: "05:15") secara aman
  const jamTeks =
    jamSekarang instanceof Date && !isNaN(jamSekarang.getTime())
      ? jamSekarang
          .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false })
          .replace(".", ":")
      : "00:00";

  // Cek Status Keterlambatan dengan proteksi null/undefined
  const batasPagi = String(jadwalSesi?.pagi?.batas_keluar_dishub || "06:00").slice(0, 5);
  const batasSiang = String(jadwalSesi?.siang?.batas_keluar_dishub || "12:30").slice(0, 5);

  const isPagiTelat = jamTeks > batasPagi;
  const isSiangTelat = jamTeks > batasSiang;

  const currentHour =
    jamSekarang instanceof Date && !isNaN(jamSekarang.getTime())
      ? jamSekarang.getHours()
      : new Date().getHours();

  const parsedSiangHour = jadwalSesi?.siang?.batas_keluar_dishub
    ? parseInt(String(jadwalSesi.siang.batas_keluar_dishub).split(":")[0], 10)
    : 12;

  const siangHour = shiftRules?.siang ?? (!isNaN(parsedSiangHour) ? parsedSiangHour : 12);
  const isSiangTime = currentHour >= siangHour;

  // Proteksi data Driver/User
  const driverName = activeUser?.nama_lengkap || activeUser?.nama || activeUser?.name || "Driver";
  const driverInitial = (driverName || "D").charAt(0).toUpperCase();
  const userTrayek = activeUser?.trayek || "Belum ada trayek";
  const userBus = activeUser?.bus || "Belum ada armada";

  // Proteksi data Laporan & Trip Sessions
  const safeReport = laporanHariIni ?? laporan ?? null;
  const reportStatus = safeReport?.status || "Belum Ada Data";
  const tripSessions = Array.isArray(safeReport?.trip_sessions)
    ? safeReport.trip_sessions
    : Array.isArray(laporanHariIni?.trip_sessions)
    ? laporanHariIni.trip_sessions
    : Array.isArray(laporan?.trip_sessions)
    ? laporan.trip_sessions
    : [];

  // Handler Inisiasi Laporan Harian (Simpan ke localStorage)
  const handleMulaiLaporan = async () => {
    if (isStartingReport) return;
    setIsStartingReport(true);
    try {
      const localNow = new Date();
      const year = localNow.getFullYear();
      const month = String(localNow.getMonth() + 1).padStart(2, "0");
      const day = String(localNow.getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;

      const payload = {
        tanggal: today,
        trayek: activeUser?.trayek || "-",
        bus: activeUser?.bus || "-",
      };

      const res = await apiService.mulaiLaporanHarian(payload);

      // BARIS WAJIB: Simpan ID laporan master ke memori lokal
      if (res && res.id) {
        localStorage.setItem("siclus_active_laporan_id", String(res.id));
      }

      if (typeof onStartInspection === "function") {
        onStartInspection();
      } else {
        navigate("/driver/laporan");
      }
    } catch (error) {
      console.error("Gagal memulai laporan harian:", error);
      alert("Gagal memulai laporan: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsStartingReport(false);
    }
  };

  const handleStartSiang = async () => {
    if (isStartingReport) return;
    setIsStartingReport(true);
    try {
      const savedLaporanId = localStorage.getItem("siclus_active_laporan_id");
      if (!savedLaporanId) {
        const localNow = new Date();
        const year = localNow.getFullYear();
        const month = String(localNow.getMonth() + 1).padStart(2, "0");
        const day = String(localNow.getDate()).padStart(2, "0");
        const today = `${year}-${month}-${day}`;

        const payload = {
          tanggal: today,
          trayek: activeUser?.trayek || "-",
          bus: activeUser?.bus || "-",
        };

        const res = await apiService.mulaiLaporanHarian(payload);
        if (res && res.id) {
          localStorage.setItem("siclus_active_laporan_id", String(res.id));
        }
      }

      if (typeof onStartSiang === "function") {
        onStartSiang();
      } else {
        navigate("/driver/laporan");
      }
    } catch (error) {
      console.error("Gagal memulai laporan siang:", error);
      if (typeof onStartSiang === "function") {
        onStartSiang();
      } else {
        navigate("/driver/laporan");
      }
    } finally {
      setIsStartingReport(false);
    }
  };

  // Loading skeleton jika activeUser masih undefined/null
  if (!activeUser) {
    return (
      <div className="space-y-6 text-left max-w-5xl mx-auto pb-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-1/3"></div>
        <div className="h-4 bg-slate-100 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 h-64 bg-white border border-slate-100 rounded-2xl p-6"></div>
          <div className="h-64 bg-white border border-slate-100 rounded-2xl p-6"></div>
        </div>
      </div>
    );
  }

  const renderKotakSiang = () => {
    const isDisabled = currentShift === "pagi" || !isSiangTime || currentShift === "selesai";
    const btnText =
      currentShift === "selesai"
        ? "TUGAS SELESAI"
        : currentShift === "pagi"
        ? "SELESAIKAN PAGI DULU"
        : isSiangTime
        ? "MULAI LAPORAN SIANG"
        : `TUNGGU JAM ${siangHour}:00 WIB`;

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 transition-all hover:shadow-md">
        <div className="flex items-center gap-3 text-[#00206B]">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-base font-extrabold m-0">Laporan Siang</h3>
            <p className="text-[11px] text-slate-500 font-bold mt-1">Buka Pukul {siangHour}:00 WIB</p>
          </div>
        </div>

        <button
          onClick={handleStartSiang}
          disabled={isDisabled || isStartingReport}
          className={`w-full font-extrabold py-3.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs ${
            !isDisabled && !isStartingReport
              ? "bg-[#00206B] hover:bg-[#00174E] text-white shadow-md active:scale-[0.98] cursor-pointer"
              : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            {isDisabled ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            )}
          </svg>
          {isStartingReport ? "MEMPROSES..." : btnText}
        </button>
      </div>
    );
  };

  const renderCardJadwal = () => (
    <div className="bg-white border-2 border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#00206B]"></div>

      <div className="flex justify-between items-center border-b-2 border-slate-50 pb-3">
        <h3 className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Batas Operasional</h3>
        {/* JAM REALTIME BERGERAK */}
        <div className="bg-slate-800 text-emerald-400 font-mono text-sm font-black px-3 py-1 rounded-lg flex items-center gap-2 shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {jamTeks} WIB
        </div>
      </div>

      <div className="space-y-3">
        {/* SESI PAGI */}
        <div className={`flex justify-between items-center p-3 rounded-xl border ${isPagiTelat ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100"}`}>
          <div>
            <p className="text-xs font-black text-slate-700 uppercase">Sesi Pagi</p>
            {isPagiTelat ? (
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider">⚠️ Terlambat</span>
            ) : (
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Aman</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Maksimal Keluar</p>
            <p className={`text-sm font-black ${isPagiTelat ? "text-rose-600" : "text-[#00206B]"}`}>{batasPagi} WIB</p>
          </div>
        </div>

        {/* SESI SIANG */}
        <div className={`flex justify-between items-center p-3 rounded-xl border ${isSiangTelat ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100"}`}>
          <div>
            <p className="text-xs font-black text-slate-700 uppercase">Sesi Siang</p>
            {isSiangTelat ? (
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider">⚠️ Terlambat</span>
            ) : (
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Aman</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Maksimal Keluar</p>
            <p className={`text-sm font-black ${isSiangTelat ? "text-rose-600" : "text-[#00206B]"}`}>{batasSiang} WIB</p>
          </div>
        </div>
      </div>

      <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest pt-2">
        Lewat batas waktu otomatis tercatat "Terlambat"
      </p>
    </div>
  );

  // State: Shift Sedang Berlangsung
  if (tripStatus === "sedang_berlangsung") {
    return (
      <div className="space-y-6 text-left max-w-5xl mx-auto pb-6">
        <header className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-[#00206B] m-0">
            Selamat bertugas, <span className="block text-3xl md:text-4xl font-black">{driverName}</span>
          </h2>
          <p className="text-sm text-slate-400 font-semibold">{currentDate}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-[#E6F7ED] border border-[#BCECD2] text-[#137333] font-bold text-xs px-3 py-1.5 rounded-full uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                SEDANG BERLANGSUNG
              </div>
              <span className="text-sm font-black text-[#00206B]">Sistem Terhubung</span>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="w-12 h-12 rounded-lg bg-[#00206B] text-white flex items-center justify-center font-black text-xl shadow-sm">
                {driverInitial}
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#00206B] m-0">{userTrayek}</h4>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{userBus}</p>
              </div>
            </div>

            <button
              onClick={() => {
                if (typeof onQuickAction === "function") {
                  onQuickAction("laporan");
                } else if (typeof onStartInspection === "function") {
                  onStartInspection();
                } else {
                  navigate("/driver/laporan");
                }
              }}
              className="w-full bg-[#00206B] hover:bg-[#00174E] text-white font-extrabold py-4 px-4 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              LANJUTKAN LAPORAN
            </button>
          </div>

          <aside className="space-y-4">
            {renderKotakSiang()}
            {renderCardJadwal()}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className="text-[#00206B]">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-black text-[#00206B] block uppercase tracking-wide">LOKASI TERVALIDASI</span>
                <span className="text-xs text-slate-400 font-semibold block">Dishub Mojokerto</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // State: Belum Mulai (Initial / Post-Finish)
  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-6">
      <header className="space-y-1">
        <h2 className="text-3xl md:text-4xl font-black text-[#00206B] m-0">
          {driverName}
        </h2>
        <p className="text-sm text-slate-500 font-bold">Driver Angkutan Sekolah</p>
        <p className="text-xs text-slate-400 font-semibold mt-1">{currentDate}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {(isLaporanLocked && currentShift === "siang") || currentShift === "selesai" ? (
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
              <div className="w-20 h-20 bg-[#E6F7ED] text-[#137333] rounded-full flex items-center justify-center border-4 border-[#BCECD2]">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-[#00206B] m-0">
                  {currentShift === "selesai" ? "TUGAS HARI INI SELESAI" : "Shift Pagi Selesai"}
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-2 max-w-xs mx-auto">
                  {currentShift === "selesai" 
                    ? "Terima kasih! Anda telah menyelesaikan seluruh tugas operasional hari ini. Laporan akan dibuka kembali besok." 
                    : "Anda telah menyelesaikan tugas pagi. Silakan istirahat, dan mulai laporan siang pada menu di samping ketika waktunya tiba."}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                  <span>Status:</span>
                  <span className="text-[#00206B] font-extrabold uppercase">
                    {laporanHariIni?.status || (currentShift === "selesai" ? "Selesai" : "Shift Pagi Selesai")}
                  </span>
                </div>
              </div>

              {/* RENDER AMAN TRIP SESSIONS JIKA TERSEDIA */}
              {tripSessions.length > 0 && (
                <div className="w-full max-w-md mt-4 border-t border-slate-100 pt-4 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Riwayat Sesi Hari Ini</p>
                  <div className="space-y-2">
                    {tripSessions.map((sesi, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                        <span className="font-bold text-[#00206B] uppercase">Sesi {sesi?.tipe_sesi || idx + 1}</span>
                        <span className="text-[10px] font-extrabold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {sesi?.status || "Terkirim"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="bg-[#E6F7ED] border border-[#BCECD2] rounded-xl p-4 flex items-center gap-2 text-[#137333] shadow-sm">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm font-black uppercase tracking-wide">SISTEM TERHUBUNG KE SERVER</span>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-[#00206B] m-0">Perjalanan Hari Ini</h3>
                    <span className="inline-block bg-slate-100 text-slate-500 font-extrabold text-xs px-3 py-1.5 rounded mt-1.5">
                      {laporanHariIni?.status || "BELUM DIMULAI"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-[#00206B] block">{userTrayek}</span>
                    <span className="text-xs text-slate-400 font-semibold block mt-0.5">{userBus}</span>
                  </div>
                </div>

                {/* Sesi / Trip Sessions jika ada */}
                {tripSessions.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sesi Terdaftar</p>
                    <div className="grid grid-cols-2 gap-2">
                      {tripSessions.map((sesi, idx) => (
                        <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                          <span className="font-bold text-[#00206B] uppercase block">Sesi {sesi?.tipe_sesi || idx + 1}</span>
                          <span className="text-[10px] text-slate-500">{sesi?.status || "Terekam"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleMulaiLaporan}
                  disabled={isStartingReport}
                  className="w-full bg-[#00206B] hover:bg-[#00174E] text-white font-black text-sm py-4 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(0,32,107,0.39)] hover:shadow-[0_6px_20px_rgba(0,32,107,0.23)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStartingReport ? "MEMULAI LAPORAN..." : "MULAI LAPORAN PERJALANAN"}
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="space-y-4">
          {renderKotakSiang()}
          {renderCardJadwal()}
        </aside>
      </div>
    </div>
  );
};

export default Beranda;


---

### src/pages/driver/DetailLaporan.jsx

jsx
import React from "react";

const DetailLaporan = ({ report }) => {
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-black text-[#00206B]">Data Tidak Ditemukan</h3>
          <p className="text-sm text-slate-500 font-medium">Sesi terhapus. Silakan kembali ke halaman Riwayat.</p>
        </div>
      </div>
    );
  }

  const sesiPagi = report.trip_sessions?.find((s) => s.tipe_sesi?.toUpperCase() === "PAGI");
  const sesiSiang = report.trip_sessions?.find((s) => s.tipe_sesi?.toUpperCase() === "SIANG");
  const inspeksiPagi = report.inspections?.find((s) => s.tipe_sesi?.toUpperCase() === "PAGI");
  const inspeksiSiang = report.inspections?.find((s) => s.tipe_sesi?.toUpperCase() === "SIANG");

  const calculateCompleteness = () => {
    let totalPercentage = 0;
    const checkFields = [
      "jam_berangkat_kantor",
      "km_berangkat_kantor",
      "jam_berangkat_start",
      "km_berangkat_start",
      "jam_tiba_finish",
      "km_tiba_finish",
      "jumlah_penumpang",
      "jam_tiba_kantor",
      "km_tiba_kantor",
    ];
    const inspFields = ["rem", "ac", "lampu", "klakson", "wiper", "lampu_rem", "bell", "pintu", "kebersihan"];

    // 1. Sesi Pagi (Maks 25%)
    if (sesiPagi) {
      let filled = 0;
      checkFields.forEach((f) => {
        if (sesiPagi[f] !== null && sesiPagi[f] !== undefined) filled++;
      });
      totalPercentage += (filled / checkFields.length) * 25;
    }
    // 2. Inspeksi Pagi (Maks 25%)
    if (inspeksiPagi) {
      let filled = 0;
      inspFields.forEach((f) => {
        if (inspeksiPagi[f]) filled++;
      });
      totalPercentage += (filled / inspFields.length) * 25;
    }
    // 3. Sesi Siang (Maks 25%)
    if (sesiSiang) {
      let filled = 0;
      checkFields.forEach((f) => {
        if (sesiSiang[f] !== null && sesiSiang[f] !== undefined) filled++;
      });
      totalPercentage += (filled / checkFields.length) * 25;
    }
    // 4. Inspeksi Siang (Maks 25%)
    if (inspeksiSiang) {
      let filled = 0;
      inspFields.forEach((f) => {
        if (inspeksiSiang[f]) filled++;
      });
      totalPercentage += (filled / inspFields.length) * 25;
    }

    return Math.round(totalPercentage);
  };

  const completeness = calculateCompleteness();

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    try {
      const d = new Date(timeString);
      if (!isNaN(d.getTime())) return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      return timeString;
    } catch {
      return timeString;
    }
  };

  const TimelineItem = ({ title, time, odometer, passengers, isLast, foto, nopol }) => (
    <div className={`relative pl-7 ${isLast ? "" : "pb-8"}`}>
      <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-[#00206B] ring-4 ring-slate-50"></div>
      {!isLast && <div className="absolute left-[6px] top-5 bottom-0 w-0.5 bg-slate-100"></div>}

      <div>
        <h4 className="text-xs font-black text-[#00206B] uppercase tracking-wider">{title}</h4>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-sm">
          {/* Render Nopol & Merk Kendaraan HANYA jika datanya dikirim (Biasanya di CP1) */}
          {nopol && (
            <div className="col-span-2 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex justify-between items-center shadow-sm">
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">KENDARAAN</span>
              <span className="text-sm font-black text-amber-900">{nopol}</span>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-2xl">
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">WAKTU</span>
            <span className="block text-sm font-black text-slate-800 mt-1">{formatTime(time)} WIB</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">ODOMETER</span>
            <span className="block text-sm font-black text-slate-800 mt-1">{odometer ? `${odometer} KM` : "-"}</span>
          </div>

          {passengers !== undefined && passengers !== null && (
            <div className="col-span-2 bg-[#00206B] p-4 rounded-2xl flex justify-between items-center shadow-sm">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">SISWA DIANGKUT</span>
              <span className="text-sm font-black text-white">{passengers} ORANG</span>
            </div>
          )}

          {/* Render Bukti Foto Selfie */}
          {foto && (
            <div className="col-span-2 mt-1 relative rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm aspect-[4/3]">
              <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded shadow-sm z-10 uppercase tracking-widest">✓ FOTO VALIDASI</div>
              <img src={foto} alt="Bukti Operasional" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const inspKeys = [
    { id: "rem", label: "REM" },
    { id: "ac", label: "AC" },
    { id: "lampu", label: "LAMPU" },
    { id: "klakson", label: "KLAKSON" },
    { id: "wiper", label: "WIPER" },
    { id: "lampu_rem", label: "LAMPU REM" },
    { id: "bell", label: "BELL" },
    { id: "pintu", label: "PINTU" },
    { id: "kebersihan", label: "KEBERSIHAN" },
  ];

  // warna box kodisi kendaraan
  const RenderInspeksiBox = ({ dataInspeksi, title }) => (
    <div className="mb-8 last:mb-0">
      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">{title}</h4>
      {dataInspeksi ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {inspKeys.map((item, idx) => {
              const statusValue = dataInspeksi[item.id];
              const isOk = statusValue === "OK";
              return (
                <div key={idx} className={`flex items-center justify-between px-5 py-4 rounded-2xl ${isOk ? "bg-slate-50" : "bg-amber-500"}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isOk ? "text-slate-600" : "text-white"}`}>{item.label}</span>

                  <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase ${isOk ? "bg-emerald-500 text-white shadow-sm" : "bg-white text-amber-600 shadow-sm"}`}>
                    {statusValue || "-"}
                  </span>
                </div>
              );
            })}
          </div>
          {dataInspeksi.catatan && (
            <div className="mt-5 bg-amber-50 p-5 rounded-2xl border-l-4 border-amber-400">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-2">CATATAN KERUSAKAN</span>
              <p className="text-sm font-bold text-amber-900 leading-relaxed">{dataInspeksi.catatan}</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-400 font-black text-[10px] uppercase tracking-widest bg-slate-50 rounded-2xl">DATA INSPEKSI {title} BELUM TERSEDIA</div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 mt-2">
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-slate-100 to-transparent rounded-bl-full pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="inline-block px-4 py-1.5 bg-[#00206B] text-white text-[10px] font-black rounded-lg uppercase tracking-widest mb-4">LAPORAN OPERASIONAL</span>
            <h2 className="text-3xl font-black text-[#00206B] uppercase tracking-tighter">{report.tanggal || report.date || "TANGGAL KOSONG"}</h2>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#00206B] flex items-center justify-center text-white font-black text-xs">
                  {(report.driverName || "D").charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-black text-slate-700 uppercase">{report.driverName || "DRIVER"}</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
              <span className="text-sm font-black text-slate-500 uppercase">
                {report.trayek || "-"} ({report.bus || "-"})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 bg-slate-50 p-5 rounded-2xl">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={completeness >= 80 ? "#00206B" : completeness >= 50 ? "#F59E0B" : "#EF4444"}
                  strokeWidth="4"
                  strokeDasharray={`${completeness}, 100`}
                />
              </svg>
              <span className="absolute text-sm font-black text-[#00206B]">{completeness}%</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KELENGKAPAN</p>
              <p className={`text-sm font-black mt-1 uppercase ${completeness >= 80 ? "text-[#00206B]" : completeness >= 50 ? "text-amber-500" : "text-rose-500"}`}>
                {completeness >= 80 ? "DATA AMAN" : completeness >= 50 ? "BELUM LENGKAP" : "DATA KURANG"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-[#00206B] uppercase tracking-widest">SESI BERANGKAT (PAGI)</h3>
            {/* RENDER BADGE STATUS KEDISIPLINAN DI SINI */}
            {String(sesiPagi?.status_waktu || "").toUpperCase() === "TERLAMBAT" ? (
              <span className="bg-rose-100 text-rose-600 border border-rose-200 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                ⚠️ Terlambat
              </span>
            ) : String(sesiPagi?.status_waktu || "").toUpperCase() === "TEPAT WAKTU" ? (
              <span className="bg-emerald-100 text-emerald-600 border border-emerald-200 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                ✅ Tepat Waktu
              </span>
            ) : null}
          </div>
          {sesiPagi ? (
            <div>
              {/* CP1: Inject nopol_kendaraan dan foto_awal */}
              <TimelineItem title="KELUAR GARASI DISHUB" time={sesiPagi.jam_berangkat_kantor} odometer={sesiPagi.km_berangkat_kantor} nopol={sesiPagi.nopol_kendaraan} foto={sesiPagi.foto_awal} />
              <TimelineItem title="TIBA DI TITIK START" time={sesiPagi.jam_berangkat_start} odometer={sesiPagi.km_berangkat_start} />
              <TimelineItem title="TIBA DI SEKOLAH (FINISH)" time={sesiPagi.jam_tiba_finish} odometer={sesiPagi.km_tiba_finish} passengers={sesiPagi.jumlah_penumpang} />
              {/* CP4: Inject foto_akhir */}
              <TimelineItem title="KEMBALI KE DISHUB" time={sesiPagi.jam_tiba_kantor} odometer={sesiPagi.km_tiba_kantor} foto={sesiPagi.foto_akhir} isLast={true} />
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 font-black text-xs uppercase tracking-widest bg-slate-50 rounded-2xl">DATA SESI PAGI KOSONG</div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-[#00206B] uppercase tracking-widest">SESI PULANG (SIANG)</h3>
            {/* RENDER BADGE STATUS KEDISIPLINAN DI SINI */}
            {String(sesiSiang?.status_waktu || "").toUpperCase() === "TERLAMBAT" ? (
              <span className="bg-rose-100 text-rose-600 border border-rose-200 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                ⚠️ Terlambat
              </span>
            ) : String(sesiSiang?.status_waktu || "").toUpperCase() === "TEPAT WAKTU" ? (
              <span className="bg-emerald-100 text-emerald-600 border border-emerald-200 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                ✅ Tepat Waktu
              </span>
            ) : null}
          </div>
          {sesiSiang ? (
            <div>
              {/* CP1: Inject nopol_kendaraan dan foto_awal */}
              <TimelineItem title="KELUAR GARASI DISHUB" time={sesiSiang.jam_berangkat_kantor} odometer={sesiSiang.km_berangkat_kantor} nopol={sesiSiang.nopol_kendaraan} foto={sesiSiang.foto_awal} />
              <TimelineItem title="TIBA DI TITIK START" time={sesiSiang.jam_berangkat_start} odometer={sesiSiang.km_berangkat_start} />
              <TimelineItem title="TIBA DI SEKOLAH (FINISH)" time={sesiSiang.jam_tiba_finish} odometer={sesiSiang.km_tiba_finish} passengers={sesiSiang.jumlah_penumpang} />
              {/* CP4: Inject foto_akhir */}
              <TimelineItem title="KEMBALI KE DISHUB" time={sesiSiang.jam_tiba_kantor} odometer={sesiSiang.km_tiba_kantor} foto={sesiSiang.foto_akhir} isLast={true} />
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 font-black text-xs uppercase tracking-widest bg-slate-50 rounded-2xl">DATA SESI SIANG KOSONG</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm mt-6">
        <h3 className="text-sm font-black text-[#00206B] uppercase tracking-widest mb-6">KONDISI KENDARAAN (INSPEKSI)</h3>
        <RenderInspeksiBox dataInspeksi={inspeksiPagi} title="SESI PAGI" />
        <RenderInspeksiBox dataInspeksi={inspeksiSiang} title="SESI SIANG" />
      </div>
    </div>
  );
};

export default DetailLaporan;


---

### src/pages/driver/LaporanDriver.jsx

jsx
import React, { useState, useRef, useEffect } from "react";
import { apiService } from "../../services/api";
import imageCompression from "browser-image-compression";

const dataURLtoFile = (dataurl, filename) => {
  let arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const LiveCamera = ({ onCapture, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) {
        alert("Akses kamera ditolak!");
        onCancel();
      }
    };
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg");
      if (stream) stream.getTracks().forEach((track) => track.stop());
      onCapture(imageData);
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-3">
      <div className="relative w-full aspect-[3/4] max-w-sm mx-auto bg-black rounded-lg overflow-hidden border-2 border-[#00206B]">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="flex gap-2 w-full max-w-sm mx-auto">
        <button type="button" onClick={takePhoto} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded shadow-md text-sm">
          Ambil Foto
        </button>
        <button
          type="button"
          onClick={() => {
            if (stream) stream.getTracks().forEach((t) => t.stop());
            onCancel();
          }}
          className="bg-rose-600 text-white font-bold py-3 px-6 rounded shadow-md text-sm"
        >
          Batal
        </button>
      </div>
    </div>
  );
};

const LaporanDriver = ({ user, currentShift = "pagi", onFinishShift }) => {
  // --- PERSISTENT DRAFT INITIALIZATION ---
  const getDraft = () => {
    const saved = localStorage.getItem("siclus_draft_form");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const localNow = new Date();
        const today = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, "0")}-${String(localNow.getDate()).padStart(2, "0")}`;
        // Jika draft berasal dari tanggal yang berbeda, bersihkan agar tidak memakai draft kemarin
        if (parsed.draftDate && parsed.draftDate !== today) {
          localStorage.removeItem("siclus_draft_step");
          localStorage.removeItem("siclus_draft_form");
          localStorage.removeItem("siclus_active_laporan_id");
          return null;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  };
  const initialDraft = getDraft();

  // 1. STATE UNTUK STEP AKTIF (CP1, CP2, dll)
  const [activeCP, setActiveCP] = useState(() => {
    const savedStep = localStorage.getItem("siclus_draft_step");
    return savedStep ? parseInt(savedStep, 10) : 1;
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [cpToConfirm, setCpToConfirm] = useState(null); // Fitur Safety Lock

  // 2. STATE UNTUK DATA FORM / SESI / INSPEKSI
  const [laporanId, setLaporanId] = useState(() => {
    return localStorage.getItem("siclus_active_laporan_id") || initialDraft?.laporanId || null;
  });
  const [sesiId, setSesiId] = useState(() => initialDraft?.sesiId || null);

  // SINKRONISASI: Simpan laporanId ke localStorage
  useEffect(() => {
    if (laporanId) {
      localStorage.setItem("siclus_active_laporan_id", String(laporanId));
    }
  }, [laporanId]);

  const [merkKendaraan, setMerkKendaraan] = useState(() => initialDraft?.merkKendaraan || "");
  const [nopol, setNopol] = useState(() => initialDraft?.nopol || "");
  const [odoAwal, setOdoAwal] = useState(() => initialDraft?.odoAwal || initialDraft?.odometer_awal || "");
  const [odo2, setOdo2] = useState(() => initialDraft?.odo2 || "");
  const [odo3, setOdo3] = useState(() => initialDraft?.odo3 || "");
  const [odo4, setOdo4] = useState(() => initialDraft?.odo4 || "");
  const [penumpang, setPenumpang] = useState(() => initialDraft?.penumpang || "");
  const [catatan, setCatatan] = useState(() => initialDraft?.catatan || "");

  const [isPhotoSaved, setIsPhotoSaved] = useState(() => initialDraft?.isPhotoSaved || false);
  const [photoPreview, setPhotoPreview] = useState(() => initialDraft?.photoPreview || null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [inspeksi, setInspeksi] = useState(() => initialDraft?.inspeksi || {
    rem: null,
    ac: null,
    lampu: null,
    klakson: null,
    wiper: null,
    lampu_rem: null,
    bell: null,
    pintu: null,
    kebersihan: null,
  });

  // AUTO-SAVE: Sinkronisasi step ke localStorage
  useEffect(() => {
    localStorage.setItem("siclus_draft_step", activeCP.toString());
  }, [activeCP]);

  // AUTO-SAVE: Sinkronisasi seluruh field form ke localStorage
  useEffect(() => {
    const localNow = new Date();
    const today = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, "0")}-${String(localNow.getDate()).padStart(2, "0")}`;
    const draftPayload = {
      draftDate: today,
      laporanId,
      sesiId,
      merkKendaraan,
      nopol,
      odoAwal,
      odometer_awal: odoAwal,
      odo2,
      odo3,
      odo4,
      penumpang,
      catatan,
      inspeksi,
      isPhotoSaved,
      photoPreview,
    };
    try {
      localStorage.setItem("siclus_draft_form", JSON.stringify(draftPayload));
    } catch (e) {
      console.warn("Gagal menyimpan snapshot foto ke localStorage, menyimpan draft teks saja:", e);
      try {
        localStorage.setItem("siclus_draft_form", JSON.stringify({ ...draftPayload, photoPreview: null }));
      } catch (err) {
        console.error("Gagal auto-save form:", err);
      }
    }
  }, [
    laporanId,
    sesiId,
    merkKendaraan,
    nopol,
    odoAwal,
    odo2,
    odo3,
    odo4,
    penumpang,
    catatan,
    inspeksi,
    isPhotoSaved,
    photoPreview,
  ]);

  useEffect(() => {
    const initLaporan = async () => {
      // 1. Cek dari localStorage dulu
      const savedLaporanId = localStorage.getItem("siclus_active_laporan_id");
      if (savedLaporanId) {
        if (!laporanId) setLaporanId(savedLaporanId);
        return;
      }
      if (laporanId) {
        localStorage.setItem("siclus_active_laporan_id", String(laporanId));
        return;
      }

      try {
        const localNow = new Date();
        const year = localNow.getFullYear();
        const month = String(localNow.getMonth() + 1).padStart(2, "0");
        const day = String(localNow.getDate()).padStart(2, "0");
        const today = `${year}-${month}-${day}`;

        const res = await (apiService.mulaiLaporanHarian || apiService.mulaiLaporan)({
          tanggal: today,
          trayek: user?.trayek || "-",
          bus: user?.bus || "-",
        });
        if (res && res.id) {
          localStorage.setItem("siclus_active_laporan_id", String(res.id));
          setLaporanId(res.id);
        }
      } catch (err) {
        console.error("Gagal init laporan:", err);
      }
    };
    initLaporan();
  }, [user, laporanId]);

  const handleCeklis = (item, status) => setInspeksi((prev) => ({ ...prev, [item]: status }));
  const totalCeklis = Object.values(inspeksi).filter((val) => val !== null).length;
  const adaKurang = Object.values(inspeksi).includes("KURANG");

  // Logika Validasi (Jika ada "KURANG", wajib isi catatan)
  const isInspeksiValid = adaKurang ? totalCeklis === 9 && catatan.trim() !== "" : totalCeklis === 9;
  const isCP1Ready = isInspeksiValid && isPhotoSaved && odoAwal !== "" && merkKendaraan !== "" && nopol !== "";

  const handlePreSubmit = (e, cpNumber) => {
    e.preventDefault();
    setCpToConfirm(cpNumber);
  };

  const submitCP1 = async () => {
    const activeLaporanId = laporanId || localStorage.getItem("siclus_active_laporan_id");
    if (!activeLaporanId) return alert("Sistem memuat ID Laporan. Tunggu sebentar.");
    setIsProcessing(true);
    try {
      const fileFoto = dataURLtoFile(photoPreview, `selfie_awal.jpg`);

      // --- PROSES KOMPRESI ---
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(fileFoto, options);

      // Kirim file yang sudah dikompres
      const uploadRes = await apiService.uploadSelfie(compressedFile);

      await apiService.submitInspeksi(activeLaporanId, { 
        ...inspeksi, 
        tipe_sesi: currentShift.toUpperCase(), // <-- WAJIB KIRIM INI
        catatan: adaKurang ? catatan : "" 
      });

      const platNomorFinal = `${merkKendaraan.trim()} - ${nopol.trim()}`;
      const cp1Res = await apiService.submitCP1(activeLaporanId, {
        tipe_sesi: currentShift,
        nopol_kendaraan: platNomorFinal,
        km_berangkat_kantor: parseInt(odoAwal),
        foto_awal: uploadRes.url_foto,
      });

      const newSesiId = cp1Res?.data?.id || cp1Res?.id;
      if (newSesiId) setSesiId(newSesiId);
      setCpToConfirm(null);
      setActiveCP(2);
    } catch (err) {
      alert("Gagal kirim CP1: " + (err.response?.data?.detail || err.message));
      setCpToConfirm(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitCP2 = async () => {
    setIsProcessing(true);
    try {
      await apiService.submitCP2(sesiId, { km_berangkat_start: parseInt(odo2) });
      setCpToConfirm(null);
      setActiveCP(3);
    } catch (err) {
      alert("Gagal kirim CP2: " + (err.response?.data?.detail || err.message));
      setCpToConfirm(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitCP3 = async () => {
    setIsProcessing(true);
    try {
      await apiService.submitCP3(sesiId, {
        km_tiba_finish: parseInt(odo3),
        jumlah_penumpang: parseInt(penumpang),
      });
      setIsPhotoSaved(false);
      setPhotoPreview(null);
      setCpToConfirm(null);
      setActiveCP(4);
    } catch (err) {
      alert("Gagal kirim CP3: " + (err.response?.data?.detail || err.message));
      setCpToConfirm(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitCP4 = async () => {
    setIsProcessing(true);
    try {
      const fileFoto = dataURLtoFile(photoPreview, `selfie_akhir.jpg`);

      // --- PROSES KOMPRESI ---
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(fileFoto, options);

      // Kirim file yang sudah dikompres
      const uploadRes = await apiService.uploadSelfie(compressedFile);

      await apiService.submitCP4(sesiId, {
        km_tiba_kantor: parseInt(odo4),
        foto_akhir: uploadRes.url_foto,
      });

      // BERSIHKAN DRAFT LOKAL SETELAH TUGAS SELESAI
      localStorage.removeItem("siclus_draft_step");
      localStorage.removeItem("siclus_draft_form");
      localStorage.removeItem("siclus_active_laporan_id");

      alert("Shift Berhasil Ditutup!");
      if (onFinishShift) onFinishShift();
    } catch (err) {
      alert("Gagal kirim CP4: " + (err.response?.data?.detail || err.message));
      setCpToConfirm(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const CheckItem = ({ id, label }) => (
    <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
      <span className="text-xs font-bold text-[#00206B] truncate w-20">{label}</span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => handleCeklis(id, "OK")}
          className={`text-[9px] font-black px-3 py-1.5 rounded transition-colors ${inspeksi[id] === "OK" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}
        >
          OK
        </button>
        <button
          type="button"
          onClick={() => handleCeklis(id, "KURANG")}
          className={`text-[9px] font-black px-2 py-1.5 rounded transition-colors ${inspeksi[id] === "KURANG" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"}`}
        >
          KURANG
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 px-4 md:px-0 font-sans">
      {/* 🔴 CHECK POINT 1 🔴 */}
      <div className={`border rounded-xl bg-white transition-all ${activeCP === 1 ? "border-[#00206B] shadow-md" : "border-slate-200"}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-black text-[#00206B] text-sm tracking-wide">CHECK POINT 1: KELUAR DISHUB</h3>
          {activeCP > 1 && <span className="text-emerald-600 font-black text-sm">✓</span>}
        </div>

        {activeCP >= 1 && (
          <form onSubmit={(e) => handlePreSubmit(e, 1)} className={`p-6 ${activeCP > 1 ? "opacity-60 pointer-events-none" : ""}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TRAYEK PENUGASAN</p>
                  <h4 className="text-xl font-black text-[#00206B]">{user?.trayek || "-"}</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">MERK MOBIL</label>
                    <input
                      type="text"
                      required
                      value={merkKendaraan}
                      onChange={(e) => setMerkKendaraan(e.target.value.toUpperCase())}
                      className="w-full p-3 border border-slate-200 rounded-lg font-bold text-[#00206B] outline-none focus:border-[#00206B]"
                      placeholder="Cth: ISUZU"
                    />
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">NO. POLISI</label>
                    <input
                      type="text"
                      required
                      value={nopol}
                      onChange={(e) => setNopol(e.target.value.toUpperCase())}
                      className="w-full p-3 border border-slate-200 rounded-lg font-bold text-[#00206B] outline-none focus:border-[#00206B]"
                      placeholder="Cth: S 1234 XA"
                    />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">ODOMETER AWAL (KM)</label>
                  <input
                    type="number"
                    required
                    value={odoAwal}
                    onChange={(e) => setOdoAwal(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-lg font-bold text-[#00206B] outline-none focus:border-[#00206B]"
                    placeholder="Contoh: 67008"
                  />
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">AMBIL FOTO WAJAH</span>
                  {isCameraOpen ? (
                    <LiveCamera
                      onCapture={(img) => {
                        setPhotoPreview(img);
                        setIsPhotoSaved(true);
                        setIsCameraOpen(false);
                      }}
                      onCancel={() => setIsCameraOpen(false)}
                    />
                  ) : !isPhotoSaved ? (
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="w-full aspect-[3/4] max-w-sm mx-auto flex flex-col items-center justify-center border-2 border-dashed border-[#00206B] text-[#00206B] bg-blue-50 font-bold text-sm rounded-lg hover:bg-blue-100 transition"
                    >
                      Buka Kamera
                    </button>
                  ) : (
                    <div className="relative w-full aspect-[3/4] max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-emerald-500">
                      <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded shadow z-10">✓ Foto Tersimpan</div>
                      <img src={photoPreview} alt="Selfie" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setIsCameraOpen(true)} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                        Ulangi Foto
                      </button>
                    </div>
                  )}
                </div>
              </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">INSPEKSI KENDARAAN</h4>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">Lakukan pemeriksaan fungsional sebelum perjalanan.</p>
                    </div>
                    <div className="bg-[#00206B] text-white px-3 py-1.5 rounded-lg text-center shadow-sm">
                      <span className="block text-xs font-black">{totalCeklis}/9</span>
                      <span className="block text-[7px] uppercase font-bold">Diperiksa</span>
                    </div>
                  </div>

                  {/* BUNGKUS GRID 2 KOLOM HANYA UNTUK CHECKITEM */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <CheckItem id="rem" label="Rem" />
                    <CheckItem id="ac" label="AC" />
                    <CheckItem id="lampu" label="Lampu" />
                    <CheckItem id="klakson" label="Klakson" />
                    <CheckItem id="wiper" label="Wiper" />
                    <CheckItem id="lampu_rem" label="Lampu Rem" />
                    <CheckItem id="bell" label="Bell" />
                    <CheckItem id="pintu" label="Pintu" />
                    <CheckItem id="kebersihan" label="Kebersihan" />
                  </div>
                  {/* PENUTUP GRID 2 KOLOM DI SINI */}

                  {/* KOTAK CATATAN DI LUAR GRID BIAR FULL WIDTH */}
                  {adaKurang && (
                    <div className="mt-4 flex-grow flex flex-col bg-amber-50 p-4 rounded-xl border-2 border-amber-300 shadow-sm transition-all animate-[fadeIn_0.3s]">
                      <label className="text-[11px] font-black text-amber-800 uppercase tracking-wider block mb-2">Catatan Kerusakan (Wajib)</label>
                      <textarea
                        required
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        className="flex-grow w-full min-h-[120px] p-3 border border-amber-300 rounded-lg text-sm text-slate-700 font-medium outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-shadow resize-none"
                        placeholder="Jelaskan detail komponen yang kurang berfungsi atau rusak..."
                      ></textarea>
                    </div>
                  )}
                </div>
            </div>

            {activeCP === 1 &&
              (cpToConfirm === 1 ? (
                <div className="mt-6 p-4 bg-[#FCE8E6] border-2 border-[#C5221F] rounded-xl shadow-sm">
                  <p className="text-sm font-bold text-[#C5221F] mb-3">Tunggu! Pastikan angka Odometer ({odoAwal} KM) dan Nopol sudah benar. Data tidak bisa diubah setelah terkirim!</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={submitCP1} disabled={isProcessing} className="flex-1 bg-[#C5221F] text-white font-black py-3 rounded-lg shadow-md">
                      Ya, Kirim Permanen
                    </button>
                    <button type="button" onClick={() => setCpToConfirm(null)} className="flex-1 bg-white text-[#C5221F] font-bold py-3 rounded-lg border-2 border-[#C5221F]">
                      Batal / Cek Lagi
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!isCP1Ready || isProcessing}
                  className={`w-full mt-6 py-4 rounded-xl font-black text-white transition-all shadow-md ${isCP1Ready ? "bg-[#00206B]" : "bg-slate-300"}`}
                >
                  KIRIM CP 1 & CATAT JAM KELUAR
                </button>
              ))}
          </form>
        )}
      </div>

      {/* 🔴 CHECK POINT 2 🔴 */}
      <div className={`border rounded-xl bg-white transition-all ${activeCP === 2 ? "border-[#00206B] shadow-md" : "border-slate-200"}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className={`font-black text-sm tracking-wide ${activeCP >= 2 ? "text-[#00206B]" : "text-slate-400"}`}>CHECK POINT 2: TIBA DI TITIK START</h3>
        </div>
        {activeCP >= 2 && (
          <form onSubmit={(e) => handlePreSubmit(e, 2)} className={`p-6 ${activeCP > 2 ? "opacity-60 pointer-events-none" : ""}`}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">ODOMETER HALTE PERTAMA (KM)</label>
            <input
              type="number"
              required
              value={odo2}
              onChange={(e) => setOdo2(e.target.value)}
              className="w-full md:w-1/2 p-3 border border-slate-200 rounded-lg font-bold text-[#00206B] outline-none"
              placeholder="0"
            />

            {activeCP === 2 &&
              (cpToConfirm === 2 ? (
                <div className="mt-4 p-4 bg-[#FCE8E6] border-2 border-[#C5221F] rounded-xl shadow-sm md:w-1/2">
                  <p className="text-sm font-bold text-[#C5221F] mb-3">Odometer Halte = {odo2} KM. Lanjutkan?</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={submitCP2} disabled={isProcessing} className="flex-1 bg-[#C5221F] text-white font-bold py-2 rounded-lg">
                      Kirim
                    </button>
                    <button type="button" onClick={() => setCpToConfirm(null)} className="flex-1 bg-white text-[#C5221F] font-bold py-2 rounded-lg border border-[#C5221F]">
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button type="submit" className="block w-full md:w-1/2 mt-4 bg-[#00206B] text-white font-bold py-3 rounded-lg shadow-md">
                  SIMPAN & CATAT WAKTU TIBA
                </button>
              ))}
          </form>
        )}
      </div>

      {/* 🔴 CHECK POINT 3 🔴 */}
      <div className={`border rounded-xl bg-white transition-all ${activeCP === 3 ? "border-[#00206B] shadow-md" : "border-slate-200"}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className={`font-black text-sm tracking-wide ${activeCP >= 3 ? "text-[#00206B]" : "text-slate-400"}`}>CHECK POINT 3: TIBA DI TITIK FINISH</h3>
        </div>
        {activeCP >= 3 && (
          <form onSubmit={(e) => handlePreSubmit(e, 3)} className={`p-6 grid grid-cols-1 md:grid-cols-2 gap-6 ${activeCP > 3 ? "opacity-60 pointer-events-none" : ""}`}>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">ODOMETER SEKOLAH (KM)</label>
              <input type="number" required value={odo3} onChange={(e) => setOdo3(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg font-bold text-[#00206B]" placeholder="0" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">TOTAL SISWA DIANGKUT</label>
              <input
                type="number"
                required
                value={penumpang}
                onChange={(e) => setPenumpang(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg font-bold text-[#00206B]"
                placeholder="0"
              />
            </div>

            {activeCP === 3 && (
              <div className="col-span-1 md:col-span-2">
                {cpToConfirm === 3 ? (
                  <div className="mt-2 p-4 bg-[#FCE8E6] border-2 border-[#C5221F] rounded-xl shadow-sm">
                    <p className="text-sm font-bold text-[#C5221F] mb-3">
                      Odometer Akhir {odo3} KM & Jumlah {penumpang} Siswa. Data Benar?
                    </p>
                    <div className="flex gap-3">
                      <button type="button" onClick={submitCP3} disabled={isProcessing} className="flex-1 bg-[#C5221F] text-white font-bold py-2 rounded-lg">
                        Kirim Permanen
                      </button>
                      <button type="button" onClick={() => setCpToConfirm(null)} className="flex-1 bg-white text-[#C5221F] font-bold py-2 rounded-lg border border-[#C5221F]">
                        Cek Lagi
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="submit" className="w-full mt-2 bg-[#00206B] text-white font-bold py-3 rounded-lg shadow-md">
                    SIMPAN & CATAT WAKTU SELESAI
                  </button>
                )}
              </div>
            )}
          </form>
        )}
      </div>

      {/* 🔴 CHECK POINT 4 🔴 */}
      <div className={`border rounded-xl bg-white transition-all ${activeCP === 4 ? "border-[#C5221F] shadow-md" : "border-slate-200"}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className={`font-black text-sm tracking-wide ${activeCP >= 4 ? "text-[#00206B]" : "text-slate-400"}`}>CHECK POINT 4: KEMBALI KE DISHUB</h3>
        </div>
        {activeCP === 4 && (
          <form onSubmit={(e) => handlePreSubmit(e, 4)} className="p-6 space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">ODOMETER AKHIR GARASI (KM)</label>
              <input
                type="number"
                required
                value={odo4}
                onChange={(e) => setOdo4(e.target.value)}
                className="w-full md:w-1/2 p-3 border border-slate-200 rounded-lg font-bold text-[#00206B]"
                placeholder="0"
              />
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:w-1/2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">FOTO WAJAH AKHIR SHIFT</span>
              {isCameraOpen ? (
                <LiveCamera
                  onCapture={(img) => {
                    setPhotoPreview(img);
                    setIsPhotoSaved(true);
                    setIsCameraOpen(false);
                  }}
                  onCancel={() => setIsCameraOpen(false)}
                />
              ) : !isPhotoSaved ? (
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full aspect-[3/4] max-w-sm mx-auto flex flex-col items-center justify-center border-2 border-dashed border-[#00206B] text-[#00206B] bg-blue-50 font-bold hover:bg-blue-100 transition"
                >
                  Buka Kamera Akhir
                </button>
              ) : (
                <div className="relative w-full aspect-[3/4] max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-emerald-500">
                  <img src={photoPreview} alt="Selfie" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setIsCameraOpen(true)} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                    Ulangi Foto
                  </button>
                </div>
              )}
            </div>

            {cpToConfirm === 4 ? (
              <div className="p-4 bg-[#FCE8E6] border-2 border-[#C5221F] rounded-xl shadow-sm">
                <p className="text-sm font-bold text-[#C5221F] mb-3">Tutup Laporan Harian dengan Odometer Garasi {odo4} KM?</p>
                <div className="flex gap-3">
                  <button type="button" onClick={submitCP4} disabled={isProcessing} className="flex-1 bg-[#C5221F] text-white font-black py-4 rounded-xl shadow-md">
                    TUTUP SHIFT SEKARANG
                  </button>
                  <button type="button" onClick={() => setCpToConfirm(null)} className="flex-1 bg-white text-[#C5221F] font-bold py-4 rounded-xl border-2 border-[#C5221F]">
                    BATAL
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!isPhotoSaved}
                className={`w-full py-4 rounded-xl shadow-md font-black text-white transition-all ${!isPhotoSaved ? "bg-slate-300" : "bg-[#C5221F] hover:bg-red-800"}`}
              >
                SUBMIT FINAL & TUTUP SHIFT
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default LaporanDriver;


---

### src/pages/driver/ProfilDriver.jsx

jsx
import React, { useState, useRef, useEffect } from "react";
import { apiService } from "../../services/api";
import imageCompression from "browser-image-compression";

const ProfilDriver = ({ user, onLogout, onUpdateUser }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(user?.foto_profil || null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFotoPreview(user.foto_profil || null);
    }
  }, [user]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Kompresi Gambar agar sangat ringan (Max 200KB)
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // Kirim ke Backend
      const res = await apiService.updateFotoProfil(compressedFile);

      // Update UI dengan URL baru dari server
      if (res && res.foto_profil) {
        setFotoPreview(res.foto_profil);

        // Opsional: Update data user di localStorage agar menetap
        const savedUser = JSON.parse(localStorage.getItem("siclus_user"));
        if (savedUser) {
          savedUser.foto_profil = res.foto_profil;
          localStorage.setItem("siclus_user", JSON.stringify(savedUser));
          // 🔥 TRIGGER GLOBAL RE-RENDER DI SINI 🔥
          if (onUpdateUser) onUpdateUser(savedUser);
        }
      }
    } catch (error) {
      alert("Gagal upload foto profil: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto pb-6 relative">
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-black text-[#00206B] m-0 tracking-wide uppercase">Profil Driver</h2>
        <p className="text-sm text-slate-400 font-semibold mt-0.5">Kelola informasi data diri operasional Anda</p>
      </div>
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-[#00206B] to-blue-500"></div>
        <div className="relative z-10 flex flex-col items-center mt-12 px-6 pb-8">
          {/* INPUT FILE HIDDEN */}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

          {/* WADAH AVATAR BISA DIKLIK */}
          <div
            onClick={() => !isUploading && fileInputRef.current.click()}
            className="w-28 h-28 rounded-full bg-white p-1.5 shadow-lg cursor-pointer group relative"
            title="Klik untuk ubah foto profil"
          >
            <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 relative">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-14 h-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}

              {/* OVERLAY LOADING ATAU HOVER */}
              <div
                className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white transition-opacity duration-200 ${isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              >
                {isUploading ? (
                  <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Uploading...</span>
                ) : (
                  <>
                    <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-widest">Ubah Foto</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <h3 className="mt-4 text-2xl font-black text-[#00206B]">
            {user?.nama_lengkap || user?.nama || user?.name || "Nama Driver"}
          </h3>
          <span className="bg-blue-50 text-blue-600 font-bold px-4 py-1.5 rounded-full text-xs mt-2 uppercase tracking-wide border border-blue-100">{user?.role || "Driver"}</span>

          {/* GRID INFO DRIVER (Tanpa Armada Default) */}
          <div className="mt-8 grid grid-cols-2 gap-3 w-full">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">ID Driver</span>
              <span className="font-extrabold text-[#00206B] text-sm truncate block">{user?.id || "-"}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Trayek Tetap</span>
              <span className="font-extrabold text-[#00206B] text-sm truncate block">{user?.trayek || "-"}</span>
            </div>
          </div>

          <div className="w-full mt-8 pt-6 border-t border-slate-100">
            <button onClick={onLogout} className="w-full bg-[#FCE8E6] hover:bg-[#FAD2CF] transition-colors text-[#C5221F] font-extrabold py-4 px-4 rounded-2xl cursor-pointer">
              🚪 KELUAR APLIKASI (LOGOUT)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilDriver;


---

### src/pages/driver/RiwayatDriver.jsx

jsx
import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";

const RiwayatDriver = ({ onViewDetail, user }) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    apiService
      .getRiwayatDriver()
      .then((res) => {
        const rawList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        const formattedData = rawList.map((item) => {
          const isShiftClosed = item.trip_sessions?.some(sesi => sesi.jam_tiba_kantor !== null);
          return {
            ...item,
            driverName: user?.nama_lengkap || user?.nama || user?.name || "Driver",
            date: item.tanggal,
            trayek: item.trayek,
            bus: item.bus,
            submittedAt: isShiftClosed ? "SELESAI DIREKAM" : (item.trip_sessions?.length > 0 ? "SEDANG BERJALAN" : "BELUM DIMULAI"),
          };
        });

        // --- KODE FILTER BARU ---
        // Hanya simpan laporan yang statusnya sudah Selesai Direkam
        const filteredData = formattedData.filter(report => report.submittedAt === "SELESAI DIREKAM");

        // Urutkan dan set ke state
        filteredData.sort((a, b) => new Date(b.created_at || b.tanggal) - new Date(a.created_at || a.tanggal));
        setReports(filteredData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Gagal menarik data riwayat driver:", err);
        setIsLoading(false);
      });
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-20">
        <span className="text-xs font-black text-[#00206B] uppercase tracking-widest animate-pulse">MEMUAT RIWAYAT PERJALANAN...</span>
      </div>
    );
  }

  const driverInitial = (user?.nama_lengkap || user?.nama || user?.name || "P").charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-2">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#00206B] uppercase tracking-tighter">RIWAYAT PERJALANAN</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">CATATAN OPERASIONAL HARIAN SISTEM</p>
      </div>

      {reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report, index) => {
            const isCompleted = report.submittedAt === "SELESAI DIREKAM";
            return (
              <div
                key={index}
                onClick={() => onViewDetail && onViewDetail(report)}
                className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-white flex items-center justify-between"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-[#00206B] flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-sm">{driverInitial}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-[#00206B] uppercase tracking-wide truncate">LAPORAN OPERASIONAL</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{report.date}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {report.trayek} ({report.bus})
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <span
                        className={`inline-block px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isCompleted ? "bg-[#00206B] text-white shadow-sm" : "bg-slate-100 text-slate-500"}`}
                      >
                        STATUS: {report.submittedAt}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-slate-300 pr-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-3xl">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">BELUM ADA DATA LAPORAN</span>
        </div>
      )}
    </div>
  );
};

export default RiwayatDriver;


---

### src/services/api.js

jsx
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// jwt token masuk
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("siclus_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// jwt token keluar
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jangan redirect jika request gagal berasal dari proses login itu sendiri
    if (error.response && error.response.status === 401 && !error.config?.url?.includes("/auth/login")) {
      localStorage.removeItem("siclus_token");
      localStorage.removeItem("siclus_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const apiService = {
  // --- AUTH & USER ---
  login: async (email, password) => {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  },

  // ==========================================
  // ZONA DRIVER
  // ==========================================
  getProfilDriver: async () => {
    const response = await apiClient.get("/driver/profil");
    return response.data;
  },
  getJadwalDriver: async () => {
    const response = await apiClient.get("/driver/jadwal");
    return response.data;
  },
  getRiwayatDriver: async () => {
    const response = await apiClient.get("/driver/riwayat");
    return response.data;
  },
  updateFotoProfil: async (fileBlob) => {
    const formData = new FormData();
    formData.append("foto", fileBlob, "profile.jpg");
    const response = await apiClient.put("/driver/profil/foto", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  mulaiLaporan: async (data) => {
    const response = await apiClient.post("/laporan/mulai", data);
    return response.data;
  },
  mulaiLaporanHarian: async (data) => {
    const response = await apiClient.post("/laporan/mulai", data);
    return response.data;
  },
  submitInspeksi: async (laporanId, data) => {
    const response = await apiClient.post(`/laporan/inspeksi?laporan_id=${laporanId}`, data);
    return response.data;
  },
  uploadSelfie: async (fileBlob) => {
    const formData = new FormData();
    formData.append("foto", fileBlob, "selfie.jpg");
    const response = await apiClient.post("/laporan/upload-selfie", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  submitCP1: async (laporanId, data) => {
    const response = await apiClient.post(`/laporan/sesi/cp1?laporan_id=${laporanId}`, data);
    return response.data;
  },
  submitCP2: async (sesiId, data) => {
    const response = await apiClient.put(`/laporan/sesi/cp2/${sesiId}`, data);
    return response.data;
  },
  submitCP3: async (sesiId, data) => {
    const response = await apiClient.put(`/laporan/sesi/cp3/${sesiId}`, data);
    return response.data;
  },
  submitCP4: async (sesiId, data) => {
    const response = await apiClient.put(`/laporan/sesi/cp4/${sesiId}`, data);
    return response.data;
  },

  // ==========================================
  // ZONA ADMIN
  // ==========================================
  getDashboardAdmin: async () => (await apiClient.get("/admin/dashboard")).data,
  getRekapAdmin: async () => (await apiClient.get("/admin/rekap")).data,
  getRiwayatHarianAdmin: async () => (await apiClient.get("/admin/riwayat-harian")).data,
  getPantauanHarian: async () => (await apiClient.get("/admin/riwayat-harian")).data,
  exportExcelAdmin: async () => {
    const res = await apiClient.get("/admin/export-excel", { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Operasional_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  getUsersAdmin: async () => (await apiClient.get("/admin/users")).data,
  createUserAdmin: async (data) => (await apiClient.post("/admin/users", data)).data,
  updateUserAdmin: async (id, data) => (await apiClient.put(`/admin/users/${id}`, data)).data,
  deleteUserAdmin: async (id) => (await apiClient.delete(`/admin/users/${id}`)).data,
  getJadwalAdmin: async () => (await apiClient.get("/admin/jadwal")).data,
  createJadwalAdmin: async (data) => (await apiClient.post("/admin/jadwal", data)).data,
  updateJadwalAdmin: async (id, data) => (await apiClient.put(`/admin/jadwal/${id}`, data)).data,
  updateFotoProfilAdmin: async (fileBlob) => {
    const formData = new FormData();
    formData.append("foto", fileBlob, "profile_admin.jpg"); // Diberi nama default agar lolos validasi ekstensi backend
    const response = await apiClient.put("/admin/profil/foto", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export default apiClient;


---

