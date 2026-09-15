import React from "react";

const UserDriverTable = ({
  drivers = [],
  isLoading = false,
  onAddDriver,
  onEditDriver,
  onDeleteDriver,
}) => {
  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs">
        <div>
          <h3 className="text-base font-black text-[#00206B] m-0 tracking-wide">Master Data Driver</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Kelola akun login dan kredensial driver</p>
        </div>
        <button
          type="button"
          onClick={onAddDriver}
          className="bg-[#00206B] hover:bg-[#0A328C] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          TAMBAH DRIVER
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#00206B] rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-medium text-slate-400 mt-4">Memuat data driver...</p>
          </div>
        ) : drivers.length > 0 ? (
          <div className="overflow-x-auto w-full border border-slate-200/90 rounded-2xl shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">
                  <th className="py-3.5 px-5 whitespace-nowrap">Driver</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Email Terdaftar</th>
                  <th className="py-3.5 px-5 text-center whitespace-nowrap">Status Akun</th>
                  <th className="py-3.5 px-5 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {drivers.map((driver, index) => {
                  const driverName = driver?.nama_lengkap || driver?.nama || driver?.name || "-";
                  const driverId = driver?.id_driver || driver?.id || driver?.id_supir || "-";
                  const initials = (driverName !== "-" ? driverName.slice(0, 2) : "DR").toUpperCase();

                  return (
                    <tr
                      key={driver?.id || driver?._id || driver?.id_supir || index}
                      className="border-b border-slate-100/90 hover:bg-sky-50/30 transition-colors bg-white"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center text-[#00206B] font-black text-xs flex-shrink-0 shadow-2xs">
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
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-[#00206B] uppercase tracking-tight">{driverName}</span>
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md inline-block">
                              {driverId}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-xs font-semibold text-slate-600">{driver?.email || "-"}</td>
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          DRIVER AKTIF
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditDriver(driver)}
                            className="bg-sky-50 text-[#00206B] hover:bg-[#00206B] hover:text-white border border-sky-200/80 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs active:scale-95"
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
                            onClick={() => onDeleteDriver(driver)}
                            className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200/80 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs active:scale-95"
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-extrabold text-[#00206B]">Belum Ada Data Driver</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Klik tombol tambah driver untuk mendaftarkan akun.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDriverTable;
