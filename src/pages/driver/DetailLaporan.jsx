import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";

// ==============================================================================
// KOMPONEN: DETAIL LAPORAN (RINCIAN TIMELINE 3 CHECKPOINT & INSPEKSI FISIK)
// ==============================================================================
const DetailLaporan = ({ report, user: propUser, onBack }) => {
  const [profilePhoto, setProfilePhoto] = useState(propUser?.foto_profil || null);
  const [activeTab, setActiveTab] = useState(() => {
    const sesiPagi = report?.trip_sessions?.find((s) => s.tipe_sesi?.toUpperCase() === "PAGI");
    const sesiSiang = report?.trip_sessions?.find((s) => s.tipe_sesi?.toUpperCase() === "SIANG");
    return !sesiPagi && sesiSiang ? "siang" : "pagi";
  });
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  useEffect(() => {
    if (report) {
      const hasPagi = report.trip_sessions?.some((s) => s.tipe_sesi?.toUpperCase() === "PAGI");
      const hasSiang = report.trip_sessions?.some((s) => s.tipe_sesi?.toUpperCase() === "SIANG");
      if (!hasPagi && hasSiang) {
        setActiveTab("siang");
      } else if (hasPagi) {
        setActiveTab("pagi");
      }
    }
  }, [report]);

  useEffect(() => {
    if (propUser?.foto_profil) {
      setProfilePhoto(propUser.foto_profil);
    } else {
      const saved = localStorage.getItem("siclus_user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.foto_profil) {
            setProfilePhoto(parsed.foto_profil);
            return;
          }
        } catch {}
      }
      apiService
        .getProfilDriver()
        .then((res) => {
          if (res?.data?.foto_profil) {
            setProfilePhoto(res.data.foto_profil);
          }
        })
        .catch(() => {});
    }
  }, [propUser]);

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
          <h3 className="text-xl font-bold text-[#00206B]">Data Tidak Ditemukan</h3>
          <p className="text-sm text-slate-500 font-medium">Sesi tidak ditemukan atau telah dihapus.</p>
        </div>
      </div>
    );
  }

  const sesiPagi = report.trip_sessions?.find((s) => s.tipe_sesi?.toUpperCase() === "PAGI");
  const sesiSiang = report.trip_sessions?.find((s) => s.tipe_sesi?.toUpperCase() === "SIANG");
  const inspeksiPagi = report.inspections?.find((s) => s.tipe_sesi?.toUpperCase() === "PAGI");
  const inspeksiSiang = report.inspections?.find((s) => s.tipe_sesi?.toUpperCase() === "SIANG");

  // Format tanggal Indonesia rapi
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    try {
      const d = new Date(timeString);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  const driverName = propUser?.nama_lengkap || propUser?.nama || report.driverName || "Driver SICLUS";
  const driverInitial = driverName.charAt(0).toUpperCase();

  // Helper Penugasan Armada Otomatis
  const getPenugasanData = (sesi) => {
    const rawNopol = sesi?.nopol_kendaraan || report.bus || propUser?.bus || propUser?.nomer_kendaraan || "-";
    let jenis = propUser?.jenis_kendaraan || "-";
    let nopol = rawNopol;

    if (rawNopol.includes(" - ")) {
      const parts = rawNopol.split(" - ");
      jenis = parts[0] || jenis;
      nopol = parts[1] || nopol;
    }

    const trayek = report.trayek || propUser?.trayek || "-";
    const kapasitas = propUser?.kapasitas ? `${propUser.kapasitas} Siswa` : report.kapasitas ? `${report.kapasitas} Siswa` : "-";

    return { trayek, jenis, nopol, kapasitas };
  };

  // 10 Item Inspeksi Standar SICLUS
  const inspKeys = [
    { id: "rem", label: "Rem" },
    { id: "lampu", label: "Lampu" },
    { id: "wiper", label: "Wiper" },
    { id: "ban", label: "Ban" },
    { id: "kebersihan", label: "Kebersihan" },
    { id: "ac", label: "AC" },
    { id: "klakson", label: "Klakson" },
    { id: "lampu_rem", label: "Lampu Rem" },
    { id: "pintu", label: "Pintu Kendaraan" },
    { id: "mesin", label: "Mesin" },
  ];

  // Aktifkan tab yang ada datanya secara default
  const activeSession = activeTab === "pagi" ? sesiPagi : sesiSiang;
  const activeInspeksi = activeTab === "pagi" ? inspeksiPagi : inspeksiSiang;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-14 font-sans text-left">
      {/* Tombol Navigasi Kembali */}
      {onBack && (
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#00206B] transition-colors cursor-pointer group">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Riwayat
        </button>
      )}

      {/* Header Halaman (Identik dengan Beranda & Riwayat) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold text-[#00206B] tracking-tight m-0">Detail Riwayat Operasional</h2>
          <p className="text-xs text-slate-500 font-normal mt-1">Catatan Perjalanan Operasional {formatDisplayDate(report.tanggal || report.date)}.</p>
        </div>
      </div>

      {/* KARTU IDENTITAS SUPIR (ELEGAN, MINIMALIS, PROFIL BULAT UTUH) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar Bulat Utuh Profil Driver */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-xs">
            {profilePhoto ? (
              <img src={profilePhoto} alt={driverName} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-[#00206B] text-white flex items-center justify-center font-bold text-lg">{driverInitial}</div>
            )}
          </div>

          {/* Info Driver */}
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 m-0 tracking-tight truncate">{driverName}</h3>
          </div>
        </div>

        {/* Status Selesai */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
            Laporan Selesai
          </span>
        </div>
      </div>

      {/* TAB PILIHAN SESI: BERANGKAT (PAGI) vs PULANG (SIANG) */}
      <div className="flex items-center gap-2.5 border-b border-slate-200/80 pb-3">
        {Boolean(sesiPagi || !sesiSiang) && (
          <button
            type="button"
            onClick={() => setActiveTab("pagi")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "pagi"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <span>Sesi Pagi</span>
            {sesiPagi && String(sesiPagi.status_waktu || "").toUpperCase() === "TEPAT WAKTU" && (
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  activeTab === "pagi"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                Tepat Waktu
              </span>
            )}
            {sesiPagi && String(sesiPagi.status_waktu || "").toUpperCase() === "TERLAMBAT" && (
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  activeTab === "pagi"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                Terlambat
              </span>
            )}
          </button>
        )}

        {Boolean(sesiSiang || !sesiPagi) && (
          <button
            type="button"
            onClick={() => setActiveTab("siang")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "siang"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <span>Sesi Siang</span>
            {sesiSiang && String(sesiSiang.status_waktu || "").toUpperCase() === "TEPAT WAKTU" && (
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  activeTab === "siang"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                Tepat Waktu
              </span>
            )}
            {sesiSiang && String(sesiSiang.status_waktu || "").toUpperCase() === "TERLAMBAT" && (
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  activeTab === "siang"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                Terlambat
              </span>
            )}
          </button>
        )}
      </div>

      {/* KONTEN SESI AKTIF (PAGI ATAU SIANG) */}
      {activeSession ? (
        <div className="space-y-6">
          {/* KARTU TIMELINE 3 CHECK POINT */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm space-y-7">
            {/* ========================================================================= */}
            {/* TAHAP 1: KEBERANGKATAN DISHUB */}
            {/* ========================================================================= */}
            <div className="relative pl-7 border-l-2 border-slate-200 pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#00206B] ring-4 ring-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                <h4 className="text-sm font-bold text-slate-900 m-0">Tahap 1: Keberangkatan Dishub</h4>
                <span className="text-xs font-semibold text-slate-400">{formatTime(activeSession.jam_berangkat_kantor)} WIB</span>
              </div>

              {/* Rincian Penugasan Kendaraan */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Rincian Penugasan Kendaraan</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(() => {
                    const penugasan = getPenugasanData(activeSession);
                    return (
                      <>
                        <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3 transition-colors hover:bg-slate-50">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Trayek</span>
                          <p className="text-sm font-semibold text-[#00206B] mt-1 truncate m-0">{penugasan.trayek}</p>
                        </div>
                        <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3 transition-colors hover:bg-slate-50">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Jenis Kendaraan</span>
                          <p className="text-sm font-semibold text-slate-800 mt-1 truncate m-0">{penugasan.jenis}</p>
                        </div>
                        <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3 transition-colors hover:bg-slate-50">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Nomor Polisi</span>
                          <p className="text-sm font-semibold text-slate-800 mt-1 truncate m-0">{penugasan.nopol}</p>
                        </div>
                        <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3 transition-colors hover:bg-slate-50">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Kapasitas</span>
                          <p className="text-sm font-semibold text-slate-800 mt-1 truncate m-0">{penugasan.kapasitas}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Data Odometer Awal & Foto Validasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Odometer Awal</span>
                  <p className="text-sm font-bold text-slate-800 m-0">{activeSession.km_berangkat_kantor ? `${activeSession.km_berangkat_kantor} KM` : "-"}</p>
                </div>

                {/* Thumbnail Foto Selfie Validasi Awal */}
                {activeSession.foto_awal ? (
                  <div
                    onClick={() => setSelectedPhotoModal(activeSession.foto_awal)}
                    className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-28 flex items-center justify-center cursor-pointer group shadow-xs"
                    title="Klik untuk memperbesar foto"
                  >
                    <img src={activeSession.foto_awal} alt="Foto Tahap 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-medium px-2 py-0.5 rounded tracking-wider shadow-xs">✓ FOTO VALIDASI</div>
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                      Lihat Foto Penuh
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3.5 flex items-center justify-center text-xs text-slate-400">Foto validasi tidak tersedia</div>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* TAHAP 2: TIBA DI TITIK AKHIR */}
            {/* ========================================================================= */}
            <div className="relative pl-7 border-l-2 border-slate-200 pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#00206B] ring-4 ring-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                <h4 className="text-sm font-bold text-slate-900 m-0">Tahap 2: Tiba di Titik Akhir</h4>
                <span className="text-xs font-semibold text-slate-400">{formatTime(activeSession.jam_tiba_finish)} WIB</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Odometer Tiba</span>
                  <p className="text-sm font-bold text-slate-800 m-0">{activeSession.km_tiba_finish ? `${activeSession.km_tiba_finish} KM` : "-"}</p>
                </div>

                <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Jumlah Penumpang / Siswa</span>
                  <p className="text-sm font-bold text-[#00206B] m-0">
                    {activeSession.jumlah_penumpang !== undefined && activeSession.jumlah_penumpang !== null ? `${activeSession.jumlah_penumpang} Siswa` : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* TAHAP 3: KEMBALI KE DISHUB */}
            {/* ========================================================================= */}
            <div className="relative pl-7">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#00206B] ring-4 ring-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                <h4 className="text-sm font-bold text-slate-900 m-0">Tahap 3: Kembali ke Dishub</h4>
                <span className="text-xs font-semibold text-slate-400">{formatTime(activeSession.jam_tiba_kantor)} WIB</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Odometer Akhir</span>
                  <p className="text-sm font-bold text-slate-800 m-0">{activeSession.km_tiba_kantor ? `${activeSession.km_tiba_kantor} KM` : "-"}</p>
                </div>

                {/* Thumbnail Foto Selfie Validasi Akhir */}
                {activeSession.foto_akhir ? (
                  <div
                    onClick={() => setSelectedPhotoModal(activeSession.foto_akhir)}
                    className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-28 flex items-center justify-center cursor-pointer group shadow-xs"
                    title="Klik untuk memperbesar foto"
                  >
                    <img src={activeSession.foto_akhir} alt="Foto CP3" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute top-2 left-2 bg-emerald-600/90 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-wider shadow-xs">✓ FOTO VALIDASI</div>
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                      Lihat Foto Penuh
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3.5 flex items-center justify-center text-xs text-slate-400">Foto validasi akhir tidak tersedia</div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* KONDISI KENDARAAN (INSPEKSI FISIK 10 ITEM) */}
          {/* ========================================================================= */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 m-0">Kondisi Fisik Kendaraan (Hasil Inspeksi)</h4>
              <span className="text-xs font-semibold text-slate-400">10 Komponen Terperiksa</span>
            </div>

            {activeInspeksi ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {inspKeys.map((item) => {
                    const val = activeInspeksi[item.id] || (item.id === "pintu" ? activeInspeksi["pintu_kendaraan"] : null);
                    const isOk = val === "OK";
                    const isKurang = val === "KURANG";
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border flex justify-between items-center transition-all ${
                          isOk
                            ? "bg-emerald-50/50 border-emerald-200/70 text-emerald-900"
                            : isKurang
                              ? "bg-amber-50 border-amber-300 text-amber-900 shadow-xs"
                              : "bg-slate-50 border-slate-200/80 text-slate-500"
                        }`}
                      >
                        <span className="text-xs font-semibold truncate pr-1">{item.label}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider flex-shrink-0 ${
                            isOk ? "bg-emerald-100 text-emerald-800" : isKurang ? "bg-amber-500 text-white font-bold" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {val || "-"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {activeInspeksi.catatan && (
                  <div className="mt-4 bg-amber-50/80 p-4 rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">Catatan Kerusakan Kendaraan</span>
                    <p className="text-xs font-semibold text-amber-950 m-0 leading-relaxed">{activeInspeksi.catatan}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-400 font-medium text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">Data inspeksi fisik untuk sesi ini belum dicatat.</div>
            )}
          </div>
        </div>
      ) : (
        /* JIKA SESI TERSEBUT BELUM DIISI */
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-slate-800 m-0">Data Sesi {activeTab === "pagi" ? "Pagi" : "Siang"} Kosong</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Pengemudi tidak menjalankan atau belum menutup sesi operasional ini pada tanggal tersebut.</p>
        </div>
      )}

      {/* MODAL PREVIEW FOTO VALIDASI (JIKA DIKLIK) */}
      {selectedPhotoModal && (
        <div onClick={() => setSelectedPhotoModal(null)} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl relative">
            <div className="p-3.5 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-[#00206B] uppercase tracking-wider">Foto Bukti Validasi Operasional</span>
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="aspect-[4/3] bg-black">
              <img src={selectedPhotoModal} alt="Preview Bukti" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailLaporan;
