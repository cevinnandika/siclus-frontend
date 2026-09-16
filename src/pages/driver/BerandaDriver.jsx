import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../../services/api";

const Beranda = ({ activeUser, onQuickAction, tripStatus = "belum_mulai", onStartInspection, currentShift, laporanHariIni, laporan }) => {
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sinkronisasi data penugasan, jadwal, dan laporan operasional
  const fetchAllData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Ambil Penugasan Aktif (otomatis memilih penugasan yang belum tuntas)
      const resPenugasan = await apiService.getPenugasanHariIni();
      const currentTask = resPenugasan?.data || null;
      setPenugasan(currentTask);

      if (currentTask?.id) {
        localStorage.setItem("siclus_active_penugasan_id", String(currentTask.id));
      }

      // 2. Ambil Jadwal Operasional untuk Penugasan Aktif
      const resJadwal = await apiService.getJadwalDriver();
      const rawList = Array.isArray(resJadwal) ? resJadwal : Array.isArray(resJadwal?.data) ? resJadwal.data : [];
      if (rawList.length > 0) {
        const pagi = rawList.find((j) => (j?.tipe_sesi || "").toUpperCase() === "PAGI") || null;
        const siang = rawList.find((j) => (j?.tipe_sesi || "").toUpperCase() === "SIANG") || null;
        setJadwalSesi({ pagi, siang });
      }

      // 3. Ambil Laporan untuk Penugasan Aktif
      if (currentTask) {
        const resLaporan = await apiService.getLaporanHariIni({
          trayek: currentTask.trayek,
          bus: currentTask.nopol_kendaraan,
        });
        const lapData = resLaporan?.data || null;
        setLaporanDriver(lapData);
        if (lapData?.id) {
          localStorage.setItem("siclus_active_laporan_id", String(lapData.id));
        } else {
          localStorage.removeItem("siclus_active_laporan_id");
        }
      } else {
        setLaporanDriver(null);
        localStorage.removeItem("siclus_active_laporan_id");
      }
    } catch (error) {
      console.error("Gagal sinkronisasi data beranda driver:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Ticking Clock & Fetch Data
  useEffect(() => {
    const timer = setInterval(() => setJamSekarang(new Date()), 1000);
    fetchAllData();
    return () => clearInterval(timer);
  }, []);

  // Format jam ke "HH:MM:SS" secara aman
  const jamTeks =
    jamSekarang instanceof Date && !isNaN(jamSekarang.getTime())
      ? jamSekarang.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).replace(/\./g, ":")
      : "00:00:00";

  // Toleransi & 3 Milestone Jam Operasional (Pagi & Siang)
  const formPagi = jadwalSesi?.pagi?.jam_formulir_pengisian ? String(jadwalSesi.pagi.jam_formulir_pengisian).slice(0, 5) : "-";
  const batasPagi = jadwalSesi?.pagi?.batas_keluar_dishub ? String(jadwalSesi.pagi.batas_keluar_dishub).slice(0, 5) : "-";
  const kembaliPagi = jadwalSesi?.pagi?.batas_kembali_dishub || jadwalSesi?.pagi?.batas_tiba_start ? String(jadwalSesi.pagi.batas_kembali_dishub || jadwalSesi.pagi.batas_tiba_start).slice(0, 5) : "-";

  const formSiang = jadwalSesi?.siang?.jam_formulir_pengisian ? String(jadwalSesi.siang.jam_formulir_pengisian).slice(0, 5) : "-";
  const batasSiang = jadwalSesi?.siang?.batas_keluar_dishub ? String(jadwalSesi.siang.batas_keluar_dishub).slice(0, 5) : "-";
  const kembaliSiang =
    jadwalSesi?.siang?.batas_kembali_dishub || jadwalSesi?.siang?.batas_tiba_start ? String(jadwalSesi.siang.batas_kembali_dishub || jadwalSesi.siang.batas_tiba_start).slice(0, 5) : "-";

  // Jam Buka Operasional Siang mengikuti jam buka formulir siang
  const jamBukaSiang = formSiang !== "-" ? formSiang : "13:00";
  const jamSekarangHM = jamTeks.slice(0, 5);
  const isSiangTime = jamSekarangHM >= jamBukaSiang;
  
  const jamBukaPagi = formPagi !== "-" ? formPagi : "06:00";
  const isPagiTime = jamSekarangHM >= jamBukaPagi;

  // Proteksi data Driver/User & Penugasan
  const driverName = activeUser?.nama_lengkap || activeUser?.nama || activeUser?.name || "Driver";

  // 4 Data Penugasan dari Admin
  const displayTrayek = penugasan?.trayek || "-";
  const displayJenis = penugasan?.jenis_kendaraan || "-";
  const displayNopol = penugasan?.nopol_kendaraan || "-";
  const displayKapasitas = penugasan?.kapasitas_penumpang ? `${penugasan.kapasitas_penumpang} Penumpang` : "-";

  // Validasi apakah sudah ditugaskan admin
  const hasPenugasan = Boolean(
    penugasan && penugasan.trayek && penugasan.trayek !== "-" && penugasan.trayek !== "Belum Ditentukan"
  );

  // Proteksi data Laporan & Trip Sessions
  const safeReport = laporanHariIni ?? laporanDriver ?? laporan ?? null;
  const tripSessions = Array.isArray(safeReport?.trip_sessions) ? safeReport.trip_sessions : [];

  const hasFinishedPagi = tripSessions.some((s) => (s?.tipe_sesi || "").toLowerCase() === "pagi" || s?.tipe_sesi === 1);
  const hasFinishedSiang = tripSessions.some((s) => (s?.tipe_sesi || "").toLowerCase() === "siang" || s?.tipe_sesi === 2);

  // Penentuan shift operasional aktif
  // Jika sudah waktunya siang, langsung anggap shift efektif "siang" walaupun pagi bolong.
  const effectiveShift = hasFinishedSiang ? "selesai" : (isSiangTime ? "siang" : (hasFinishedPagi ? "siang" : currentShift || "pagi"));

  const isShiftSiang = effectiveShift === "siang";
  const isShiftSelesai = effectiveShift === "selesai";

  // Kondisi Jeda Operasional: Sesi Pagi selesai, Sesi Siang belum, dan belum masuk jam siang
  const isJedaOperasional = hasFinishedPagi && !hasFinishedSiang && !isSiangTime;
  const isJedaPagi = !hasFinishedPagi && !isPagiTime;

  // Logika Kesiapan Memulai Laporan:
  const canStartReport = isShiftSiang ? hasPenugasan && isSiangTime && !hasFinishedSiang : hasPenugasan && isPagiTime && !hasFinishedPagi;

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
        trayek: displayTrayek,
        bus: displayNopol,
      };

      const res = await apiService.mulaiLaporan(payload);
      const dataLaporan = res?.data || res;

      if (dataLaporan) {
        setLaporanDriver(dataLaporan);
        if (dataLaporan.id) {
          localStorage.setItem("siclus_active_laporan_id", String(dataLaporan.id));
        }
        if (penugasan?.id) {
          localStorage.setItem("siclus_active_penugasan_id", String(penugasan.id));
        }
      }

      if (typeof onQuickAction === "function") {
        onQuickAction("laporan");
      } else if (typeof onStartInspection === "function") {
        onStartInspection();
      } else {
        navigate("/driver/laporan");
      }
    } catch (error) {
      console.error("Gagal memulai laporan:", error);
      if (typeof onQuickAction === "function") {
        onQuickAction("laporan");
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-stretch">
          <div className="lg:col-span-2 h-64 bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(6,81,237,0.05)]"></div>
          <div className="h-64 bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(6,81,237,0.05)]"></div>
        </div>
      </div>
    );
  }

  // Komponen Batas Operasional (Sidebar Kanan) - Minimalis & Elegan
  const renderCardJadwal = () => {
    const isSiang = isShiftSiang || isJedaOperasional;
    const formWaktu = isShiftSelesai ? "-" : (isSiang ? formSiang : formPagi);
    const keluarWaktu = isShiftSelesai ? "-" : (isSiang ? batasSiang : batasPagi);
    const kembaliWaktu = isShiftSelesai ? "-" : (isSiang ? kembaliSiang : kembaliPagi);

    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(6,81,237,0.05)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out flex-1 flex flex-col justify-between">
        <div>
          {/* Header Minimalis */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Batas Operasional</span>
              <span className="text-xs font-bold text-[#00206B] mt-0.5 block">
                {isShiftSelesai ? "Operasional Selesai" : isSiang ? "Sesi Siang" : "Sesi Pagi"}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg tabular-nums">{jamTeks.slice(0, 5)} WIB</span>
          </div>

          {/* 3 Milestone Bersih, Elegan & Minimalis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-xs font-medium text-slate-600">Waktu Pengisian</span>
              <span className={`text-sm tabular-nums ${formWaktu !== "-" ? "font-semibold text-slate-800" : "font-normal text-slate-400"}`}>
                {formWaktu !== "-" ? `${formWaktu} WIB` : "-"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-xs font-medium text-slate-600">Batas Keluar</span>
              <span className={`text-sm tabular-nums ${keluarWaktu !== "-" ? "font-semibold text-slate-800" : "font-normal text-slate-400"}`}>
                {keluarWaktu !== "-" ? `${keluarWaktu} WIB` : "-"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-xs font-medium text-slate-600">Batas Kembali</span>
              <span className={`text-sm tabular-nums ${kembaliWaktu !== "-" ? "font-semibold text-slate-800" : "font-normal text-slate-400"}`}>
                {kembaliWaktu !== "-" ? `${kembaliWaktu} WIB` : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // State: Shift Sedang Berlangsung
  if (tripStatus === "sedang_berlangsung") {
    return (
      <div className="space-y-6 text-left max-w-5xl mx-auto pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <header className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold text-[#00206B] m-0 tracking-tight">
              Selamat bertugas, {driverName}
            </h2>
            <p className="text-xs text-slate-500 font-normal mt-1">{currentDate}</p>
          </header>
          <button
            type="button"
            onClick={fetchAllData}
            disabled={isRefreshing}
            className="self-start sm:self-auto inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95 disabled:opacity-70"
          >
            <svg className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? "Menyinkronkan..." : "Segarkan Data"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-[0_2px_15px_-3px_rgba(6,81,237,0.05)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out flex-1 flex flex-col justify-between">
              <div>
                {/* Header: Operasional di atas, Keterangan di bawah */}
                <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                      {isShiftSelesai ? "Operasional Selesai" : isJedaOperasional ? "Jeda Operasional" : isShiftSiang ? "Operasional Siang" : "Operasional Pagi"}
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                      {isShiftSelesai
                        ? "Semua sesi harian telah diselesaikan."
                        : isJedaOperasional
                          ? `Sesi Pagi selesai. Sesi Siang dibuka pukul ${jamBukaSiang} WIB.`
                          : isShiftSiang
                            ? "Pengantaran Siswa"
                            : "Penjemputan Siswa"}
                    </p>
                  </div>
                </div>

                <div className="py-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Rincian Penugasan Kendaraan</p>
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
                      <p className="text-sm font-bold text-[#00206B] mt-1 truncate">{displayTrayek}</p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-4 4h4M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                        </svg>
                        Jenis Kendaraan
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-1 truncate">{displayJenis}</p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        Nomor Polisi
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-1 truncate">{displayNopol}</p>
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
                      <p className="text-sm font-semibold text-slate-800 mt-1 truncate">{displayKapasitas}</p>
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
                  className="w-full bg-[#00206B] hover:bg-[#00174E] text-white font-semibold text-sm py-3.5 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                >
                  <span>Lanjutkan Laporan</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1 flex flex-col">{renderCardJadwal()}</aside>
        </div>
      </div>
    );
  }

  // State: Belum Mulai (Initial / Post-Finish)
  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <header className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold text-[#00206B] m-0 tracking-tight">{driverName}</h2>
          <p className="text-xs text-slate-500 font-normal mt-1">Selamat Datang Driver Dishub Kota Mojokerto</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{currentDate}</p>
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
          {/* Tampilan Utama: Rincian Penugasan Armada */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-[0_2px_15px_-3px_rgba(6,81,237,0.05)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out flex-1 flex flex-col justify-between">
              <div>
                {/* Header: Operasional di atas, Keterangan di bawah */}
                <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                      {isShiftSelesai ? "Operasional Selesai" : isJedaOperasional ? "Jeda Operasional" : isShiftSiang ? "Operasional Siang" : "Operasional Pagi"}
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                      {isShiftSelesai
                        ? "Semua sesi harian telah diselesaikan."
                        : isJedaOperasional
                          ? `Sesi Pagi selesai. Sesi Siang dibuka pukul ${jamBukaSiang} WIB.`
                          : isShiftSiang
                            ? "Pengantaran Siswa"
                            : "Penjemputan Siswa"}
                    </p>
                  </div>
                </div>

                {/* Rincian Penugasan Armada */}
                <div className="py-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Rincian Penugasan Kendaraan</p>
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
                      <p className={`text-sm font-bold mt-1 truncate ${displayTrayek !== "-" ? "text-[#00206B]" : "text-slate-400 font-normal"}`}>{displayTrayek}</p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-4 4h4M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                        </svg>
                        Jenis Kendaraan
                      </div>
                      <p className={`text-sm mt-1 truncate ${displayJenis !== "-" ? "text-slate-800 font-semibold" : "text-slate-400 font-normal"}`}>{displayJenis}</p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        Nomor Polisi
                      </div>
                      <p className={`text-sm mt-1 truncate ${displayNopol !== "-" ? "text-slate-800 font-semibold" : "text-slate-400 font-normal"}`}>{displayNopol}</p>
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
                      <p className={`text-sm mt-1 truncate ${displayKapasitas !== "-" ? "text-slate-800 font-semibold" : "text-slate-400 font-normal"}`}>{displayKapasitas}</p>
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

              {/* Action Button dengan Proteksi Jeda & Selesai */}
              <div className="pt-3">
                {isShiftSelesai ? (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 text-slate-500 font-semibold text-sm py-3.5 px-6 rounded-xl cursor-default flex items-center justify-center gap-2"
                  >
                    <span>Operasional Selesai</span>
                  </button>
                ) : isJedaOperasional ? (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 text-slate-500 font-medium text-sm py-3.5 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Menunggu Sesi Siang ({jamBukaSiang} WIB)</span>
                  </button>
                ) : canStartReport ? (
                  <button
                    type="button"
                    onClick={handleMulaiLaporan}
                    disabled={isStartingReport}
                    className="w-full bg-[#00206B] hover:bg-[#00174E] text-white font-semibold text-sm py-3.5 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{isStartingReport ? "Memulai Laporan..." : "Mulai Laporan"}</span>
                  </button>
                ) : !hasPenugasan ? (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 text-slate-400 font-medium text-sm py-3.5 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Belum Ada Penugasan</span>
                  </button>
                ) : isJedaPagi ? (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 text-slate-500 font-medium text-sm py-3.5 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Menunggu Sesi Pagi ({jamBukaPagi} WIB)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 text-slate-400 font-medium text-sm py-3.5 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Belum Dimulai</span>
                  </button>
                )}
              </div>
            </div>
        </div>

        <aside className="lg:col-span-1 flex flex-col">{renderCardJadwal()}</aside>
      </div>
    </div>
  );
};

export default Beranda;
