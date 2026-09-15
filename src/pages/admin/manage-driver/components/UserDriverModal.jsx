import React, { useState, useEffect } from "react";

const UserDriverModal = ({
  isOpen = false,
  isEdit = false,
  initialData = null,
  drivers = [],
  isSubmitting = false,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    id_driver: "DRV-",
    nama_lengkap: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialData) {
        setFormData({
          id_driver: initialData.id_driver || initialData.id || initialData.id_supir || "",
          nama_lengkap: initialData.nama_lengkap || initialData.nama || initialData.name || "",
          email: initialData.email || "",
          password: "",
        });
      } else {
        setFormData({
          id_driver: "DRV-",
          nama_lengkap: "",
          email: "",
          password: "",
        });
      }
      setShowPassword(false);
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

  const duplicateAddId =
    !isEdit &&
    (formData.id_driver || "").trim().length > 4 &&
    drivers.find(
      (d) => (d.id || d.id_driver || "").toUpperCase() === (formData.id_driver || "").trim().toUpperCase()
    );

  const duplicateAddName =
    !isEdit &&
    (formData.nama_lengkap || "").trim().length > 1 &&
    drivers.find(
      (d) => (d.nama || d.nama_lengkap || d.name || "").trim().toLowerCase() === (formData.nama_lengkap || "").trim().toLowerCase()
    );

  const duplicateAddEmail =
    !isEdit &&
    (formData.email || "").trim().length > 3 &&
    drivers.find(
      (d) => (d.email || "").trim().toLowerCase() === (formData.email || "").trim().toLowerCase()
    );

  const duplicateEditName =
    isEdit &&
    (formData.nama_lengkap || "").trim().length > 1 &&
    drivers.find(
      (d) =>
        (d.id || d.id_driver) !== editTargetId &&
        (d.nama || d.nama_lengkap || d.name || "").trim().toLowerCase() === (formData.nama_lengkap || "").trim().toLowerCase()
    );

  const duplicateEditEmail =
    isEdit &&
    (formData.email || "").trim().length > 3 &&
    drivers.find(
      (d) =>
        (d.id || d.id_driver) !== editTargetId &&
        (d.email || "").trim().toLowerCase() === (formData.email || "").trim().toLowerCase()
    );

  const hasValidationError = isEdit
    ? Boolean(duplicateEditName) || Boolean(duplicateEditEmail)
    : Boolean(duplicateAddId) || Boolean(duplicateAddName) || Boolean(duplicateAddEmail);

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (hasValidationError) return;
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s]">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">
              {isEdit ? "Perbarui Driver" : "Registrasi Driver"}
            </span>
            <h3 className="text-xl font-extrabold text-[#00206B] m-0">
              {isEdit ? "Edit Data Driver" : "Tambah Driver Baru"}
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

        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <span className="text-[10px] font-bold text-[#00206B] uppercase tracking-widest">Data Akun Login</span>
            <div className="w-full h-[1px] bg-slate-200 mt-1 mb-3"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ID Driver */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                ID Driver
              </label>
              <input
                type="text"
                name="id_driver"
                disabled={isEdit}
                required={!isEdit}
                value={formData.id_driver}
                onChange={handleIdDriverChange}
                placeholder="DRV-..."
                className={`w-full border text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none transition-colors ${
                  isEdit
                    ? "bg-slate-100 border-slate-200 opacity-70 cursor-not-allowed"
                    : duplicateAddId
                    ? "bg-rose-50/20 border-rose-400 focus:border-rose-500"
                    : "bg-white border-slate-200 focus:border-[#00206B]"
                }`}
              />
              {duplicateAddId && (
                <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                  <span>⚠️ ID sudah terdaftar</span>
                </p>
              )}
            </div>

            {/* Nama Lengkap */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="nama_lengkap"
                required
                value={formData.nama_lengkap}
                onChange={handleChange}
                placeholder=""
                className={`w-full bg-white border text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none transition-colors ${
                  (isEdit ? duplicateEditName : duplicateAddName)
                    ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                    : "border-slate-200 focus:border-[#00206B]"
                }`}
              />
              {(isEdit ? duplicateEditName : duplicateAddName) && (
                <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                  <span>⚠️ Nama sudah terdaftar</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Email Akun
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder=""
                className={`w-full bg-white border text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none transition-colors ${
                  (isEdit ? duplicateEditEmail : duplicateAddEmail)
                    ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                    : "border-slate-200 focus:border-[#00206B]"
                }`}
              />
              {(isEdit ? duplicateEditEmail : duplicateAddEmail) && (
                <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                  <span>⚠️ Email sudah terdaftar</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {isEdit ? "Password Baru" : "Password Login"}
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

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || hasValidationError}
              className="px-6 py-3 rounded-xl bg-[#00206B] hover:bg-[#00174E] text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserDriverModal;
