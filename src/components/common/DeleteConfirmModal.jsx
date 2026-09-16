import React from "react";

const DeleteConfirmModal = ({
  isOpen,
  title = "Hapus Data?",
  description,
  countdown = 5,
  isSubmitting = false,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.15s]">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#00206B] m-0">{title}</h3>
          <p className="text-xs text-slate-500 font-normal mt-1">{description}</p>
        </div>

        {/* Indikator Hitung Mundur 5 Detik (Batal Otomatis) */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-2.5 flex items-center justify-between px-3.5 text-amber-800">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span className="text-[11px] font-semibold">Batal otomatis dalam:</span>
          </div>
          <span className="text-xs font-bold bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-lg tabular-nums">
            {countdown}s
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
          <div
            className="bg-amber-500 h-1 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / 5) * 100}%` }}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs uppercase cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs uppercase shadow-md cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
          >
            <span>{isSubmitting ? "Menghapus..." : "Ya, Hapus"}</span>
            {!isSubmitting && <span className="opacity-80 font-medium">({countdown}s)</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
