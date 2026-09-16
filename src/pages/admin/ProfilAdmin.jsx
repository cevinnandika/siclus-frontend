import React, { useState, useRef, useEffect } from "react";
import { apiService } from "../../services/api";
import imageCompression from "browser-image-compression";
import toast from 'react-hot-toast';

const ProfilAdmin = ({ user, onLogout, onUpdateUser }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(user?.foto_profil || null);
  const [isEditing, setIsEditing] = useState(false);
  const [adminName, setAdminName] = useState(user?.nama_lengkap || user?.nama || user?.name || "Administrator");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.nama_lengkap || user?.nama || user?.name) {
      setAdminName(user.nama_lengkap || user.nama || user.name);
    }
    if (user?.foto_profil) {
      setFotoPreview(user.foto_profil);
    }
  }, [user]);

  // Fungsi menyimpan perubahan nama admin
  const handleSaveName = async () => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("siclus_user") || "{}");
      savedUser.nama = adminName;
      savedUser.name = adminName;
      savedUser.nama_lengkap = adminName;
      localStorage.setItem("siclus_user", JSON.stringify(savedUser));

      if (user?.id) {
        try {
          await apiService.updateUserAdmin(user.id, { nama_lengkap: adminName });
        } catch (apiErr) {
          console.warn("API update profile fallback:", apiErr);
        }
      }

      setIsEditing(false);
      if (onUpdateUser) onUpdateUser(savedUser);
      else window.location.reload();
    } catch (error) {
      console.error("Gagal update nama admin:", error);
    }
  };

  // Fungsi upload & kompres foto profil admin
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      const res = await apiService.updateFotoProfilAdmin(compressedFile);

      if (res && res.foto_profil) {
        setFotoPreview(res.foto_profil);
        toast.success("Foto profil berhasil diperbarui!");
        const savedUser = JSON.parse(localStorage.getItem("siclus_user") || "{}");
        if (savedUser) {
          savedUser.foto_profil = res.foto_profil;
          localStorage.setItem("siclus_user", JSON.stringify(savedUser));
          if (onUpdateUser) onUpdateUser(savedUser);
          else window.location.reload();
        }
      }
    } catch (error) {
      toast.error("Gagal upload foto profil admin: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  const adminInitial = (adminName || "A").charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans text-left animate-[fadeIn_0.2s]">
      {/* Header Halaman: Konsisten dengan Tampilan Driver */}
      <div className="pb-1">
        <h2 className="text-2xl md:text-3xl font-bold text-[#00206B] tracking-tight m-0">
          Profil Administrator
        </h2>
        <p className="text-xs text-slate-500 font-normal mt-1">
          Informasi identitas dan rincian akun administrator sistem.
        </p>
      </div>

      {/* Kartu Profil Utama: Bersih, Elegan, Identik dengan Driver */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Baris Atas: Avatar + Nama + Status Role */}
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
                alt={adminName}
                className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#00206B] text-white flex items-center justify-center font-bold text-3xl">
                {adminInitial}
              </div>
            )}

            {/* Overlay Ubah Foto saat Hover / Uploading */}
            <div
              className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-white transition-opacity duration-200 ${
                isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {isUploading ? (
                <span className="text-[10px] font-medium uppercase tracking-wider animate-pulse">
                  Mengunggah...
                </span>
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

          {/* Info Admin */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="border-2 border-slate-300 rounded-lg px-3 py-1 text-base sm:text-lg font-semibold text-slate-900 outline-none focus:border-[#00206B]"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="bg-[#00206B] text-white px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-[#00174E] cursor-pointer"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setAdminName(user?.nama_lengkap || user?.nama || user?.name || "Administrator");
                    }}
                    className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-slate-200 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 m-0 tracking-tight truncate">
                    {adminName}
                  </h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-slate-400 hover:text-[#00206B] transition-colors p-1 cursor-pointer"
                    title="Ubah Nama Admin"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Status Badge Role */}
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 self-center sm:self-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                ADMINISTRATOR
              </span>
            </div>

            <p className="text-xs text-slate-500 font-normal m-0">
              Administrator Pengelola Sistem Monitoring Angkutan Sekolah
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Klik pada foto profil di samping untuk memperbarui foto akun Anda.
            </p>
          </div>
        </div>

        {/* Rincian Akun Admin (Fungsi & Informasi Khusus Admin) */}
        <div className="py-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Informasi Akun
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* ID Administrator */}
            <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                  />
                </svg>
                ID Administrator
              </div>
              <p className="text-sm font-semibold text-[#00206B] mt-1 truncate">
                {user?.id || user?.id_driver || "ADM-DISHUB"}
              </p>
            </div>

            {/* Email Terdaftar */}
            <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email Terdaftar
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-1 truncate" title={user?.email || "-"}>
                {user?.email || "admin@siclus.id"}
              </p>
            </div>

            {/* Hak Akses & Otoritas Sistem */}
            <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
                Hak Akses Sistem
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-1 truncate">
                Super Admin (Monitoring & Master Data)
              </p>
            </div>

            {/* Instansi Kedinasan */}
            <div className="bg-slate-50/70 border border-slate-100/90 rounded-xl p-3.5 transition-colors hover:bg-slate-50">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                  />
                </svg>
                Instansi Kedinasan
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-1 truncate">
                Dinas Perhubungan Kota Mojokerto
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Keluar: Elegan & Identik dengan Driver */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 text-rose-700 text-xs font-bold py-2.5 px-5 rounded-xl transition-colors cursor-pointer active:scale-95 shadow-xs"
          >
            <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Keluar dari Akun
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilAdmin;
