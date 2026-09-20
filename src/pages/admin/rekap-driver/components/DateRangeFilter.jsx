import React, { useState } from "react";
import { INDO_MONTHS, formatYMD, formatDateRangeDisplay } from "../../../../utils/dateUtils";

// ==============================================================================
// KOMPONEN: FILTER RENTANG TANGGAL (DATE RANGE PICKER & PRESETS KALENDER)
// ==============================================================================
const DateRangeFilter = ({ startDate = "", endDate = "", onApply, onClear }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [tempStart, setTempStart] = useState("");
  const [tempEnd, setTempEnd] = useState("");
  const [activePresetKey, setActivePresetKey] = useState("SEMUA");

  const firstDayOfWeek = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();

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
    onApply(tempStart, tempEnd || tempStart, activePresetKey);
    setShowDatePicker(false);
  };

  const handleApplyPreset = (preset) => {
    setActivePresetKey(preset);
    const today = new Date();

    if (preset === "SEMUA") {
      onClear();
      setShowDatePicker(false);
      return;
    }

    if (preset === "HARI_INI") {
      const todayStr = formatYMD(today);
      onApply(todayStr, todayStr, preset);
      setShowDatePicker(false);
      return;
    }

    if (preset === "7_HARI") {
      const past7 = new Date();
      past7.setDate(today.getDate() - 6);
      onApply(formatYMD(past7), formatYMD(today), preset);
      setShowDatePicker(false);
      return;
    }

    if (preset === "BULAN_INI") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      onApply(formatYMD(startOfMonth), formatYMD(endOfMonth), preset);
      setShowDatePicker(false);
    }
  };

  const handleClear = () => {
    setActivePresetKey("SEMUA");
    setTempStart("");
    setTempEnd("");
    onClear();
  };

  return (
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

      {/* Reset button jika ada filter aktif */}
      {(startDate || endDate) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClear();
          }}
          title="Reset ke Semua Tanggal"
          className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs cursor-pointer transition-transform hover:scale-110"
        >
          ✕
        </button>
      )}

      {/* Custom Calendar Popover */}
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
                      isSelected ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
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
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold shadow-2xs"
                        : isStart
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-l-lg font-bold shadow-2xs"
                          : isEnd
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-r-lg font-bold shadow-2xs"
                            : isInRange
                              ? "bg-blue-50 text-blue-700 font-semibold rounded-none"
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

            {/* Range Summary & Bottom Actions */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold text-slate-500 truncate max-w-[130px]">
                {tempStart ? formatDateRangeDisplay(tempStart, tempEnd || tempStart) : <span className="text-slate-400 italic">Pilih tanggal</span>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {(tempStart || tempEnd || startDate || endDate) && (
                  <button
                    type="button"
                    onClick={handleClear}
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
                    tempStart
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white cursor-pointer active:scale-95 shadow-blue-500/20"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
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
  );
};

export default DateRangeFilter;
