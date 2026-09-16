import React from "react";

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

const TimePickerInput = ({
  label,
  value = "",
  onChange,
  placeholder = "00:00",
  disabled = false,
  className = "",
  required = false,
}) => {
  const handleInputChange = (e) => {
    const inputVal = e.target.value;
    if (!inputVal) {
      onChange("");
      return;
    }

    // Hanya izinkan digit dan titik dua
    let val = inputVal.replace(/[^\d:]/g, "");

    const prevVal = value || "";
    const isDeletingColon = prevVal.endsWith(":") && !val.endsWith(":") && val.length === 2;
    const digitsOnly = val.replace(/\D/g, "");

    // Kasus paste panjang atau ketik lebih dari 2 digit tanpa titik dua
    if (val.length > 5 || (!val.includes(":") && digitsOnly.length > 2)) {
      const d4 = digitsOnly.slice(0, 4);
      let hh = parseInt(d4.slice(0, 2), 10) || 0;
      if (hh > 23) hh = 23;
      let mm = d4.length > 2 ? parseInt(d4.slice(2, 4), 10) || 0 : 0;
      if (mm > 59) mm = 59;
      onChange(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
      return;
    }

    // Format dengan titik dua (HH:mm)
    if (val.includes(":")) {
      const parts = val.split(":");
      let hhStr = parts[0].slice(0, 2);
      if (hhStr.length === 2 && parseInt(hhStr, 10) > 23) hhStr = "23";
      let mmStr = parts[1] ? parts[1].slice(0, 2) : "";
      if (mmStr.length === 2 && parseInt(mmStr, 10) > 59) mmStr = "59";
      onChange(`${hhStr}:${mmStr}`);
      return;
    }

    // Kasus user ketik 2 digit jam (HH) -> otomatis tambah :
    if (val.length === 2 && !isDeletingColon) {
      let hh = parseInt(val, 10);
      if (hh > 23) hh = 23;
      onChange(`${String(hh).padStart(2, "0")}:`);
      return;
    }

    // Kasus ketik digit ke-3 langsung
    if (val.length === 3 && !val.includes(":")) {
      let hh = parseInt(val.slice(0, 2), 10);
      if (hh > 23) hh = 23;
      const m1 = val.slice(2, 3);
      onChange(`${String(hh).padStart(2, "0")}:${m1}`);
      return;
    }

    if (val.length <= 5) {
      onChange(val);
    }
  };

  const handleBlur = () => {
    if (!value) return;
    onChange(sanitizeTime(value));
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    if (!paste) return;
    onChange(sanitizeTime(paste));
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={5}
        className="w-full bg-white border border-slate-200 text-sm font-semibold text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B] transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed tabular-nums"
      />
    </div>
  );
};

export default TimePickerInput;
