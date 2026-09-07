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
