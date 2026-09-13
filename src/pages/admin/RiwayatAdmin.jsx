import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";

const RiwayatAdmin = () => {
  const [laporanHarian, setLaporanHarian] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPantauan = async () => {
      try {
        // Pastikan memanggil API yang benar dari apiService
        const res = await (apiService.getPantauanHarian ? apiService.getPantauanHarian() : apiService.getRiwayatHarianAdmin());
        // Amankan mapping data
        const dataTarget = res?.data || res || [];
        const rawList = Array.isArray(dataTarget) ? dataTarget : [];

        // Jika data dikelompokkan berdasarkan tanggal: [{ tanggal, laporan: [...] }], lakukan flattening secara aman
        let flattened = [];
        if (rawList.length > 0 && Array.isArray(rawList[0]?.laporan)) {
          rawList.forEach((group) => {
            (group.laporan || []).forEach((lap) => {
              flattened.push({
                ...lap,
                tanggal: lap.tanggal || group.tanggal,
              });
            });
          });
        } else {
          flattened = [...rawList];
        }

        // Normalisasi data laporan agar pengemudi, status, dan catatan inspeksi selalu siap diakses
        const normalized = flattened.map((lap) => {
          const catatanInspeksi =
            lap?.inspeksi?.catatan ||
            lap?.catatan_inspeksi ||
            (Array.isArray(lap?.inspections) ? lap.inspections.find((i) => i?.catatan)?.catatan : null) ||
            (Array.isArray(lap?.trip_sessions) ? lap.trip_sessions.find((s) => s?.catatan)?.catatan : null) ||
            lap?.catatan ||
            "";

          const namaSupir =
            lap?.pengemudi?.nama_lengkap ||
            lap?.pengemudi?.nama ||
            lap?.users?.nama ||
            lap?.nama_supir ||
            lap?.id_supir ||
            "Supir";

          const sesiAkhir = lap.trip_sessions?.[lap.trip_sessions.length - 1];
          const isSelesai = sesiAkhir?.jam_tiba_kantor !== null && sesiAkhir?.jam_tiba_kantor !== undefined;
          const status = lap.status || (isSelesai ? "SELESAI DIREKAM" : "SEDANG BERJALAN");
          const statusWaktu = sesiAkhir?.status_waktu || lap.status_waktu || "BELUM ADA";

          return {
            ...lap,
            pengemudi: {
              nama_lengkap: namaSupir,
              ...(lap.pengemudi || {}),
            },
            inspeksi: catatanInspeksi ? { ...(lap.inspeksi || {}), catatan: catatanInspeksi } : lap.inspeksi,
            status,
            status_waktu: statusWaktu,
          };
        });

        setLaporanHarian(normalized);
      } catch (error) {
        console.error("Gagal menarik data pantauan:", error);
        setLaporanHarian([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPantauan();
  }, []);

  if (isLoading) {
    return <div className="text-center p-10 font-bold text-[#00206B] animate-pulse">Menghubungkan ke Live Feed Server... ⏳</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-black text-[#00206B] m-0 tracking-wide uppercase">Pantauan Harian</h2>
        <p className="text-sm text-slate-400 font-semibold mt-0.5">Live feed status laporan operasional driver per hari.</p>
      </div>

      {laporanHarian.length === 0 ? (
        /* EMPTY STATE YANG SEKARANG ADA DI LAYAR */
        <div className="text-center py-16 bg-white border-2 border-slate-200 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-black text-slate-400 uppercase tracking-widest">BELUM ADA PANTAUAN HARIAN</span>
        </div>
      ) : (
        /* RENDER LIST CARD LAPORAN DI SINI */
        <div className="space-y-4">
          {laporanHarian.map((laporan, index) => {
            const namaSupir = laporan?.pengemudi?.nama_lengkap || "Supir";
            const statusText = laporan?.status || "PROSES";
            const isSelesai = statusText === "SELESAI DIREKAM" || statusText === "SELESAI";
            const isLate = laporan?.status_waktu === "TERLAMBAT";

            return (
              <div key={laporan.id || index} className="p-5 bg-white border-2 border-slate-100 hover:border-blue-200 rounded-2xl shadow-sm transition-all">
                {/* Header Card: Nama Supir, Trayek, dan Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#00206B] to-blue-500 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
                      {laporan?.pengemudi?.foto_profil || laporan?.users?.foto_profil || laporan?.foto_profil ? (
                        <img
                          src={laporan?.pengemudi?.foto_profil || laporan?.users?.foto_profil || laporan?.foto_profil}
                          alt={namaSupir}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement.innerText = (namaSupir || "?").charAt(0).toUpperCase();
                          }}
                        />
                      ) : (
                        (namaSupir || "?").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#00206B] text-sm md:text-base uppercase m-0 leading-tight">
                        {namaSupir}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          TRAYEK {laporan?.trayek || "-"} • {laporan?.bus || "-"}
                        </span>
                        {laporan?.tanggal && (
                          <>
                            <span className="text-slate-300 text-[10px]">•</span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {laporan.tanggal}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isSelesai ? (
                      <span className="bg-[#E6F7ED] text-[#137333] border border-[#BCECD2] text-[10px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-wider">
                        {statusText}
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        {statusText}
                      </span>
                    )}
                    {isLate && (
                      <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-rose-500"></span> TERLAMBAT
                      </span>
                    )}
                  </div>
                </div>

                {/* Tampilkan Catatan Krusial (Inspeksi) Jika Ada */}
                {laporan?.inspeksi?.catatan && (
                  <div className="bg-rose-50 border border-rose-200 p-2 rounded-lg mt-2">
                    <p className="text-[10px] text-rose-600 font-bold uppercase">⚠️ Catatan Inspeksi:</p>
                    <p className="text-xs text-rose-800 font-semibold">{laporan.inspeksi.catatan}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RiwayatAdmin;