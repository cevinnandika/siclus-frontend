import React, { useMemo } from "react";
import DateRangeFilter from "./DateRangeFilter";
import { formatCompactNumber } from "../utils/rekapDataHelpers";

// ==============================================================================
// KOMPONEN: TABEL REKAP OPERASIONAL (RINGKASAN METRIK & REKAP KESELURUHAN DRIVER)
// ==============================================================================
const RekapTable = ({ groupedData = [], isLoading = false, searchQuery = "", setSearchQuery, startDate = "", endDate = "", onApplyDateFilter, onClearDateFilter, onExportAll, onSelectDriver }) => {
  const summary = useMemo(() => {
    return groupedData.reduce(
      (acc, supir) => {
        acc.totalDriver += 1;
        acc.totalLaporan += Number(supir.list_laporan?.length || supir.total_hari_jalan || 0);
        acc.totalPenumpang += Number(supir.total_penumpang || 0);
        acc.totalTepat += Number(supir.total_tepat || 0);
        acc.totalTelat += Number(supir.total_telat || 0);
        return acc;
      },
      {
        totalDriver: 0,
        totalLaporan: 0,
        totalPenumpang: 0,
        totalTepat: 0,
        totalTelat: 0,
      },
    );
  }, [groupedData]);

  return (
    <>
      {/* Header & Integrated Toolbar */}
      <div className="space-y-4 text-left">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#00206B] tracking-tight m-0">Rekapitulasi Kinerja</h2>
          <p className="text-xs text-slate-500 font-normal mt-1">Pantau akumulasi performa, trip harian, dan kedisiplinan seluruh driver.</p>
        </div>

        {/* 5 Metric Summary Cards - Clean Header & Value Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
          {/* Card 1: Total Driver */}
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white via-blue-50/25 to-indigo-50/35 border border-slate-200/80 hover:border-blue-400/80 shadow-[0_4px_20px_-4px_rgba(0,32,107,0.06)] hover:shadow-[0_20px_35px_-10px_rgba(37,99,235,0.22)] hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group flex flex-col justify-between min-h-[116px]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block pt-1">Total Driver</span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-600/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0">
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            <div className="relative z-10 flex items-baseline gap-1.5 pt-2 min-w-0" title={`${summary.totalDriver.toLocaleString("id-ID")} Driver`}>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#00206B] group-hover:text-blue-600 tracking-tight transition-colors truncate">
                {isLoading ? "..." : formatCompactNumber(summary.totalDriver)}
              </span>
              <span className="text-xs font-semibold text-slate-400 shrink-0">Orang</span>
            </div>
          </div>

          {/* Card 2: Total Laporan */}
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white via-sky-50/25 to-blue-50/35 border border-slate-200/80 hover:border-sky-400/80 shadow-[0_4px_20px_-4px_rgba(2,132,199,0.06)] hover:shadow-[0_20px_35px_-10px_rgba(14,165,233,0.22)] hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group flex flex-col justify-between min-h-[116px]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-sky-400/20 to-blue-500/20 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block pt-1">Total Laporan</span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/25 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 flex-shrink-0">
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5-4.5h7.5m-7.5-4.5h7.5M6 20.25h12A2.25 2.25 0 0020.25 18V7.5a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 7.5v10.5A2.25 2.25 0 006 20.25z"
                  />
                </svg>
              </div>
            </div>

            <div className="relative z-10 flex items-baseline gap-1.5 pt-2 min-w-0" title={`${summary.totalLaporan.toLocaleString("id-ID")} Laporan`}>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#00206B] group-hover:text-sky-600 tracking-tight transition-colors truncate">
                {isLoading ? "..." : formatCompactNumber(summary.totalLaporan)}
              </span>
              <span className="text-xs font-semibold text-slate-400 shrink-0">Laporan</span>
            </div>
          </div>

          {/* Card 3: Total Penumpang */}
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white via-purple-50/25 to-indigo-50/35 border border-slate-200/80 hover:border-purple-400/80 shadow-[0_4px_20px_-4px_rgba(147,51,234,0.06)] hover:shadow-[0_20px_35px_-10px_rgba(147,51,234,0.22)] hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group flex flex-col justify-between min-h-[116px]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-indigo-500/20 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block pt-1">Total Penumpang</span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0">
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="relative z-10 flex items-baseline gap-1.5 pt-2 min-w-0" title={`${summary.totalPenumpang.toLocaleString("id-ID")} Siswa`}>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#00206B] group-hover:text-purple-600 tracking-tight transition-colors truncate">
                {isLoading ? "..." : formatCompactNumber(summary.totalPenumpang)}
              </span>
              <span className="text-xs font-semibold text-slate-400 shrink-0">Siswa</span>
            </div>
          </div>

          {/* Card 4: Tepat Waktu */}
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/35 border border-slate-200/80 hover:border-emerald-400/80 shadow-[0_4px_20px_-4px_rgba(5,150,105,0.06)] hover:shadow-[0_20px_35px_-10px_rgba(16,185,129,0.22)] hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group flex flex-col justify-between min-h-[116px]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block pt-1">Tepat Waktu</span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 flex-shrink-0">
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="relative z-10 flex items-baseline gap-1.5 pt-2 min-w-0" title={`${summary.totalTepat.toLocaleString("id-ID")} Tepat`}>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#00206B] group-hover:text-emerald-600 tracking-tight transition-colors truncate">
                {isLoading ? "..." : formatCompactNumber(summary.totalTepat)}
              </span>
              <span className="text-xs font-semibold text-slate-400 shrink-0">Tepat</span>
            </div>
          </div>

          {/* Card 5: Terlambat */}
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white via-rose-50/25 to-amber-50/35 border border-slate-200/80 hover:border-rose-400/80 shadow-[0_4px_20px_-4px_rgba(225,29,72,0.06)] hover:shadow-[0_20px_35px_-10px_rgba(244,63,94,0.25)] hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group flex flex-col justify-between min-h-[116px]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-rose-400/20 to-orange-500/20 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block pt-1">Terlambat</span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-rose-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0">
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
            </div>

            <div className="relative z-10 flex items-baseline gap-1.5 pt-2 min-w-0" title={`${summary.totalTelat.toLocaleString("id-ID")} Telat`}>
              <span
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight transition-colors truncate ${summary.totalTelat > 0 ? "text-rose-600" : "text-[#00206B] group-hover:text-rose-600"}`}
              >
                {isLoading ? "..." : formatCompactNumber(summary.totalTelat)}
              </span>
              <span className="text-xs font-semibold text-slate-400 shrink-0">Telat</span>
            </div>
          </div>
        </div>

        {/* UNIFIED ACTION & FILTER TOOLBAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 p-2.5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,32,107,0.05)]">
          {/* Search Bar */}
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

          {/* Right Toolbar: Date Filter + Export All */}
          <div className="flex items-center gap-2 relative">
            <DateRangeFilter startDate={startDate} endDate={endDate} onApply={onApplyDateFilter} onClear={onClearDateFilter} />

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
                          <span className="text-sm font-semibold text-slate-800 block group-hover:text-[#00206B] transition-colors">{supir.nama_supir}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-500 font-semibold tracking-wider">{supir.id_supir}</span>
                            {supir.is_nonaktif && (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-500 font-bold border border-slate-200">Nonaktif</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4.5 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60 font-semibold text-xs shadow-2xs">
                        <span className="font-bold text-slate-900 text-sm">{supir.list_laporan?.length || supir.total_hari_jalan || 0}</span>
                        <span className="text-[11px] text-slate-500 font-medium">Laporan</span>
                      </span>
                    </td>

                    <td className="py-4.5 px-6 text-center">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200/80 font-semibold text-xs shadow-2xs max-w-[150px]"
                        title={`${Number(supir.total_penumpang || 0).toLocaleString("id-ID")} Siswa`}
                      >
                        <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                          />
                        </svg>
                        <span className="font-bold text-sky-950 text-sm truncate">{formatCompactNumber(supir.total_penumpang)}</span>
                        <span className="text-[11px] text-sky-700/80 font-medium shrink-0">Siswa</span>
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
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400 text-xs font-semibold">0 Telat</span>
                      )}
                    </td>

                    <td className="py-4.5 px-6 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDriver(supir.id_supir);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-sky-50 to-blue-50 hover:from-blue-600 hover:to-indigo-600 border border-sky-200/80 hover:border-blue-500 text-blue-700 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md hover:shadow-blue-500/25 active:scale-95 group/btn"
                      >
                        <span>Lihat Log</span>
                        <svg
                          className="w-3.5 h-3.5 text-blue-600 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all"
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
