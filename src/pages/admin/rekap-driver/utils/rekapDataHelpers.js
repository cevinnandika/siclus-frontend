export const resolveSessionStatus = (sesi) => {
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

export const formatSessionName = (tipe, index = 0) => {
  if (!tipe) return index === 0 ? "Pagi" : index === 1 ? "Siang" : `Sesi ${index + 1}`;
  const str = String(tipe).trim();
  const lower = str.toLowerCase();
  if (lower.includes("pagi") || lower === "1") return "Pagi";
  if (lower.includes("siang") || lower === "2") return "Siang";
  if (lower.includes("sore") || lower === "3") return "Sore";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const sortSessions = (sessions) => {
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

export const calculateJarakTempuh = (cp1, cp3, legacyCp) => {
  const km1 = Number(cp1) || 0;
  const km3 = Number(cp3) || Number(legacyCp) || 0;
  if (km3 > 0 && km1 > 0 && km3 >= km1) {
    return `${km3 - km1} KM`;
  }
  return "-";
};

export const generateSessionRows = (driver, lap) => {
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

    // Normalisasi CP1 (Berangkat Dishub), CP2 (Tiba Rute), CP3 (Kembali Dishub)
    const cp1Raw = sesi.km_berangkat_kantor ?? sesi.cp1_km ?? (idx === 0 ? lap.odo_awal : null);
    const cp2Raw = sesi.km_tiba_finish ?? sesi.cp2_km ?? (idx === 0 ? lap.odo_dishub : null);
    const cp3Raw = sesi.km_tiba_kantor ?? sesi.cp3_km ?? (idx === 0 ? lap.odo_akhir : null);

    const cp1Display = cp1Raw !== null && cp1Raw !== undefined && cp1Raw !== "" ? cp1Raw : "-";
    const cp2Display = cp2Raw !== null && cp2Raw !== undefined && cp2Raw !== "" ? cp2Raw : "-";
    const cp3Display = cp3Raw !== null && cp3Raw !== undefined && cp3Raw !== "" ? cp3Raw : "-";

    const jarakTempuh = calculateJarakTempuh(cp1Raw, cp3Raw);
    const status = resolveSessionStatus(sesi);

    const jam1 = sesi.jam_berangkat_kantor || sesi.cp1_time || null;
    const jam2 = sesi.jam_tiba_finish || sesi.cp2_time || null;
    const jam3 = sesi.jam_tiba_kantor || sesi.cp3_time || null;
    const foto1 = sesi.foto_awal || null;
    const foto3 = sesi.foto_akhir || null;

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
      cp2: cp2Display,
      cp3: cp3Display,
      jarakTempuh,
      status,
      jamCP1: jam1,
      jamCP2: jam2,
      jamCP3: jam3,
      fotoCP1: foto1,
      fotoCP2: null,
      fotoCP3: foto3,
    };
  });
};

export const groupRekapData = (rawData = [], startDate = "", endDate = "", searchQuery = "") => {
  // 1. Filter rentang kalender
  const filtered = rawData.filter((item) => {
    const itemDateStr = item.tanggal
      ? (item.tanggal.includes("T") ? item.tanggal.split("T")[0] : item.tanggal)
      : item.created_at
      ? item.created_at.split("T")[0]
      : "";

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

  // 2. Grouping per supir
  const groups = filtered.reduce((acc, curr) => {
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

    const isNonaktif =
      String(curr.users?.role || "").toLowerCase() === "nonaktif" ||
      String(curr.role || "").toLowerCase() === "nonaktif";

    if (!acc[supirId]) {
      acc[supirId] = {
        id_supir: supirId,
        nama_supir: driverName,
        nama_lengkap: driverName,
        foto_profil: driverPhoto,
        is_nonaktif: isNonaktif,
        trayek_utama: curr.trayek || curr.users?.trayek || "-",
        bus_utama: curr.bus || curr.users?.bus || "-",
        total_hari_jalan: 0,
        total_penumpang: 0,
        total_telat: 0,
        total_tepat: 0,
        list_laporan: [],
        riwayat: [],
      };
    } else {
      if (!acc[supirId].foto_profil && driverPhoto) {
        acc[supirId].foto_profil = driverPhoto;
      }
      if (isNonaktif) {
        acc[supirId].is_nonaktif = true;
      }
    }

    acc[supirId].total_hari_jalan += 1;

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
};

export const formatCompactNumber = (num) => {
  if (num === null || num === undefined) return "0";
  const n = Number(num);
  if (isNaN(n)) return "0";
  if (n >= 1e12) {
    return (n / 1e12).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " T";
  }
  if (n >= 1e9) {
    return (n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " M";
  }
  if (n >= 1e6) {
    return (n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " Jt";
  }
  return n.toLocaleString("id-ID");
};
