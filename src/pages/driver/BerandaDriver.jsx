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
  const [penugasan, setPenugasan] = useState(null);
  const [laporanDriver, setLaporanDriver] = useState(null);
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

    const fetchPenugasan = async () => {
      try {
        const res = await apiService.getPenugasanHariIni();
        if (res && res.data) {
          setPenugasan(res.data);
        }
      } catch (error) {
        console.log("Belum ada penugasan hari ini.");
      }
    };

    const fetchLaporan = async () => {
      try {
        const res = await apiService.getLaporanHariIni();
        if (res) {
          setLaporanDriver(res.data || res);
        }
      } catch (error) {
        console.log("Belum ada laporan hari ini.");
      }
    };

    fetchJadwal();
    fetchPenugasan();
    fetchLaporan();

    return () => clearInterval(timer);
  }, []);

  // Format jam ke "HH:MM:SS" secara aman
  const jamTeks =
    jamSekarang instanceof Date && !isNaN(jamSekarang.getTime())
      ? jamSekarang
          .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
          .replace(/\./g, ":")
      : "00:00:00";

  // Cek Status Keterlambatan dengan proteksi null/undefined
  const batasPagi = String(jadwalSesi?.pagi?.batas_keluar_dishub || "06:00").slice(0, 5);
  const batasSiang = String(jadwalSesi?.siang?.batas_keluar_dishub || "12:30").slice(0, 5);

  const isPagiTelat = jamTeks.slice(0, 5) > batasPagi;
  const isSiangTelat = jamTeks.slice(0, 5) > batasSiang;

  const currentHour =
    jamSekarang instanceof Date && !isNaN(jamSekarang.getTime())
      ? jamSekarang.getHours()
      : new Date().getHours();

  const parsedSiangHour = jadwalSesi?.siang?.batas_keluar_dishub
    ? parseInt(String(jadwalSesi.siang.batas_keluar_dishub).split(":")[0], 10)
    : 12;

  const siangHour = shiftRules?.siang ?? (!isNaN(parsedSiangHour) ? parsedSiangHour : 12);
  const isSiangTime = currentHour >= siangHour;

  // Proteksi data Driver/User & Penugasan
  const driverName = activeUser?.nama_lengkap || activeUser?.nama || activeUser?.name || "Driver";

  // 4 Data Penugasan dari Admin
  const displayTrayek = penugasan?.trayek || activeUser?.trayek || "Belum Ditentukan";
  const displayJenis = penugasan?.jenis_kendaraan || activeUser?.jenis_kendaraan || activeUser?.bus || "Belum Ditentukan";
  const displayNopol = penugasan?.nopol_kendaraan || activeUser?.nomer_kendaraan || activeUser?.bus || "Belum Ditentukan";
  const displayKapasitas = penugasan?.kapasitas_penumpang 
    ? `${penugasan.kapasitas_penumpang} Penumpang` 
    : (activeUser?.kapasitas ? `${activeUser.kapasitas} Penumpang` : "Belum Ditentukan");

  // Validasi apakah sudah ditugaskan admin
  const hasPenugasan = Boolean(
    (penugasan && penugasan.trayek && penugasan.trayek !== "-" && penugasan.trayek !== "Belum Ditentukan") ||
    (activeUser?.trayek && activeUser.trayek !== "-" && activeUser.trayek !== "Belum Ditentukan")
  );

  // Proteksi data Laporan & Trip Sessions
  const safeReport = laporanHariIni ?? laporanDriver ?? laporan ?? null;
  const tripSessions = Array.isArray(safeReport?.trip_sessions)
    ? safeReport.trip_sessions
    : [];

  const hasFinishedPagi = tripSessions.some(
    (s) => (s?.tipe_sesi || "").toLowerCase() === "pagi" || s?.tipe_sesi === 1
  );
  const hasFinishedSiang = tripSessions.some(
    (s) => (s?.tipe_sesi || "").toLowerCase() === "siang" || s?.tipe_sesi === 2
  );

  // Penentuan shift operasional aktif
  const effectiveShift = hasFinishedSiang
    ? "selesai"
    : hasFinishedPagi
    ? "siang"
    : (currentShift || "pagi");

  const isShiftSiang = effectiveShift === "siang";
  const isShiftSelesai = effectiveShift === "selesai";

  // Logika Kesiapan Memulai Laporan & Jeda Operasional:
  // - Jika shift pagi: aktif jika admin sudah menugaskan armada
  // - Jika shift siang: aktif HANYA jika sudah masuk jam siang (isSiangTime) dan sudah ditugaskan
  // Jika di masa jeda (belum jam siang): canStartReport = false -> tombol abu-abu disabled "Belum Dimulai"!
  const canStartReport = isShiftSiang ? (hasPenugasan && isSiangTime) : hasPenugasan;

  // Handler Inisiasi Laporan Harian (Simpan ke localStorage)
  const handleMulaiLaporan = async () => {
    if (isStartingReport || !canStartReport) return;
    setIsStartingReport(true);
    try {
      const localNow = new Date();
      const year = localNow.getFullYear();
      const month = String(localNow.getMonth() + 1).padStart(2, "0");
      const day = String(localNow.getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;

      const payload = {
        tanggal: today,
        trayek: displayTrayek !== "Belum Ditentukan" ? displayTrayek : (activeUser?.trayek || "-"),
        bus: displayNopol !== "Belum Ditentukan" ? displayNopol : (activeUser?.bus || "-"),
      };

      const res = await apiService.mulaiLaporanHarian(payload);

      // Simpan ID laporan master ke memori lokal
      const masterId = res?.id || res?.data?.id || (safeReport && safeReport.id) || null;
      if (masterId) {
        localStorage.setItem("siclus_active_laporan_id", String(masterId));
      }
      localStorage.setItem("siclus_draft_step", "1");

      if (isShiftSiang && typeof onStartSiang === "function") {
        onStartSiang();
      } else if (typeof onStartInspection === "function") {
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

  // Loading skeleton jika activeUser masih undefined/null
  if (!activeUser) {
    return (
      <div className="space-y-6 text-left max-w-5xl mx-auto pb-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-1/3"></div>
        <div className="h-4 bg-slate-100 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-stretch">
          <div className="lg:col-span-2 h-64 bg-white border border-slate-100 rounded-2xl p-6"></div>
          <div className="h-64 bg-white border border-slate-100 rounded-2xl p-6"></div>
        </div>
      </div>
    );
  }

  // Komponen Batas Operasional (Sidebar Kanan) - Jam Polos Tanpa Dot
  const renderCardJadwal = () => (
    <div className="bg-white border border-slate-400/80 rounded-2xl p-6 sm:p-7 shadow-sm flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Batas Operasional
          </span>
          <span className="font-mono text-xs font-semibold text-slate-600">
            {jamTeks} WIB
          </span>
        </div>

        <div className="space-y-3">
          {/* SESI PAGI */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between transition-colors">
            <div>
              <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                Sesi Pagi
              </p>
              {isPagiTelat ? (
                <span className="text-[11px] font-medium text-amber-600 mt-0.5 block">
                  Lewat Batas
                </span>
              ) : (
                <span className="text-[11px] font-medium text-emerald-600 mt-0.5 block">
                  Tepat Waktu
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-medium text-slate-400 uppercase block mb-0.5">
                Batas Keluar
              </span>
              <span className="text-xs font-bold text-slate-700">
                {batasPagi} WIB
              </span>
            </div>
          </div>

          {/* SESI SIANG */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between transition-colors">
            <div>
              <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                Sesi Siang
              </p>
              {isSiangTelat ? (
                <span className="text-[11px] font-medium text-amber-600 mt-0.5 block">
                  Lewat Batas
                </span>
              ) : (
                <span className="text-[11px] font-medium text-emerald-600 mt-0.5 block">
                  Tepat Waktu
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-medium text-slate-400 uppercase block mb-0.5">
                Batas Keluar
              </span>
              <span className="text-xs font-bold text-slate-700">
                {batasSiang} WIB
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-6 border-t border-slate-100 text-center">
        <p className="text-[11px] font-normal text-slate-400 m-0">
          Toleransi waktu operasional tercatat otomatis
        </p>
      </div>
    </div>
  );

  // State: Shift Sedang Berlangsung
  if (tripStatus === "sedang_berlangsung") {
    return (
      <div className="space-y-6 text-left max-w-5xl mx-auto pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <header className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 m-0 tracking-tight">
              Selamat bertugas, <span className="text-[#00206B]">{driverName}</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">{currentDate}</p>
          </header>
          <button
            onClick={() => window.location.reload()}
            className="self-start sm:self-auto inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Segarkan Data
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm flex-1 flex flex-col justify-between">
              <div>
                {/* Header: Operasional di atas, Keterangan di bawah */}
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {isShiftSiang ? "Operasional Siang" : "Operasional Pagi"}
                  </h3>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    {isShiftSiang ? "Pengantaran Siswa" : "Penjemputan Siswa"}
                  </p>
                </div>

                <div className="py-5">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Rincian Penugasan
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        Trayek Penugasan
                      </div>
                      <p className="text-sm font-bold text-[#00206B] mt-1 truncate">
                        {displayTrayek}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-4 4h4M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                        </svg>
                        Jenis Kendaraan
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-1 truncate">
                        {displayJenis}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        Nomor Polisi
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-1 truncate">
                        {displayNopol}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Kapasitas Penumpang
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-1 truncate">
                        {displayKapasitas}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3">
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
                  className="w-full bg-[#00206B] hover:bg-[#00174E] text-white font-semibold text-sm py-3.5 px-6 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
                >
                  <span>Lanjutkan Laporan</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1 flex flex-col">
            {renderCardJadwal()}
          </aside>
        </div>
      </div>
    );
  }

  // State: Belum Mulai (Initial / Post-Finish)
  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <header className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-black text-[#00206B] m-0 tracking-tight">
            {driverName}
          </h2>
          <p className="text-sm text-slate-400 font-normal">Selamat Datang Driver Dishub Kota Mojokerto</p>
          <p className="text-xs text-slate-400 font-bold mt-0.5">{currentDate}</p>
        </header>
        <button
          onClick={() => window.location.reload()}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Segarkan Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          {isShiftSelesai ? (
            /* Tampilan jika SELURUH tugas hari ini telah selesai */
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200/70">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 m-0">Tugas Hari Ini Selesai</h3>
                <p className="text-sm text-slate-500 font-normal mt-2 max-w-sm mx-auto">
                  Terima kasih! Anda telah menyelesaikan seluruh tugas operasional hari ini. Laporan akan dibuka kembali besok.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                  <span>Status:</span>
                  <span className="text-[#00206B] font-bold">{safeReport?.status || "Selesai"}</span>
                </div>
              </div>

              {tripSessions.length > 0 && (
                <div className="w-full max-w-sm mt-4 border-t border-slate-100 pt-4 text-left">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Riwayat Sesi Hari Ini</p>
                  <div className="space-y-2">
                    {tripSessions.map((sesi, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs">
                        <span className="font-semibold text-slate-800">Sesi {sesi?.tipe_sesi || idx + 1}</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">{sesi?.status || "Terkirim"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tampilan Utama: Operasional Pagi atau Operasional Siang */
            <div className="bg-white border border-slate-400/80 rounded-2xl p-6 sm:p-7 shadow-sm flex-1 flex flex-col justify-between">
              <div>
                {/* Header: Operasional di atas, Keterangan di bawah. Polos tanpa badge Siap Dimulai */}
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {isShiftSiang ? "Operasional Siang" : "Operasional Pagi"}
                  </h3>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    {isShiftSiang ? "Pengantaran Siswa" : "Penjemputan Siswa"}
                  </p>
                </div>

                {/* Spesifikasi Penugasan Armada */}
                <div className="py-5">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Rincian Penugasan
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                          />
                        </svg>
                        Trayek Penugasan
                      </div>
                      <p className={`text-sm font-bold mt-1 truncate ${displayTrayek !== "Belum Ditentukan" ? "text-[#00206B]" : "text-slate-400 font-normal"}`}>{displayTrayek}</p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-4 4h4M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                        </svg>
                        Jenis Kendaraan
                      </div>
                      <p className={`text-sm mt-1 truncate ${displayJenis !== "Belum Ditentukan" ? "text-slate-800 font-semibold" : "text-slate-400 font-normal"}`}>{displayJenis}</p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        Nomor Polisi
                      </div>
                      <p className={`text-sm mt-1 truncate ${displayNopol !== "Belum Ditentukan" ? "text-slate-800 font-semibold" : "text-slate-400 font-normal"}`}>{displayNopol}</p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Kapasitas Penumpang
                      </div>
                      <p className={`text-sm mt-1 truncate ${displayKapasitas !== "Belum Ditentukan" ? "text-slate-800 font-semibold" : "text-slate-400 font-normal"}`}>{displayKapasitas}</p>
                    </div>
                  </div>
                </div>

                {/* Sesi / Trip Sessions jika ada */}
                {tripSessions.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 mt-1 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sesi Terdaftar</p>
                    <div className="grid grid-cols-2 gap-2">
                      {tripSessions.map((sesi, idx) => (
                        <div key={idx} className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 text-xs flex items-center justify-between">
                          <span className="font-semibold text-slate-800 uppercase">Sesi {sesi?.tipe_sesi || idx + 1}</span>
                          <span className="text-[10px] text-slate-500">{sesi?.status || "Terekam"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button:
                  - Biru jika siap dimulai (shift pagi sudah ditugaskan, ATAU shift siang sudah masuk waktu siang)
                  - Abu-abu disabled jika belum ditugaskan ATAU masih dalam masa jeda (shift siang belum masuk jam siang)
              */}
              <div className="pt-3">
                {canStartReport ? (
                  <button
                    type="button"
                    onClick={handleMulaiLaporan}
                    disabled={isStartingReport}
                    className="w-full bg-[#00206B] hover:bg-[#00174E] text-white font-semibold text-sm py-3.5 px-6 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                    {isStartingReport ? "Memulai Laporan..." : "Mulai Laporan Perjalanan"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-slate-100 border border-slate-200/80 text-slate-400 font-semibold text-sm py-3.5 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Belum Dimulai</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-1 flex flex-col">
          {renderCardJadwal()}
        </aside>
      </div>
    </div>
  );
};

export default Beranda;
