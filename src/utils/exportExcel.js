import ExcelJS from "exceljs";
import toast from "react-hot-toast";

/**
 * Helper download buffer file Excel yang aman all browser
 */
export const downloadExcelBuffer = (buffer, fileName) => {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });
  const cleanFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", cleanFileName);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    if (link.parentNode) link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 1000);
};

/**
 * Generator File Excel Rekapitulasi Ber-styling Resmi Dishub Kota Mojokerto
 */
const buildStyledRekapSheet = async (dataRows, titleInfo, fileName) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistem SICLUS - Dishub Kota Mojokerto";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Rekap_Operasional", {
    views: [{ showGridLines: true }],
  });

  // 1. KOP SURAT / JUDUL RESMI
  worksheet.mergeCells("A1:N1");
  const cellTitle = worksheet.getCell("A1");
  cellTitle.value = "LAPORAN REKAPITULASI OPERASIONAL ANGKUTAN SEKOLAH GRATIS";
  cellTitle.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF00206B" } };
  cellTitle.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 26;

  worksheet.mergeCells("A2:N2");
  const cellSub = worksheet.getCell("A2");
  cellSub.value = "DINAS PERHUBUNGAN KOTA MOJOKERTO";
  cellSub.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF334155" } };
  cellSub.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(2).height = 20;

  worksheet.mergeCells("A3:N3");
  const cellMeta = worksheet.getCell("A3");
  const tanggalCetak = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const jamCetak = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  cellMeta.value = `${titleInfo || "Semua Periode Tercatat"} • Dicetak pada: ${tanggalCetak} ${jamCetak} WIB`;
  cellMeta.font = { name: "Calibri", size: 9.5, italic: true, color: { argb: "FF64748B" } };
  cellMeta.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(3).height = 18;

  // Spacer row
  worksheet.getRow(4).height = 10;

  // 2. DEFINISI KOLOM RESMI DISHUB
  const headers = [
    { header: "NO", key: "no", width: 6 },
    { header: "TANGGAL", key: "tanggal", width: 14 },
    { header: "SESI", key: "sesi", width: 10 },
    { header: "TRAYEK", key: "trayek", width: 12 },
    { header: "NOPOL", key: "nopol", width: 16 },
    { header: "NAMA DRIVER", key: "driver", width: 26 },
    { header: "SISWA", key: "siswa", width: 12 },
    { header: "KAPASITAS", key: "kapasitas", width: 12 },
    { header: "LOAD FACTOR", key: "loadFactor", width: 14 },
    { header: "BERANGKAT DISHUB", key: "berangkatDishub", width: 18 },
    { header: "TIBA SEKOLAH", key: "tibaSekolah", width: 18 },
    { header: "KEMBALI DISHUB", key: "kembaliDishub", width: 18 },
    { header: "JARAK TEMPUH", key: "jarakTempuh", width: 16 },
    { header: "STATUS WAKTU", key: "status", width: 16 },
  ];

  const headerRowNumber = 5;
  const headerRow = worksheet.getRow(headerRowNumber);
  headerRow.values = headers.map((h) => h.header);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF00206B" }, // Biru Navy Dishub
    };
    cell.font = {
      name: "Calibri",
      size: 10,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "medium", color: { argb: "FF00174E" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });

  // 3. BARIS DATA PER SESI OPERASIONAL
  dataRows.forEach((row, index) => {
    const rowIndex = headerRowNumber + 1 + index;
    const isEven = index % 2 === 0;

    const rowData = [
      index + 1,
      row.tanggal || "-",
      row.sesiName || "-",
      row.trayek || "-",
      row.nopol || "-",
      row.driverNama || "-",
      row.siswaDisplay || "-",
      row.kapasitas ? `${row.kapasitas} Kursi` : "-",
      row.loadFactor || "-",
      row.cp1 !== "-" && row.cp1 !== undefined && row.cp1 !== null ? `${row.cp1} KM` : "-",
      row.cp2 !== "-" && row.cp2 !== undefined && row.cp2 !== null ? `${row.cp2} KM` : "-",
      row.cp3 !== "-" && row.cp3 !== undefined && row.cp3 !== null ? `${row.cp3} KM` : "-",
      row.jarakTempuh || "-",
      row.status || "-",
    ];

    const dataRow = worksheet.getRow(rowIndex);
    dataRow.values = rowData;
    dataRow.height = 22;

    const isTerlambat = String(row.status || "").toUpperCase().includes("TERLAMBAT");

    dataRow.eachCell((cell, colNumber) => {
      // Background Zebra
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isEven ? "FFFFFFFF" : "FFF8FAFC" },
      };

      // Font Dasar
      cell.font = {
        name: "Calibri",
        size: 9.5,
        color: { argb: "FF1E293B" },
      };

      // Borders Seluruh Sisi
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      // Alignment
      if (colNumber === 6) {
        // Nama Driver: Rata Kiri dengan indent
        cell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
      } else {
        // Data Operasional: Rata Tengah
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }

      // Format Khusus Status Waktu
      if (colNumber === 14) {
        cell.font = {
          name: "Calibri",
          size: 9.5,
          bold: true,
          color: { argb: isTerlambat ? "FFE11D48" : "FF059669" },
        };
      }
    });
  });

  // 4. SUMMARY ROW DI BAGIAN BAWAH
  const summaryRowIndex = headerRowNumber + 1 + dataRows.length;
  const summaryRow = worksheet.getRow(summaryRowIndex);
  summaryRow.height = 24;

  worksheet.mergeCells(`A${summaryRowIndex}:F${summaryRowIndex}`);
  const summaryLabel = worksheet.getCell(`A${summaryRowIndex}`);
  summaryLabel.value = `TOTAL KESELURUHAN (${dataRows.length} SESI OPERASIONAL)`;
  summaryLabel.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF00206B" } };
  summaryLabel.alignment = { horizontal: "center", vertical: "middle" };

  const totalSiswa = dataRows.reduce((acc, r) => acc + (Number(r.siswa) || 0), 0);
  const cellTotalSiswa = worksheet.getCell(`G${summaryRowIndex}`);
  cellTotalSiswa.value = `${totalSiswa} Siswa`;
  cellTotalSiswa.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF00206B" } };
  cellTotalSiswa.alignment = { horizontal: "center", vertical: "middle" };

  for (let c = 1; c <= headers.length; c++) {
    const cCell = summaryRow.getCell(c);
    cCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };
    cCell.border = {
      top: { style: "medium", color: { argb: "FF94A3B8" } },
      bottom: { style: "double", color: { argb: "FF00206B" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  }

  // 5. ATUR LEBAR KOLOM SESUAI ISI
  headers.forEach((h, idx) => {
    const col = worksheet.getColumn(idx + 1);
    let maxLen = h.header.length;
    dataRows.forEach((r) => {
      const vals = [
        String(r.tanggal || ""),
        String(r.sesiName || ""),
        String(r.trayek || ""),
        String(r.nopol || ""),
        String(r.driverNama || ""),
        String(r.siswaDisplay || ""),
        String(r.cp1 || ""),
        String(r.status || ""),
      ];
      vals.forEach((v) => {
        if (v && v.length > maxLen) maxLen = v.length;
      });
    });
    col.width = Math.max(h.width, maxLen + 3);
  });

  // Tulis buffer dan trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  downloadExcelBuffer(buffer, fileName);
};

/**
 * Export sessions for a single selected driver
 */
export const exportDriverSessionsToExcel = async (
  selectedDriver,
  generateSessionRows,
  startDate,
  endDate
) => {
  const riwayatList = selectedDriver?.riwayat || selectedDriver?.list_laporan;
  if (!selectedDriver || !riwayatList || riwayatList.length === 0) {
    toast.error("Tidak ada data laporan untuk driver ini!");
    return;
  }

  const sessionRows = [];
  riwayatList.forEach((lap) => {
    const rows = generateSessionRows(selectedDriver, lap);
    rows.forEach((r) => sessionRows.push(r));
  });

  if (sessionRows.length === 0) {
    toast.error("Tidak ada rincian sesi operasional!");
    return;
  }

  const namaSupir = selectedDriver.nama_lengkap || selectedDriver.nama_supir || "Driver";
  const cleanNama = namaSupir.replace(/[^a-zA-Z0-9_-]/g, "_");
  let namaFile = `Rekap_${cleanNama}`;
  let titleInfo = `Driver: ${namaSupir}`;
  if (startDate && endDate) {
    namaFile += `_${startDate}_sd_${endDate}`;
    titleInfo += ` • Periode: ${startDate} s/d ${endDate}`;
  } else if (startDate) {
    namaFile += `_sejak_${startDate}`;
    titleInfo += ` • Periode: Sejak ${startDate}`;
  }
  namaFile += ".xlsx";

  try {
    toast.loading("Menyiapkan dokumen Excel resmi...", { id: "excel-export" });
    await buildStyledRekapSheet(sessionRows, titleInfo, namaFile);
    toast.success(`Berhasil mengunduh rekap resmi untuk ${namaSupir}!`, { id: "excel-export" });
  } catch (err) {
    console.error("Gagal export excel:", err);
    toast.error("Gagal membuat file Excel: " + err.message, { id: "excel-export" });
  }
};

/**
 * Export sessions for all drivers in groupedData
 */
export const exportAllDriversToExcel = async (
  groupedData,
  generateSessionRows,
  startDate,
  endDate
) => {
  if (!groupedData || groupedData.length === 0) {
    toast.error("Tidak ada data untuk diexport!");
    return;
  }

  const allSessionRows = [];
  groupedData.forEach((driver) => {
    const riwayatList = driver.riwayat || driver.list_laporan;
    if (riwayatList && riwayatList.length > 0) {
      riwayatList.forEach((lap) => {
        const rows = generateSessionRows(driver, lap);
        rows.forEach((r) => allSessionRows.push(r));
      });
    }
  });

  if (allSessionRows.length === 0) {
    toast.error("Tidak ada detail laporan untuk diexport!");
    return;
  }

  let namaFile = "Rekap_Operasional_Semua_Driver";
  let titleInfo = "Seluruh Driver & Armada Terdaftar";
  if (startDate && endDate) {
    namaFile += `_${startDate}_sd_${endDate}`;
    titleInfo += ` • Periode: ${startDate} s/d ${endDate}`;
  } else if (startDate) {
    namaFile += `_sejak_${startDate}`;
    titleInfo += ` • Periode: Sejak ${startDate}`;
  }
  namaFile += ".xlsx";

  try {
    toast.loading("Menyiapkan dokumen Excel resmi Dishub...", { id: "excel-export" });
    await buildStyledRekapSheet(allSessionRows, titleInfo, namaFile);
    toast.success("Berhasil mengunduh rekap resmi semua driver!", { id: "excel-export" });
  } catch (err) {
    console.error("Gagal export excel:", err);
    toast.error("Gagal membuat file Excel: " + err.message, { id: "excel-export" });
  }
};

