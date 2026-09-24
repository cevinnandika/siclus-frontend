import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { apiService } from "./services/api";
import { isMasterAdmin } from "./utils/roleHelper";

// Layouts & Notification
import AppLayout from "./components/layout/AppLayout";
import BottomNav from "./components/layout/BottomNav";
import { Toaster } from "react-hot-toast";

// Pages - Auth
import Login from "./pages/auth/Login";

// Pages - Admin
import BerandaAdmin from "./pages/admin/BerandaAdmin";
import ManageDriver from "./pages/admin/ManageDriver";
import RekapAdmin from "./pages/admin/RekapDriver";
import ProfilAdmin from "./pages/admin/ProfilAdmin";
import ManageAdmin from "./pages/admin/ManageAdmin";

// Pages - Driver
import Beranda from "./pages/driver/BerandaDriver";
import Laporan from "./pages/driver/LaporanDriver";
import RiwayatDriver from "./pages/driver/RiwayatDriver";
import DetailLaporan from "./pages/driver/DetailLaporan";
import ProfilDriver from "./pages/driver/ProfilDriver";

// ==============================================================================
// HELPER: VALIDASI KESESUAIAN ROLE PENGGUNA
// ==============================================================================
const isRoleMatch = (userRole, allowedRole) => {
  if (!userRole) return false;
  const u = userRole.toLowerCase();
  const a = allowedRole.toLowerCase();
  if (a === "driver") return u === "driver" || u === "pengemudi";
  return u === a;
};

// ==============================================================================
// KOMPONEN: PROTECTED ROUTE (PENGAWAL RUTE OTENTIKASI & ROLE)
// ==============================================================================
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

// ==============================================================================
// KOMPONEN UTAMA: APLIKASI SICLUS (ROUTING & GLOBAL STATE ENGINE)
// ==============================================================================
function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [tripStatus, setTripStatus] = useState("belum_mulai");
  const [selectedReport, setSelectedReport] = useState(null);
  const [currentShift] = useState("pagi");
  const [isLaporanLocked, setIsLaporanLocked] = useState(false);
  const [shiftRules, setShiftRules] = useState({ pagi: 5, siang: 12 });

  // ==============================================================================
  // EFFECT: INITIAL CLEANUP LEGACY LOCKS
  // ==============================================================================
  useEffect(() => {
    localStorage.removeItem("siclus_shift");
    localStorage.removeItem("siclus_locked");
  }, []);

  // ==============================================================================
  // EFFECT: INITIAL RESTORE SESI & SINKRONISASI JADWAL
  // ==============================================================================
  useEffect(() => {
    const token = localStorage.getItem("siclus_token");
    const savedUser = localStorage.getItem("siclus_user");

    if (token && savedUser) {
      try {
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
      } catch (err) {
        console.error("Gagal parse data sesi user:", err);
      }
    }
    setIsInitializing(false);
  }, []);

  // ==============================================================================
  // HANDLER: LOGIN SUKSES
  // ==============================================================================
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

  // ==============================================================================
  // HANDLER: LOGOUT & PEMBERSIHAN STORAGE
  // ==============================================================================
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

  // ==============================================================================
  // EFFECT: SINKRONISASI LINTAS TAB (CROSS-TAB INSTANT LOGOUT BILA AKUN DIHAPUS)
  // ==============================================================================
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "siclus_revoked_account" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          const currentUser = JSON.parse(localStorage.getItem("siclus_user") || "{}");
          if (currentUser?.email && data.email && currentUser.email.toLowerCase() === data.email.toLowerCase()) {
            sessionStorage.setItem("siclus_logout_reason", "Akun Anda baru saja dinonaktifkan atau dihapus oleh Administrator Utama.");
            handleLogout();
          }
        } catch (err) {
          console.error("Storage sync err:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ==============================================================================
  // EFFECT: DETEKSI REAL-TIME KEAKTIFAN SESI USER (HEARTBEAT & WINDOW FOCUS)
  // ==============================================================================
  useEffect(() => {
    if (!user) return;

    const checkSessionAlive = async () => {
      if (document.visibilityState !== "visible") return;
      const token = localStorage.getItem("siclus_token");
      if (!token) return;

      try {
        if (user.role?.toLowerCase() === "admin") {
          await apiService.getOperasionalHariIniAdmin();
        } else {
          await apiService.getJadwalDriver();
        }
      } catch (err) {
        // Jika status 401 (akun dihapus di database), axios interceptor di api.js
        // otomatis membersihkan storage dan mengarahkan ke halaman login.
      }
    };

    // Validasi langsung saat user membuka atau beralih kembali ke tab ini
    window.addEventListener("focus", checkSessionAlive);
    document.addEventListener("visibilitychange", checkSessionAlive);

    // Heartbeat berkala setiap 30 detik untuk mendeteksi perubahan dari perangkat lain
    const heartbeatTimer = setInterval(checkSessionAlive, 30000);

    return () => {
      window.removeEventListener("focus", checkSessionAlive);
      document.removeEventListener("visibilitychange", checkSessionAlive);
      clearInterval(heartbeatTimer);
    };
  }, [user]);

  // ==============================================================================
  // HANDLER: NAVIGASI MENU AKTIF
  // ==============================================================================
  const handleMenuClick = (menuId) => {
    const baseRoute = user?.role?.toLowerCase() === "admin" ? "/admin" : "/driver";
    let targetRoute = menuId;
    if (menuId === "riwayatdriver") targetRoute = "dashboard";
    if (menuId === "kelolauser") targetRoute = "kelola";
    navigate(`${baseRoute}/${targetRoute}`);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#131314] text-white flex items-center justify-center">
        Memuat Sistem...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#131314] font-sans antialiased overflow-hidden">
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            border: "1px solid #f1f5f9",
            borderRadius: "1.25rem",
            padding: "12px 16px",
            fontSize: "13px",
            fontWeight: "600",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
          },
        }}
      />
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <AppLayout
          user={user}
          title={"SICLUS"}
          onBack={null}
          activeMenu={location.pathname.split("/").pop()}
          onMenuClick={handleMenuClick}
        >
          <Routes>
            <Route
              path="/"
              element={<Navigate to={user?.role?.toLowerCase() === "admin" ? "/admin/dashboard" : "/driver/beranda"} replace />}
            />

            {/* ================================================================== */}
            {/* ZONA RUTE PENGEMUDI (DRIVER)                                       */}
            {/* ================================================================== */}
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
                          onViewDetail={(report) => {
                            setSelectedReport(report);
                            navigate("/driver/detail-laporan");
                          }}
                        />
                      }
                    />
                    <Route
                      path="detail-laporan"
                      element={<DetailLaporan report={selectedReport} user={user} onBack={() => navigate("/driver/riwayat")} />}
                    />
                    <Route
                      path="akun"
                      element={<ProfilDriver user={user} onLogout={handleLogout} onUpdateUser={setUser} />}
                    />
                    <Route path="*" element={<Navigate to="/driver/beranda" replace />} />
                  </Routes>
                </ProtectedRoute>
              }
            />

            {/* ================================================================== */}
            {/* ZONA RUTE ADMINISTRATOR (ADMIN)                                    */}
            {/* ================================================================== */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute user={user} allowedRole="admin">
                  <Routes>
                    <Route path="dashboard" element={<BerandaAdmin user={user} />} />
                    <Route path="rekap" element={<RekapAdmin user={user} />} />
                    <Route path="kelola" element={<ManageDriver onBack={() => navigate("/admin/dashboard")} />} />
                    <Route
                      path="kelola-admin"
                      element={
                        isMasterAdmin(user) ? (
                          <ManageAdmin />
                        ) : (
                          <Navigate to="/admin/dashboard" replace />
                        )
                      }
                    />
                    <Route path="akun" element={<ProfilAdmin user={user} onLogout={handleLogout} onUpdateUser={setUser} />} />
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
