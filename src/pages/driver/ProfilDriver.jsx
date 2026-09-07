import React, { useState, useRef, useEffect } from "react";
import { apiService } from "../../services/api";
import imageCompression from "browser-image-compression";

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
      // Kompresi Gambar agar sangat ringan (Max 200KB)
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // Kirim ke Backend
      const res = await apiService.updateFotoProfil(compressedFile);

      // Update UI dengan URL baru dari server
      if (res && res.foto_profil) {
        setFotoPreview(res.foto_profil);

        // Opsional: Update data user di localStorage agar menetap
        const savedUser = JSON.parse(localStorage.getItem("siclus_user"));
        if (savedUser) {
          savedUser.foto_profil = res.foto_profil;
          localStorage.setItem("siclus_user", JSON.stringify(savedUser));
          // 🔥 TRIGGER GLOBAL RE-RENDER DI SINI 🔥
          if (onUpdateUser) onUpdateUser(savedUser);
        }
      }
    } catch (error) {
      alert("Gagal upload foto profil: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto pb-6 relative">
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-black text-[#00206B] m-0 tracking-wide uppercase">Profil Driver</h2>
        <p className="text-sm text-slate-400 font-semibold mt-0.5">Kelola informasi data diri operasional Anda</p>
      </div>
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-[#00206B] to-blue-500"></div>
        <div className="relative z-10 flex flex-col items-center mt-12 px-6 pb-8">
          {/* INPUT FILE HIDDEN */}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

          {/* WADAH AVATAR BISA DIKLIK */}
          <div
            onClick={() => !isUploading && fileInputRef.current.click()}
            className="w-28 h-28 rounded-full bg-white p-1.5 shadow-lg cursor-pointer group relative"
            title="Klik untuk ubah foto profil"
          >
            <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 relative">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-14 h-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}

              {/* OVERLAY LOADING ATAU HOVER */}
              <div
                className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white transition-opacity duration-200 ${isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              >
                {isUploading ? (
                  <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Uploading...</span>
                ) : (
                  <>
                    <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-widest">Ubah Foto</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <h3 className="mt-4 text-2xl font-black text-[#00206B]">
            {user?.nama_lengkap || user?.nama || user?.name || "Nama Driver"}
          </h3>
          <span className="bg-blue-50 text-blue-600 font-bold px-4 py-1.5 rounded-full text-xs mt-2 uppercase tracking-wide border border-blue-100">{user?.role || "Driver"}</span>

          {/* GRID INFO DRIVER (Tanpa Armada Default) */}
          <div className="mt-8 grid grid-cols-2 gap-3 w-full">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">ID Driver</span>
              <span className="font-extrabold text-[#00206B] text-sm truncate block">{user?.id || "-"}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Trayek Tetap</span>
              <span className="font-extrabold text-[#00206B] text-sm truncate block">{user?.trayek || "-"}</span>
            </div>
          </div>

          <div className="w-full mt-8 pt-6 border-t border-slate-100">
            <button onClick={onLogout} className="w-full bg-[#FCE8E6] hover:bg-[#FAD2CF] transition-colors text-[#C5221F] font-extrabold py-4 px-4 rounded-2xl cursor-pointer">
              🚪 KELUAR APLIKASI (LOGOUT)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilDriver;
