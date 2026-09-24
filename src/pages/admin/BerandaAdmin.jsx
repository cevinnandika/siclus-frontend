import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { getAdminGreeting } from "../../utils/roleHelper";

// ==============================================================================
// KOMPONEN: BERANDA ADMIN (DASHBOARD PEMANTAUAN OPERASIONAL & PERGERAKAN ARMADA)
// ==============================================================================
const BerandaAdmin = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({
    total_supir_terdaftar: 0,
    total_supir_siaga: 0,
    total_supir_ditugaskan: 0,
    total_supir_jalan: 0,
    total_supir_telat: 0,
  });
  const [driversList, setDriversList] = useState([]);
  const [expandedDriverId, setExpandedDriverId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPollingPaused, setIsPollingPaused] = useState(false);

  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ==============================================================================
  // FUNGSI: TARIK STATISTIK DASHBOARD & OPERASIONAL HARIAN
  // ==============================================================================
  const fetchData = async (showRefreshPulse = false) => {
    if (showRefreshPulse) setIsRefreshing(true);
    else if (driversList.length === 0) setIsLoading(true);

    try {
      // 1. Fetch Dashboard Stats
      let stats = null;
      const resDashboard = await apiService.getDashboardAdmin();
      if (resDashboard) {
        const data = resDashboard.data || resDashboard;
        stats = {
          total_supir_terdaftar: data.total_supir_terdaftar ?? data.total_driver ?? data.total_supir ?? 0,
          total_supir_siaga: data.total_supir_siaga,
          total_supir_ditugaskan: data.total_supir_ditugaskan ?? 0,
          total_supir_jalan: data.total_supir_jalan ?? 0,
          total_supir_telat: data.total_supir_telat ?? 0,
        };
      }

      // 2. Fetch Daily Sessions for Live Tracking
      const resHarian = await apiService.getOperasionalHariIniAdmin();
      if (resHarian) {
        const rawList = resHarian.data || (Array.isArray(resHarian) ? resHarian : []);
        const tempDrivers = [];

        rawList.forEach((lap) => {
          const driverName = lap.users?.nama || lap.nama_supir || lap.id_supir || "Driver";
          const sessions = lap.trip_sessions || [];

          // Format waktu HH:mm WIB
          const formatTime = (timeStr) => {
            if (!timeStr) return null;
            const d = new Date(timeStr);
            if (isNaN(d.getTime())) return timeStr.substring(0, 5) + " WIB";
            return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
          };

          const taskTipe = String(lap.tipe_sesi || "SEMUA")
            .replace(/'/g, "")
            .trim()
            .toUpperCase();

          // Pisahkan sesi Pagi dan Siang
          const sesiPagi = sessions.find((s) => (s.tipe_sesi || "").toUpperCase() === "PAGI");
          const sesiSiang = sessions.find((s) => (s.tipe_sesi || "").toUpperCase() === "SIANG");

          const pagiCompleted = Boolean(sesiPagi?.jam_tiba_kantor);
          const siangCompleted = Boolean(sesiSiang?.jam_tiba_kantor);
          const pagiStarted = Boolean(sesiPagi?.jam_berangkat_kantor);
          const siangStarted = Boolean(sesiSiang?.jam_berangkat_kantor);

          // Tentukan Status Global Driver Hari Ini
          let driverStatus = "Menunggu Tugas";
          let statusColor = "bg-slate-100 text-slate-600 border-slate-200";
          let isAllDone = false;

          if (taskTipe === "BATAL") {
            driverStatus = "OPERASIONAL DIBATALKAN";
            statusColor = "bg-rose-50 text-rose-700 border-rose-300 font-bold";
            isAllDone = true;
          } else if (taskTipe === "PAGI") {
            if (pagiCompleted) {
              driverStatus = "SELESAI OPERASIONAL";
              statusColor = "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold";
              isAllDone = true;
            } else if (pagiStarted) {
              driverStatus = "Sedang Beroperasi (Pagi)";
              statusColor = "bg-amber-50 text-amber-700 border-amber-300 font-semibold";
            }
          } else if (taskTipe === "SIANG") {
            if (siangCompleted) {
              driverStatus = "SELESAI OPERASIONAL";
              statusColor = "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold";
              isAllDone = true;
            } else if (siangStarted) {
              driverStatus = "Sedang Beroperasi (Siang)";
              statusColor = "bg-amber-50 text-amber-700 border-amber-300 font-semibold";
            }
          } else {
            // "SEMUA"
            if (pagiCompleted && siangCompleted) {
              driverStatus = "SELESAI OPERASIONAL";
              statusColor = "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold";
              isAllDone = true;
            } else if (siangStarted) {
              driverStatus = siangCompleted ? "Selesai (Siang)" : "Sedang Beroperasi (Siang)";
              statusColor = siangCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-amber-50 text-amber-700 border-amber-300 font-semibold";
            } else if (pagiCompleted) {
              driverStatus = "Selesai Sesi Pagi (Menunggu Siang)";
              statusColor = "bg-sky-50 text-sky-700 border-sky-300 font-semibold";
            } else if (pagiStarted) {
              driverStatus = "Sedang Beroperasi (Pagi)";
              statusColor = "bg-amber-50 text-amber-700 border-amber-300 font-semibold";
            }
          }

          // Bangun Timeline Operasional Lengkap untuk Sesi Pagi & Siang
          const driverTimeline = [];

          if (taskTipe === "BATAL") {
            driverTimeline.push({
              type: "header",
              label: "PENUGASAN OPERASIONAL DIBATALKAN",
              isComplete: true,
            });
            driverTimeline.push({
              label: "Operasional dibatalkan oleh Admin (Laporan SPJ tetap tersimpan)",
              time: null,
              active: false,
            });
          }

          // --- 1. SESI PAGI (KEBERANGKATAN SEKOLAH) ---
          if (taskTipe !== "SIANG" && taskTipe !== "BATAL") {
            driverTimeline.push({
              type: "header",
              label: "SESI KEBERANGKATAN SEKOLAH (PAGI)",
              isComplete: pagiCompleted,
            });

            if (!sesiPagi || !sesiPagi.jam_berangkat_kantor) {
              driverTimeline.push({
                label: "Menunggu Keberangkatan Armada",
                time: null,
                active: false,
              });
            } else {
              const isLatePagi = sesiPagi.status_waktu === "TERLAMBAT";
              // Tahap 1
              driverTimeline.push({
                label: isLatePagi ? "Tahap 1: Berangkat dari Kantor Dishub (Terlambat)" : "Tahap 1: Berangkat dari Kantor Dishub",
                time: formatTime(sesiPagi.jam_berangkat_kantor),
                active: true,
                isLate: isLatePagi,
              });

              // Tahap 2
              if (sesiPagi.jam_tiba_finish) {
                const siswaInfo = sesiPagi.jumlah_penumpang ? ` • ${sesiPagi.jumlah_penumpang} Siswa` : "";
                driverTimeline.push({
                  label: `Tahap 2: Tiba di Rute Sekolah${siswaInfo}`,
                  time: formatTime(sesiPagi.jam_tiba_finish),
                  active: true,
                });
              } else {
                driverTimeline.push({
                  label: "Tahap 2: Sedang Perjalanan ke Rute Sekolah",
                  time: null,
                  active: false,
                });
              }

              // Tahap 3
              if (sesiPagi.jam_tiba_kantor) {
                driverTimeline.push({
                  label: "Tahap 3: Telah Kembali ke Kantor Dishub (Pelayanan Pagi Selesai)",
                  time: formatTime(sesiPagi.jam_tiba_kantor),
                  active: true,
                  isFinishedSession: true,
                });
              } else {
                driverTimeline.push({
                  label: "Tahap 3: Sedang Perjalanan Kembali ke Dishub",
                  time: null,
                  active: false,
                });
              }
            }
          }

          // --- 2. SESI SIANG (KEPULANGAN SEKOLAH) ---
          if (taskTipe !== "PAGI" && taskTipe !== "BATAL") {
            driverTimeline.push({
              type: "header",
              label: "SESI KEPULANGAN SEKOLAH (SIANG)",
              isComplete: siangCompleted,
            });

            if (!sesiSiang || !sesiSiang.jam_berangkat_kantor) {
              driverTimeline.push({
                label: "Menunggu Keberangkatan Armada",
                time: null,
                active: false,
              });
            } else {
              const isLateSiang = sesiSiang.status_waktu === "TERLAMBAT";
              // Tahap 1
              driverTimeline.push({
                label: isLateSiang ? "Tahap 1: Berangkat dari Kantor Dishub (Terlambat)" : "Tahap 1: Berangkat dari Kantor Dishub",
                time: formatTime(sesiSiang.jam_berangkat_kantor),
                active: true,
                isLate: isLateSiang,
              });

              // Tahap 2
              if (sesiSiang.jam_tiba_finish) {
                const siswaInfo = sesiSiang.jumlah_penumpang ? ` • ${sesiSiang.jumlah_penumpang} Siswa` : "";
                driverTimeline.push({
                  label: `Tahap 2: Tiba di Rute Sekolah${siswaInfo}`,
                  time: formatTime(sesiSiang.jam_tiba_finish),
                  active: true,
                });
              } else {
                driverTimeline.push({
                  label: "Tahap 2: Sedang Perjalanan ke Rute Sekolah",
                  time: null,
                  active: false,
                });
              }

              // Tahap 3
              if (sesiSiang.jam_tiba_kantor) {
                driverTimeline.push({
                  label: "Tahap 3: Telah Kembali ke Kantor Dishub (Pelayanan Siang Selesai)",
                  time: formatTime(sesiSiang.jam_tiba_kantor),
                  active: true,
                  isFinishedSession: true,
                });
              } else {
                driverTimeline.push({
                  label: "Tahap 3: Sedang Perjalanan Kembali ke Dishub",
                  time: null,
                  active: false,
                });
              }
            }
          }

          tempDrivers.push({
            id: lap.id,
            id_supir: lap.id_supir,
            nama_supir: driverName,
            foto_profil: lap.users?.foto_profil || lap.foto_profil || null,
            trayek: lap.trayek || lap.users?.trayek || "-",
            bus: lap.bus || lap.users?.bus || "-",
            statusLabel: driverStatus,
            statusColor,
            isAllDone,
            timeline: driverTimeline,
          });
        });

        // Rekonsiliasi akurat secara realtime berbasis akun driver unik:
        const totalTerdaftar = stats?.total_supir_terdaftar || 10;
        const totalAkunDitugaskan = stats?.total_supir_ditugaskan !== undefined ? stats.total_supir_ditugaskan : 0;

        // Box 2 (Sedang Beroperasi): Akun driver bertugas dikurangi akun driver yang sudah SELESAI
        const liveSedangBeroperasi = stats?.total_supir_jalan !== undefined ? stats.total_supir_jalan : 0;

        // Box 1 (Driver): Total Driver di DB dikurangi Driver yang sedang aktif beroperasi
        const liveDriverSiaga = stats?.total_supir_siaga !== undefined ? stats.total_supir_siaga : Math.max(0, totalTerdaftar - liveSedangBeroperasi);

        // Box 3 (Driver Terlambat): Dihitung per 1 akun driver unik
        const liveDriverTelat = stats?.total_supir_telat !== undefined ? stats.total_supir_telat : 0;

        setDashboardData({
          total_supir_terdaftar: totalTerdaftar,
          total_supir_siaga: liveDriverSiaga,
          total_supir_ditugaskan: totalAkunDitugaskan,
          total_supir_jalan: liveSedangBeroperasi,
          total_supir_telat: liveDriverTelat,
        });

        setDriversList(tempDrivers);
      }
      setIsPollingPaused(false);
    } catch (error) {
      console.error("Gagal mengambil data dashboard admin:", error);
      setIsPollingPaused(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      if (navigator.onLine && document.visibilityState === "visible" && !isPollingPaused) {
        fetchData(false);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isPollingPaused]);

  const toggleDriver = (id) => {
    setExpandedDriverId((prev) => (prev === id ? null : id));
  };

  // Ikon SVG Modern
  const UserIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
  const BusIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
      />
    </svg>
  );
  const WarningIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
  const ChevronDownIcon = ({ isOpen }) => (
    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-6 animate-[fadeIn_0.3s]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold text-[#00206B] m-0 tracking-tight">{user?.nama_lengkap || user?.nama || user?.name || "Admin"}</h2>
          <p className="text-xs text-slate-500 font-normal mt-1">{getAdminGreeting(user)}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{currentDate}</p>
        </div>

        <div className="flex flex-col sm:items-end gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => fetchData(true)}
            disabled={isLoading || isRefreshing}
            className="self-start sm:self-auto flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-700 px-5 py-2.5 rounded-xl font-semibold text-xs shadow-xs hover:shadow-sm hover:shadow-blue-500/10 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : "text-blue-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? "Memperbarui..." : "Segarkan Data"}
          </button>
          {isPollingPaused && <span className="text-xs text-rose-500 font-medium px-2">Koneksi lambat, auto-refresh ditunda.</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Driver (Electric Blue / Indigo) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-white via-blue-50/25 to-indigo-50/35 border border-slate-200/80 hover:border-blue-400/80 shadow-[0_4px_20px_-4px_rgba(0,32,107,0.06)] hover:shadow-[0_20px_40px_-12px_rgba(37,99,235,0.25)] hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group">
          {/* Top Line Glow Accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Ambient Glow Orb */}
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Driver</span>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-3xl font-extrabold text-[#00206B] group-hover:text-blue-600 tracking-tight transition-colors">
                  {isLoading && dashboardData.total_supir_terdaftar === 0 ? "..." : dashboardData.total_supir_siaga}
                </span>
                <span className="text-xs font-semibold text-slate-400">Driver</span>
              </div>
            </div>

            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10 flex-shrink-0">
              <UserIcon />
            </div>
          </div>
        </div>

        {/* Card 2: Sedang Beroperasi (Cyber Mint / Emerald) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/35 border border-slate-200/80 hover:border-emerald-400/80 shadow-[0_4px_20px_-4px_rgba(5,150,105,0.06)] hover:shadow-[0_20px_40px_-12px_rgba(16,185,129,0.25)] hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group">
          {/* Top Line Glow Accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Ambient Glow Orb */}
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Sedang Beroperasi</span>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-3xl font-extrabold text-[#00206B] group-hover:text-emerald-600 tracking-tight transition-colors">
                  {isLoading && dashboardData.total_supir_terdaftar === 0 ? "..." : dashboardData.total_supir_jalan}
                </span>
                <span className="text-xs font-semibold text-slate-400">Aktif</span>
              </div>
            </div>

            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 relative z-10 flex-shrink-0">
              <BusIcon />
            </div>
          </div>
        </div>

        {/* Card 3: Driver Terlambat (Sunset Coral / Rose) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-white via-rose-50/25 to-amber-50/35 border border-slate-200/80 hover:border-rose-400/80 shadow-[0_4px_20px_-4px_rgba(225,29,72,0.06)] hover:shadow-[0_20px_40px_-12px_rgba(244,63,94,0.25)] hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group">
          {/* Top Line Glow Accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Ambient Glow Orb */}
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-gradient-to-br from-rose-400/20 to-orange-500/20 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Driver Terlambat</span>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className={`text-3xl font-extrabold tracking-tight transition-colors ${dashboardData.total_supir_telat > 0 ? "text-rose-600" : "text-[#00206B] group-hover:text-rose-600"}`}>
                  {isLoading && dashboardData.total_supir_terdaftar === 0 ? "..." : dashboardData.total_supir_telat}
                </span>
                <span className="text-xs font-semibold text-slate-400">Driver</span>
              </div>
            </div>

            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-rose-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10 flex-shrink-0">
              <WarningIcon />
            </div>
          </div>
        </div>
      </div>

      {/* COMMAND CENTER LAYOUT - 1 COLUMN ACCORDION */}
      <div className="grid grid-cols-1 gap-6 items-start mt-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-semibold text-[#00206B] m-0 tracking-tight">Pantauan Operasional Hari Ini</h3>
              <p className="text-xs text-slate-500 font-normal mt-1">Klik pada nama driver untuk melihat rincian aktivitas perjalanan.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2 mr-1">
                {dashboardData.total_supir_jalan > 0 && !isPollingPaused && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isPollingPaused ? "bg-amber-400" : dashboardData.total_supir_jalan > 0 ? "bg-emerald-500" : "bg-slate-300"}`}></span>
              </span>
              <span className="text-xs font-semibold tracking-wider px-3 py-1 bg-white text-slate-600 rounded-lg border border-slate-200">{dashboardData.total_supir_jalan} TRAYEK AKTIF</span>
            </div>
          </div>

          {/* Scrollable Driver Operational List Container */}
          <div className="space-y-3 max-h-[calc(100vh-390px)] min-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading && driversList.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl shadow-sm">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-[#00206B] rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-medium text-slate-500 mt-4">Memuat data...</p>
              </div>
            ) : driversList.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <BusIcon />
                </div>
                <h4 className="text-sm font-semibold text-[#00206B] m-0">Belum Ada Penugasan</h4>
                <p className="text-xs text-slate-500 font-normal mt-1">Silakan atur penugasan driver untuk hari ini.</p>
              </div>
            ) : (
              driversList.map((driver) => {
                const isOpen = expandedDriverId === driver.id;

                return (
                  <div
                    key={driver.id}
                    className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden ${
                      driver.isAllDone ? "border-l-4 border-l-emerald-500 border-slate-200" : "border-slate-100"
                    }`}
                  >
                    {/* ACCORDION HEADER */}
                    <div onClick={() => toggleDriver(driver.id)} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-sky-100/90 to-blue-50 border border-slate-200/80 flex items-center justify-center text-[#00206B] font-semibold text-sm shadow-2xs flex-shrink-0">
                          {driver.foto_profil ? (
                            <img
                              src={driver.foto_profil}
                              alt={driver.nama_supir}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.parentElement.innerText = driver.nama_supir.charAt(0).toUpperCase();
                              }}
                            />
                          ) : (
                            driver.nama_supir.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 m-0">{driver.nama_supir}</h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs font-normal text-slate-600">Rute: {driver.trayek}</span>
                            <span className="text-slate-200 text-xs">•</span>
                            <span className="text-xs font-normal text-slate-600">{driver.bus}</span>
                          </div>
                        </div>
                      </div>

                      <div className="self-start sm:self-auto flex items-center gap-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${driver.statusColor}`}>{driver.statusLabel}</span>
                        <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center border border-slate-100">
                          <ChevronDownIcon isOpen={isOpen} />
                        </div>
                      </div>
                    </div>

                    {/* ACCORDION BODY (TIMELINE) */}
                    {isOpen && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-50 bg-slate-50/30">
                        <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[15px] before:translate-y-[10px] before:h-[calc(100%-20px)] before:w-[2px] before:bg-slate-200/60 mt-4 ml-1">
                          {driver.timeline.map((item, idx) => {
                            if (item.type === "header") {
                              return (
                                <div key={idx} className="relative z-10 mb-4 ml-[-4px] flex items-center justify-between">
                                  <span className="text-xs font-semibold tracking-wider text-[#00206B] bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/60">{item.label}</span>
                                  {item.isComplete && (
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                                      <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                      </svg>
                                      SELESAI
                                    </span>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <div key={idx} className={`relative flex items-start gap-4 mb-4 ${!item.active ? "opacity-50" : ""}`}>
                                {/* Timeline Dot */}
                                <div
                                  className={`mt-0.5 flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 z-10 bg-white
                                  ${item.isLate ? "border-rose-400 text-rose-500" : item.isFinishedSession ? "border-emerald-500 bg-emerald-50 text-emerald-600" : item.active ? "border-[#00206B] text-[#00206B]" : "border-slate-300 text-slate-300"}`}
                                >
                                  {item.isFinishedSession ? (
                                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                  ) : item.active ? (
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                  ) : (
                                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-1.5">
                                  <h4
                                    className={`font-semibold text-xs m-0 ${item.isLate ? "text-rose-600" : item.isFinishedSession ? "text-emerald-700 font-bold" : item.active ? "text-[#00206B]" : "text-slate-500"}`}
                                  >
                                    {item.label}
                                  </h4>
                                  {item.time && (
                                    <div className="text-xs font-normal text-slate-500 mt-0.5 flex items-center gap-1.5 tabular-nums">
                                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {item.time}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BerandaAdmin;
