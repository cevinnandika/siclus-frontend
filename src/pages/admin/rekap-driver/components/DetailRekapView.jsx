import React, { useState, useMemo } from "react";
import DateRangeFilter from "./DateRangeFilter";
import { formatTime } from "../../../../utils/dateUtils";
import { formatCompactNumber } from "../utils/rekapDataHelpers";

// ==============================================================================
// KOMPONEN: DETAIL REKAP VIEW (RINCIAN SESI, INSPEKSI & ODOMETER PER PENGEMUDI)
// ==============================================================================
const DetailRekapView = ({ selectedDriver, startDate, endDate, onBack, onApplyDateFilter, onClearDateFilter, onExportExcel, onImageClick, generateSessionRows }) => {
  const [expandedReportId, setExpandedReportId] = useState(null);

  const sessionRows = useMemo(() => {
    if (!selectedDriver?.list_laporan || selectedDriver.list_laporan.length === 0) {
      return [];
    }
    const result = [];
    selectedDriver.list_laporan.forEach((lap, lapIdx) => {
      const rows = generateSessionRows(selectedDriver, lap);
      rows.forEach((r, sIdx) => {
        result.push({
          ...r,
          uniqueKey: `${lap.id || lap.tanggal || lapIdx}_sesi_${r.sesiRaw?.id || sIdx}`,
          isFirstSessionOfDay: sIdx === 0,
          isLastSessionOfDay: sIdx === rows.length - 1,
          totalSessionsInDay: rows.length,
          sessionOrderInDay: sIdx + 1,
        });
      });
    });
    return result;
  }, [selectedDriver, generateSessionRows]);

  if (!selectedDriver) return null;

  return (
    <div className="space-y-4 animate-[fadeIn_0.25s] text-left">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#00206B] bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer group"
        >
          <svg className="w-4 h-4 text-slate-400 group-hover:text-[#00206B] group-hover:-translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Kembali ke Daftar Rekap</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_4px_24px_-6px_rgba(0,32,107,0.06)] overflow-hidden">
        {/* Header: Driver Info & Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100/90 to-blue-50 border border-sky-200/70 text-[#00206B] flex items-center justify-center font-bold text-xl shadow-2xs flex-shrink-0">
              {selectedDriver.foto_profil ? (
                <img
                  src={selectedDriver.foto_profil}
                  alt={selectedDriver.nama_supir}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement.innerText = selectedDriver.nama_supir.charAt(0).toUpperCase();
                  }}
                />
              ) : (
                selectedDriver.nama_supir.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider block">DETAIL OPERASIONAL</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-500 font-semibold tracking-wider">ID : {selectedDriver.id_supir}</span>
                {selectedDriver.is_nonaktif && (
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-500 font-bold border border-slate-200">Nonaktif</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 relative">
            <DateRangeFilter startDate={startDate} endDate={endDate} onApply={onApplyDateFilter} onClear={onClearDateFilter} />

            <button
              type="button"
              onClick={onExportExcel}
              title="Download Data Excel Driver Ini"
              className="h-10 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border border-emerald-700/80 px-4 rounded-xl font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Summary Cards - Clean Header & Value Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: Total Laporan */}
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white via-blue-50/25 to-indigo-50/35 border border-slate-200/80 hover:border-blue-400/80 shadow-[0_4px_20px_-4px_rgba(0,32,107,0.06)] hover:shadow-[0_20px_35px_-10px_rgba(37,99,235,0.22)] hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group flex flex-col justify-between min-h-[116px]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block pt-1">
                Total Laporan
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-600/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0">
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5-4.5h7.5m-7.5-4.5h7.5M6 20.25h12A2.25 2.25 0 0020.25 18V7.5a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 7.5v10.5A2.25 2.25 0 006 20.25z" />
                </svg>
              </div>
            </div>

            <div className="relative z-10 flex items-baseline gap-1.5 pt-2 min-w-0" title={`${selectedDriver?.list_laporan?.length || selectedDriver?.total_hari_jalan || 0} Laporan`}>
              <span className="text-2xl md:text-3xl font-extrabold text-[#00206B] group-hover:text-blue-600 tracking-tight transition-colors truncate">
                {selectedDriver?.list_laporan?.length || selectedDriver?.total_hari_jalan || 0}
              </span>
              <span className="text-xs font-semibold text-slate-400 shrink-0">Laporan</span>
            </div>
          </div>

          {/* Card 2: Total Penumpang */}
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white via-sky-50/25 to-blue-50/35 border border-slate-200/80 hover:border-sky-400/80 shadow-[0_4px_20px_-4px_rgba(2,132,199,0.06)] hover:shadow-[0_20px_35px_-10px_rgba(14,165,233,0.22)] hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group flex flex-col justify-between min-h-[116px]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-sky-400/20 to-blue-500/20 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block pt-1">
                Total Penumpang
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/25 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 flex-shrink-0">
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
            </div>

            <div className="relative z-10 flex items-baseline gap-1.5 pt-2 min-w-0" title={`${Number(selectedDriver?.total_penumpang || 0).toLocaleString("id-ID")} Siswa`}>
              <span className="text-2xl md:text-3xl font-extrabold text-[#00206B] group-hover:text-sky-600 tracking-tight transition-colors truncate">
                {formatCompactNumber(selectedDriver?.total_penumpang || 0)}
              </span>
              <span className="text-xs font-semibold text-slate-400 shrink-0">Siswa</span>
            </div>
          </div>

          {/* Card 3: Tepat Waktu */}
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/35 border border-slate-200/80 hover:border-emerald-400/80 shadow-[0_4px_20px_-4px_rgba(5,150,105,0.06)] hover:shadow-[0_20px_35px_-10px_rgba(16,185,129,0.22)] hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group flex flex-col justify-between min-h-[116px]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block pt-1">
                Tepat Waktu
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0">
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="relative z-10 flex items-baseline gap-1.5 pt-2 min-w-0" title={`${selectedDriver?.total_tepat || 0} Tepat`}>
              <span className="text-2xl md:text-3xl font-extrabold text-[#00206B] group-hover:text-emerald-600 tracking-tight transition-colors truncate">
                {selectedDriver?.total_tepat || 0}
              </span>
              <span className="text-xs font-semibold text-slate-400 shrink-0">Trip</span>
            </div>
          </div>

          {/* Card 4: Terlambat */}
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white via-rose-50/25 to-amber-50/35 border border-slate-200/80 hover:border-rose-400/80 shadow-[0_4px_20px_-4px_rgba(225,29,72,0.06)] hover:shadow-[0_20px_35px_-10px_rgba(244,63,94,0.25)] hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group flex flex-col justify-between min-h-[116px]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-rose-400/20 to-orange-500/20 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block pt-1">
                Terlambat
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-rose-500/30 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 flex-shrink-0">
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            <div className="relative z-10 flex items-baseline gap-1.5 pt-2 min-w-0" title={`${selectedDriver?.total_telat || 0} Telat`}>
              <span
                className={`text-2xl md:text-3xl font-extrabold tracking-tight transition-colors truncate ${selectedDriver?.total_telat > 0 ? "text-rose-600" : "text-[#00206B] group-hover:text-rose-600"}`}
              >
                {selectedDriver?.total_telat || 0}
              </span>
              <span className="text-xs font-semibold text-slate-400 shrink-0">Trip</span>
            </div>
          </div>
        </div>

        {/* Tabel Riwayat Laporan Operasional */}
        <div className="space-y-3 pt-2 w-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-[#00206B] uppercase tracking-wider flex items-center gap-2 m-0">
              <span>📅</span> RIWAYAT TANGGAL LAPORAN OPERASIONAL
            </h3>
          </div>

          <div className="overflow-x-auto w-full min-h-[300px] border border-slate-200/90 rounded-2xl shadow-2xs">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead className="bg-slate-50 border-b border-slate-200/80">
                <tr className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
                  <th className="py-3 px-3 whitespace-nowrap">Tanggal</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Sesi</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Trayek</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Nopol</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Siswa</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Kapasitas</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Load Factor</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Berangkat</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Tiba</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Kembali</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Jarak</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sessionRows.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="py-8 text-center text-xs font-semibold text-slate-400">
                      Belum ada riwayat operasi yang tersimpan
                    </td>
                  </tr>
                ) : (
                  sessionRows.map((row) => {
                    const isExpanded = expandedReportId === row.uniqueKey;

                    return (
                      <React.Fragment key={row.uniqueKey}>
                        <tr
                          className={`transition-colors ${isExpanded ? "bg-sky-50/40" : "bg-white hover:bg-sky-50/20"} ${
                            row.isLastSessionOfDay ? "border-b-2 border-slate-200/90" : "border-b border-dashed border-slate-200/80"
                          }`}
                        >
                          <td className="py-3 px-3 whitespace-nowrap">
                            {row.isFirstSessionOfDay ? (
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#00206B] flex-shrink-0 shadow-2xs" />
                                <span className="font-bold text-[#00206B] text-xs tracking-tight">{row.tanggal}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 pl-1" title={`Tanggal: ${row.tanggal} (${row.sesiName})`}>
                                <span className="text-slate-300 font-semibold text-xs">└─</span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/70">
                                  Lanjutan
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                row.sesiName.toLowerCase().includes("pagi") ? "bg-amber-50 text-amber-800 border-amber-200/70" : "bg-blue-50 text-blue-800 border-blue-200/70"
                              }`}
                            >
                              {row.sesiName}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-sky-50 text-[#00206B] font-semibold text-xs border border-sky-200/70">{row.trayek}</span>
                          </td>
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs">{row.nopol}</span>
                          </td>
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200/70">
                              {row.siswaDisplay}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center text-xs font-semibold text-slate-600 whitespace-nowrap">{row.kapasitas}</td>
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md font-semibold text-xs border ${
                                row.loadFactorNum >= 70
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : row.loadFactorNum >= 40
                                    ? "bg-sky-50 text-sky-700 border-sky-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {row.loadFactor}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">{row.cp1}</td>
                          <td className="py-3 px-2 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">{row.cp2}</td>
                          <td className="py-3 px-2 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">{row.cp3}</td>
                          <td className="py-3 px-2 text-center text-xs font-bold text-[#00206B] whitespace-nowrap">{row.jarakTempuh}</td>
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border inline-block ${
                                row.status === "TERLAMBAT" ? "bg-rose-50 text-rose-700 border-rose-200/80" : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setExpandedReportId(isExpanded ? null : row.uniqueKey)}
                              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl cursor-pointer transition-all border whitespace-nowrap flex items-center gap-1.5 mx-auto active:scale-95 shadow-2xs ${
                                isExpanded
                                  ? "bg-slate-800 text-white border-slate-700 shadow-inner"
                                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white border-blue-500/30 shadow-md shadow-blue-500/20 hover:shadow-lg"
                              }`}
                            >
                              <span>{isExpanded ? "Tutup" : "Detail Log"}</span>
                              <span>{isExpanded ? "▲" : "▼"}</span>
                            </button>
                          </td>
                        </tr>

                        {/* INLINE EXPANDED CHECKPOINT INSPECTION ACCORDION */}
                        {isExpanded && (
                          <tr className={`bg-slate-50/80 ${row.isLastSessionOfDay ? "border-b-2 border-slate-200/90" : "border-b border-dashed border-slate-200/80"}`}>
                            <td colSpan="13" className="p-4 md:p-6 border-y border-slate-200">
                              <div className="space-y-4 max-w-4xl mx-auto">
                                <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-[10px] font-bold uppercase text-slate-800 tracking-wider bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                      Rincian Sesi {row.sesiName}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500">
                                      {row.tanggal} {row.isFirstSessionOfDay ? "(Sesi 1)" : `(Sesi ${row.sessionOrderInDay})`} • Trayek {row.trayek} • Nopol {row.nopol}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedReportId(null)}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                                  >
                                    <span>Tutup Rincian</span>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>

                                {/* 3 Tahap Perjalanan Cards - Balanced, Centered & Professional */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                  {/* Tahap 1: Berangkat Dishub */}
                                  <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TAHAP 1</span>
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                                        Berangkat Dishub
                                      </span>
                                    </div>
                                    <div>
                                      <div className="text-lg font-bold text-slate-900 tracking-tight">
                                        {formatTime(row.jamCP1)} <span className="text-xs font-semibold text-slate-400">WIB</span>
                                      </div>
                                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                        <span>Odometer:</span>
                                        <span className="font-semibold text-slate-700">{row.cp1} KM</span>
                                      </div>
                                    </div>
                                    {row.fotoCP1 ? (
                                      <button
                                        type="button"
                                        onClick={() => onImageClick(row.fotoCP1)}
                                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold tracking-wide transition-all cursor-pointer active:scale-[0.98] shadow-2xs"
                                      >
                                        <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                        </svg>
                                        <span>Buka Foto Berangkat</span>
                                      </button>
                                    ) : (
                                      <div className="text-center py-2 text-[11px] text-slate-400 font-medium bg-slate-50 rounded-xl border border-slate-200/60">
                                        Tanpa Foto
                                      </div>
                                    )}
                                  </div>

                                  {/* Tahap 2: Tiba Rute Sekolah */}
                                  <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TAHAP 2</span>
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        {row.siswa} Siswa Diangkut
                                      </span>
                                    </div>
                                    <div>
                                      <div className="text-lg font-bold text-slate-900 tracking-tight">
                                        {formatTime(row.jamCP2 || row.jamCP3)} <span className="text-xs font-semibold text-slate-400">WIB</span>
                                      </div>
                                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                        <span>Odometer:</span>
                                        <span className="font-semibold text-slate-700">{row.cp2 || row.cp3} KM</span>
                                      </div>
                                    </div>
                                    <div className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-emerald-50/70 text-emerald-800 text-[11px] font-semibold border border-emerald-200/60">
                                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                      </svg>
                                      <span>Selesai Antar Siswa</span>
                                    </div>
                                  </div>

                                  {/* Tahap 3: Kembali ke Dishub */}
                                  <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TAHAP 3</span>
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                        Jarak: {row.jarakTempuh}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="text-lg font-bold text-slate-900 tracking-tight">
                                        {formatTime(row.jamCP3)} <span className="text-xs font-semibold text-slate-400">WIB</span>
                                      </div>
                                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                        <span>Odometer:</span>
                                        <span className="font-semibold text-slate-700">{row.cp3} KM</span>
                                      </div>
                                    </div>
                                    {row.fotoCP3 ? (
                                      <button
                                        type="button"
                                        onClick={() => onImageClick(row.fotoCP3)}
                                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold tracking-wide transition-all cursor-pointer active:scale-[0.98] shadow-2xs"
                                      >
                                        <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                        </svg>
                                        <span>Buka Foto Kembali</span>
                                      </button>
                                    ) : (
                                      <div className="text-center py-2 text-[11px] text-slate-400 font-medium bg-slate-50 rounded-xl border border-slate-200/60">
                                        Tanpa Foto
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs uppercase cursor-pointer transition-colors shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailRekapView;
