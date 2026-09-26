import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";

// ==============================================================================
// KOMPONEN: RIWAYAT DRIVER (DAFTAR HISTORI CATATAN & LAPORAN OPERASIONAL)
// ==============================================================================
const RiwayatDriver = ({ onViewDetail, user }) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(user?.foto_profil || null);

  // ==============================================================================
  // EFFECT: SINKRONISASI FOTO PROFIL PENGEMUDI
  // ==============================================================================
  useEffect(() => {
    if (user?.foto_profil) {
      setProfilePhoto(user.foto_profil);
    } else {
      const saved = localStorage.getItem("siclus_user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.foto_profil) {
            setProfilePhoto(parsed.foto_profil);
            return;
          }
        } catch {
          // Abaikan kesalahan parsing storage lokal
        }
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
  }, [user]);

  // ==============================================================================
  // EFFECT: AMBIL DATA RIWAYAT PERJALANAN & SESI OPERASIONAL
  // ==============================================================================
  useEffect(() => {
    if (!user) return;

    apiService
      .getRiwayatDriver()
      .then((res) => {
        const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const formattedData = rawList.map((item) => {
          const sesiList = item.trip_sessions || [];
          const sesiPagi = sesiList.find((s) => (s?.tipe_sesi || "").toUpperCase() === "PAGI");
          const sesiSiang = sesiList.find((s) => (s?.tipe_sesi || "").toUpperCase() === "SIANG");

          const isPagiDone = Boolean(sesiPagi && sesiPagi.jam_tiba_kantor);
          const isSiangDone = Boolean(sesiSiang && sesiSiang.jam_tiba_kantor);

          let statusLabel = "Tercatat";

          if (isPagiDone && isSiangDone) {
            statusLabel = "2 Sesi Selesai";
          } else if (isPagiDone && !isSiangDone) {
            statusLabel = "Sesi Pagi Selesai";
          } else if (!isPagiDone && isSiangDone) {
            statusLabel = "Sesi Siang Selesai";
          } else if (sesiList.length > 0) {
            statusLabel = "Sedang Berjalan";
          }

          return {
            ...item,
            driverName: user?.nama_lengkap || user?.nama || user?.name || "Driver",
            date: item.tanggal,
            trayek: item.trayek,
            bus: item.bus,
            jenis_kendaraan: item.jenis_kendaraan || item.penugasan?.jenis_kendaraan || user?.jenis_kendaraan || "-",
            kapasitas: item.kapasitas || item.kapasitas_penumpang || item.penugasan?.kapasitas_penumpang || user?.kapasitas || "-",
            kapasitas_penumpang: item.kapasitas_penumpang || item.kapasitas || item.penugasan?.kapasitas_penumpang || user?.kapasitas || "-",
            statusLabel,
            hasActivity: sesiList.length > 0,
          };
        });

        // Tampilkan semua laporan yang memiliki rekaman sesi
        const filteredData = formattedData.filter((report) => report.hasActivity);

        // Urutkan dari laporan terbaru
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
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-[#00206B] rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-medium text-slate-400 mt-4">Memuat riwayat perjalanan...</p>
      </div>
    );
  }

  // ==============================================================================
  // RENDER: TAMPILAN RIWAYAT LAPORAN DRIVER
  // ==============================================================================
  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12 px-4 md:px-0 font-sans text-left">
      <div className="pb-1">
        <h2 className="text-2xl md:text-3xl font-bold text-[#00206B] tracking-tight m-0">Riwayat Perjalanan</h2>
        <p className="text-xs text-slate-500 font-normal mt-1">Daftar catatan dan laporan operasional harian</p>
      </div>

      {reports.length > 0 ? (
        <div className="space-y-3 pt-1">
          {reports.map((report, index) => {
            const rawId =
              user?.id ||
              (report.id_supir && !report.id_supir.includes("@") ? report.id_supir : "") ||
              user?.email?.split("@")[0].toUpperCase() ||
              "DRIVER";
            const driverIdDisplay =
              rawId.toUpperCase().startsWith("DRV") || rawId.toUpperCase().startsWith("ID") ? rawId : `ID: ${rawId}`;

            return (
              <div
                key={index}
                onClick={() => onViewDetail && onViewDetail(report)}
                className="bg-white border border-slate-100 hover:border-slate-200 rounded-3xl p-4 sm:px-5 sm:py-4 shadow-[0_2px_15px_-3px_rgba(6,81,237,0.05)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out cursor-pointer flex items-center justify-between group"
              >
                {/* Kiri: Icon / Foto Profil + Info Laporan */}
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex-shrink-0 flex items-center justify-center text-slate-500 overflow-hidden">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Driver" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-800 m-0 tracking-tight truncate group-hover:text-[#00206B] transition-colors">
                        Laporan Operasional
                      </h3>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                        {report.statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500 font-medium">{report.date}</span>
                      <span className="text-slate-300 text-xs">•</span>
                      <span className="text-xs text-slate-400 font-medium">{driverIdDisplay}</span>
                    </div>
                  </div>
                </div>

                {/* Kanan: Link Rincian */}
                <div className="flex items-center gap-2 pl-3 flex-shrink-0 text-slate-400 group-hover:text-[#00206B] transition-colors">
                  <span className="text-xs font-medium hidden sm:inline text-slate-400 group-hover:text-[#00206B] transition-colors">
                    Lihat Rincian
                  </span>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-[#00206B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl shadow-[0_2px_15px_-3px_rgba(6,81,237,0.05)]">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Belum Ada Data Laporan</span>
        </div>
      )}
    </div>
  );
};

export default RiwayatDriver;
