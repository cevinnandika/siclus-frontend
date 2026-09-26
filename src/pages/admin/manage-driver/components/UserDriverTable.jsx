import React, { useState } from "react";

// ==============================================================================
// KOMPONEN: TABEL DATA DRIVER (MASTER AKUN & KREDENSIAL PENGEMUDI)
// ==============================================================================
const UserDriverTable = ({ drivers = [], isLoading = false, onAddDriver, onEditDriver, onDeleteDriver }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDrivers = (drivers || []).filter((driver) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (driver?.nama_lengkap || driver?.nama || driver?.name || "").toLowerCase();
    const id = (driver?.id_driver || driver?.id || driver?.id_supir || "").toLowerCase();
    const email = (driver?.email || "").toLowerCase();
    return name.includes(q) || id.includes(q) || email.includes(q);
  });

  return (
    <div className="space-y-4 text-left">
      {/* Header bar / Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:px-5 sm:py-3 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau ID driver..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00206B] focus:ring-2 focus:ring-[#00206B]/10 transition-all"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              title="Hapus pencarian"
              className="absolute right-2.5 top-2 p-0.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onAddDriver}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider cursor-pointer flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          TAMBAH DRIVER
        </button>
      </div>

      {/* Table Card (Identik dengan RekapTable) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-[0_4px_24px_-6px_rgba(0,32,107,0.06)] overflow-hidden text-left">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#00206B] rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-medium text-slate-400 mt-4">Memuat data driver...</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <div className="w-14 h-14 border border-slate-100 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-[#00206B] m-0">Belum Ada Data Driver</h3>
            <p className="text-xs text-slate-400 mt-1">Klik tombol tambah driver untuk mendaftarkan akun.</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <div className="w-12 h-12 border border-slate-100 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-slate-700 m-0">Driver Tidak Ditemukan</h4>
            <p className="text-xs text-slate-400">Tidak ada driver yang cocok dengan pencarian "{searchQuery}".</p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#00206B] transition-colors cursor-pointer"
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full min-h-[300px]">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead className="bg-slate-50 border-b border-slate-200/80">
                <tr className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  <th className="py-4 px-6">Driver</th>
                  <th className="py-4 px-6 text-center">ID Driver</th>
                  <th className="py-4 px-6">Email Terdaftar</th>
                  <th className="py-4 px-6 text-center">Status Akun</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {filteredDrivers.map((driver, index) => {
                  const driverName = driver?.nama_lengkap || driver?.nama || driver?.name || "-";
                  const driverId = driver?.id_driver || driver?.id || driver?.id_supir || "-";
                  const initials = (driverName !== "-" ? driverName.slice(0, 2) : "DR").toUpperCase();

                  return (
                    <tr
                      key={driver?.id || driver?._id || driver?.id_supir || index}
                      className="hover:bg-gradient-to-r hover:from-sky-50/40 hover:via-blue-50/25 hover:to-transparent transition-all duration-150 group"
                    >
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100/90 to-blue-50 border border-sky-200/70 text-[#00206B] flex items-center justify-center font-bold text-sm shadow-2xs flex-shrink-0 group-hover:border-[#00206B] transition-all duration-200">
                            {driver?.foto_profil ? (
                              <img
                                src={driver.foto_profil}
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
                            <span className="text-sm font-semibold text-slate-800 block group-hover:text-[#00206B] transition-colors">{driverName}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4.5 px-6 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200/80 shadow-2xs tracking-wider">{driverId}</span>
                      </td>

                      <td className="py-4.5 px-6">
                        <span className="text-xs font-semibold text-slate-600 block">{driver?.email || "-"}</span>
                      </td>

                      <td className="py-4.5 px-6 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                          AKTIF
                        </span>
                      </td>

                      <td className="py-4.5 px-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditDriver(driver)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer active:scale-95 shadow-2xs"
                            title="Edit Driver"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                              />
                            </svg>
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDriver(driver)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer active:scale-95 shadow-2xs"
                            title="Hapus Driver"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDriverTable;
