import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";

const BerandaAdmin = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({
    total_supir_terdaftar: 0,
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

  const fetchData = async (showRefreshPulse = false) => {
    if (showRefreshPulse) setIsRefreshing(true);
    else if (driversList.length === 0) setIsLoading(true);

    try {
      // 1. Fetch Dashboard Stats
      const resDashboard = await apiService.getDashboardAdmin();
      if (resDashboard) {
        const data = resDashboard.data || resDashboard;
        setDashboardData({
          total_supir_terdaftar: data.total_supir_terdaftar ?? data.total_driver ?? data.total_supir ?? data.total_pengemudi ?? 0,
          total_supir_jalan: data.total_supir_jalan ?? data.jalan_hari_ini ?? data.supir_aktif ?? 0,
          total_supir_telat: data.total_supir_telat ?? data.telat_hari_ini ?? data.supir_telat ?? 0,
        });
      }

      // 2. Fetch Daily Sessions for Live Tracking
      const resHarian = await apiService.getOperasionalHariIniAdmin();
      if (resHarian) {
        const rawList = resHarian.data || (Array.isArray(resHarian) ? resHarian : []);
        const tempDrivers = [];

        rawList.forEach((lap) => {
          const driverName = lap.users?.nama || lap.nama_supir || lap.id_supir || "Driver";
          const sessions = lap.trip_sessions || [];

          // Determine driver's current status
          let driverStatus = "Menunggu";
          let statusColor = "bg-slate-50 text-slate-500 border-slate-200";

          if (sessions.length > 0) {
            const lastSession = sessions[sessions.length - 1];
            if (lastSession.jam_tiba_kantor) {
              if (sessions.length > 1) {
                driverStatus = "Selesai (2 Sesi)";
              } else {
                driverStatus = "Selesai (Pagi)";
              }
              statusColor = "bg-[#00206B]/5 text-[#00206B] border-[#00206B]/10";
            } else {
              driverStatus = `Berjalan (Sesi ${lastSession.tipe_sesi || "Pagi"})`;
              statusColor = "bg-[#00206B]/10 text-[#00206B] border-[#00206B]/20";
            }
          }

          // Build Driver Timeline
          const formatTime = (timeStr) => {
            if (!timeStr) return null;
            const d = new Date(timeStr);
            if (isNaN(d.getTime())) return timeStr.substring(0, 5);
            return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
          };

          const driverTimeline = [];

          if (sessions.length === 0) {
            driverTimeline.push({ type: "header", label: "BELUM ADA AKTIVITAS" });
            driverTimeline.push({ label: "Menunggu Pengisian Laporan", time: null, active: false });
          } else {
            sessions.forEach((sesi) => {
              const isPagi = (sesi.tipe_sesi || "").toLowerCase().includes("pagi");
              driverTimeline.push({
                type: "header",
                label: isPagi ? "SESI KEBERANGKATAN SEKOLAH (PAGI)" : "SESI KEPULANGAN SEKOLAH (SIANG)",
              });

              if (sesi.jam_berangkat_start) {
                driverTimeline.push({ label: "Telah Menyelesaikan Inspeksi Kendaraan", time: formatTime(sesi.jam_berangkat_start), active: true });
                
                if (sesi.jam_berangkat_kantor) {
                  const isLate = sesi.status_waktu === "TERLAMBAT";
                  driverTimeline.push({ label: isLate ? "Berangkat dari Kantor Dishub (Terlambat)" : "Berangkat dari Kantor Dishub", time: formatTime(sesi.jam_berangkat_kantor), active: true, isLate });
                  
                  if (sesi.jam_tiba_finish) {
                    driverTimeline.push({ label: "Tiba di Titik Akhir Trayek", time: formatTime(sesi.jam_tiba_finish), active: true });
                    
                    if (sesi.jam_tiba_kantor) {
                      driverTimeline.push({ label: "Telah Kembali ke Kantor Dishub", time: formatTime(sesi.jam_tiba_kantor), active: true });
                    } else {
                      driverTimeline.push({ label: "Sedang Perjalanan Kembali ke Dishub", time: null, active: false });
                    }
                  } else {
                    driverTimeline.push({ label: "Sedang Dalam Perjalanan ke Tujuan", time: null, active: false });
                  }
                } else {
                  driverTimeline.push({ label: "Sedang Menuju Titik Keberangkatan", time: null, active: false });
                }
              } else {
                driverTimeline.push({ label: "Menunggu Pengisian Laporan", time: null, active: false });
              }
            });
          }

          tempDrivers.push({
            id: lap.id,
            id_supir: lap.id_supir,
            nama_supir: driverName,
            trayek: lap.trayek || lap.users?.trayek || "-",
            bus: lap.bus || lap.users?.bus || "-",
            statusLabel: driverStatus,
            statusColor,
            timeline: driverTimeline,
          });
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
    setExpandedDriverId(prev => (prev === id ? null : id));
  };

  // Ikon SVG
  const UserIcon = () => (
    <svg className="w-5 h-5 text-slate-400 group-hover:text-[#00206B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
  const BusIcon = () => (
    <svg className="w-5 h-5 text-emerald-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
  const WarningIcon = () => (
    <svg className="w-5 h-5 text-rose-400 group-hover:text-rose-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
          <p className="text-xs text-slate-500 font-normal mt-1">Selamat Datang Administrator Dishub Kota Mojokerto</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{currentDate}</p>
        </div>

        <div className="flex flex-col sm:items-end gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => fetchData(true)}
            disabled={isLoading || isRefreshing}
            className="self-start sm:self-auto flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 px-5 py-2.5 rounded-xl font-medium text-xs shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? "Memperbarui..." : "Segarkan Data"}
          </button>
          {isPollingPaused && <span className="text-xs text-rose-500 font-medium px-2">Koneksi lambat, auto-refresh ditunda.</span>}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.1)] transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Pengemudi</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#00206B] tracking-tight">{isLoading && dashboardData.total_supir_terdaftar === 0 ? "..." : dashboardData.total_supir_terdaftar}</span>
              <span className="text-xs font-medium text-slate-400">Driver</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-[#00206B]/20 transition-colors">
            <UserIcon />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.1)] transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Sedang Beroperasi</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#00206B] tracking-tight">{isLoading && dashboardData.total_supir_jalan === 0 ? "..." : dashboardData.total_supir_jalan}</span>
              <span className="text-xs font-medium text-slate-400">Aktif</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-emerald-200 transition-colors">
            <BusIcon />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.1)] transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Insiden Keterlambatan</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#00206B] tracking-tight">{isLoading && dashboardData.total_supir_telat === 0 ? "..." : dashboardData.total_supir_telat}</span>
              <span className="text-xs font-medium text-slate-400">Insiden</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-rose-200 transition-colors">
            <WarningIcon />
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
                {!isPollingPaused && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isPollingPaused ? "bg-amber-400" : "bg-emerald-500"}`}></span>
              </span>
              <span className="text-xs font-semibold tracking-wider px-3 py-1 bg-white text-slate-600 rounded-lg border border-slate-200">{driversList.length} TRAYEK AKTIF</span>
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
                  <div key={driver.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                    {/* ACCORDION HEADER */}
                    <div 
                      onClick={() => toggleDriver(driver.id)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[#00206B] font-semibold text-sm bg-slate-50 border border-slate-100 flex-shrink-0">
                          {driver.nama_supir.charAt(0).toUpperCase()}
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
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${driver.statusColor}`}>
                          {driver.statusLabel}
                        </span>
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
                                <div key={idx} className="relative z-10 mb-4 ml-[-4px]">
                                  <span className="text-xs font-semibold tracking-wider text-[#00206B] bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/60">
                                    {item.label}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div key={idx} className={`relative flex items-start gap-4 mb-4 ${!item.active ? 'opacity-50' : ''}`}>
                                {/* Timeline Dot */}
                                <div className={`mt-0.5 flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 z-10 bg-white
                                  ${item.isLate ? 'border-rose-400 text-rose-500' : item.active ? 'border-[#00206B] text-[#00206B]' : 'border-slate-300 text-slate-300'}`}>
                                  {item.active ? (
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                  ) : (
                                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-1.5">
                                  <h4 className={`font-semibold text-xs m-0 ${item.isLate ? 'text-rose-600' : item.active ? 'text-[#00206B]' : 'text-slate-500'}`}>
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
