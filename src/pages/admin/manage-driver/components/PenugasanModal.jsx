import React from "react";
import TimePickerInput from "../../../../components/common/TimePickerInput";
import {
  INDO_MONTHS,
  getTodayDateStr,
  parseTanggal,
  getMaxDays,
} from "../../../../utils/dateUtils";

const PenugasanModal = ({
  isOpen = false,
  isEdit = false,
  formPenugasan,
  setFormPenugasan,
  drivers = [],
  isSubmitting = false,
  onClose,
  onSubmit,
}) => {
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
    let val = e.target.value.toUpperCase();
    val = val.replace(/[^A-Z0-9\s]/g, "");
    setFormPenugasan((prev) => ({ ...prev, nopol_kendaraan: val }));
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
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">
              {isEdit ? "Perbarui Penugasan" : "Penugasan Armada"}
            </span>
            <h3 className="text-xl font-extrabold text-[#00206B] m-0">
              {isEdit ? "Edit Penugasan & Jadwal" : "Tugaskan Armada Baru"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          {/* 1. Supir */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Pilih Supir
            </label>
            <select
              required
              value={formPenugasan.id_supir}
              onChange={(e) => setFormPenugasan({ ...formPenugasan, id_supir: e.target.value })}
              className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B] cursor-pointer"
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Tanggal
              </label>
              <button
                type="button"
                onClick={() => setFormPenugasan((prev) => ({ ...prev, tanggal: getTodayDateStr() }))}
                className="text-[10px] font-bold text-[#00206B] hover:text-blue-700 hover:underline cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md border border-slate-200/80 transition-colors"
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
                  className="w-full bg-white border border-slate-200 text-xs sm:text-sm font-bold text-[#00206B] rounded-xl px-2 py-2.5 outline-none focus:border-[#00206B] cursor-pointer"
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
                  className="w-full bg-white border border-slate-200 text-xs sm:text-sm font-bold text-[#00206B] rounded-xl px-2 py-2.5 outline-none focus:border-[#00206B] cursor-pointer truncate"
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
                  className="w-full bg-white border border-slate-200 text-xs sm:text-sm font-bold text-[#00206B] rounded-xl px-2 py-2.5 outline-none focus:border-[#00206B] cursor-pointer"
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
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Trayek Rute
            </label>
            <input
              type="text"
              required
              autoComplete="off"
              value={formPenugasan.trayek}
              onChange={(e) => setFormPenugasan({ ...formPenugasan, trayek: e.target.value.toUpperCase() })}
              placeholder="Contoh: T07 / KAMPUS - TERMINAL"
              className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B] uppercase"
            />
          </div>

          {/* 4. Kendaraan & Kapasitas */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Nopol Bus
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                value={formPenugasan.nopol_kendaraan}
                onChange={handleNopolChange}
                placeholder="W 7689 NBH"
                className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-3 py-2.5 outline-none focus:border-[#00206B] uppercase"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Jenis Mobil
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                value={formPenugasan.jenis_kendaraan}
                onChange={(e) => setFormPenugasan({ ...formPenugasan, jenis_kendaraan: e.target.value.toUpperCase() })}
                placeholder="AVANZA / HIACE"
                className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-3 py-2.5 outline-none focus:border-[#00206B] uppercase"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Kapasitas
              </label>
              <input
                type="number"
                min="1"
                max="60"
                required
                autoComplete="off"
                value={formPenugasan.kapasitas_penumpang}
                onChange={handleKapasitasChange}
                placeholder="Max 60"
                className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-3 py-2.5 outline-none focus:border-[#00206B]"
              />
            </div>
          </div>

          {/* 5. Jam Sesi Pagi */}
          <div className="pt-2">
            <span className="text-[10px] font-bold text-[#00206B] uppercase tracking-widest">
              Toleransi Sesi Pagi (Penjemputan)
            </span>
            <div className="w-full h-[1px] bg-slate-200 mt-1 mb-3"></div>

            <div className="grid grid-cols-3 gap-3">
              <TimePickerInput
                label="Buka Formulir"
                value={formPenugasan.jam_pengisian_pagi}
                onChange={(val) => setFormPenugasan((p) => ({ ...p, jam_pengisian_pagi: val }))}
              />
              <TimePickerInput
                label="Batas Keluar"
                value={formPenugasan.batas_keluar_pagi}
                onChange={(val) => setFormPenugasan((p) => ({ ...p, batas_keluar_pagi: val }))}
              />
              <TimePickerInput
                label="Batas Kembali"
                value={formPenugasan.batas_kembali_pagi}
                onChange={(val) => setFormPenugasan((p) => ({ ...p, batas_kembali_pagi: val }))}
              />
            </div>
          </div>

          {/* 6. Jam Sesi Siang */}
          <div className="pt-2">
            <span className="text-[10px] font-bold text-[#00206B] uppercase tracking-widest">
              Toleransi Sesi Siang (Pengantaran)
            </span>
            <div className="w-full h-[1px] bg-slate-200 mt-1 mb-3"></div>

            <div className="grid grid-cols-3 gap-3">
              <TimePickerInput
                label="Buka Formulir"
                value={formPenugasan.jam_pengisian_siang}
                onChange={(val) => setFormPenugasan((p) => ({ ...p, jam_pengisian_siang: val }))}
              />
              <TimePickerInput
                label="Batas Keluar"
                value={formPenugasan.batas_keluar_siang}
                onChange={(val) => setFormPenugasan((p) => ({ ...p, batas_keluar_siang: val }))}
              />
              <TimePickerInput
                label="Batas Kembali"
                value={formPenugasan.batas_kembali_siang}
                onChange={(val) => setFormPenugasan((p) => ({ ...p, batas_kembali_siang: val }))}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-[#00206B] hover:bg-[#00174E] text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Penugasan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PenugasanModal;
