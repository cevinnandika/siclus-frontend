import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";

const RiwayatDriver = ({ onViewDetail, user }) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    apiService
      .getRiwayatDriver()
      .then((res) => {
        const rawList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        const formattedData = rawList.map((item) => {
          const isShiftClosed = item.trip_sessions?.some(sesi => sesi.jam_tiba_kantor !== null);
          return {
            ...item,
            driverName: user?.nama_lengkap || user?.nama || user?.name || "Driver",
            date: item.tanggal,
            trayek: item.trayek,
            bus: item.bus,
            submittedAt: isShiftClosed ? "SELESAI DIREKAM" : (item.trip_sessions?.length > 0 ? "SEDANG BERJALAN" : "BELUM DIMULAI"),
          };
        });

        // --- KODE FILTER BARU ---
        // Hanya simpan laporan yang statusnya sudah Selesai Direkam
        const filteredData = formattedData.filter(report => report.submittedAt === "SELESAI DIREKAM");

        // Urutkan dan set ke state
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
        <span className="text-xs font-black text-[#00206B] uppercase tracking-widest animate-pulse">MEMUAT RIWAYAT PERJALANAN...</span>
      </div>
    );
  }

  const driverInitial = (user?.nama_lengkap || user?.nama || user?.name || "P").charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-2">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#00206B] uppercase tracking-tighter">RIWAYAT PERJALANAN</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">CATATAN OPERASIONAL HARIAN SISTEM</p>
      </div>

      {reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report, index) => {
            const isCompleted = report.submittedAt === "SELESAI DIREKAM";
            return (
              <div
                key={index}
                onClick={() => onViewDetail && onViewDetail(report)}
                className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-white flex items-center justify-between"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-[#00206B] flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-sm">{driverInitial}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-[#00206B] uppercase tracking-wide truncate">LAPORAN OPERASIONAL</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{report.date}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {report.trayek} ({report.bus})
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <span
                        className={`inline-block px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isCompleted ? "bg-[#00206B] text-white shadow-sm" : "bg-slate-100 text-slate-500"}`}
                      >
                        STATUS: {report.submittedAt}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-slate-300 pr-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-3xl">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">BELUM ADA DATA LAPORAN</span>
        </div>
      )}
    </div>
  );
};

export default RiwayatDriver;
