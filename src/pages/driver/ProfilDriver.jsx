import React, { useState, useRef, useEffect } from "react";
import { apiService } from "../../services/api";
import imageCompression from "browser-image-compression";
import toast from 'react-hot-toast';

// ==============================================================================
// KOMPONEN: PROFIL DRIVER (MANAJEMEN INFORMASI AKUN & UNGGAH FOTO PROFIL)
// ==============================================================================
const ProfilDriver = ({ user, onLogout, onUpdateUser }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(user?.foto_profil || null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFotoPreview(user.foto_profil || null);
    }
  }, [user]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const res = await apiService.updateFotoProfil(compressedFile);

      if (res && res.foto_profil) {
        setFotoPreview(res.foto_profil);
        toast.success("Foto profil berhasil diperbarui!");

        const savedUser = JSON.parse(localStorage.getItem("siclus_user") || "{}");
        if (savedUser) {
          savedUser.foto_profil = res.foto_profil;
          localStorage.setItem("siclus_user", JSON.stringify(savedUser));
          if (onUpdateUser) onUpdateUser(savedUser);
        }
      }
    } catch (error) {
      toast.error("Gagal upload foto profil: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  const driverName = user?.nama_lengkap || user?.nama || user?.name || "Driver SICLUS";
  const driverInitial = driverName.charAt(0).toUpperCase();

  if (!user) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-[#00206B] rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-medium text-slate-400 mt-4">Memuat data akun driver...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans text-left">
      {/* Header Halaman: Konsisten dengan Beranda & Profil Admin */}
      <div className="pb-1">
        <h2 className="text-2xl md:text-3xl font-bold text-[#00206B] tracking-tight m-0">Profil Pengemudi</h2>
        <p className="text-xs text-slate-500 font-normal mt-1">
          Informasi identitas dan rincian akun operasional pengemudi.
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Baris Atas: Avatar + Nama + Status */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* Avatar Bulat Utuh dengan Tombol Ubah Foto */}
          <div
            onClick={() => !isUploading && fileInputRef.current.click()}
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex-shrink-0 cursor-pointer group shadow-sm"
            title="Klik untuk mengubah foto profil"
          >
            {fotoPreview ? (
              <img
                src={fotoPreview}
                alt={driverName}
                className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#00206B] text-white flex items-center justify-center font-bold text-3xl">
                {driverInitial}
              </div>
            )}

            {/* Overlay Ubah Foto */}
            <div
              className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-white transition-opacity duration-200 ${
                isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mb-1.5"></div>
                  <span className="text-[10px] font-medium text-white/90 uppercase tracking-wider">
                    Mengunggah...
                  </span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[9px] font-medium uppercase tracking-wider">Ubah Foto</span>
                </>
              )}
            </div>
          </div>

          {/* Info Driver */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 m-0 tracking-tight truncate">
                {driverName}
              </h3>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 self-center sm:self-auto">
                {user?.role ? user.role.toUpperCase() : "PENGEMUDI AKTIF"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal m-0">
              Pengemudi Angkutan Sekolah Gratis Kota Mojokerto
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Klik pada foto profil di samping untuk memperbarui foto akun Anda.
            </p>
          </div>
        </div>

        {/* Rincian Akun Driver (2 Box Bersih, Identik dengan Estetika Admin) */}
        <div className="py-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Informasi Akun
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* ID Driver */}
            <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                ID Driver
              </div>
              <p className="text-sm font-semibold text-[#00206B] mt-1 truncate">
                {user?.id || "-"}
              </p>
            </div>

            {/* Email Terdaftar */}
            <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Terdaftar
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-1 truncate" title={user?.email || "-"}>
                {user?.email || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Keluar: Elegan, Proporsional, Profesional */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 text-rose-700 text-xs font-semibold py-2.5 px-5 rounded-xl transition-colors cursor-pointer active:scale-95 shadow-xs"
          >
            <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar dari Akun
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilDriver;
