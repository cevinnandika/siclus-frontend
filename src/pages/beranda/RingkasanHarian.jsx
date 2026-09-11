import React from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';

const RingkasanHarian = ({ inspections = [], trips = [], currentShift, onResetAllLogs }) => {
  const latestTrip = trips[0];
  const latestInspection = inspections[0];
  const odometerStart = latestInspection?.odometer || "";
  const passengerCount = latestTrip?.passengers?.total || latestTrip?.passengers?.seated || 0;
  const departureTime = latestTrip?.departure || "";
  const arrivalTime = latestTrip?.arrival || "";
  const odometerDeparture = latestTrip?.odometerDeparture || "";
  const odometerArrival = latestTrip?.odometerArrival || "";

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-6">
      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-black text-[#00206B] m-0 tracking-wide uppercase">RINGKASAN LAPORAN HARIAN</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          {/* Card 1: Perjalanan Pagi */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-[#00206B] m-0 pb-2 border-b border-slate-100">Perjalanan Pagi</h3>

            {/* Start / Mulai Row */}
            <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-slate-400">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <rect x="4" y="3" width="16" height="15" rx="3" />
                  <line x1="4" y1="13" x2="20" y2="13" />
                  <circle cx="8" cy="9" r="1.5" fill="currentColor" />
                  <circle cx="16" cy="9" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <div className="flex-1 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">Mulai (Dishub)</span>
                <div className="text-right">
                  <span className="font-black text-[#00206B] block">05:30 WIB</span>
                  <span className="text-xs text-slate-400 font-semibold block mt-0.5">KM {odometerStart ? parseInt(odometerStart).toLocaleString("id-ID") : "-"}</span>
                </div>
              </div>
            </div>

            {/* Departure from Start Point */}
            <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-slate-400">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" fill="currentColor" />
                </svg>
              </div>
              <div className="flex-1 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">Berangkat dari Titik Start</span>
                <div className="text-right">
                  <span className="font-black text-[#00206B] block">{departureTime} WIB</span>
                  <span className="text-xs text-slate-400 font-semibold block mt-0.5">KM {odometerDeparture ? parseInt(odometerDeparture).toLocaleString("id-ID") : "-"}</span>
                </div>
              </div>
            </div>

            {/* End / Selesai Row */}
            <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-slate-400">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </div>
              <div className="flex-1 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">Selesai (Sekolah)</span>
                <div className="text-right">
                  <span className="font-black text-[#00206B] block">{arrivalTime} WIB</span>
                  <span className="text-xs text-slate-400 font-semibold block mt-0.5">KM {odometerArrival ? parseInt(odometerArrival).toLocaleString("id-ID") : "-"}</span>
                </div>
              </div>
            </div>

            {/* Total Passengers Row */}
            <div className="flex items-center justify-between pt-2 text-sm">
              <span className="font-bold text-slate-500">Total Penumpang</span>
              <span className="text-base font-black text-[#00206B]">{passengerCount} Siswa</span>
            </div>
          </div>

          {/* 🔥 BELAJAR DISINI: Card Perjalanan Siang beserta tombolnya 
              UDAH GUE BUMI HANGUSKAN DARI SINI BIAR HALAMANNYA BERSIH! 🧹 */}
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-4">
          {/* Complete Data Check Box */}
          <div className="bg-[#E6F7ED] border border-[#BCECD2] rounded-xl p-4 flex items-center gap-2 text-[#137333] shadow-sm">
            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            <span className="text-sm font-extrabold uppercase tracking-wide">Data Pagi Lengkap</span>
          </div>

          {/* Statistics */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <h4 className="text-sm font-extrabold text-[#00206B] mb-3">Statistik Hari Ini</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Perjalanan</span>
                <span className="font-bold text-[#00206B]">1/2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Siswa</span>
                <span className="font-bold text-[#00206B]">{passengerCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jarak Tempuh</span>
                <span className="font-bold text-[#00206B]">{odometerArrival && odometerStart ? (parseInt(odometerArrival) - parseInt(odometerStart)).toLocaleString("id-ID") + " KM" : "30 KM"}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => toast.success("Laporan harian berhasil disimpan ke server!")}
              className="w-full bg-[#00206B] hover:bg-[#00174E] text-white font-extrabold py-4 px-4 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              SIMPAN LAPORAN HARIAN
            </button>
            {inspections.length > 0 && (
              <button
                onClick={onResetAllLogs}
                className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Hapus Log Percobaan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RingkasanHarian;
