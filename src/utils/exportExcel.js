import * as XLSX from "xlsx";
import toast from "react-hot-toast";

/**
 * Helper download file Excel yang aman di semua browser (Chrome, Edge, Firefox)
 * Menghindari issue Chromium yang menamai file dengan raw UUID blob tanpa ekstensi
 */
export const saveWorkbookAsExcel = (workbook, fileName) => {
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

    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    }, 1000);
  } catch (err) {
    console.error("Gagal mengunduh file Excel:", err);
    XLSX.writeFile(workbook, fileName);
  }
};

/**
 * Helper row format for Excel export matching Dishub's exact per-session layout
 */
export const generateExcelRow = (row) => ({
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

/**
 * Standard column width definition for Dishub Excel export
 */
export const excelColumnWidths = [
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

/**
 * Export sessions for a single selected driver
 */
export const exportDriverSessionsToExcel = (selectedDriver, generateSessionRows, startDate, endDate) => {
  const riwayatList = selectedDriver?.riwayat || selectedDriver?.list_laporan;
  if (!selectedDriver || !riwayatList || riwayatList.length === 0) {
    toast.error("Tidak ada data laporan untuk driver ini!");
    return;
  }

  const excelData = [];
  riwayatList.forEach((lap) => {
    const sessionRows = generateSessionRows(selectedDriver, lap);
    sessionRows.forEach((row) => {
      excelData.push(generateExcelRow(row));
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  worksheet["!cols"] = excelColumnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap_Sesi_Dishub");

  const namaSupir = selectedDriver.nama_lengkap || selectedDriver.nama_supir || "Driver";
  const cleanNama = namaSupir.replace(/[^a-zA-Z0-9_-]/g, "_");
  let namaFile = `Rekap_${cleanNama}`;
  if (startDate && endDate) namaFile += `_${startDate}_to_${endDate}`;
  else if (startDate) namaFile += `_sejak_${startDate}`;
  namaFile += ".xlsx";

  saveWorkbookAsExcel(workbook, namaFile);
  toast.success(`Berhasil mengunduh rekap per sesi untuk ${namaSupir}!`);
};

/**
 * Export sessions for all drivers in groupedData
 */
export const exportAllDriversToExcel = (groupedData, generateSessionRows, startDate, endDate) => {
  if (!groupedData || groupedData.length === 0) {
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
  worksheet["!cols"] = excelColumnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap_Semua_Sesi");

  let namaFile = "Rekap_Semua_Driver";
  if (startDate && endDate) namaFile += `_${startDate}_to_${endDate}`;
  else if (startDate) namaFile += `_sejak_${startDate}`;
  namaFile += ".xlsx";

  saveWorkbookAsExcel(workbook, namaFile);
  toast.success("Berhasil mengunduh rekap semua driver!");
};
