import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { apiService } from "./services/api";

// Layouts
import AppLayout from "./components/layout/AppLayout";
import BottomNav from "./components/layout/BottomNav";
import { Toaster } from 'react-hot-toast';

// Pages - Auth
import Login from "./pages/auth/Login";

// Pages - Admin
import BerandaAdmin from "./pages/admin/BerandaAdmin";

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
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid #f1f5f9',
            borderRadius: '1.25rem',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          },
        }}
      />
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <AppLayout user={user} title={"SICLUS"} onBack={null} activeMenu={location.pathname.split("/").pop()} onMenuClick={handleMenuClick}>
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
                    <Route path="detail-laporan" element={<DetailLaporan report={selectedReport} user={user} onBack={() => navigate("/driver/riwayat")} />} />
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

                    <Route path="rekap" element={<RekapAdmin user={user} />} />
                    <Route path="kelola" element={<ManageDriver onBack={() => navigate("/admin/dashboard")} />} />
                    <Route path="akun" element={<ProfilAdmin user={user} onLogout={handleLogout} onUpdateUser={setUser} />} />
                    
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
