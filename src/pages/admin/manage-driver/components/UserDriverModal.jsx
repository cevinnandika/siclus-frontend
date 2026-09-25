import React, { useState, useEffect } from "react";

// ==============================================================================
// KOMPONEN: MODAL AKUN DRIVER (FORM PENDAFTARAN & PERUBAHAN DATA PENGEMUDI)
// ==============================================================================
const UserDriverModal = ({ isOpen = false, isEdit = false, initialData = null, drivers = [], isSubmitting = false, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    id_driver: "DRV-",
    nama_lengkap: "",
    email: "",
    password: "",
    password_admin: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialData) {
        setFormData({
          id_driver: initialData.id_driver || initialData.id || initialData.id_supir || "",
          nama_lengkap: initialData.nama_lengkap || initialData.nama || initialData.name || "",
          email: initialData.email || "",
          password: "",
          password_admin: "",
        });
      } else {
        setFormData({
          id_driver: "DRV-",
          nama_lengkap: "",
          email: "",
          password: "",
          password_admin: "",
        });
      }
      setShowPassword(false);
      setShowAdminPassword(false);
    }
  }, [isOpen, isEdit, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIdDriverChange = (e) => {
    let val = e.target.value.toUpperCase();
    if (!val.startsWith("DRV-")) {
      const rest = val.replace(/^DRV-?/i, "").replace(/^D?R?V?-?/i, "");
      val = "DRV-" + rest;
    }
    setFormData((prev) => ({ ...prev, id_driver: val }));
  };

  // Duplicate checks
  const editTargetId = initialData?.id || initialData?._id || initialData?.id_supir || formData.id_driver;

  const duplicateAddId = !isEdit && (formData.id_driver || "").trim().length > 4 && drivers.find((d) => (d.id || d.id_driver || "").toUpperCase() === (formData.id_driver || "").trim().toUpperCase());

  const duplicateAddName =
    !isEdit &&
    (formData.nama_lengkap || "").trim().length > 1 &&
    drivers.find((d) => (d.nama || d.nama_lengkap || d.name || "").trim().toLowerCase() === (formData.nama_lengkap || "").trim().toLowerCase());

  const duplicateAddEmail = !isEdit && (formData.email || "").trim().length > 3 && drivers.find((d) => (d.email || "").trim().toLowerCase() === (formData.email || "").trim().toLowerCase());

  const duplicateEditName =
    isEdit &&
    (formData.nama_lengkap || "").trim().length > 1 &&
    drivers.find((d) => (d.id || d.id_driver) !== editTargetId && (d.nama || d.nama_lengkap || d.name || "").trim().toLowerCase() === (formData.nama_lengkap || "").trim().toLowerCase());

  const duplicateEditEmail =
    isEdit &&
    (formData.email || "").trim().length > 3 &&
    drivers.find((d) => (d.id || d.id_driver) !== editTargetId && (d.email || "").trim().toLowerCase() === (formData.email || "").trim().toLowerCase());

  // Validasi domain resmi @siclus.id
  const emailVal = (formData.email || "").trim().toLowerCase();
  const isInvalidEmailDomain = emailVal.length > 0 && !emailVal.endsWith("@siclus.id");

  const hasValidationError = isEdit
    ? Boolean(duplicateEditName) || Boolean(duplicateEditEmail) || isInvalidEmailDomain
    : Boolean(duplicateAddId) || Boolean(duplicateAddName) || Boolean(duplicateAddEmail) || isInvalidEmailDomain;

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (hasValidationError) return;
    if (isEdit && !formData.password_admin?.trim()) return;
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s]">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider block">{isEdit ? "Perbarui Driver" : "Registrasi Driver"}</span>
            <h3 className="text-xl font-bold text-[#00206B] m-0">{isEdit ? "Edit Data Driver" : "Tambah Driver Baru"}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-4" autoComplete="off">
          {/* Trap anti-autofill browser */}
          <div className="sr-only opacity-0 h-0 w-0 absolute -z-10 overflow-hidden" aria-hidden="true">
            <input type="text" name="fake_driver_modal_user" tabIndex="-1" autoComplete="username" />
            <input type="password" name="fake_driver_modal_pwd" tabIndex="-1" autoComplete="current-password" />
          </div>

          <div>
            <span className="text-xs font-bold text-[#00206B] uppercase tracking-wider">DATA AKUN LOGIN</span>
            <div className="w-full h-[1px] bg-slate-200 mt-1 mb-3"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ID Driver */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">ID DRIVER</label>
              <input
                type="text"
                name="id_driver"
                disabled={isEdit}
                required={!isEdit}
                value={formData.id_driver}
                onChange={handleIdDriverChange}
                placeholder="DRV-..."
                className={`w-full border text-sm font-semibold text-[#00206B] rounded-xl px-4 py-2.5 outline-none transition-colors ${
                  isEdit
                    ? "bg-slate-100 border-slate-200 opacity-70 cursor-not-allowed"
                    : duplicateAddId
                      ? "bg-rose-50/20 border-rose-400 focus:border-rose-500"
                      : "bg-white border-slate-200 focus:border-[#00206B]"
                }`}
              />
              {duplicateAddId && (
                <p className="text-[10px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                  <span>⚠️ ID sudah terdaftar</span>
                </p>
              )}
            </div>

            {/* Nama Lengkap */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">NAMA LENGKAP</label>
              <input
                type="text"
                name="nama_lengkap"
                required
                value={formData.nama_lengkap}
                onChange={handleChange}
                placeholder=""
                className={`w-full bg-white border text-sm font-semibold text-[#00206B] rounded-xl px-4 py-2.5 outline-none transition-colors ${
                  (isEdit ? duplicateEditName : duplicateAddName) ? "border-rose-400 bg-rose-50/20 focus:border-rose-500" : "border-slate-200 focus:border-[#00206B]"
                }`}
              />
              {(isEdit ? duplicateEditName : duplicateAddName) && (
                <p className="text-[10px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                  <span>⚠️ Nama sudah terdaftar</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">EMAIL AKUN DRIVER</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="nama@siclus.id"
                className={`w-full bg-white border text-sm font-semibold text-[#00206B] rounded-xl px-4 py-2.5 outline-none transition-colors ${
                  (isEdit ? duplicateEditEmail : duplicateAddEmail) || isInvalidEmailDomain ? "border-rose-400 bg-rose-50/20 focus:border-rose-500" : "border-slate-200 focus:border-[#00206B]"
                }`}
              />
              {isInvalidEmailDomain && (
                <p className="text-[10px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                  <span>⚠️ Wajib menggunakan domain resmi @siclus.id</span>
                </p>
              )}
              {(isEdit ? duplicateEditEmail : duplicateAddEmail) && (
                <p className="text-[10px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                  <span>⚠️ Email sudah terdaftar</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                {isEdit ? "PASSWORD BARU (OPSIONAL)" : "PASSWORD LOGIN"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required={!isEdit}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isEdit ? "Kosongkan jika tidak diganti" : "Minimal 8 karakter"}
                  className="w-full bg-white border border-slate-200 text-sm font-normal text-[#00206B] rounded-xl pl-4 pr-11 py-2.5 outline-none focus:border-[#00206B]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#00206B] transition-colors focus:outline-none cursor-pointer"
                  title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Security Notice & Verifikasi Password Admin Khusus Mode Edit */}
          {isEdit && (
            <div className="space-y-3 pt-2">
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
                  <span className="text-[11px] text-amber-800">
                    Masukkan password akun administrator Anda untuk mengonfirmasi perubahan data akun pengemudi ini.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  PASSWORD ADMINISTRATOR (KONFIRMASI) <span className="text-rose-500">*</span>
                </label>
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
                    type={showAdminPassword ? "text" : "password"}
                    name="password_admin"
                    autoComplete="new-password"
                    readOnly
                    onFocus={(e) => {
                      e.target.readOnly = false;
                    }}
                    value={formData.password_admin || ""}
                    onChange={handleChange}
                    placeholder="Ketik password admin Anda untuk konfirmasi"
                    required={isEdit}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00206B] focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showAdminPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showAdminPassword ? (
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
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">
              BATAL
            </button>
            <button
              type="submit"
              disabled={isSubmitting || hasValidationError || (isEdit && !formData.password_admin?.trim())}
              className="px-6 py-2.5 rounded-xl bg-[#00206B] hover:bg-[#001850] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-900/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isSubmitting ? "MENYIMPAN..." : isEdit ? "SIMPAN PERUBAHAN" : "SIMPAN DRIVER"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserDriverModal;
