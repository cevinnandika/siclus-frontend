import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { apiService } from "../../services/api";

const RekapAdmin = () => {
  const [rawData, setRawData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchRekap = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getRekapAdmin();
        if (response) {
          const list = response.data || (Array.isArray(response) ? response : []);
          setRawData(list);
        }
      } catch (error) {
        console.error("Gagal menarik data rekap:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRekap();
  }, []);

  // FUNGSI SAKTI: Filter waktu (Date Range) & Grouping by Driver
  const groupedData = useMemo(() => {
    // 1. Filter berdasarkan rentang kalender (startDate & endDate)
    const filtered = rawData.filter((item) => {
      const itemDateStr = item.tanggal ? (item.tanggal.includes("T") ? item.tanggal.split("T")[0] : item.tanggal) : item.created_at ? item.created_at.split("T")[0] : "";

      if (startDate && endDate) {
        if (!itemDateStr) return false;
        return itemDateStr >= startDate && itemDateStr <= endDate;
      }
      if (startDate) {
        if (!itemDateStr) return false;
        return itemDateStr >= startDate;
      }
      if (endDate) {
        if (!itemDateStr) return false;
        return itemDateStr <= endDate;
      }
      return true;
    });

    // 2. Grouping per Supir
    const groups = filtered.reduce((acc, curr) => {
      const supirId = curr.id_supir || curr.user_id || "ANONIM";
      const driverName = curr.users?.nama || curr.users?.name || curr.nama_supir || curr.nama || supirId;
      if (!acc[supirId]) {
        acc[supirId] = {
          id_supir: supirId,
          nama_supir: driverName,
          nama_lengkap: driverName,
          trayek_utama: curr.trayek || curr.users?.trayek || "-",
          bus_utama: curr.bus || curr.users?.bus || "-",
          total_hari_jalan: 0,
          total_penumpang: 0,
          total_telat: 0,
          total_tepat: 0,
          list_laporan: [],
          riwayat: [],
        };
      }

      acc[supirId].total_hari_jalan += 1;

      // Hitung Metrik dari Sesi
      let passengerCount = 0;
      let isLate = false;

      if (curr.trip_sessions && curr.trip_sessions.length > 0) {
        curr.trip_sessions.forEach((sesi) => {
          passengerCount += sesi.jumlah_penumpang || 0;
          const late =
            sesi.status_waktu === "TERLAMBAT" ||
            sesi.status_kedisiplinan === "TERLAMBAT" ||
            sesi.status?.toUpperCase() === "TERLAMBAT" ||
            sesi.is_late === true ||
            sesi.terlambat === true ||
            sesi.cp1_late ||
            sesi.cp2_late;

          if (late) {
            acc[supirId].total_telat += 1;
            isLate = true;
          } else {
            acc[supirId].total_tepat += 1;
          }
        });
        acc[supirId].total_penumpang += passengerCount;
      } else {
        // Fallback jika tidak ada trip_sessions terpisah
        passengerCount = curr.jumlah_penumpang || 0;
        acc[supirId].total_penumpang += passengerCount;
        isLate = curr.status_waktu === "TERLAMBAT" || curr.status_kedisiplinan === "TERLAMBAT" || curr.status?.toUpperCase() === "TERLAMBAT" || curr.is_late === true || curr.terlambat === true;

        if (isLate) {
          acc[supirId].total_telat += 1;
        } else {
          acc[supirId].total_tepat += 1;
        }
      }

      const totalSesi = curr.sesi_terlaksana ?? curr.trip_sessions?.length ?? 0;
      const statusKedisiplinan = curr.status_waktu || (isLate ? "TERLAMBAT" : "TEPAT WAKTU");
      const normalizedReport = {
        ...curr,
        tanggal: curr.tanggal || (curr.created_at ? curr.created_at.split("T")[0] : "-"),
        bus: curr.bus || curr.users?.bus || "-",
        sesi_terlaksana: totalSesi,
        siswa_diangkut: passengerCount,
        status_waktu: statusKedisiplinan,
      };

      acc[supirId].list_laporan.push(normalizedReport);
      acc[supirId].riwayat.push(normalizedReport);

      return acc;
    }, {});

    let result = Object.values(groups).sort((a, b) => b.total_hari_jalan - a.total_hari_jalan);

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.nama_supir.toLowerCase().includes(q) || s.id_supir.toLowerCase().includes(q) || s.trayek_utama.toLowerCase().includes(q));
    }

    return result;
  }, [rawData, startDate, endDate, searchQuery]);

  // Helper function to calculate row data for both Table UI and Excel Export
  const generateRowData = (driver, lap) => {
    // 1. Ambil data dari trip_sessions (karena odometer ada di trip_sessions)
    // Asumsikan sesi pertama = sesi pagi, terakhir = sore.
    const sessions = lap.trip_sessions || [];
    const firstSesi = sessions.length > 0 ? sessions[0] : {};
    const lastSesi = sessions.length > 0 ? sessions[sessions.length - 1] : {};

    const odoAwal = Number(firstSesi.km_berangkat_kantor) || 0;
    const odoAkhir = Number(lastSesi.km_tiba_kantor) || odoAwal;
    const odoDishub = Number(lastSesi.km_tiba_finish) || 0;
    
    // Odometer Hari Ini = Odometer Akhir - Odometer Awal
    const odoHariIni = Math.max(0, odoAkhir - odoAwal);
    
    const kapasitas = Number(lap.kapasitas) || Number(driver.users?.kapasitas) || 25; // Default 25
    const siswaDiangkut = Number(lap.siswa_diangkut) || 0;
    const totalSesi = Number(lap.sesi_terlaksana) || 0;
    
    let loadFactor = "0%";
    if (kapasitas > 0 && totalSesi > 0) {
      loadFactor = Math.round((siswaDiangkut / (kapasitas * totalSesi)) * 100) + "%";
    }

    return {
      "ID Driver": driver.id_supir || "-",
      "Nama Driver": driver.nama_lengkap || driver.nama_supir || "Driver",
      "Trayek": lap.trayek || driver.trayek_utama || "-",
      "Tanggal": lap.tanggal || (lap.created_at ? lap.created_at.split("T")[0] : "-"),
      "Armada / Bus": lap.bus || "-",
      "Total Sesi": totalSesi,
      "Siswa Diangkut": siswaDiangkut,
      "Kapasitas": kapasitas,
      "Load Factor": loadFactor,
      "Odometer Awal (Km)": odoAwal || "-",
      "Odometer Akhir (Km)": odoAkhir || "-",
      "Odometer Dishub (Km)": odoDishub || "-",
      "Odometer Hari Ini (Km)": odoHariIni || "-",
      "Status Kedisiplinan": lap.status_waktu || "TEPAT WAKTU"
    };
  };

  const handleExportPerDriver = () => {
    const riwayatList = selectedDriver?.riwayat || selectedDriver?.list_laporan;
    if (!selectedDriver || !riwayatList || riwayatList.length === 0) return;

    // Susun data baris per baris untuk Excel
    const excelData = riwayatList.map((lap) => generateRowData(selectedDriver, lap));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap_Mingguan");

    // Nama file dinamis menggunakan nama supir
    const namaFile = `Rekap_${namaSupir.replace(/\s+/g, "_")}.xlsx`;
    XLSX.writeFile(workbook, namaFile);
  };

  const handleExportAll = () => {
    if (groupedData.length === 0) {
      showToast("Tidak ada data untuk diexport!", "error");
      return;
    }

    const allExcelData = [];
    
    groupedData.forEach((driver) => {
      const riwayatList = driver.riwayat || driver.list_laporan;
      if (riwayatList && riwayatList.length > 0) {
        riwayatList.forEach((lap) => {
          allExcelData.push(generateRowData(driver, lap));
        });
      }
    });

    if (allExcelData.length === 0) {
      showToast("Tidak ada detail laporan untuk diexport!", "error");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(allExcelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap_Semua_Driver");
    
    let namaFile = "Rekap_Semua_Driver";
    if (startDate && endDate) namaFile += `_${startDate}_to_${endDate}`;
    else if (startDate) namaFile += `_sejak_${startDate}`;
    namaFile += ".xlsx";

    XLSX.writeFile(workbook, namaFile);
  };

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8 animate-[fadeIn_0.3s] text-left">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="pb-1">
          <h2 className="text-2xl font-bold text-slate-900 m-0 tracking-tight">Rekapitulasi Kinerja</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5 tracking-wide">Pantau akumulasi performa driver per rentang waktu</p>
        </div>

        {/* BAGIAN FILTER KANAN ATAS */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex items-center">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari supir / trayek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-44 sm:w-52 bg-white border border-slate-200 hover:border-slate-300 focus:border-[#00206B] focus:ring-2 focus:ring-[#00206B]/5 text-xs font-semibold text-slate-700 rounded-xl pl-9 pr-8 outline-none shadow-xs placeholder:text-slate-400 placeholder:font-normal transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                title="Hapus pencarian"
                className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* FILTER KALENDER (DATE RANGE) */}
          <div className="flex items-center h-10 bg-white border border-slate-200 hover:border-slate-300 focus-within:border-[#00206B] focus-within:ring-2 focus-within:ring-[#00206B]/5 rounded-xl px-3 shadow-xs transition-all text-xs">
            {/* Dari */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 select-none">Dari</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[112px] text-xs font-semibold text-slate-700 outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-opacity"
              />
            </div>

            {/* Separator */}
            <span className="text-slate-300 mx-1.5 select-none font-normal">–</span>

            {/* Sampai */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 select-none">Sampai</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[112px] text-xs font-semibold text-slate-700 outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-opacity"
              />
            </div>

            {/* Reset Date Filter Button */}
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                title="Hapus filter rentang tanggal"
                className="ml-2 pl-2 border-l border-slate-200 text-slate-400 hover:text-rose-600 transition-colors p-0.5 rounded hover:bg-rose-50 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* GLOBAL EXPORT BUTTON */}
          <button
            onClick={handleExportAll}
            disabled={groupedData.length === 0}
            className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
              groupedData.length === 0 
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 cursor-pointer"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export Semua
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {isLoading ? (
          <div className="text-center text-[#00206B] font-bold py-14 animate-pulse">Menghitung akumulasi data server...</div>
        ) : groupedData.length === 0 ? (
          <div className="text-center text-slate-400 font-medium py-14 space-y-2">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50">
                  <th className="py-4 px-5 text-[10px] font-bold text-slate-400 tracking-widest uppercase rounded-tl-xl">Driver</th>
                  <th className="py-4 px-5 text-[10px] font-bold text-slate-400 tracking-widest uppercase text-center">Hari Jalan</th>
                  <th className="py-4 px-5 text-[10px] font-bold text-slate-400 tracking-widest uppercase text-center">Total Siswa</th>
                  <th className="py-4 px-5 text-[10px] font-bold text-slate-400 tracking-widest uppercase text-center">Disiplin Waktu</th>
                  <th className="py-4 px-5 text-[10px] font-bold text-slate-400 tracking-widest uppercase text-center rounded-tr-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedData.map((supir, index) => (
                  <tr key={supir.id_supir || index} onClick={() => setSelectedDriver(supir)} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-[#00206B] flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                          {supir.nama_supir.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-black text-[#00206B] block uppercase tracking-wide group-hover:text-blue-700 transition-colors">{supir.nama_supir}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{supir.id_supir}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className="text-base font-black text-[#00206B]">{supir.total_hari_jalan}</span> <span className="text-xs text-slate-400 font-semibold">Hari</span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="text-base font-black text-[#00206B]">{supir.total_penumpang}</span> <span className="text-xs text-slate-400 font-semibold">Siswa</span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className="text-emerald-600 bg-white border border-slate-200 font-bold text-[10px] px-2.5 py-1 rounded-md shadow-sm uppercase tracking-widest"
                          title="Total Sesi Tepat Waktu"
                        >
                          {supir.total_tepat} Tepat
                        </span>
                        {supir.total_telat > 0 ? (
                          <span
                            className="text-rose-600 bg-white border border-slate-200 font-bold text-[10px] px-2.5 py-1 rounded-md shadow-sm uppercase tracking-widest"
                            title="Total Sesi Terlambat"
                          >
                            {supir.total_telat} Telat
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">0 Telat</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDriver(supir);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-[#00206B] text-slate-500 hover:text-[#00206B] px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                      >
                        <span>Lihat Log</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: RINCIAN LOG HARIAN SUPIR */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-[#00206B] flex items-center justify-center font-black text-lg shadow-sm">
                  {selectedDriver.nama_supir.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-[#00206B] tracking-wider block">DETAIL OPERASIONAL</span>
                  <h3 className="text-xl font-black text-[#00206B] m-0">{selectedDriver.nama_supir}</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    ID: {selectedDriver.id_supir} • Total {selectedDriver.total_hari_jalan} Laporan
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPerDriver}
                  title="Download Data Excel Driver Ini"
                  className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-emerald-200 shadow-sm cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Export Excel
                </button>
                <button onClick={() => setSelectedDriver(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                  ✕
                </button>
              </div>
            </div>

            {/* Metric Summary Cards for this driver */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Total Hari Tugas</span>
                {/* Total Hari Tugas */}
                <span className="text-xl font-black">{selectedDriver?.total_hari_jalan || 0} Hari</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Total Siswa Diangkut</span>
                {/* Total Siswa Diangkut */}
                <span className="text-xl font-black">{selectedDriver?.total_penumpang || 0} Orang</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Disiplin Waktu</span>
                {/* Disiplin Waktu */}
                <div className="flex flex-col items-center justify-center">
                  <span className="text-sm font-bold text-emerald-600 border border-slate-200 px-3 py-1 rounded-md mb-1">{selectedDriver?.total_tepat || 0} Tepat</span>
                  <span className="text-sm font-bold text-rose-600 border border-slate-200 px-3 py-1 rounded-md">{selectedDriver?.total_telat || 0} Telat</span>
                </div>
              </div>
            </div>

            {/* Bagian RIWAYAT TANGGAL LAPORAN OPERASIONAL - TABEL */}
            <div className="space-y-3 mt-4 w-full">
              <h4 className="text-xs font-black text-[#00206B] uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">📅 Riwayat Tanggal Laporan Operasional</h4>
              
              <div className="overflow-x-auto w-full custom-scrollbar pb-2">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                      <th className="py-3 px-4 rounded-tl-xl whitespace-nowrap">Tanggal</th>
                      <th className="py-3 px-4 whitespace-nowrap">Armada / Bus</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Total Sesi</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Siswa Diangkut</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Kapasitas</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Load Factor</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Odo Awal</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Odo Akhir</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Odo Dishub</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Odo Hari Ini</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 rounded-tr-xl whitespace-nowrap text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDriver?.list_laporan && selectedDriver.list_laporan.length > 0 ? (
                      selectedDriver.list_laporan.map((lap, idx) => {
                        const rowData = generateRowData(selectedDriver, lap);
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors bg-white">
                            <td className="py-3 px-4 font-bold text-[#00206B] text-xs whitespace-nowrap">{rowData["Tanggal"]}</td>
                            <td className="py-3 px-4 text-xs font-semibold text-slate-600 whitespace-nowrap">{rowData["Armada / Bus"]}</td>
                            <td className="py-3 px-4 text-center text-xs font-bold text-slate-600">{rowData["Total Sesi"]}</td>
                            <td className="py-3 px-4 text-center text-xs font-bold text-slate-600">{rowData["Siswa Diangkut"]}</td>
                            <td className="py-3 px-4 text-center text-xs font-bold text-slate-600">{rowData["Kapasitas"]}</td>
                            <td className="py-3 px-4 text-center text-xs font-bold text-slate-600">{rowData["Load Factor"]}</td>
                            <td className="py-3 px-4 text-center text-xs font-semibold text-slate-500">{rowData["Odometer Awal (Km)"]}</td>
                            <td className="py-3 px-4 text-center text-xs font-semibold text-slate-500">{rowData["Odometer Akhir (Km)"]}</td>
                            <td className="py-3 px-4 text-center text-xs font-semibold text-slate-500">{rowData["Odometer Dishub (Km)"]}</td>
                            <td className="py-3 px-4 text-center text-xs font-bold text-[#00206B]">{rowData["Odometer Hari Ini (Km)"]}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-xs font-bold text-slate-600">{rowData["Status Kedisiplinan"]}</td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => setSelectedReportDetail(lap)}
                                className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md cursor-pointer transition-colors shadow-sm whitespace-nowrap"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="12" className="py-8 text-center text-xs font-bold text-slate-400">
                          Belum ada riwayat operasi yang tersimpan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedDriver(null)} className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase cursor-pointer">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL CHECKPOINT LAPORAN SPESIFIK */}
      {selectedReportDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.15s]">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-5 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#00206B] tracking-wider block">RINCIAN CHECKPOINT & INSPEKSI</span>
                <h3 className="text-xl font-black text-[#00206B] m-0">Laporan {selectedReportDetail.tanggal || selectedReportDetail.date || "Harian"}</h3>
              </div>
              <button onClick={() => setSelectedReportDetail(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                ✕
              </button>
            </div>

            {/* Sesi & CP */}
            <div className="space-y-4">
              {(selectedReportDetail.trip_sessions || []).map((sesi, idx) => (
                <div key={sesi.id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="font-black text-xs uppercase text-[#00206B]">Sesi {sesi.tipe_sesi || idx + 1}</span>
                    <span className="text-xs font-bold text-emerald-700">👥 {sesi.jumlah_penumpang || 0} Siswa</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">CP1 Keluar Dishub</span>
                      <span className="font-bold text-slate-800">
                        {formatTime(sesi.jam_berangkat_kantor || sesi.cp1_time)} WIB ({sesi.km_berangkat_kantor || sesi.cp1_km || 0} KM)
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">CP2 Tiba Start</span>
                      <span className="font-bold text-slate-800">
                        {formatTime(sesi.jam_berangkat_start || sesi.cp2_time)} WIB ({sesi.km_berangkat_start || sesi.cp2_km || 0} KM)
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">CP3 Tiba Sekolah</span>
                      <span className="font-bold text-slate-800">
                        {formatTime(sesi.jam_tiba_finish || sesi.cp3_time)} WIB ({sesi.km_tiba_finish || sesi.cp3_km || 0} KM)
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">CP4 Kembali Dishub</span>
                      <span className="font-bold text-slate-800">
                        {formatTime(sesi.jam_tiba_kantor || sesi.cp4_time)} WIB ({sesi.km_tiba_kantor || sesi.cp4_km || 0} KM)
                      </span>
                    </div>
                  </div>

                  {/* Foto Validasi Sesi */}
                  {(sesi.foto_awal || sesi.foto_akhir) && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {sesi.foto_awal && (
                        <div onClick={() => setSelectedImage(sesi.foto_awal)} className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 cursor-pointer group">
                          <img src={sesi.foto_awal} alt="Foto CP1" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Foto CP1 🔍</span>
                        </div>
                      )}
                      {sesi.foto_akhir && (
                        <div onClick={() => setSelectedImage(sesi.foto_akhir)} className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 cursor-pointer group">
                          <img src={sesi.foto_akhir} alt="Foto CP4" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Foto CP4 🔍</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedReportDetail(null)} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase cursor-pointer">
                Kembali ke Ringkasan Supir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div onClick={() => setSelectedImage(null)} className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out animate-[fadeIn_0.15s]">
          <div className="relative max-w-2xl max-h-[90vh]">
            <img src={selectedImage} alt="Zoom" className="rounded-2xl max-w-full max-h-[85vh] object-contain shadow-2xl" />
            <button onClick={() => setSelectedImage(null)} className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black transition-colors">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RekapAdmin;
