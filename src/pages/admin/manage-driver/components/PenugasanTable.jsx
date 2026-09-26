import React from "react";

// ==============================================================================
// KOMPONEN: TABEL PENUGASAN (DAFTAR PENUGASAN ARMADA, STATUS & JADWAL OPERASIONAL)
// ==============================================================================
const PenugasanTable = ({ penugasanList = [], drivers = [], isLoading = false, onAddPenugasan, onEditPenugasan, onDeletePenugasan, onBatalkanPenugasan }) => {
  return (
    <div className="space-y-4 text-left">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:px-5 sm:py-3 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-[#00206B] m-0 tracking-wide">Penugasan & Jadwal Trayek</h3>
          <p className="text-xs text-slate-500 font-normal mt-0.5">Atur rute trayek, kendaraan, nopol, serta toleransi jam operasional</p>
        </div>
        <button
          type="button"
          onClick={onAddPenugasan}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          TUGASKAN DRIVER
        </button>
      </div>

      {/* Table Card (Identik dengan RekapTable) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-[0_4px_24px_-6px_rgba(0,32,107,0.06)] overflow-hidden text-left">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#00206B] rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-medium text-slate-400 mt-4">Memuat data penugasan & jadwal...</p>
          </div>
        ) : penugasanList.length > 0 ? (
          <div className="overflow-x-auto w-full min-h-[300px]">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead className="bg-slate-50 border-b border-slate-200/80">
                <tr className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  <th className="py-4 px-3.5 whitespace-nowrap">Tanggal</th>
                  <th className="py-4 px-2 text-center whitespace-nowrap">Sesi</th>
                  <th className="py-4 px-3 whitespace-nowrap">Driver</th>
                  <th className="py-4 px-2 text-center whitespace-nowrap">Trayek</th>
                  <th className="py-4 px-2 text-center whitespace-nowrap">Nopol</th>
                  <th className="py-4 px-3 text-center whitespace-nowrap">Kendaraan & Kapasitas</th>
                  <th className="py-4 px-3 text-center whitespace-nowrap">Jam Toleransi Operasional</th>
                  <th className="py-4 px-3 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {penugasanList.map((p, pIdx) => {
                  const driverName = p.users?.nama || p.users?.nama_lengkap || p.id_supir || "Driver";
                  const initials = driverName.slice(0, 2).toUpperCase();
                  const matchedDriver = (drivers || []).find((d) => (d.id || d.id_driver) === p.id_supir || (d.nama || d.nama_lengkap) === p.users?.nama);
                  const driverPhoto = p?.foto_profil || p?.users?.foto_profil || matchedDriver?.foto_profil || null;

                  const pagiKeluar = p.jam_keluar_dishub_pagi || p.batas_keluar_pagi || "06:30";
                  const pagiKembali = p.jam_kembali_dishub_pagi || p.batas_kembali_pagi || "08:00";

                  const siangKeluar = p.jam_keluar_dishub_siang || p.batas_keluar_siang || "13:30";
                  const siangKembali = p.jam_kembali_dishub_siang || p.batas_kembali_siang || "14:30";

                  const rawTipe = String(p.tipe_sesi || "SEMUA")
                    .replace(/'/g, "")
                    .trim()
                    .toUpperCase();
                  let sessions = [];
                  if (rawTipe === "PAGI") {
                    sessions = [
                      {
                        key: "pagi",
                        name: "Pagi",
                        jam: `${pagiKeluar} s/d ${pagiKembali}`,
                        isPagi: true,
                      },
                    ];
                  } else if (rawTipe === "SIANG") {
                    sessions = [
                      {
                        key: "siang",
                        name: "Siang",
                        jam: `${siangKeluar} s/d ${siangKembali}`,
                        isPagi: false,
                      },
                    ];
                  } else if (rawTipe === "BATAL") {
                    sessions = [
                      {
                        key: "batal",
                        name: "Dibatalkan",
                        jam: "-",
                        isPagi: false,
                        isBatal: true,
                      },
                    ];
                  } else {
                    // "SEMUA"
                    sessions = [
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
                  }

                  return sessions.map((sesi, sIdx) => {
                    const isFirst = sIdx === 0;
                    const isLast = sIdx === sessions.length - 1;

                    return (
                      <tr
                        key={`${p.id || pIdx}_${sesi.key}`}
                        className={`transition-colors bg-white hover:bg-sky-50/25 ${isLast ? "border-b-2 border-slate-200/90" : "border-b border-dashed border-slate-200/80"}`}
                      >
                        {/* 1. Tanggal */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          {isFirst ? (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#00206B] flex-shrink-0 shadow-2xs ml-0.5" />
                              <span className="font-bold text-[#00206B] text-xs tracking-tight">{p.tanggal}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 pl-2" title={`Tanggal: ${p.tanggal} (${sesi.name})`}>
                              <span className="text-slate-300 font-semibold text-xs">└─</span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70">
                                Sesi Lanjutan
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 2. Sesi */}
                        <td className="py-3.5 px-2 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold border shadow-2xs ${
                              sesi.isBatal
                                ? "bg-rose-50 text-rose-800 border-rose-200/70"
                                : sesi.isPagi
                                  ? "bg-amber-50 text-amber-800 border-amber-200/70"
                                  : "bg-blue-50 text-blue-800 border-blue-200/70"
                            }`}
                          >
                            {sesi.name}
                          </span>
                        </td>

                        {/* 3. Driver */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100/90 to-blue-50 border border-sky-200/70 text-[#00206B] flex items-center justify-center font-bold text-xs shadow-2xs flex-shrink-0">
                              {driverPhoto ? (
                                <img
                                  src={driverPhoto}
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
                            <div>
                              <span className="font-semibold text-xs text-[#00206B] uppercase tracking-tight block">{driverName}</span>
                              <span className="inline-block px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-500 font-semibold tracking-wider mt-0.5">{p.id_supir}</span>
                            </div>
                          </div>
                        </td>

                        {/* 4. Trayek */}
                        <td className="py-3.5 px-2 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-50 text-[#00206B] font-semibold text-xs border border-sky-200/70 shadow-2xs">{p.trayek || "-"}</span>
                        </td>

                        {/* 5. Nopol */}
                        <td className="py-3.5 px-2 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs shadow-2xs">{p.nopol_kendaraan || "-"}</span>
                        </td>

                        {/* 6. Armada & Kapasitas */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-600">
                            {p.jenis_kendaraan ? `${p.jenis_kendaraan} • ` : ""}
                            {p.kapasitas_penumpang || 25} Kursi
                          </span>
                        </td>

                        {/* 7. Jam Toleransi Operasional */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/70 shadow-2xs">{sesi.jam}</span>
                        </td>

                        {/* 8. Aksi */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {isLast ? (
                            rawTipe === "BATAL" || p.status_operasional === "BATAL" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 shadow-2xs">
                                <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                Dibatalkan
                              </span>
                            ) : p.status_operasional === "SELESAI" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 shadow-2xs">
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Selesai
                              </span>
                            ) : p.status_operasional === "BERJALAN" ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 shadow-2xs">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                  Sedang Jalan
                                </span>
                                {onBatalkanPenugasan && (
                                  <button
                                    type="button"
                                    onClick={() => onBatalkanPenugasan(p)}
                                    className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200/70 text-rose-600 font-semibold text-xs transition-all cursor-pointer active:scale-95 shadow-2xs flex items-center gap-1"
                                    title="Batalkan Sisa Operasional Driver"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    Batalkan
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onEditPenugasan(p)}
                                  className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/70 hover:border-blue-200 text-slate-600 hover:text-blue-600 transition-all cursor-pointer active:scale-95 shadow-2xs"
                                  title="Edit Penugasan (Belum Dimulai)"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                    />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeletePenugasan(p)}
                                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/70 text-rose-600 transition-all cursor-pointer active:scale-95 shadow-2xs"
                                  title="Hapus Penugasan (Belum Dimulai)"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                    />
                                  </svg>
                                </button>
                              </div>
                            )
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
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
          <div className="text-center py-16 space-y-2">
            <div className="w-14 h-14 border border-slate-100 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.948c0-.621-.504-1.125-1.125-1.125H5.625a1.125 1.125 0 00-1.125 1.125v1.206"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-[#00206B] m-0">Belum Ada Penugasan Driver</h3>
            <p className="text-xs text-slate-400 mt-1">Klik tombol "Tugaskan Driver" untuk menjadwalkan operasional supir.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PenugasanTable;
