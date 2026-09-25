import React, { useState, useEffect } from "react";

// ==============================================================================
// KOMPONEN: MODAL HAPUS DRIVER (KONFIRMASI KREDENSIAL ADMINISTRATOR)
// ==============================================================================
const DeleteDriverModal = ({ isOpen, driver, currentAdminEmail = "", isSubmitting = false, onClose, onConfirm }) => {
  const [emailAdmin, setEmailAdmin] = useState("");
  const [passwordAdmin, setPasswordAdmin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Reset & inisialisasi state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setEmailAdmin(currentAdminEmail || "");
      setPasswordAdmin("");
      setShowPassword(false);
      setErrorMessage("");
    }
  }, [isOpen, currentAdminEmail]);

  if (!isOpen || !driver) return null;

  const driverName = driver.nama_lengkap || driver.nama || driver.name || "Driver";
  const driverId = driver.id || driver.id_driver || driver.id_supir || "-";
  const initials = driverName.charAt(0).toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!emailAdmin.trim()) {
      setErrorMessage("Email administrator wajib diisi.");
      return;
    }

    if (!passwordAdmin) {
      setErrorMessage("Password administrator wajib diisi untuk verifikasi keamanan.");
      return;
    }

    try {
      await onConfirm({
        email_admin: emailAdmin.trim(),
        password_admin: passwordAdmin,
      });
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((d) => d.msg).join(", ") : "Gagal memverifikasi kredensial admin.";
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-[fadeIn_0.15s]">
      <div className="bg-white rounded-3xl p-6 md:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-[scaleIn_0.15s]" onClick={(e) => e.stopPropagation()}>
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-[#00206B] tracking-tight">Hapus Akun Driver?</h3>
          <p className="text-xs text-slate-500 font-normal">Tindakan ini bersifat permanen. Seluruh data akun & akses supir akan dicabut dari sistem.</p>
        </div>

        {/* Driver Card Info */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-100/70 border border-rose-200/80 text-rose-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {driver.foto_profil ? (
              <img
                src={driver.foto_profil}
                alt={driverName}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement.innerText = initials;
                }}
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-bold text-xs text-[#00206B] uppercase tracking-tight block truncate">{driverName}</span>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
              <span className="inline-block font-semibold px-1.5 py-0.2 rounded-md bg-white border border-slate-200/80 text-slate-700">{driverId}</span>
              <span className="truncate">{driver.email || "Tanpa email"}</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-amber-900 text-xs">
          <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <div className="leading-snug">
            <span className="font-bold block">Verifikasi Keamanan Administrator</span>
            <span className="text-[11px] text-amber-800">Demi mencegah kesalahan fatal, masukkan kredensial akun administrator Anda.</span>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email Admin */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">EMAIL ADMINISTRATOR</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <input
                type="email"
                value={emailAdmin}
                onChange={(e) => setEmailAdmin(e.target.value)}
                placeholder="admin@dishub.go.id"
                disabled={isSubmitting}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00206B] focus:bg-white transition-all font-medium disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password Admin */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">PASSWORD ADMINISTRATOR</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={passwordAdmin}
                onChange={(e) => setPasswordAdmin(e.target.value)}
                placeholder="Ketik password admin Anda"
                disabled={isSubmitting}
                autoFocus
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00206B] focus:bg-white transition-all font-medium disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-start gap-2 animate-[fadeIn_0.15s]">
              <svg className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-colors disabled:opacity-50"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !passwordAdmin || !emailAdmin.trim()}
              className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>MEMVALIDASI...</span>
                </>
              ) : (
                <span>KONFIRMASI HAPUS</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteDriverModal;
