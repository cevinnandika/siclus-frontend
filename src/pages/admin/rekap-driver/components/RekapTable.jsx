import React from "react";
import DateRangeFilter from "./DateRangeFilter";

const RekapTable = ({
  groupedData = [],
  isLoading = false,
  searchQuery = "",
  setSearchQuery,
  startDate = "",
  endDate = "",
  onApplyDateFilter,
  onClearDateFilter,
  onExportAll,
  onSelectDriver,
}) => {
  return (
    <>
      {/* Header & Integrated Toolbar */}
      <div className="space-y-4 text-left">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#00206B] tracking-tight m-0">Rekapitulasi Kinerja</h2>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Pantau akumulasi performa, trip harian, dan kedisiplinan seluruh driver.
          </p>
        </div>

        {/* UNIFIED ACTION & FILTER TOOLBAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 p-2.5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,32,107,0.05)]">
          {/* Search Bar */}
          <div className="relative flex items-center w-full sm:w-64 md:w-72">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari supir / trayek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full bg-slate-50/80 hover:bg-white border border-slate-200 focus:border-sky-500 focus:bg-white text-xs font-semibold text-slate-700 rounded-xl pl-9 pr-8 outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-normal transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                title="Hapus pencarian"
                className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Right Toolbar: Date Filter + Export All */}
          <div className="flex items-center gap-2 relative">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onApply={onApplyDateFilter}
              onClear={onClearDateFilter}
            />

            <button
              type="button"
              onClick={onExportAll}
              disabled={groupedData.length === 0}
              className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 ${
                groupedData.length === 0
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border border-emerald-700/80 shadow-xs cursor-pointer active:scale-95"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Rekap Semua Driver</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-[0_4px_24px_-6px_rgba(0,32,107,0.06)] overflow-hidden text-left">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#00206B] rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-medium text-slate-400 mt-4">Memuat data rekap...</p>
          </div>
        ) : groupedData.length === 0 ? (
          <div className="text-center text-slate-400 font-medium py-16 space-y-2">
            <div className="w-14 h-14 border border-slate-100 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <p className="font-bold text-slate-600 m-0">Belum ada data di periode ini.</p>
            <p className="text-xs text-slate-400">Silakan pilih rentang waktu lainnya pada filter di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full max-h-[calc(100vh-280px)] min-h-[320px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-xs">
                <tr className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  <th className="py-4 px-6">Driver</th>
                  <th className="py-4 px-6 text-center">Total Laporan</th>
                  <th className="py-4 px-6 text-center">Total Penumpang</th>
                  <th className="py-4 px-6 text-center">Tepat Waktu</th>
                  <th className="py-4 px-6 text-center">Terlambat</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {groupedData.map((supir, index) => (
                  <tr
                    key={supir.id_supir || index}
                    onClick={() => onSelectDriver(supir.id_supir)}
                    className="hover:bg-gradient-to-r hover:from-sky-50/40 hover:via-blue-50/25 hover:to-transparent transition-all duration-150 group cursor-pointer"
                    title={`Klik untuk melihat detail rekap ${supir.nama_supir}`}
                  >
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100/90 to-blue-50 border border-sky-200/70 text-[#00206B] flex items-center justify-center font-bold text-sm shadow-2xs flex-shrink-0 group-hover:border-[#00206B] transition-all duration-200">
                          {supir.foto_profil ? (
                            <img
                              src={supir.foto_profil}
                              alt={supir.nama_supir}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.parentElement.innerText = supir.nama_supir.charAt(0).toUpperCase();
                              }}
                            />
                          ) : (
                            supir.nama_supir.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-800 block group-hover:text-[#00206B] transition-colors">
                            {supir.nama_supir}
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-500 font-semibold tracking-wider mt-0.5">
                            {supir.id_supir}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4.5 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60 font-semibold text-xs shadow-2xs">
                        <span className="font-bold text-slate-900 text-sm">
                          {supir.list_laporan?.length || supir.total_hari_jalan || 0}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">Laporan</span>
                      </span>
                    </td>

                    <td className="py-4.5 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200/80 font-semibold text-xs shadow-2xs">
                        <svg className="w-3.5 h-3.5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                          />
                        </svg>
                        <span className="font-bold text-sky-950 text-sm">{supir.total_penumpang}</span>
                        <span className="text-[11px] text-sky-700/80 font-medium">Siswa</span>
                      </span>
                    </td>

                    <td className="py-4.5 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200/80 font-semibold text-xs px-3 py-1 rounded-xl shadow-2xs">
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{supir.total_tepat} Tepat</span>
                      </span>
                    </td>

                    <td className="py-4.5 px-6 text-center">
                      {supir.total_telat > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-rose-800 bg-rose-50 border border-rose-200/80 font-semibold text-xs px-3 py-1 rounded-xl shadow-2xs">
                          <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                          <span>{supir.total_telat} Telat</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400 text-xs font-semibold">
                          0 Telat
                        </span>
                      )}
                    </td>

                    <td className="py-4.5 px-6 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDriver(supir.id_supir);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-sky-50 to-blue-50 hover:from-[#00206B] hover:to-[#0A328C] border border-sky-200/80 hover:border-[#00206B] text-[#00206B] hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm active:scale-95 group/btn"
                      >
                        <span>Lihat Log</span>
                        <svg
                          className="w-3.5 h-3.5 text-[#00206B] group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default RekapTable;
