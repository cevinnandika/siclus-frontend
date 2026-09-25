import React from "react";

// ==============================================================================
// KOMPONEN: MODAL PEMBATALAN SISA OPERASIONAL PENUGASAN SUPIR
// ==============================================================================
const BatalOperasionalModal = ({
  isOpen,
  penugasan,
  isSubmitting = false,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !penugasan) return null;

  const driverName =
    penugasan.users?.nama ||
    penugasan.users?.nama_lengkap ||
    penugasan.id_supir ||
    "Driver";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-[fadeIn_0.15s]">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-left space-y-5">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#00206B] m-0 tracking-tight">
              Batalkan Operasional Hari Ini?
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Hentikan penugasan operasional berjalan secara aman
            </p>
          </div>
        </div>

        {/* Info Box Penugasan */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Supir</span>
            <span className="font-bold text-[#00206B] uppercase">{driverName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Tanggal Operasional</span>
            <span className="font-semibold text-slate-700">{penugasan.tanggal}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Trayek / Nopol</span>
            <span className="font-semibold text-slate-700">
              {penugasan.trayek || "-"} • {penugasan.nopol_kendaraan || "-"}
            </span>
          </div>
        </div>

        {/* Jaminan Keamanan Data (Dishub SPJ) */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 space-y-1.5 text-xs text-blue-900">
          <div className="flex items-center gap-2 font-bold text-blue-950">
            <svg
              className="w-4 h-4 text-blue-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            <span>Perlindungan Data Laporan & SPJ</span>
          </div>
          <p className="text-[11px] leading-relaxed text-blue-800">
            Laporan perjalanan atau checklist inspeksi yang <strong>telah dikirim supir tidak akan terhapus</strong>. 
            Sisa sesi akan ditutup dan status driver akan dialihkan menjadi <strong>Selesai Operasional & Siaga</strong>.
          </p>
        </div>

        {/* Tombol Aksi */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-colors disabled:opacity-50"
          >
            BATAL
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all shadow-md shadow-amber-500/25 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="w-4 h-4 text-white animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                MEMPROSES...
              </>
            ) : (
              "YA, BATALKAN SISA SESI"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatalOperasionalModal;
