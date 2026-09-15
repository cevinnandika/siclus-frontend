import React from "react";

const PenugasanTable = ({
  penugasanList = [],
  isLoading = false,
  onAddPenugasan,
  onEditPenugasan,
  onDeletePenugasan,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs">
        <div>
          <h3 className="text-base font-black text-[#00206B] m-0 tracking-wide">Penugasan & Jadwal Armada</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Atur rute trayek, armada, nopol, serta toleransi jam operasional</p>
        </div>
        <button
          type="button"
          onClick={onAddPenugasan}
          className="bg-[#00206B] hover:bg-[#0A328C] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tugaskan Driver
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#00206B] rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-medium text-slate-400 mt-4">Memuat data penugasan & jadwal...</p>
          </div>
        ) : penugasanList.length > 0 ? (
          <div className="overflow-x-auto w-full border border-slate-200/90 rounded-2xl shadow-2xs">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">
                  <th className="py-3.5 px-3 whitespace-nowrap">Tanggal</th>
                  <th className="py-3.5 px-2 text-center whitespace-nowrap">Sesi</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Driver</th>
                  <th className="py-3.5 px-2 text-center whitespace-nowrap">Trayek</th>
                  <th className="py-3.5 px-2 text-center whitespace-nowrap">Nopol</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Armada & Kapasitas</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Jam Toleransi Operasional</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {penugasanList.map((p, pIdx) => {
                  const driverName = p.users?.nama || p.users?.nama_lengkap || p.id_supir || "Driver";
                  const initials = driverName.slice(0, 2).toUpperCase();

                  const pagiKeluar = p.jam_keluar_dishub_pagi || p.batas_keluar_pagi || "06:30";
                  const pagiKembali = p.jam_kembali_dishub_pagi || p.batas_kembali_pagi || "08:00";

                  const siangKeluar = p.jam_keluar_dishub_siang || p.batas_keluar_siang || "13:30";
                  const siangKembali = p.jam_kembali_dishub_siang || p.batas_kembali_siang || "14:30";

                  const sessions = [
                    {
                      key: "pagi",
                      name: "Pagi",
                      jam: `${pagiKeluar} s/d ${pagiKembali}`,
                      isPagi: true,
                    },
                    {
                      key: "siang",
                      name: "Siang",
                      jam: `${siangKeluar} s/d ${siangKembali}`,
                      isPagi: false,
                    },
                  ];

                  return sessions.map((sesi, sIdx) => {
                    const isFirst = sIdx === 0;
                    const isLast = sIdx === sessions.length - 1;

                    return (
                      <tr
                        key={`${p.id || pIdx}_${sesi.key}`}
                        className={`transition-colors bg-white hover:bg-sky-50/25 ${
                          isLast ? "border-b-2 border-slate-200/90" : "border-b border-dashed border-slate-200/80"
                        }`}
                      >
                        {/* 1. Tanggal */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isFirst ? (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#00206B] flex-shrink-0 shadow-2xs ml-0.5" />
                              <span className="font-extrabold text-[#00206B] text-xs tracking-tight">{p.tanggal}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 pl-2" title={`Tanggal: ${p.tanggal} (${sesi.name})`}>
                              <span className="text-slate-300 font-bold text-xs">└─</span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70">
                                Sesi Lanjutan
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 2. Sesi */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border shadow-2xs ${
                              sesi.isPagi ? "bg-amber-50 text-amber-800 border-amber-200/70" : "bg-blue-50 text-blue-800 border-blue-200/70"
                            }`}
                          >
                            {sesi.name}
                          </span>
                        </td>

                        {/* 3. Driver */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center text-[#00206B] font-black text-xs flex-shrink-0 shadow-2xs">
                              {p?.foto_profil || p?.users?.foto_profil ? (
                                <img
                                  src={p.foto_profil || p.users?.foto_profil}
                                  alt={driverName}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.parentElement.innerText = initials;
                                  }}
                                />
                              ) : (
                                initials
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-[#00206B] uppercase tracking-tight">{driverName}</span>
                              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                                {p.id_supir}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 4. Trayek */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-50 text-[#00206B] font-bold text-xs border border-sky-200/70 shadow-2xs">
                            {p.trayek || "-"}
                          </span>
                        </td>

                        {/* 5. Nopol */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs">
                            {p.nopol_kendaraan || "-"}
                          </span>
                        </td>

                        {/* 6. Armada & Kapasitas */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-600">
                            {p.jenis_kendaraan ? `${p.jenis_kendaraan} • ` : ""}
                            {p.kapasitas_penumpang || 25} Kursi
                          </span>
                        </td>

                        {/* 7. Jam Toleransi Operasional */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/70 shadow-2xs">
                            {sesi.jam}
                          </span>
                        </td>

                        {/* 8. Aksi */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {!sesi.isPagi && (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onEditPenugasan(p)}
                                className="bg-sky-50 text-[#00206B] hover:bg-[#00206B] hover:text-white border border-sky-200/80 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs active:scale-95"
                                title="Edit penugasan ini"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                  />
                                </svg>
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeletePenugasan(p)}
                                className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200/80 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs active:scale-95"
                                title="Hapus penugasan ini"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                  />
                                </svg>
                                Hapus
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-14 flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-3.5 text-slate-400 shadow-2xs">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.948c0-.621-.504-1.125-1.125-1.125H5.625a1.125 1.125 0 00-1.125 1.125v1.206"
                />
              </svg>
            </div>
            <h3 className="text-sm font-black text-[#00206B]">Belum Ada Penugasan Armada</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Klik tombol "Tugaskan Driver" untuk menjadwalkan operasional supir.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PenugasanTable;
