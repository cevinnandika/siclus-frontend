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
      item.status_kedisiplinan === "TERLAMBAT" || item.is_late === true || item.terlambat === true || item.status?.toUpperCase() === "TERLAMBAT" || item.cp1_late === true || item.cp2_late === true;

    const notStarted = item.status === "belum_mulai" || item.status === "BELUM_MULAI" || item.status_operasional === "BELUM_JALAN" || (!item.jam_berangkat_kantor && !item.cp1_time);

    return isLate || notStarted;
  });

  // Jika daftar dari API memiliki field kedisiplinan umum, pisahkan list peringatan
  const displayAlerts = lateOrNotStartedList.length > 0 ? lateOrNotStartedList : riwayatHarian;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-6 animate-[fadeIn_0.3s]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-black text-[#00206B] m-0">{user?.nama_lengkap || user?.nama || user?.name || "Admin"}</h2>
          <p className="text-sm text-slate-500 font-bold">Administrator</p>
          <p className="text-xs text-slate-400 font-semibold mt-1">{currentDate}</p>
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
              <span className="text-3xl font-black text-[#00206B]">{isLoading ? "..." : dashboardData.total_supir_terdaftar}</span>
              <span className="text-xs font-bold text-slate-400">Driver</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500">Terdaftar di sistem master data</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#00206B] flex-shrink-0 text-2xl shadow-inner">🚌</div>
        </div>

        {/* Card 2: Jalan Hari Ini */}
        <div className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider block">JALAN HARI INI</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700">{isLoading ? "..." : dashboardData.total_supir_jalan}</span>
              <span className="text-xs font-bold text-emerald-600">Armada Aktif</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600/80">Driver sedang bertugas</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 text-2xl shadow-inner">🟢</div>
        </div>

        {/* Card 3: Telat Hari Ini */}
        <div className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-black text-rose-600 uppercase tracking-wider block">TELAT HARI INI</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-700">{isLoading ? "..." : dashboardData.total_supir_telat}</span>
              <span className="text-xs font-bold text-rose-600">Insiden Telat</span>
            </div>
            <p className="text-[11px] font-semibold text-rose-600/80">Melewati toleransi jam cut-off</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0 text-2xl shadow-inner">🔴</div>
        </div>
      </div>

      {/* Peringatan Kedisiplinan Terkini */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-black text-base">⚠️</div>
            <div>
              <h3 className="text-lg font-black text-[#00206B] m-0 tracking-wide uppercase">Peringatan Kedisiplinan Terkini</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Pemantauan toleransi waktu CP1 & CP2 driver hari ini</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">{displayAlerts.length} Data Terpantau</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-[#00206B] font-bold animate-pulse">Memuat Data Kedisiplinan Terkini... ⏳</div>
        ) : displayAlerts.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-black">✓</div>
            <h4 className="text-base font-extrabold text-emerald-800 m-0">Semua Driver Disiplin & Tepat Waktu</h4>
            <p className="text-xs text-emerald-600 font-semibold max-w-md mx-auto">Tidak ada driver yang terdeteksi terlambat pada CP1/CP2 untuk jadwal hari ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAlerts.map((item, index) => {
              const driverName = item.nama_supir || item.nama || item.driver_name || item.id_supir || `Driver #${index + 1}`;
              const trayek = item.trayek || item.nama_trayek || "-";
              const bus = item.bus || item.armada || item.nopol || "-";
              const sesi = item.tipe_sesi || item.sesi || "PAGI";

              const isLate =
                item.status_kedisiplinan === "TERLAMBAT" || item.is_late === true || item.terlambat === true || item.status?.toUpperCase() === "TERLAMBAT" || item.cp1_late || item.cp2_late;

              const notStarted = item.status === "belum_mulai" || item.status === "BELUM_MULAI" || item.status_operasional === "BELUM_JALAN" || (!item.jam_berangkat_kantor && !item.cp1_time);

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
                        isLate ? "bg-gradient-to-br from-rose-600 to-red-700" : notStarted ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-slate-700 to-[#00206B]"
                      }`}
                    >
                      {driverName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-[#00206B] m-0">{driverName}</h4>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">Sesi {sesi}</span>
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
                        <p className="text-[11px] font-bold text-rose-600 mt-1">{item.keterangan || item.alasan_telat || "Melewati toleransi batas waktu CP"}</p>
                      </div>
                    ) : notStarted ? (
                      <div className="text-left sm:text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                          ⏳ BELUM JALAN
                        </span>
                        <p className="text-[11px] font-bold text-amber-700 mt-1">Belum memulai checklist inspeksi</p>
                      </div>
                    ) : (
                      <div className="text-left sm:text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                          ✓ TEPAT WAKTU
                        </span>
                        <p className="text-[11px] font-bold text-emerald-700 mt-1">Sesuai toleransi jadwal</p>
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
