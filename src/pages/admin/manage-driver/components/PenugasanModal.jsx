import React from "react";
import TimePickerInput from "../../../../components/common/TimePickerInput";
import { INDO_MONTHS, getTodayDateStr, parseTanggal, getMaxDays } from "../../../../utils/dateUtils";

// ==============================================================================
// HELPER: FORMATTER OTOMATIS PLAT NOMOR KENDARAAN (STANDAR TNKB INDONESIA)
// ==============================================================================
const formatPlatNomor = (input) => {
  if (!input) return "";
  let raw = input
    .toUpperCase()
    .replace(/[-_]/g, " ")
    .replace(/[^A-Z0-9\s]/g, "");
  raw = raw.replace(/^[^A-Z]+/, "");
  if (!raw) return "";

  const hasTrailingSpace = input.endsWith(" ");
  const tokens = raw.trimStart().split(/\s+/);

  let p1 = "";
  let p2 = "";
  let p3 = "";

  if (tokens.length === 1) {
    const firstDigitIdx = tokens[0].search(/[0-9]/);
    if (firstDigitIdx !== -1) {
      p1 = tokens[0].slice(0, Math.min(firstDigitIdx, 2));
      const rest = tokens[0].slice(firstDigitIdx);
      const m = rest.match(/^([0-9]{1,4})([A-Z]{0,3})/);
      if (m) {
        p2 = m[1] || "";
        p3 = m[2] || "";
      }
    } else {
      p1 = tokens[0].slice(0, 2);
    }
  } else if (tokens.length === 2) {
    p1 = tokens[0].replace(/[^A-Z]/g, "").slice(0, 2);
    const rest = tokens[1];
    const m = rest.match(/^([0-9]{0,4})([A-Z]{0,3})/);
    if (m) {
      p2 = m[1] || "";
      p3 = m[2] || "";
    }
  } else {
    p1 = tokens[0].replace(/[^A-Z]/g, "").slice(0, 2);
    p2 = tokens[1].replace(/[^0-9]/g, "").slice(0, 4);
    p3 = tokens
      .slice(2)
      .join("")
      .replace(/[^A-Z]/g, "")
      .slice(0, 3);
  }

  let res = p1;
  if (p2) {
    res += " " + p2;
    if (p3) {
      res += " " + p3;
    } else if (hasTrailingSpace && tokens.length >= 2) {
      res += " ";
    }
  } else if (hasTrailingSpace && tokens.length >= 1) {
    res += " ";
  }

  return res;
};

// ==============================================================================
// KOMPONEN: MODAL PENUGASAN (FORM PENUGASAN ARMADA & JADWAL CUT-OFF OPERASIONAL)
// ==============================================================================
const PenugasanModal = ({ isOpen = false, isEdit = false, formPenugasan, setFormPenugasan, drivers = [], isSubmitting = false, onClose, onSubmit }) => {
  if (!isOpen) return null;

  const handleDatePartChange = (part, value) => {
    const current = parseTanggal(formPenugasan.tanggal);
    const updated = { ...current, [part]: value };

    const yNum = parseInt(updated.year, 10) || new Date().getFullYear();
    const mNum = parseInt(updated.month, 10) || 1;
    const maxDays = new Date(yNum, mNum, 0).getDate();

    let dNum = parseInt(updated.day, 10) || 1;
    if (dNum > maxDays) dNum = maxDays;
    const safeDay = String(dNum).padStart(2, "0");
    const safeMonth = String(mNum).padStart(2, "0");

    const newDateStr = `${yNum}-${safeMonth}-${safeDay}`;
    setFormPenugasan((prev) => ({ ...prev, tanggal: newDateStr }));
  };

  const handleNopolChange = (e) => {
    const formatted = formatPlatNomor(e.target.value);
    setFormPenugasan((prev) => ({ ...prev, nopol_kendaraan: formatted }));
  };

  const handleKapasitasChange = (e) => {
    let val = e.target.value;
    if (val === "") {
      setFormPenugasan((prev) => ({ ...prev, kapasitas_penumpang: "" }));
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 60) {
      setFormPenugasan((prev) => ({ ...prev, kapasitas_penumpang: num }));
    }
  };

  const currentTipeSesi = formPenugasan.tipe_sesi || "SEMUA";
  const pagiActive = currentTipeSesi === "PAGI" || currentTipeSesi === "SEMUA";
  const siangActive = currentTipeSesi === "SIANG" || currentTipeSesi === "SEMUA";

  const handleTogglePagi = () => {
    if (pagiActive && !siangActive) return; // Minimal 1 sesi aktif
    if (pagiActive) {
      setFormPenugasan((prev) => ({ ...prev, tipe_sesi: "SIANG" }));
    } else {
      setFormPenugasan((prev) => ({ ...prev, tipe_sesi: siangActive ? "SEMUA" : "PAGI" }));
    }
  };

  const handleToggleSiang = () => {
    if (siangActive && !pagiActive) return; // Minimal 1 sesi aktif
    if (siangActive) {
      setFormPenugasan((prev) => ({ ...prev, tipe_sesi: "PAGI" }));
    } else {
      setFormPenugasan((prev) => ({ ...prev, tipe_sesi: pagiActive ? "SEMUA" : "SIANG" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const parsedDate = parseTanggal(formPenugasan.tanggal);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s]">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider block">{isEdit ? "Perbarui Penugasan" : "Penugasan Kendaraan"}</span>
            <h3 className="text-xl font-bold text-[#00206B] m-0">{isEdit ? "Edit Penugasan & Jadwal" : "Tugaskan Kendaraan Baru"}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          {/* 1. Supir */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">PILIH SUPIR</label>
            <select
              required
              value={formPenugasan.id_supir}
              onChange={(e) => setFormPenugasan({ ...formPenugasan, id_supir: e.target.value })}
              className="w-full bg-white border border-slate-200 text-sm font-semibold text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B] cursor-pointer"
            >
              <option value="">-- Pilih Supir --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama_lengkap || d.nama || d.name} ({d.id})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Tanggal */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">TANGGAL PENUGASAN</label>
              <button
                type="button"
                onClick={() => setFormPenugasan((prev) => ({ ...prev, tanggal: getTodayDateStr() }))}
                className="text-xs font-semibold text-[#00206B] hover:text-blue-700 hover:underline cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200/80 transition-colors"
              >
                Hari Ini
              </button>
            </div>

            <div className="grid grid-cols-12 gap-2">
              {/* Hari */}
              <div className="col-span-3">
                <select
                  value={parsedDate.day}
                  onChange={(e) => handleDatePartChange("day", e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 rounded-xl px-2 py-2.5 outline-none focus:border-[#00206B] cursor-pointer tabular-nums"
                >
                  {Array.from({ length: getMaxDays(formPenugasan.tanggal) }, (_, i) => {
                    const val = String(i + 1).padStart(2, "0");
                    return (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Bulan */}
              <div className="col-span-5">
                <select
                  value={parsedDate.month}
                  onChange={(e) => handleDatePartChange("month", e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 rounded-xl px-2 py-2.5 outline-none focus:border-[#00206B] cursor-pointer truncate"
                >
                  {INDO_MONTHS.map((bln, idx) => {
                    const val = String(idx + 1).padStart(2, "0");
                    return (
                      <option key={val} value={val}>
                        {bln}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Tahun */}
              <div className="col-span-4">
                <select
                  value={parsedDate.year}
                  onChange={(e) => handleDatePartChange("year", e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 rounded-xl px-2 py-2.5 outline-none focus:border-[#00206B] cursor-pointer tabular-nums"
                >
                  {[2025, 2026, 2027, 2028].map((yr) => (
                    <option key={yr} value={String(yr)}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Trayek */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">TRAYEK RUTE</label>
            <input
              type="text"
              required
              autoComplete="off"
              value={formPenugasan.trayek}
              onChange={(e) => setFormPenugasan({ ...formPenugasan, trayek: e.target.value.toUpperCase() })}
              placeholder="Masukan Trayek"
              className="w-full bg-white border border-slate-200 text-sm font-semibold text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B] uppercase"
            />
          </div>

          {/* 4. Kendaraan & Kapasitas */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">PLAT KENDARAAN</label>
              <input
                type="text"
                required
                autoComplete="off"
                value={formPenugasan.nopol_kendaraan}
                onChange={handleNopolChange}
                placeholder="W 7689 NBH"
                maxLength={11}
                title="Format TNKB Indonesia: 1-2 huruf depan, 1-4 angka, 1-3 huruf belakang (Contoh: W 7689 NBH)"
                className="w-full bg-white border border-slate-200 text-sm font-semibold text-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-[#00206B] uppercase tracking-wider placeholder:normal-case placeholder:font-normal placeholder:text-slate-300 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">NAMA KENDARAAN</label>
              <input
                type="text"
                required
                autoComplete="off"
                value={formPenugasan.jenis_kendaraan}
                onChange={(e) => setFormPenugasan({ ...formPenugasan, jenis_kendaraan: e.target.value.toUpperCase() })}
                placeholder="Avanza"
                className="w-full bg-white border border-slate-200 text-sm font-semibold text-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-[#00206B] uppercase"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">KAPASITAS KENDARAAN</label>
              <input
                type="number"
                min="1"
                max="60"
                required
                autoComplete="off"
                value={formPenugasan.kapasitas_penumpang}
                onChange={handleKapasitasChange}
                placeholder="Max 60"
                className="w-full bg-white border border-slate-200 text-sm font-semibold text-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-[#00206B] tabular-nums"
              />
            </div>
          </div>

          {/* 5. Jam Sesi Pagi */}
          <div className="pt-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={pagiActive} onChange={handleTogglePagi} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                <span className={`text-xs font-bold uppercase tracking-wider ${pagiActive ? "text-[#00206B]" : "text-slate-400 line-through"}`}>Sesi Pagi (Penjemputan)</span>
              </label>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${pagiActive ? "bg-amber-50 text-amber-700 border border-amber-200/60" : "bg-slate-100 text-slate-400"}`}>
                {pagiActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <div className="w-full h-[1px] bg-slate-200 mt-1.5 mb-3"></div>

            {pagiActive ? (
              <div className="grid grid-cols-3 gap-3 animate-[fadeIn_0.2s]">
                <TimePickerInput label="JAM BUKA FORMULIR" value={formPenugasan.jam_pengisian_pagi} onChange={(val) => setFormPenugasan((p) => ({ ...p, jam_pengisian_pagi: val }))} />
                <TimePickerInput label="JAM BATAS KELUAR" value={formPenugasan.batas_keluar_pagi} onChange={(val) => setFormPenugasan((p) => ({ ...p, batas_keluar_pagi: val }))} />
                <TimePickerInput label="JAM BATAS KEMBALI" value={formPenugasan.batas_kembali_pagi} onChange={(val) => setFormPenugasan((p) => ({ ...p, batas_kembali_pagi: val }))} />
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-1">Sesi Pagi dilewati (driver tidak bertugas pada rute penjemputan pagi).</p>
            )}
          </div>

          {/* 6. Jam Sesi Siang */}
          <div className="pt-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={siangActive} onChange={handleToggleSiang} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                <span className={`text-xs font-bold uppercase tracking-wider ${siangActive ? "text-[#00206B]" : "text-slate-400 line-through"}`}>Sesi Siang (Pengantaran)</span>
              </label>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${siangActive ? "bg-blue-50 text-blue-700 border border-blue-200/60" : "bg-slate-100 text-slate-400"}`}>
                {siangActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <div className="w-full h-[1px] bg-slate-200 mt-1.5 mb-3"></div>

            {siangActive ? (
              <div className="grid grid-cols-3 gap-3 animate-[fadeIn_0.2s]">
                <TimePickerInput label="JAM BUKA FORMULIR" value={formPenugasan.jam_pengisian_siang} onChange={(val) => setFormPenugasan((p) => ({ ...p, jam_pengisian_siang: val }))} />
                <TimePickerInput label="JAM BATAS KELUAR" value={formPenugasan.batas_keluar_siang} onChange={(val) => setFormPenugasan((p) => ({ ...p, batas_keluar_siang: val }))} />
                <TimePickerInput label="JAM BATAS KEMBALI" value={formPenugasan.batas_kembali_siang} onChange={(val) => setFormPenugasan((p) => ({ ...p, batas_kembali_siang: val }))} />
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-1">Sesi Siang dilewati (driver tidak bertugas pada rute kepulangan siang).</p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#00206B] hover:bg-[#001850] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-900/10 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting ? "MENYIMPAN..." : isEdit ? "SIMPAN PERUBAHAN" : "SIMPAN PENUGASAN"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PenugasanModal;
