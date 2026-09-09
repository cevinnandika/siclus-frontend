import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";

const RiwayatDriver = ({ onViewDetail, user }) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(user?.foto_profil || null);

  // Ambil data foto profil supir agar selalu sinkron dengan foto yang dipasang di profil
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
        } catch (e) {}
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

  useEffect(() => {
    if (!user) return;

    apiService
      .getRiwayatDriver()
      .then((res) => {
        const rawList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        const formattedData = rawList.map((item) => {
          const isShiftClosed = item.trip_sessions?.some((sesi) => sesi.jam_tiba_kantor !== null);
          return {
            ...item,
            driverName: user?.nama_lengkap || user?.nama || user?.name || "Driver",
            date: item.tanggal,
            trayek: item.trayek,
            bus: item.bus,
            submittedAt: isShiftClosed ? "SELESAI DIREKAM" : (item.trip_sessions?.length > 0 ? "SEDANG BERJALAN" : "BELUM DIMULAI"),
          };
        });

        // Hanya tampilkan laporan yang statusnya sudah Selesai Direkam
        const filteredData = formattedData.filter((report) => report.submittedAt === "SELESAI DIREKAM");

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
      <div className="flex justify-center items-center p-20">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Memuat Riwayat Perjalanan...
        </span>
      </div>
    );
  }

  const driverInitial = (user?.nama_lengkap || user?.nama || user?.name || "R").charAt(0).toUpperCase();

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12 px-4 md:px-0 font-sans text-left">
      {/* Header Halaman: Nama Sesuai Menu & Subtitle Masuk Akal */}
      <div className="pb-1">
        <h2 className="text-2xl font-bold text-slate-900 m-0 tracking-tight">
          Riwayat Perjalanan
        </h2>
        <p className="text-sm text-slate-400 font-normal mt-1">
          Daftar catatan dan laporan operasional harian yang telah diselesaikan.
        </p>
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
              rawId.toUpperCase().startsWith("DRV") || rawId.toUpperCase().startsWith("ID")
                ? rawId
                : `ID: ${rawId}`;

            return (
              <div
                key={index}
                onClick={() => onViewDetail && onViewDetail(report)}
                className="bg-white border border-slate-200/80 hover:border-[#00206B]/50 rounded-2xl p-4 sm:px-5 sm:py-3.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between group"
              >
                {/* Kiri: Avatar Bulat Utuh + Info Laporan & Tanggal (Satu Bar Bersih & Rapi) */}
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  {/* Avatar Bulat Utuh: Menampilkan Foto Profil Supir atau Inisial Bulat Sempurna */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200/80 flex-shrink-0 flex items-center justify-center shadow-sm">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt={user?.nama_lengkap || "Driver"}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#00206B] text-white flex items-center justify-center font-bold text-sm sm:text-base">
                        {driverInitial}
                      </div>
                    )}
                  </div>

                  {/* Teks Info: Judul Laporan Operasional & Tanggal + ID Driver dalam Satu Baris Terpadu */}
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 m-0 tracking-tight truncate group-hover:text-[#00206B] transition-colors">
                      Laporan Operasional
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 font-medium">
                        {report.date}
                      </span>
                      <span className="text-slate-300 text-xs">|</span>
                      <span className="text-xs text-slate-400 font-semibold tracking-wide">
                        {driverIdDisplay}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kanan: Navigasi Lihat Rincian + Tombol Chevron Bulat Elegan */}
                <div className="flex items-center gap-3 pl-3 flex-shrink-0 text-slate-400 group-hover:text-[#00206B] transition-colors">
                  <span className="text-xs font-semibold hidden sm:inline text-slate-500 group-hover:text-[#00206B]">
                    Lihat Rincian
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#00206B] text-slate-400 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Belum Ada Data Laporan
          </span>
        </div>
      )}
    </div>
  );
};

export default RiwayatDriver;
