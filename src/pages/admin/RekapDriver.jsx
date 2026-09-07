import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { apiService } from "../../services/api";

const RekapAdmin = () => {
  const [rawData, setRawData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPeriode, setFilterPeriode] = useState(7); // Default: 7 Hari (1 Minggu)
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

  // FUNGSI SAKTI: Filter waktu & Grouping by Driver
  const groupedData = useMemo(() => {
    const now = new Date();

    // 1. Filter berdasarkan rentang hari (1 Minggu / 1 Bulan / Semua Waktu)
    const filtered = rawData.filter((item) => {
      if (filterPeriode === "all") return true;
      if (!item.tanggal && !item.created_at) return true;
      const itemDate = new Date(item.tanggal || item.created_at);
      const diffTime = Math.abs(now - itemDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= filterPeriode;
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
        isLate =
          curr.status_waktu === "TERLAMBAT" ||
          curr.status_kedisiplinan === "TERLAMBAT" ||
          curr.status?.toUpperCase() === "TERLAMBAT" ||
          curr.is_late === true ||
          curr.terlambat === true;

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
      result = result.filter(
        (s) =>
          s.nama_supir.toLowerCase().includes(q) ||
          s.id_supir.toLowerCase().includes(q) ||
          s.trayek_utama.toLowerCase().includes(q)
      );
    }

    return result;
  }, [rawData, filterPeriode, searchQuery]);

  const handleExportPerDriver = () => {
    const riwayatList = selectedDriver?.riwayat || selectedDriver?.list_laporan;
    if (!selectedDriver || !riwayatList || riwayatList.length === 0) return;

    // Susun data baris per baris untuk Excel
    const excelData = riwayatList.map((laporan) => ({
      "Tanggal": laporan.tanggal,
      "Armada / Bus": laporan.bus || "-",
      "Total Sesi": laporan.sesi_terlaksana || 0,
      "Siswa Diangkut": laporan.siswa_diangkut || 0,
      "Status Kedisiplinan": laporan.status_waktu || "TEPAT WAKTU",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap_Mingguan");

    // Nama file dinamis menggunakan nama supir
    const namaSupir = selectedDriver.nama_lengkap || selectedDriver.nama_supir || "Driver";
    const namaFile = `Rekap_${namaSupir.replace(/\s+/g, "_")}.xlsx`;
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
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-[#00206B] m-0 tracking-wide uppercase">
            Rekapitulasi Kinerja
          </h2>
          <p className="text-sm text-slate-400 font-semibold mt-0.5">
            Pantau akumulasi performa driver per rentang waktu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Supir */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari supir / trayek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-bold text-[#00206B] rounded-xl px-3.5 py-3 pl-9 outline-none focus:border-[#00206B] shadow-sm placeholder:text-slate-400"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Periode */}
          <select
            value={filterPeriode}
            onChange={(e) => setFilterPeriode(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="bg-white border border-slate-200 text-xs font-bold text-[#00206B] rounded-xl px-4 py-3 outline-none focus:border-[#00206B] shadow-sm cursor-pointer"
          >
            <option value={7}>1 Minggu Terakhir</option>
            <option value={30}>1 Bulan Terakhir</option>
            <option value="all">Semua Waktu</option>
          </select>
        </div>
      </div>

      {/* Tabel Akumulasi per Supir */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center text-[#00206B] font-bold py-14 animate-pulse">
            Menghitung akumulasi data server... ⏳
          </div>
        ) : groupedData.length === 0 ? (
          <div className="text-center text-slate-400 font-medium py-14 space-y-2">
            <div className="text-3xl">📂</div>
            <p className="font-bold text-slate-600 m-0">Belum ada data di periode ini.</p>
            <p className="text-xs text-slate-400">Silakan pilih rentang waktu lainnya pada filter di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50">
                  <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase rounded-tl-xl tracking-wider">
                    Nama Driver
                  </th>
                  <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase tracking-wider">Trayek</th>
                  <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase text-center tracking-wider">
                    Hari Jalan
                  </th>
                  <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase text-center tracking-wider">
                    Total Siswa
                  </th>
                  <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase text-center tracking-wider">
                    Disiplin Waktu
                  </th>
                  <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase text-center rounded-tr-xl tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedData.map((supir, index) => (
                  <tr
                    key={supir.id_supir || index}
                    onClick={() => setSelectedDriver(supir)}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00206B] to-blue-500 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
                          {supir.nama_supir.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-black text-[#00206B] block uppercase tracking-wide group-hover:text-blue-700 transition-colors">
                            {supir.nama_supir}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{supir.id_supir}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-xs font-extrabold text-slate-700 uppercase bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg inline-block">
                        {supir.trayek_utama}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="text-base font-black text-[#00206B]">{supir.total_hari_jalan}</span>{" "}
                      <span className="text-xs text-slate-400 font-semibold">Hari</span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="text-base font-black text-[#00206B]">{supir.total_penumpang}</span>{" "}
                      <span className="text-xs text-slate-400 font-semibold">Siswa</span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className="bg-[#E6F7ED] text-[#137333] border border-[#BCECD2] font-black text-[10px] px-2.5 py-1 rounded-lg shadow-sm"
                          title="Total Sesi Tepat Waktu"
                        >
                          🟢 {supir.total_tepat} Tepat
                        </span>
                        {supir.total_telat > 0 ? (
                          <span
                            className="bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF] font-black text-[10px] px-2.5 py-1 rounded-lg shadow-sm"
                            title="Total Sesi Terlambat"
                          >
                            🔴 {supir.total_telat} Telat
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
                        className="inline-flex items-center gap-1.5 bg-[#00206B] hover:bg-[#00174E] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <span>Lihat Log</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
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

      {/* MODAL 1: RINCIAN LOG HARIAN SUPIR */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00206B] to-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                  {selectedDriver.nama_supir.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-[#00206B] tracking-wider block">
                    AKUMULASI LOGBOOK DRIVER
                  </span>
                  <h3 className="text-xl font-black text-[#00206B] m-0">{selectedDriver.nama_supir}</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    ID: {selectedDriver.id_supir} • Trayek: {selectedDriver.trayek_utama} • Total {selectedDriver.total_hari_jalan} Laporan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriver(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* DI DALAM MODAL DETAIL DRIVER (Dekat Header/Nama) */}
            <div className="mt-4 flex justify-center w-full">
              <button
                onClick={handleExportPerDriver}
                className="flex items-center gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-black px-4 py-2 rounded-xl transition-colors border border-emerald-200 w-full justify-center shadow-sm cursor-pointer"
              >
                <span>📊 DOWNLOAD EXCEL ({selectedDriver?.nama_lengkap || selectedDriver?.nama_supir})</span>
              </button>
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
                  <span className="text-sm font-bold text-emerald-600">✓ {selectedDriver?.total_tepat || 0} Tepat</span>
                  <span className="text-sm font-bold text-rose-600">⚠️ {selectedDriver?.total_telat || 0} Telat</span>
                </div>
              </div>
            </div>

            {/* Bagian RIWAYAT TANGGAL LAPORAN OPERASIONAL */}
            <div className="space-y-3 mt-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              <h4 className="text-xs font-black text-[#00206B] uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                📅 Riwayat Tanggal Laporan Operasional
              </h4>
              {selectedDriver?.list_laporan && selectedDriver.list_laporan.length > 0 ? (
                selectedDriver.list_laporan.map((lap, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-white flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="text-sm font-black text-[#00206B]">Tanggal: {lap.tanggal || (lap.created_at ? lap.created_at.split("T")[0] : "-")}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Armada: {lap.bus || "-"}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {lap.trip_sessions?.length || 0} Sesi Terlaksana
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedReportDetail(lap)}
                      className="text-[10px] font-black uppercase tracking-widest text-[#00206B] border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      Detail Checkpoint 🔍
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 font-bold text-xs">Belum ada riwayat operasional.</div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDriver(null)}
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase cursor-pointer"
              >
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
                <span className="text-[10px] font-black uppercase text-[#00206B] tracking-wider block">
                  RINCIAN CHECKPOINT & INSPEKSI
                </span>
                <h3 className="text-xl font-black text-[#00206B] m-0">
                  Laporan {selectedReportDetail.tanggal || selectedReportDetail.date || "Harian"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sesi & CP */}
            <div className="space-y-4">
              {(selectedReportDetail.trip_sessions || []).map((sesi, idx) => (
                <div key={sesi.id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="font-black text-xs uppercase text-[#00206B]">
                      Sesi {sesi.tipe_sesi || idx + 1}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      👥 {sesi.jumlah_penumpang || 0} Siswa
                    </span>
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
                        <div
                          onClick={() => setSelectedImage(sesi.foto_awal)}
                          className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 cursor-pointer group"
                        >
                          <img src={sesi.foto_awal} alt="Foto CP1" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            Foto CP1 🔍
                          </span>
                        </div>
                      )}
                      {sesi.foto_akhir && (
                        <div
                          onClick={() => setSelectedImage(sesi.foto_akhir)}
                          className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 cursor-pointer group"
                        >
                          <img src={sesi.foto_akhir} alt="Foto CP4" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            Foto CP4 🔍
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase cursor-pointer"
              >
                Kembali ke Ringkasan Supir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out animate-[fadeIn_0.15s]"
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img src={selectedImage} alt="Zoom" className="rounded-2xl max-w-full max-h-[85vh] object-contain shadow-2xl" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RekapAdmin;

