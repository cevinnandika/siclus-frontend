import React, { useState } from "react";
import DateRangeFilter from "./DateRangeFilter";
import { formatTime } from "../../../../utils/dateUtils";

const DetailRekapView = ({
  selectedDriver,
  startDate,
  endDate,
  onBack,
  onApplyDateFilter,
  onClearDateFilter,
  onExportExcel,
  onImageClick,
  generateSessionRows,
}) => {
  const [expandedReportId, setExpandedReportId] = useState(null);

  if (!selectedDriver) return null;

  return (
    <div className="space-y-4 animate-[fadeIn_0.25s] text-left">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#00206B] bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer group"
        >
          <svg
            className="w-4 h-4 text-slate-400 group-hover:text-[#00206B] group-hover:-translate-x-0.5 transition-all"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
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
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100/90 to-blue-50 border border-sky-200/70 text-[#00206B] flex items-center justify-center font-black text-xl shadow-2xs flex-shrink-0">
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
              <span className="text-[10px] font-extrabold uppercase text-[#00206B] tracking-wider block">
                DETAIL OPERASIONAL
              </span>
              <h2 className="text-2xl font-black text-[#00206B] m-0 tracking-tight">{selectedDriver.nama_supir}</h2>
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-500 font-bold tracking-wider mt-1">
                ID : {selectedDriver.id_supir}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 relative">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onApply={onApplyDateFilter}
              onClear={onClearDateFilter}
            />

            <button
              type="button"
              onClick={onExportExcel}
              title="Download Data Excel Driver Ini"
              className="h-10 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border border-emerald-700/80 px-4 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Laporan */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Laporan</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-800 tracking-tight">
                  {selectedDriver?.list_laporan?.length || selectedDriver?.total_hari_jalan || 0}
                </span>
                <span className="text-xs font-semibold text-slate-400">Laporan</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100/80 flex items-center justify-center border border-slate-200/60 group-hover:border-slate-300 transition-colors flex-shrink-0">
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5-4.5h7.5m-7.5-4.5h7.5M6 20.25h12A2.25 2.25 0 0020.25 18V7.5a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 7.5v10.5A2.25 2.25 0 006 20.25z" />
              </svg>
            </div>
          </div>

          {/* Card 2: Total Penumpang */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Penumpang</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-sky-950 tracking-tight">{selectedDriver?.total_penumpang || 0}</span>
                <span className="text-xs font-bold text-sky-700">Siswa</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center border border-sky-200/70 transition-colors flex-shrink-0">
              <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>

          {/* Card 3: Tepat Waktu */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tepat Waktu</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-950 tracking-tight">{selectedDriver?.total_tepat || 0}</span>
                <span className="text-xs font-bold text-emerald-700">Tepat</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200/70 transition-colors flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Card 4: Terlambat */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Terlambat</span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-black tracking-tight ${selectedDriver?.total_telat > 0 ? "text-rose-950" : "text-slate-800"}`}>
                  {selectedDriver?.total_telat || 0}
                </span>
                <span className={`text-xs font-semibold ${selectedDriver?.total_telat > 0 ? "text-rose-600" : "text-slate-400"}`}>
                  Telat
                </span>
              </div>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors flex-shrink-0 ${
                selectedDriver?.total_telat > 0
                  ? "bg-rose-50 border-rose-200/70 text-rose-600"
                  : "bg-slate-50 border-slate-200/60 text-slate-400"
              }`}
            >
              <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tabel Riwayat Laporan Operasional */}
        <div className="space-y-3 pt-2 w-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-[#00206B] uppercase tracking-wider flex items-center gap-2 m-0">
              <span>📅</span> RIWAYAT TANGGAL LAPORAN OPERASIONAL
            </h3>
          </div>

          <div className="overflow-x-auto w-full border border-slate-200/90 rounded-2xl shadow-2xs">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">
                  <th className="py-3 px-4 whitespace-nowrap">Tanggal</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Sesi</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Trayek</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Nopol</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Siswa</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Kapasitas</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Load Factor</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">CP1 (Keluar)</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">CP2 (Sekolah)</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">CP3 (Finish)</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Jarak Tempuh</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {selectedDriver?.list_laporan && selectedDriver.list_laporan.length > 0 ? (
                  (() => {
                    const sessionRows = [];
                    selectedDriver.list_laporan.forEach((lap, lapIdx) => {
                      const rows = generateSessionRows(selectedDriver, lap);
                      rows.forEach((r, sIdx) => {
                        sessionRows.push({
                          ...r,
                          uniqueKey: `${lap.id || lap.tanggal || lapIdx}_sesi_${r.sesiRaw?.id || sIdx}`,
                          isFirstSessionOfDay: sIdx === 0,
                          isLastSessionOfDay: sIdx === rows.length - 1,
                          totalSessionsInDay: rows.length,
                          sessionOrderInDay: sIdx + 1,
                        });
                      });
                    });

                    if (sessionRows.length === 0) {
                      return (
                        <tr>
                          <td colSpan="13" className="py-8 text-center text-xs font-bold text-slate-400">
                            Belum ada riwayat operasi yang tersimpan
                          </td>
                        </tr>
                      );
                    }

                    return sessionRows.map((row) => {
                      const isExpanded = expandedReportId === row.uniqueKey;

                      return (
                        <React.Fragment key={row.uniqueKey}>
                          <tr
                            className={`transition-colors ${isExpanded ? "bg-sky-50/40" : "bg-white hover:bg-sky-50/20"} ${
                              row.isLastSessionOfDay ? "border-b-2 border-slate-200/90" : "border-b border-dashed border-slate-200/80"
                            }`}
                          >
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {row.isFirstSessionOfDay ? (
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-[#00206B] flex-shrink-0 shadow-2xs ml-0.5" />
                                  <span className="font-extrabold text-[#00206B] text-xs tracking-tight">{row.tanggal}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 pl-2" title={`Tanggal: ${row.tanggal} (${row.sesiName})`}>
                                  <span className="text-slate-300 font-bold text-xs">└─</span>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70">
                                    Sesi Lanjutan
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                  row.sesiName.toLowerCase().includes("pagi")
                                    ? "bg-amber-50 text-amber-800 border-amber-200/70"
                                    : "bg-blue-50 text-blue-800 border-blue-200/70"
                                }`}
                              >
                                {row.sesiName}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-50 text-[#00206B] font-bold text-xs border border-sky-200/70">
                                {row.trayek}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                                {row.nopol}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200/70">
                                {row.siswaDisplay}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-600 whitespace-nowrap">
                              {row.kapasitas}
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg font-extrabold text-xs border ${
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
                            <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">
                              {row.cp1}
                            </td>
                            <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">
                              {row.cp3}
                            </td>
                            <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">
                              {row.cp4}
                            </td>
                            <td className="py-3.5 px-4 text-center text-xs font-black text-[#00206B] whitespace-nowrap">
                              {row.jarakTempuh}
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border inline-block ${
                                  row.status === "TERLAMBAT"
                                    ? "bg-rose-50 text-rose-700 border-rose-200/80"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setExpandedReportId(isExpanded ? null : row.uniqueKey)}
                                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl cursor-pointer transition-all border shadow-2xs whitespace-nowrap flex items-center gap-1 mx-auto active:scale-95 ${
                                  isExpanded
                                    ? "bg-[#00206B] text-white border-[#00206B]"
                                    : "bg-gradient-to-r from-sky-50 to-blue-50 hover:from-[#00206B] hover:to-[#0A328C] text-[#00206B] hover:text-white border-sky-200/80 hover:border-[#00206B]"
                                }`}
                              >
                                <span>{isExpanded ? "Tutup" : "Detail"}</span>
                                <span>{isExpanded ? "▲" : "▼"}</span>
                              </button>
                            </td>
                          </tr>

                          {/* INLINE EXPANDED CHECKPOINT INSPECTION ACCORDION */}
                          {isExpanded && (
                            <tr
                              className={`bg-slate-50/80 ${
                                row.isLastSessionOfDay ? "border-b-2 border-slate-200/90" : "border-b border-dashed border-slate-200/80"
                              }`}
                            >
                              <td colSpan="13" className="p-4 md:p-6 border-y border-slate-200">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black uppercase text-[#00206B] tracking-wider bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
                                        RINCIAN CHECKPOINT & BUKTI SESI {row.sesiName.toUpperCase()}
                                      </span>
                                      <span className="text-xs font-bold text-slate-700">
                                        {row.tanggal} {row.isFirstSessionOfDay ? "(Sesi 1)" : `(Sesi ${row.sessionOrderInDay})`} • Trayek {row.trayek} • Nopol {row.nopol}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedReportId(null)}
                                      className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2.5 py-1 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                                    >
                                      Tutup Rincian ✕
                                    </button>
                                  </div>

                                  {/* 3 Checkpoint Cards */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                          CP1 • Keluar Garasi Dishub
                                        </span>
                                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                                          Awal
                                        </span>
                                      </div>
                                      <div className="text-sm font-black text-slate-800">{formatTime(row.jamCP1)} WIB</div>
                                      <div className="text-xs font-bold text-slate-500">Odometer: {row.cp1} KM</div>
                                    </div>

                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                          CP2 • Tiba Rute Sekolah
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                          👥 {row.siswa} Siswa
                                        </span>
                                      </div>
                                      <div className="text-sm font-black text-slate-800">{formatTime(row.jamCP3)} WIB</div>
                                      <div className="text-xs font-bold text-slate-500">Odometer: {row.cp3} KM</div>
                                    </div>

                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                          CP3 • Kembali Garasi Dishub
                                        </span>
                                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                          🏁 {row.jarakTempuh}
                                        </span>
                                      </div>
                                      <div className="text-sm font-black text-slate-800">{formatTime(row.jamCP4)} WIB</div>
                                      <div className="text-xs font-bold text-slate-500">Odometer: {row.cp4} KM</div>
                                    </div>
                                  </div>

                                  {/* Foto Bukti Checkpoint */}
                                  {(row.fotoCP1 || row.fotoCP4) && (
                                    <div className="space-y-2 pt-1">
                                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                                        Foto Bukti Checkpoint
                                      </span>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {row.fotoCP1 && (
                                          <div
                                            onClick={() => onImageClick(row.fotoCP1)}
                                            className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 cursor-pointer group border border-slate-200 shadow-xs"
                                          >
                                            <img
                                              src={row.fotoCP1}
                                              alt="Foto CP1 Awal"
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                                              📸 Foto CP1 (Keluar Garasi) 🔍
                                            </span>
                                          </div>
                                        )}
                                        {row.fotoCP4 && (
                                          <div
                                            onClick={() => onImageClick(row.fotoCP4)}
                                            className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 cursor-pointer group border border-slate-200 shadow-xs"
                                          >
                                            <img
                                              src={row.fotoCP4}
                                              alt="Foto CP3 Akhir"
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                                              📸 Foto CP3 (Kembali Garasi) 🔍
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    });
                  })()
                ) : (
                  <tr>
                    <td colSpan="13" className="py-8 text-center text-xs font-bold text-slate-400">
                      Belum ada riwayat operasi yang tersimpan
                    </td>
                  </tr>
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
            className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase cursor-pointer transition-colors shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailRekapView;
