import React, { useState, useRef } from "react";
import { apiService } from "../../services/api";
import imageCompression from "browser-image-compression";

const ProfilAdmin = ({ user, onLogout }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(user?.foto_profil || null);
  const [isEditing, setIsEditing] = useState(false);
  const [adminName, setAdminName] = useState(user?.nama_lengkap || user?.nama || user?.name || "Pak Fajar");
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (user?.nama_lengkap || user?.nama || user?.name) {
      setAdminName(user.nama_lengkap || user.nama || user.name);
    }
  }, [user]);

  // Fungsi untuk menyimpan ke backend (siapkan kerangkanya)
  const handleSaveName = async () => {
    try {
      // Update juga data di localStorage/Context agar nama di Sidebar ikut berubah
      const savedUser = JSON.parse(localStorage.getItem("siclus_user") || "{}");
      savedUser.nama = adminName;
      savedUser.name = adminName;
      savedUser.nama_lengkap = adminName;
      localStorage.setItem("siclus_user", JSON.stringify(savedUser));

      // Kerangka API update jika backend sudah siap
      if (user?.id) {
        try {
          await apiService.updateUserAdmin(user.id, { nama_lengkap: adminName });
        } catch (apiErr) {
          console.warn("API update profile fallback:", apiErr);
        }
      }

      setIsEditing(false);
      // Sinkronisasi perubahan ke seluruh komponen aplikasi
      window.location.reload();
    } catch (error) {
      console.error("Gagal update nama", error);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Kompresi Gambar (Max 200KB)
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      // Kirim ke Backend Admin
      const res = await apiService.updateFotoProfilAdmin(compressedFile);
      
      // Update UI dengan URL baru
      if (res && res.foto_profil) {
        setFotoPreview(res.foto_profil);
        const savedUser = JSON.parse(localStorage.getItem("siclus_user"));
        if (savedUser) {
          savedUser.foto_profil = res.foto_profil;
          localStorage.setItem("siclus_user", JSON.stringify(savedUser));
          
          // BARIS TAMBAHAN: Paksa sinkronisasi global state aplikasi
          window.location.reload();
        }
      }
    } catch (error) {
      alert("Gagal upload foto profil admin: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto pb-6 relative">
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-black text-[#00206B] m-0 tracking-wide uppercase">Profil Akun Admin</h2>
        <p className="text-sm text-slate-400 font-semibold mt-0.5">Informasi kredensial dan hak akses administrator operasional SICLUS</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-[#00206B]"></div>
        <div className="relative z-10 flex flex-col items-center mt-12 px-6 pb-8">
          
          {/* INPUT FILE HIDDEN */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

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
                <span className="text-3xl font-black text-[#00206B]">{(adminName || "A").charAt(0).toUpperCase()}</span>
              )}
              
              {/* OVERLAY LOADING ATAU HOVER */}
              <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white transition-opacity duration-200 ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {isUploading ? (
                  <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Uploading...</span>
                ) : (
                  <>
                    <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-widest">Ubah Foto</span>
                  </>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-amber-400 border-4 border-white rounded-full flex items-center justify-center" title="Akun Terverifikasi">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* BAGIAN RENDER NAMA ADMIN */}
          <div className="flex flex-col items-center justify-center mt-4">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="border-2 border-slate-300 rounded-lg px-3 py-1.5 text-lg font-bold text-center text-[#00206B] outline-none focus:border-[#00206B] transition-colors"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="bg-[#00206B] hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-xs font-black transition-colors cursor-pointer"
                >
                  SIMPAN
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setAdminName(user?.nama_lengkap || user?.nama || user?.name || "Pak Fajar");
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-black transition-colors cursor-pointer"
                >
                  BATAL
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group">
                <h2 className="text-2xl font-black text-[#00206B]">{adminName}</h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-slate-300 hover:text-[#00206B] transition-colors p-1 cursor-pointer"
                  title="Ubah Nama Admin"
                >
                  {/* Icon Edit Pencils SVG */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <span className="bg-[#00206B] text-white font-black px-4 py-1.5 rounded-full text-[10px] mt-2 uppercase tracking-widest shadow-md">🛡️ ADMINISTRATOR UTAMA</span>

          <div className="mt-8 space-y-3 w-full">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Email Terdaftar</span>
              <span className="font-extrabold text-[#00206B] text-sm">{user?.email || "admin@siclus.id"}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Hak Akses & Otoritas</span>
              <span className="font-extrabold text-[#00206B] text-sm text-center">Full Akses Monitoring, Rekap, & Manajemen Data</span>
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

export default ProfilAdmin;
