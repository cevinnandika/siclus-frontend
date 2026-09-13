import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { apiService } from "../../services/api";

const RekapAdmin = () => {
  const [rawData, setRawData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [tempStart, setTempStart] = useState("");
  const [tempEnd, setTempEnd] = useState("");
  const [activePresetKey, setActivePresetKey] = useState("SEMUA");

  const INDO_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const firstDayOfWeek = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();

  const formatYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateRangeDisplay = (start, end) => {
    if (!start && !end) return "Semua Tanggal";
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const formatShort = (dateStr) => {
      if (!dateStr) return "";
      const parts = dateStr.split("-");
      if (parts.length !== 3) return dateStr;
      const day = parseInt(parts[2], 10);
      const month = months[parseInt(parts[1], 10) - 1] || parts[1];
      const year = parts[0];
      return `${day} ${month} ${year}`;
    };

    if (start && end) {
      if (start === end) return formatShort(start);
      return `${formatShort(start)} – ${formatShort(end)}`;
    }
    if (start) return `Sejak ${formatShort(start)}`;
    return `Hingga ${formatShort(end)}`;
  };

  const handlePrevMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const toggleDatePicker = () => {
    if (!showDatePicker) {
      setTempStart(startDate);
      setTempEnd(endDate);
      if (startDate) {
        const parts = startDate.split("-").map(Number);
        if (parts.length === 3) {
          setCalendarDate(new Date(parts[0], parts[1] - 1, parts[2] || 1));
        }
      } else {
        setCalendarDate(new Date());
      }
    }
    setShowDatePicker((prev) => !prev);
  };

  const handleSelectDay = (day) => {
    setActivePresetKey("KUSTOM");
    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();
    const dateObj = new Date(y, m, day);
    const dateStr = formatYMD(dateObj);

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd("");
    } else {
      if (dateStr < tempStart) {
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  const handleApplyCustomDate = () => {
    setStartDate(tempStart);
    setEndDate(tempEnd || tempStart);
    setActivePresetKey("KUSTOM");
    setShowDatePicker(false);
  };

  const handleClearDate = () => {
    setStartDate("");
    setEndDate("");
    setTempStart("");
    setTempEnd("");
    setActivePresetKey("SEMUA");
    setShowDatePicker(false);
  };

  const handleApplyPreset = (preset) => {
    const now = new Date();
    const todayStr = formatYMD(now);
    setActivePresetKey(preset);

    if (preset === "SEMUA") {
      handleClearDate();
      return;
    }
    if (preset === "HARI_INI") {
      setStartDate(todayStr);
      setEndDate(todayStr);
      setTempStart(todayStr);
      setTempEnd(todayStr);
      setCalendarDate(now);
    } else if (preset === "7_HARI") {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      const pastStr = formatYMD(past);
      setStartDate(pastStr);
      setEndDate(todayStr);
      setTempStart(pastStr);
      setTempEnd(todayStr);
      setCalendarDate(now);
    } else if (preset === "BULAN_INI") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayStr = formatYMD(firstDay);
      setStartDate(firstDayStr);
      setEndDate(todayStr);
      setTempStart(firstDayStr);
      setTempEnd(todayStr);
      setCalendarDate(now);
    }
    setShowDatePicker(false);
  };

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
      // Prioritaskan ID resmi dari database (misal: "DRV-001") dan jangan gunakan email
      let driverDbId = curr.users?.id;
      if (!driverDbId || driverDbId.includes("@")) {
        if (curr.id_supir && !curr.id_supir.includes("@")) {
          driverDbId = curr.id_supir;
        } else if (curr.id_driver && !curr.id_driver.includes("@")) {
          driverDbId = curr.id_driver;
        } else if (curr.user_id && !curr.user_id.includes("@")) {
          driverDbId = curr.user_id;
        }
      }
      const supirId = driverDbId || (curr.id_supir && !curr.id_supir.includes("@") ? curr.id_supir : "DRV-001");
      const driverName = curr.users?.nama || curr.users?.name || curr.nama_supir || curr.nama || "Driver";
      const driverPhoto = curr.users?.foto_profil || curr.foto_profil || curr.pengemudi?.foto_profil || null;

      if (!acc[supirId]) {
        acc[supirId] = {
          id_supir: supirId,
          nama_supir: driverName,
          nama_lengkap: driverName,
          foto_profil: driverPhoto,
          trayek_utama: curr.trayek || curr.users?.trayek || "-",
          bus_utama: curr.bus || curr.users?.bus || "-",
          total_hari_jalan: 0,
          total_penumpang: 0,
          total_telat: 0,
          total_tepat: 0,
          list_laporan: [],
          riwayat: [],
        };
      } else if (!acc[supirId].foto_profil && driverPhoto) {
        acc[supirId].foto_profil = driverPhoto;
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

  // Driver aktif yang dipilih untuk tampilan detail di dalam halaman
  const selectedDriver = useMemo(() => {
    if (!selectedDriverId) return null;
    return groupedData.find((d) => d.id_supir === selectedDriverId) || null;
  }, [groupedData, selectedDriverId]);

  const resolveSessionStatus = (sesi) => {
    if (!sesi) return "-";
    const late =
      sesi.status_waktu === "TERLAMBAT" ||
      sesi.status_kedisiplinan === "TERLAMBAT" ||
      sesi.status?.toUpperCase() === "TERLAMBAT" ||
      sesi.is_late === true ||
      sesi.terlambat === true ||
      sesi.cp1_late ||
      sesi.cp2_late;
    if (late) return "TERLAMBAT";
    if (sesi.status_waktu) return sesi.status_waktu.toUpperCase();
    return "TEPAT WAKTU";
  };

  // Helper to format session name cleanly (Pagi, Siang, Sore, etc.)
  const formatSessionName = (tipe, index = 0) => {
    if (!tipe) return index === 0 ? "Pagi" : index === 1 ? "Siang" : `Sesi ${index + 1}`;
    const str = String(tipe).trim();
    const lower = str.toLowerCase();
    if (lower.includes("pagi") || lower === "1") return "Pagi";
    if (lower.includes("siang") || lower === "2") return "Siang";
    if (lower.includes("sore") || lower === "3") return "Sore";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Helper to sort sessions chronologically: Pagi first, then Siang / Sore
  const sortSessions = (sessions) => {
    return [...sessions].sort((a, b) => {
      const typeA = (a.tipe_sesi || "").toUpperCase();
      const typeB = (b.tipe_sesi || "").toUpperCase();
      if (typeA.includes("PAGI") && !typeB.includes("PAGI")) return -1;
      if (!typeA.includes("PAGI") && typeB.includes("PAGI")) return 1;
      const timeA = a.jam_berangkat_kantor || a.created_at || "";
      const timeB = b.jam_berangkat_kantor || b.created_at || "";
      return timeA.localeCompare(timeB);
    });
  };

  // Helper to calculate distance per trip: CP4 (Kembali) - CP1 (Keluar)
  const calculateJarakTempuh = (cp1, cp4, cp3) => {
    const km1 = Number(cp1) || 0;
    const km4 = Number(cp4) || 0;
    const km3 = Number(cp3) || 0;
    if (km4 > 0 && km1 > 0 && km4 >= km1) {
      return `${km4 - km1} KM`;
    }
    if (km3 > 0 && km1 > 0 && km3 >= km1) {
      return `${km3 - km1} KM`;
    }
    return "-";
  };

  // Helper to generate granular per-session rows for Table UI and Excel Export
  const generateSessionRows = (driver, lap) => {
    const rawSessions = lap.trip_sessions || [];
    const sortedSessions = rawSessions.length > 0 ? sortSessions(rawSessions) : [lap];
    const kapasitas = Number(lap.kapasitas) || Number(driver?.users?.kapasitas) || 25;
    const tanggal = lap.tanggal || (lap.created_at ? lap.created_at.split("T")[0] : "-");
    const trayek = lap.trayek || lap.users?.trayek || driver?.trayek_utama || "-";
    const defaultNopol = lap.bus || lap.nopol_kendaraan || lap.nopol || driver?.bus_utama || "-";

    return sortedSessions.map((sesi, idx) => {
      const sesiName = formatSessionName(sesi.tipe_sesi, idx);
      const nopol = sesi.nopol_kendaraan || defaultNopol;
      const siswa = Number(sesi.jumlah_penumpang ?? (sortedSessions.length === 1 ? lap.siswa_diangkut : 0) ?? 0);
      const loadFactorNum = kapasitas > 0 ? Math.round((siswa / kapasitas) * 100) : 0;
      const loadFactor = `${loadFactorNum}%`;

      const cp1Raw = sesi.km_berangkat_kantor ?? sesi.cp1_km ?? (idx === 0 ? lap.odo_awal : null);
      const cp3Raw = sesi.km_tiba_finish ?? sesi.cp3_km ?? (idx === 0 ? lap.odo_dishub : null);
      const cp4Raw = sesi.km_tiba_kantor ?? sesi.cp4_km ?? (idx === 0 ? lap.odo_akhir : null);

      const cp1Display = cp1Raw !== null && cp1Raw !== undefined && cp1Raw !== "" ? cp1Raw : "-";
      const cp3Display = cp3Raw !== null && cp3Raw !== undefined && cp3Raw !== "" ? cp3Raw : "-";
      const cp4Display = cp4Raw !== null && cp4Raw !== undefined && cp4Raw !== "" ? cp4Raw : "-";

      const jarakTempuh = calculateJarakTempuh(cp1Raw, cp4Raw, cp3Raw);
      const status = resolveSessionStatus(sesi);

      return {
        lapId: lap.id,
        sesiIndex: idx,
        sesiRaw: sesi,
        driverId: driver?.id_supir || "-",
        driverNama: driver?.nama_lengkap || driver?.nama_supir || "Driver",
        tanggal,
        sesiName,
        trayek,
        nopol,
        siswa,
        siswaDisplay: `${siswa} Siswa`,
        kapasitas,
        loadFactor,
        loadFactorNum,
        cp1: cp1Display,
        cp3: cp3Display,
        cp4: cp4Display,
        jarakTempuh,
        status,
        jamCP1: sesi.jam_berangkat_kantor || sesi.cp1_time || null,
        jamCP2: sesi.jam_berangkat_start || sesi.cp2_time || null,
        jamCP3: sesi.jam_tiba_finish || sesi.cp3_time || null,
        jamCP4: sesi.jam_tiba_kantor || sesi.cp4_time || null,
        kmCP2: sesi.km_berangkat_start || sesi.cp2_km || null,
        fotoCP1: sesi.foto_awal || null,
        fotoCP4: sesi.foto_akhir || null,
      };
    });
  };

  // Helper row format for Excel export matching Dishub's exact per-session layout
  const generateExcelRow = (row) => ({
    Tanggal: row.tanggal,
    Sesi: row.sesiName,
    Trayek: row.trayek,
    Nopol: row.nopol,
    Siswa: row.siswaDisplay,
    Kapasitas: row.kapasitas,
    "Load Factor": row.loadFactor,
    "CP1 (Keluar)": row.cp1,
    "CP2 (Sekolah)": row.cp3,
    "CP3 (Masuk)": row.cp4,
    "Jarak Tempuh": row.jarakTempuh,
    Status: row.status,
    "Nama Driver": row.driverNama,
    "ID Driver": row.driverId,
  });

  // Helper download file Excel yang aman di semua browser (Chrome, Edge, Firefox)
  // Menghindari issue Chromium yang menamai file dengan raw UUID blob tanpa ekstensi
  const saveWorkbookAsExcel = (workbook, fileName) => {
    try {
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const dataBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });

      const cleanFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", cleanFileName);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Beri jeda agar download manager browser sempat membaca atribut download sebelum URL dicabut
      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error("Gagal mengunduh file Excel:", err);
      // Fallback
      XLSX.writeFile(workbook, fileName);
    }
  };

  const handleExportPerDriver = () => {
    const riwayatList = selectedDriver?.riwayat || selectedDriver?.list_laporan;
    if (!selectedDriver || !riwayatList || riwayatList.length === 0) {
      toast.error("Tidak ada data laporan untuk driver ini!");
      return;
    }

    // Susun data baris per sesi untuk Excel sesuai format Dishub
    const excelData = [];
    riwayatList.forEach((lap) => {
      const sessionRows = generateSessionRows(selectedDriver, lap);
      sessionRows.forEach((row) => {
        excelData.push(generateExcelRow(row));
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    // Lebar kolom rapi dan optimal untuk Dishub Excel
    worksheet["!cols"] = [
      { wch: 14 }, // Tanggal
      { wch: 10 }, // Sesi
      { wch: 12 }, // Trayek
      { wch: 16 }, // Nopol
      { wch: 12 }, // Siswa
      { wch: 12 }, // Kapasitas
      { wch: 14 }, // Load Factor
      { wch: 14 }, // CP1 (Keluar)
      { wch: 14 }, // CP2 (Sekolah)
      { wch: 14 }, // CP3 (Masuk)
      { wch: 16 }, // Jarak Tempuh
      { wch: 16 }, // Status
      { wch: 22 }, // Nama Driver
      { wch: 14 }, // ID Driver
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap_Sesi_Dishub");

    // Nama file dinamis menggunakan nama supir
    const namaSupir = selectedDriver.nama_lengkap || selectedDriver.nama_supir || "Driver";
    const cleanNama = namaSupir.replace(/[^a-zA-Z0-9_-]/g, "_");
    let namaFile = `Rekap_${cleanNama}`;
    if (startDate && endDate) namaFile += `_${startDate}_to_${endDate}`;
    else if (startDate) namaFile += `_sejak_${startDate}`;
    namaFile += ".xlsx";

    saveWorkbookAsExcel(workbook, namaFile);
    toast.success(`Berhasil mengunduh rekap per sesi untuk ${namaSupir}!`);
  };

  const handleExportAll = () => {
    if (groupedData.length === 0) {
      toast.error("Tidak ada data untuk diexport!");
      return;
    }

    const allExcelData = [];

    groupedData.forEach((driver) => {
      const riwayatList = driver.riwayat || driver.list_laporan;
      if (riwayatList && riwayatList.length > 0) {
        riwayatList.forEach((lap) => {
          const sessionRows = generateSessionRows(driver, lap);
          sessionRows.forEach((row) => {
            allExcelData.push(generateExcelRow(row));
          });
        });
      }
    });

    if (allExcelData.length === 0) {
      toast.error("Tidak ada detail laporan untuk diexport!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(allExcelData);
    worksheet["!cols"] = [
      { wch: 14 }, // Tanggal
      { wch: 10 }, // Sesi
      { wch: 12 }, // Trayek
      { wch: 16 }, // Nopol
      { wch: 12 }, // Siswa
      { wch: 12 }, // Kapasitas
      { wch: 14 }, // Load Factor
      { wch: 14 }, // CP1 (Keluar)
      { wch: 14 }, // CP2 (Sekolah)
      { wch: 14 }, // CP3 (Masuk)
      { wch: 16 }, // Jarak Tempuh
      { wch: 16 }, // Status
      { wch: 22 }, // Nama Driver
      { wch: 14 }, // ID Driver
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap_Semua_Sesi");

    let namaFile = "Rekap_Semua_Driver";
    if (startDate && endDate) namaFile += `_${startDate}_to_${endDate}`;
    else if (startDate) namaFile += `_sejak_${startDate}`;
    namaFile += ".xlsx";

    saveWorkbookAsExcel(workbook, namaFile);
    toast.success("Berhasil mengunduh rekap semua driver!");
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
      {/* TAMPILAN 1: DAFTAR SEMUA DRIVER (DEFAULT VIEW) */}
      {!selectedDriver ? (
        <>
          {/* Header & Integrated Toolbar */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-[#00206B] tracking-tight m-0">Rekapitulasi Kinerja</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Pantau akumulasi performa, trip harian, dan kedisiplinan seluruh driver.</p>
            </div>

            {/* UNIFIED ACTION & FILTER TOOLBAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 p-2.5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,32,107,0.05)]">
              {/* Search Bar - Sisi Kiri */}
              <div className="relative flex items-center w-full sm:w-64 md:w-72">
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

              {/* Sisi Kanan: Kapsul Filter Kalender & Rekap Semua Driver */}
              <div className="flex items-center gap-2 relative">
                {/* Kapsul Filter Tanggal Modern */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleDatePicker}
                    className={`h-10 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer shadow-2xs ${
                      startDate || endDate ? "bg-blue-50/90 text-[#00206B] border-blue-200 hover:bg-blue-100/70" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <svg className={`w-4 h-4 ${startDate || endDate ? "text-[#00206B]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                    <span>{formatDateRangeDisplay(startDate, endDate)}</span>
                    <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showDatePicker ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Reset '✕' button jika ada filter aktif */}
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearDate();
                      }}
                      title="Reset ke Semua Tanggal"
                      className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs cursor-pointer transition-transform hover:scale-110"
                    >
                      ✕
                    </button>
                  )}

                  {/* Custom Calendar Popover (Zero Chrome Defaults) */}
                  {showDatePicker && (
                    <>
                      {/* Transparent backdrop to close on outside click */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />

                      {/* Dropdown Card */}
                      <div className="absolute right-0 top-full mt-2 w-76 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 z-50 animate-[fadeIn_0.15s] text-left">
                        {/* Preset Chips */}
                        <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 overflow-x-auto scrollbar-none">
                          {[
                            { key: "SEMUA", label: "Semua" },
                            { key: "HARI_INI", label: "Hari Ini" },
                            { key: "7_HARI", label: "7 Hari" },
                            { key: "BULAN_INI", label: "Bulan Ini" },
                          ].map((p) => {
                            const isSelected = activePresetKey === p.key;
                            return (
                              <button
                                key={p.key}
                                type="button"
                                onClick={() => handleApplyPreset(p.key)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                  isSelected ? "bg-[#00206B] text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                                }`}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Month & Year Navigation */}
                        <div className="flex items-center justify-between py-2.5">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                          </button>
                          <span className="text-xs font-bold text-slate-800 tracking-tight">
                            {INDO_MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                          </span>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </button>
                        </div>

                        {/* Day of Week Headers */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-1">
                          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d, i) => (
                            <span key={d} className={`text-[10px] font-bold uppercase tracking-wider ${i === 0 ? "text-rose-400" : "text-slate-400"}`}>
                              {d}
                            </span>
                          ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-8" />
                          ))}
                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const currentDayStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                            const isStart = tempStart === currentDayStr;
                            const isEnd = tempEnd === currentDayStr;
                            const isInRange = tempStart && tempEnd && currentDayStr > tempStart && currentDayStr < tempEnd;
                            const isToday = currentDayStr === formatYMD(new Date());

                            return (
                              <button
                                key={dayNum}
                                type="button"
                                onClick={() => handleSelectDay(dayNum)}
                                className={`h-8 w-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                                  isStart && isEnd
                                    ? "bg-[#00206B] text-white rounded-lg font-bold shadow-2xs"
                                    : isStart
                                      ? "bg-[#00206B] text-white rounded-l-lg font-bold shadow-2xs"
                                      : isEnd
                                        ? "bg-[#00206B] text-white rounded-r-lg font-bold shadow-2xs"
                                        : isInRange
                                          ? "bg-blue-50 text-[#00206B] font-semibold rounded-none"
                                          : isToday
                                            ? "border border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 font-bold"
                                            : "text-slate-700 hover:bg-slate-100 rounded-lg"
                                }`}
                              >
                                {dayNum}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected Range Summary & Bottom Actions */}
                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold text-slate-500 truncate max-w-[130px]">
                            {tempStart ? formatDateRangeDisplay(tempStart, tempEnd || tempStart) : <span className="text-slate-400 italic">Pilih tanggal</span>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {(tempStart || tempEnd || startDate || endDate) && (
                              <button
                                type="button"
                                onClick={handleClearDate}
                                className="px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={!tempStart}
                              onClick={handleApplyCustomDate}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                                tempStart ? "bg-[#00206B] hover:bg-[#001850] text-white cursor-pointer active:scale-95" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              Terapkan
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* GLOBAL EXPORT BUTTON (Rekap Semua Driver) */}
                <button
                  onClick={handleExportAll}
                  disabled={groupedData.length === 0}
                  className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 ${
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

          {/* Table Container - Flush Edge-to-Edge with Soft Sky/Navy Depth */}
          <div className="bg-white border border-slate-200/90 rounded-3xl shadow-[0_4px_24px_-6px_rgba(0,32,107,0.06)] overflow-hidden">
            {isLoading ? (
              <div className="text-center text-[#00206B] font-bold py-16 animate-pulse">Menghitung akumulasi data server...</div>
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
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">
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
                        onClick={() => setSelectedDriverId(supir.id_supir)}
                        className="hover:bg-gradient-to-r hover:from-sky-50/40 hover:via-blue-50/25 hover:to-transparent transition-all duration-150 group cursor-pointer"
                        title={`Klik untuk melihat detail rekap ${supir.nama_supir}`}
                      >
                        <td className="py-4.5 px-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100/90 to-blue-50 border border-sky-200/70 text-[#00206B] flex items-center justify-center font-black text-sm shadow-2xs flex-shrink-0 group-hover:border-[#00206B] transition-all duration-200">
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
                              <span className="text-sm font-extrabold text-slate-800 block group-hover:text-[#00206B] transition-colors">{supir.nama_supir}</span>
                              <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-500 font-bold tracking-wider mt-0.5">{supir.id_supir}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4.5 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60 font-bold text-xs shadow-2xs">
                            <span className="font-black text-slate-900 text-sm">{supir.list_laporan?.length || supir.total_hari_jalan || 0}</span>
                            <span className="text-[11px] text-slate-500 font-medium">Laporan</span>
                          </span>
                        </td>

                        <td className="py-4.5 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200/80 font-bold text-xs shadow-2xs">
                            <svg className="w-3.5 h-3.5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                              />
                            </svg>
                            <span className="font-black text-sky-950 text-sm">{supir.total_penumpang}</span>
                            <span className="text-[11px] text-sky-700/80 font-medium">Siswa</span>
                          </span>
                        </td>

                        <td className="py-4.5 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200/80 font-bold text-xs px-3 py-1 rounded-xl shadow-2xs">
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{supir.total_tepat} Tepat</span>
                          </span>
                        </td>

                        <td className="py-4.5 px-6 text-center">
                          {supir.total_telat > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-rose-800 bg-rose-50 border border-rose-200/80 font-bold text-xs px-3 py-1 rounded-xl shadow-2xs">
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDriverId(supir.id_supir);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-sky-50 to-blue-50 hover:from-[#00206B] hover:to-[#0A328C] border border-sky-200/80 hover:border-[#00206B] text-[#00206B] hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm active:scale-95 group/btn"
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
      ) : (
        /* TAMPILAN 2: DETAIL OPERASIONAL DRIVER (IN-PAGE / MENYATU DI DALAM HALAMAN) */
        <div className="space-y-4 animate-[fadeIn_0.25s]">
          {/* Top Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedDriverId(null);
                setExpandedReportId(null);
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#00206B] bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer group"
            >
              <svg className="w-4 h-4 text-slate-400 group-hover:text-[#00206B] group-hover:-translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Kembali ke Daftar Rekap</span>
            </button>
          </div>

          {/* MAIN DETAIL CARD CONTAINER (MENYATU DI DALAM HALAMAN) */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_4px_24px_-6px_rgba(0,32,107,0.06)] overflow-hidden">
            {/* Header: Driver Info & Controls (Filter Tanggal + Export Excel Berdampingan) */}
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
                  <span className="text-[10px] font-extrabold uppercase text-[#00206B] tracking-wider block">DETAIL OPERASIONAL</span>
                  <h2 className="text-2xl font-black text-[#00206B] m-0 tracking-tight">{selectedDriver.nama_supir}</h2>
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-500 font-bold tracking-wider mt-1">ID : {selectedDriver.id_supir}</span>
                </div>
              </div>

              {/* Sisi Kanan: Kapsul Filter Tanggal + Export Excel Pas Berdampingan di Dalam Card */}
              <div className="flex items-center gap-2.5 relative">
                {/* Kapsul Filter Tanggal */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleDatePicker}
                    className={`h-10 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer shadow-2xs ${
                      startDate || endDate ? "bg-blue-50/90 text-[#00206B] border-blue-200 hover:bg-blue-100/70" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <svg className={`w-4 h-4 ${startDate || endDate ? "text-[#00206B]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                    <span>{formatDateRangeDisplay(startDate, endDate)}</span>
                    <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showDatePicker ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearDate();
                      }}
                      title="Reset ke Semua Tanggal"
                      className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs cursor-pointer transition-transform hover:scale-110"
                    >
                      ✕
                    </button>
                  )}

                  {/* Custom Calendar Popover (Zero Chrome Defaults) */}
                  {showDatePicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                      <div className="absolute right-0 top-full mt-2 w-76 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 z-50 animate-[fadeIn_0.15s] text-left">
                        {/* Preset Chips */}
                        <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 overflow-x-auto scrollbar-none">
                          {[
                            { key: "SEMUA", label: "Semua" },
                            { key: "HARI_INI", label: "Hari Ini" },
                            { key: "7_HARI", label: "7 Hari" },
                            { key: "BULAN_INI", label: "Bulan Ini" },
                          ].map((p) => {
                            const isSelected = activePresetKey === p.key;
                            return (
                              <button
                                key={p.key}
                                type="button"
                                onClick={() => handleApplyPreset(p.key)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                  isSelected ? "bg-[#00206B] text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                                }`}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Month & Year Navigation */}
                        <div className="flex items-center justify-between py-2.5">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                          </button>
                          <span className="text-xs font-bold text-slate-800 tracking-tight">
                            {INDO_MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                          </span>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </button>
                        </div>

                        {/* Day of Week Headers */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-1">
                          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d, i) => (
                            <span key={d} className={`text-[10px] font-bold uppercase tracking-wider ${i === 0 ? "text-rose-400" : "text-slate-400"}`}>
                              {d}
                            </span>
                          ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-8" />
                          ))}
                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const currentDayStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                            const isStart = tempStart === currentDayStr;
                            const isEnd = tempEnd === currentDayStr;
                            const isInRange = tempStart && tempEnd && currentDayStr > tempStart && currentDayStr < tempEnd;
                            const isToday = currentDayStr === formatYMD(new Date());

                            return (
                              <button
                                key={dayNum}
                                type="button"
                                onClick={() => handleSelectDay(dayNum)}
                                className={`h-8 w-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                                  isStart && isEnd
                                    ? "bg-[#00206B] text-white rounded-lg font-bold shadow-2xs"
                                    : isStart
                                      ? "bg-[#00206B] text-white rounded-l-lg font-bold shadow-2xs"
                                      : isEnd
                                        ? "bg-[#00206B] text-white rounded-r-lg font-bold shadow-2xs"
                                        : isInRange
                                          ? "bg-blue-50 text-[#00206B] font-semibold rounded-none"
                                          : isToday
                                            ? "border border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 font-bold"
                                            : "text-slate-700 hover:bg-slate-100 rounded-lg"
                                }`}
                              >
                                {dayNum}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected Range Summary & Bottom Actions */}
                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold text-slate-500 truncate max-w-[130px]">
                            {tempStart ? formatDateRangeDisplay(tempStart, tempEnd || tempStart) : <span className="text-slate-400 italic">Pilih tanggal</span>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {(tempStart || tempEnd || startDate || endDate) && (
                              <button
                                type="button"
                                onClick={handleClearDate}
                                className="px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={!tempStart}
                              onClick={handleApplyCustomDate}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                                tempStart ? "bg-[#00206B] hover:bg-[#001850] text-white cursor-pointer active:scale-95" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              Terapkan
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Tombol Export Excel */}
                <button
                  onClick={handleExportPerDriver}
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

            {/* 4 Metric Summary Cards - Harmonized with Option 3 Palette */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Laporan */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Laporan</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-800 tracking-tight">{selectedDriver?.list_laporan?.length || selectedDriver?.total_hari_jalan || 0}</span>
                    <span className="text-xs font-semibold text-slate-400">Laporan</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100/80 flex items-center justify-center border border-slate-200/60 group-hover:border-slate-300 transition-colors flex-shrink-0">
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5-4.5h7.5m-7.5-4.5h7.5M6 20.25h12A2.25 2.25 0 0020.25 18V7.5a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 7.5v10.5A2.25 2.25 0 006 20.25z"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 2: Total Penumpang (Soft Cyan / Sky) */}
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 3: Tepat Waktu (Soft Emerald) */}
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

              {/* Card 4: Terlambat (Soft Rose / Neutral) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Terlambat</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-black tracking-tight ${selectedDriver?.total_telat > 0 ? "text-rose-950" : "text-slate-800"}`}>{selectedDriver?.total_telat || 0}</span>
                    <span className={`text-xs font-semibold ${selectedDriver?.total_telat > 0 ? "text-rose-600" : "text-slate-400"}`}>Telat</span>
                  </div>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors flex-shrink-0 ${
                    selectedDriver?.total_telat > 0 ? "bg-rose-50 border-rose-200/70 text-rose-600" : "bg-slate-50 border-slate-200/60 text-slate-400"
                  }`}
                >
                  <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Bagian RIWAYAT TANGGAL LAPORAN OPERASIONAL - TABEL LENGKAP */}
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
                                      row.sesiName.toLowerCase().includes("pagi") ? "bg-amber-50 text-amber-800 border-amber-200/70" : "bg-blue-50 text-blue-800 border-blue-200/70"
                                    }`}
                                  >
                                    {row.sesiName}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                  <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-50 text-[#00206B] font-bold text-xs border border-sky-200/70">{row.trayek}</span>
                                </td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                  <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">{row.nopol}</span>
                                </td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200/70">
                                    {row.siswaDisplay}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-600 whitespace-nowrap">{row.kapasitas}</td>
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
                                <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">{row.cp1}</td>
                                <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">{row.cp3}</td>
                                <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">{row.cp4}</td>
                                <td className="py-3.5 px-4 text-center text-xs font-black text-[#00206B] whitespace-nowrap">{row.jarakTempuh}</td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                  <span
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border inline-block ${
                                      row.status === "TERLAMBAT" ? "bg-rose-50 text-rose-700 border-rose-200/80" : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                    }`}
                                  >
                                    {row.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                  <button
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

                              {/* INLINE EXPANDED CHECKPOINT INSPECTION ACCORDION (MENYATU DI DALAM TABEL) */}
                              {isExpanded && (
                                <tr className={`bg-slate-50/80 ${row.isLastSessionOfDay ? "border-b-2 border-slate-200/90" : "border-b border-dashed border-slate-200/80"}`}>
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
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">CP1 • Keluar Garasi Dishub</span>
                                            <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">Awal</span>
                                          </div>
                                          <div className="text-sm font-black text-slate-800">{formatTime(row.jamCP1)} WIB</div>
                                          <div className="text-xs font-bold text-slate-500">Odometer: {row.cp1} KM</div>
                                        </div>

                                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">CP2 • Tiba Rute Sekolah</span>
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">👥 {row.siswa} Siswa</span>
                                          </div>
                                          <div className="text-sm font-black text-slate-800">{formatTime(row.jamCP3)} WIB</div>
                                          <div className="text-xs font-bold text-slate-500">Odometer: {row.cp3} KM</div>
                                        </div>

                                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">CP3 • Kembali Garasi Dishub</span>
                                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">🏁 {row.jarakTempuh}</span>
                                          </div>
                                          <div className="text-sm font-black text-slate-800">{formatTime(row.jamCP4)} WIB</div>
                                          <div className="text-xs font-bold text-slate-500">Odometer: {row.cp4} KM</div>
                                        </div>
                                      </div>

                                      {/* Foto Validasi Sesi */}
                                      {(row.fotoCP1 || row.fotoCP4) && (
                                        <div className="space-y-2 pt-1">
                                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Foto Bukti Checkpoint</span>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {row.fotoCP1 && (
                                              <div
                                                onClick={() => setSelectedImage(row.fotoCP1)}
                                                className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 cursor-pointer group border border-slate-200 shadow-xs"
                                              >
                                                <img src={row.fotoCP1} alt="Foto CP1 Awal" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                                                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                                                  📸 Foto CP1 (Keluar Garasi) 🔍
                                                </span>
                                              </div>
                                            )}
                                            {row.fotoCP4 && (
                                              <div
                                                onClick={() => setSelectedImage(row.fotoCP4)}
                                                className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 cursor-pointer group border border-slate-200 shadow-xs"
                                              >
                                                <img src={row.fotoCP4} alt="Foto CP3 Akhir" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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

            {/* Bottom Action Bar: Tutup Button (Persis seperti pada posisi di tangkapan layar user) */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setSelectedDriverId(null);
                  setExpandedReportId(null);
                }}
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase cursor-pointer transition-colors shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal Lightbox (Hanya saat klik thumbnail foto inspeksi) */}
      {selectedImage && (
        <div onClick={() => setSelectedImage(null)} className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out animate-[fadeIn_0.15s]">
          <div className="relative max-w-2xl max-h-[90vh]">
            <img src={selectedImage} alt="Zoom" className="rounded-2xl max-w-full max-h-[85vh] object-contain shadow-2xl" />
            <button onClick={() => setSelectedImage(null)} className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black transition-colors cursor-pointer">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RekapAdmin;
