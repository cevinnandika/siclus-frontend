export const INDO_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const INDO_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export const formatYMD = (d) => {
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTodayDateStr = () => {
  return formatYMD(new Date());
};

export const parseTanggal = (dateStr) => {
  const fallback = getTodayDateStr();
  const target = dateStr && dateStr.includes("-") ? dateStr : fallback;
  const parts = target.split("-");
  return {
    year: parts[0] || String(new Date().getFullYear()),
    month: parts[1] ? String(parts[1]).padStart(2, "0") : "01",
    day: parts[2] ? String(parts[2]).padStart(2, "0") : "01",
  };
};

export const getMaxDays = (dateStr) => {
  const parsed = parseTanggal(dateStr);
  const y = parseInt(parsed.year, 10) || new Date().getFullYear();
  const m = parseInt(parsed.month, 10) || 1;
  return new Date(y, m, 0).getDate();
};

export const formatDateRangeDisplay = (start, end) => {
  if (!start && !end) return "Semua Tanggal";

  const formatShort = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const month = INDO_MONTHS_SHORT[parseInt(parts[1], 10) - 1] || parts[1];
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

export const formatTime = (timeString) => {
  if (!timeString) return "-";
  try {
    const d = new Date(timeString);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }
    return timeString;
  } catch {
    return timeString;
  }
};

export const sanitizeTime = (t) => {
  if (!t || typeof t !== "string") return "00:00";
  const digits = t.replace(/\D/g, "");
  if (digits.length === 0) return "00:00";
  let hh = parseInt(digits.slice(0, 2) || "0", 10);
  if (isNaN(hh) || hh < 0) hh = 0;
  if (hh > 23) hh = 23;
  let mm = digits.length > 2 ? parseInt(digits.slice(2, 4) || "0", 10) : 0;
  if (isNaN(mm) || mm < 0) mm = 0;
  if (mm > 59) mm = 59;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};
