import React from "react";

const DetailLaporan = ({ report }) => {
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
          <h3 className="text-xl font-black text-[#00206B]">Data Tidak Ditemukan</h3>
          <p className="text-sm text-slate-500 font-medium">Sesi terhapus. Silakan kembali ke halaman Riwayat.</p>
        </div>
      </div>
    );
  }

  const sesiPagi = report.trip_sessions?.find((s) => s.tipe_sesi?.toUpperCase() === "PAGI");
  const sesiSiang = report.trip_sessions?.find((s) => s.tipe_sesi?.toUpperCase() === "SIANG");
  const inspeksiPagi = report.inspections?.find((s) => s.tipe_sesi?.toUpperCase() === "PAGI");
  const inspeksiSiang = report.inspections?.find((s) => s.tipe_sesi?.toUpperCase() === "SIANG");

  const calculateCompleteness = () => {
    let totalPercentage = 0;
    const checkFields = [
      "jam_berangkat_kantor",
      "km_berangkat_kantor",
      "jam_berangkat_start",
      "km_berangkat_start",
      "jam_tiba_finish",
      "km_tiba_finish",
      "jumlah_penumpang",
      "jam_tiba_kantor",
      "km_tiba_kantor",
    ];
    const inspFields = ["rem", "ac", "lampu", "klakson", "wiper", "lampu_rem", "bell", "pintu", "kebersihan"];

    // 1. Sesi Pagi (Maks 25%)
    if (sesiPagi) {
      let filled = 0;
      checkFields.forEach((f) => {
        if (sesiPagi[f] !== null && sesiPagi[f] !== undefined) filled++;
      });
      totalPercentage += (filled / checkFields.length) * 25;
    }
    // 2. Inspeksi Pagi (Maks 25%)
    if (inspeksiPagi) {
      let filled = 0;
      inspFields.forEach((f) => {
        if (inspeksiPagi[f]) filled++;
      });
      totalPercentage += (filled / inspFields.length) * 25;
    }
    // 3. Sesi Siang (Maks 25%)
    if (sesiSiang) {
      let filled = 0;
      checkFields.forEach((f) => {
        if (sesiSiang[f] !== null && sesiSiang[f] !== undefined) filled++;
      });
      totalPercentage += (filled / checkFields.length) * 25;
    }
    // 4. Inspeksi Siang (Maks 25%)
    if (inspeksiSiang) {
      let filled = 0;
      inspFields.forEach((f) => {
        if (inspeksiSiang[f]) filled++;
      });
      totalPercentage += (filled / inspFields.length) * 25;
    }

    return Math.round(totalPercentage);
  };

  const completeness = calculateCompleteness();

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    try {
      const d = new Date(timeString);
      if (!isNaN(d.getTime())) return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      return timeString;
    } catch {
      return timeString;
    }
  };

  const TimelineItem = ({ title, time, odometer, passengers, isLast, foto, nopol }) => (
    <div className={`relative pl-7 ${isLast ? "" : "pb-8"}`}>
      <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-[#00206B] ring-4 ring-slate-50"></div>
      {!isLast && <div className="absolute left-[6px] top-5 bottom-0 w-0.5 bg-slate-100"></div>}

      <div>
        <h4 className="text-xs font-black text-[#00206B] uppercase tracking-wider">{title}</h4>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-sm">
          {/* Render Nopol & Merk Kendaraan HANYA jika datanya dikirim (Biasanya di CP1) */}
          {nopol && (
            <div className="col-span-2 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex justify-between items-center shadow-sm">
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">KENDARAAN</span>
              <span className="text-sm font-black text-amber-900">{nopol}</span>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-2xl">
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">WAKTU</span>
            <span className="block text-sm font-black text-slate-800 mt-1">{formatTime(time)} WIB</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">ODOMETER</span>
            <span className="block text-sm font-black text-slate-800 mt-1">{odometer ? `${odometer} KM` : "-"}</span>
          </div>

          {passengers !== undefined && passengers !== null && (
            <div className="col-span-2 bg-[#00206B] p-4 rounded-2xl flex justify-between items-center shadow-sm">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">SISWA DIANGKUT</span>
              <span className="text-sm font-black text-white">{passengers} ORANG</span>
            </div>
          )}

          {/* Render Bukti Foto Selfie */}
          {foto && (
            <div className="col-span-2 mt-1 relative rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm aspect-[4/3]">
              <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded shadow-sm z-10 uppercase tracking-widest">✓ FOTO VALIDASI</div>
              <img src={foto} alt="Bukti Operasional" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const inspKeys = [
    { id: "rem", label: "REM" },
    { id: "ac", label: "AC" },
    { id: "lampu", label: "LAMPU" },
    { id: "klakson", label: "KLAKSON" },
    { id: "wiper", label: "WIPER" },
    { id: "lampu_rem", label: "LAMPU REM" },
    { id: "bell", label: "BELL" },
    { id: "pintu", label: "PINTU" },
    { id: "kebersihan", label: "KEBERSIHAN" },
  ];

  // warna box kodisi kendaraan
  const RenderInspeksiBox = ({ dataInspeksi, title }) => (
    <div className="mb-8 last:mb-0">
      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">{title}</h4>
      {dataInspeksi ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {inspKeys.map((item, idx) => {
              const statusValue = dataInspeksi[item.id];
              const isOk = statusValue === "OK";
              return (
                <div key={idx} className={`flex items-center justify-between px-5 py-4 rounded-2xl ${isOk ? "bg-slate-50" : "bg-amber-500"}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isOk ? "text-slate-600" : "text-white"}`}>{item.label}</span>

                  <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase ${isOk ? "bg-emerald-500 text-white shadow-sm" : "bg-white text-amber-600 shadow-sm"}`}>
                    {statusValue || "-"}
                  </span>
                </div>
              );
            })}
          </div>
          {dataInspeksi.catatan && (
            <div className="mt-5 bg-amber-50 p-5 rounded-2xl border-l-4 border-amber-400">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-2">CATATAN KERUSAKAN</span>
              <p className="text-sm font-bold text-amber-900 leading-relaxed">{dataInspeksi.catatan}</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-400 font-black text-[10px] uppercase tracking-widest bg-slate-50 rounded-2xl">DATA INSPEKSI {title} BELUM TERSEDIA</div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 mt-2">
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-slate-100 to-transparent rounded-bl-full pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="inline-block px-4 py-1.5 bg-[#00206B] text-white text-[10px] font-black rounded-lg uppercase tracking-widest mb-4">LAPORAN OPERASIONAL</span>
            <h2 className="text-3xl font-black text-[#00206B] uppercase tracking-tighter">{report.tanggal || report.date || "TANGGAL KOSONG"}</h2>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#00206B] flex items-center justify-center text-white font-black text-xs">
                  {(report.driverName || "D").charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-black text-slate-700 uppercase">{report.driverName || "DRIVER"}</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
              <span className="text-sm font-black text-slate-500 uppercase">
                {report.trayek || "-"} ({report.bus || "-"})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 bg-slate-50 p-5 rounded-2xl">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={completeness >= 80 ? "#00206B" : completeness >= 50 ? "#F59E0B" : "#EF4444"}
                  strokeWidth="4"
                  strokeDasharray={`${completeness}, 100`}
                />
              </svg>
              <span className="absolute text-sm font-black text-[#00206B]">{completeness}%</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KELENGKAPAN</p>
              <p className={`text-sm font-black mt-1 uppercase ${completeness >= 80 ? "text-[#00206B]" : completeness >= 50 ? "text-amber-500" : "text-rose-500"}`}>
                {completeness >= 80 ? "DATA AMAN" : completeness >= 50 ? "BELUM LENGKAP" : "DATA KURANG"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-[#00206B] uppercase tracking-widest">SESI BERANGKAT (PAGI)</h3>
            {/* RENDER BADGE STATUS KEDISIPLINAN DI SINI */}
            {String(sesiPagi?.status_waktu || "").toUpperCase() === "TERLAMBAT" ? (
              <span className="bg-rose-100 text-rose-600 border border-rose-200 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                ⚠️ Terlambat
              </span>
            ) : String(sesiPagi?.status_waktu || "").toUpperCase() === "TEPAT WAKTU" ? (
              <span className="bg-emerald-100 text-emerald-600 border border-emerald-200 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                ✅ Tepat Waktu
              </span>
            ) : null}
          </div>
          {sesiPagi ? (
            <div>
              {/* CP1: Inject nopol_kendaraan dan foto_awal */}
              <TimelineItem title="KELUAR GARASI DISHUB" time={sesiPagi.jam_berangkat_kantor} odometer={sesiPagi.km_berangkat_kantor} nopol={sesiPagi.nopol_kendaraan} foto={sesiPagi.foto_awal} />
              <TimelineItem title="TIBA DI TITIK START" time={sesiPagi.jam_berangkat_start} odometer={sesiPagi.km_berangkat_start} />
              <TimelineItem title="TIBA DI SEKOLAH (FINISH)" time={sesiPagi.jam_tiba_finish} odometer={sesiPagi.km_tiba_finish} passengers={sesiPagi.jumlah_penumpang} />
              {/* CP4: Inject foto_akhir */}
              <TimelineItem title="KEMBALI KE DISHUB" time={sesiPagi.jam_tiba_kantor} odometer={sesiPagi.km_tiba_kantor} foto={sesiPagi.foto_akhir} isLast={true} />
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 font-black text-xs uppercase tracking-widest bg-slate-50 rounded-2xl">DATA SESI PAGI KOSONG</div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-[#00206B] uppercase tracking-widest">SESI PULANG (SIANG)</h3>
            {/* RENDER BADGE STATUS KEDISIPLINAN DI SINI */}
            {String(sesiSiang?.status_waktu || "").toUpperCase() === "TERLAMBAT" ? (
              <span className="bg-rose-100 text-rose-600 border border-rose-200 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                ⚠️ Terlambat
              </span>
            ) : String(sesiSiang?.status_waktu || "").toUpperCase() === "TEPAT WAKTU" ? (
              <span className="bg-emerald-100 text-emerald-600 border border-emerald-200 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                ✅ Tepat Waktu
              </span>
            ) : null}
          </div>
          {sesiSiang ? (
            <div>
              {/* CP1: Inject nopol_kendaraan dan foto_awal */}
              <TimelineItem title="KELUAR GARASI DISHUB" time={sesiSiang.jam_berangkat_kantor} odometer={sesiSiang.km_berangkat_kantor} nopol={sesiSiang.nopol_kendaraan} foto={sesiSiang.foto_awal} />
              <TimelineItem title="TIBA DI TITIK START" time={sesiSiang.jam_berangkat_start} odometer={sesiSiang.km_berangkat_start} />
              <TimelineItem title="TIBA DI SEKOLAH (FINISH)" time={sesiSiang.jam_tiba_finish} odometer={sesiSiang.km_tiba_finish} passengers={sesiSiang.jumlah_penumpang} />
              {/* CP4: Inject foto_akhir */}
              <TimelineItem title="KEMBALI KE DISHUB" time={sesiSiang.jam_tiba_kantor} odometer={sesiSiang.km_tiba_kantor} foto={sesiSiang.foto_akhir} isLast={true} />
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 font-black text-xs uppercase tracking-widest bg-slate-50 rounded-2xl">DATA SESI SIANG KOSONG</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm mt-6">
        <h3 className="text-sm font-black text-[#00206B] uppercase tracking-widest mb-6">KONDISI KENDARAAN (INSPEKSI)</h3>
        <RenderInspeksiBox dataInspeksi={inspeksiPagi} title="SESI PAGI" />
        <RenderInspeksiBox dataInspeksi={inspeksiSiang} title="SESI SIANG" />
      </div>
    </div>
  );
};

export default DetailLaporan;
