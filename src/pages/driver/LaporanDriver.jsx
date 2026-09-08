import React, { useState, useRef, useEffect } from "react";
import { apiService } from "../../services/api";
import imageCompression from "browser-image-compression";

const dataURLtoFile = (dataurl, filename) => {
  let arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const LiveCamera = ({ onCapture, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) {
        alert("Akses kamera ditolak!");
        onCancel();
      }
    };
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg");
      if (stream) stream.getTracks().forEach((track) => track.stop());
      onCapture(imageData);
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-3">
      <div className="relative w-full aspect-[3/4] max-w-sm mx-auto bg-black rounded-lg overflow-hidden border-2 border-[#00206B]">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="flex gap-2 w-full max-w-sm mx-auto">
        <button type="button" onClick={takePhoto} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded shadow-md text-sm">
          Ambil Foto
        </button>
        <button
          type="button"
          onClick={() => {
            if (stream) stream.getTracks().forEach((t) => t.stop());
            onCancel();
          }}
          className="bg-rose-600 text-white font-bold py-3 px-6 rounded shadow-md text-sm"
        >
          Batal
        </button>
      </div>
    </div>
  );
};

const LaporanDriver = ({ user: propUser, currentShift = "pagi", onFinishShift }) => {
  // 1. DATA USER: Tarik dari prop atau fallback ke localStorage / API
  const [profileData, setProfileData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("siclus_user") || "{}");
    } catch {
      return {};
    }
  });

  const user = React.useMemo(() => ({
    ...profileData,
    ...propUser,
    trayek: propUser?.trayek || profileData?.trayek || "",
    jenis_kendaraan: propUser?.jenis_kendaraan || profileData?.jenis_kendaraan || propUser?.tipe_kendaraan || profileData?.tipe_kendaraan || "",
    nomer_kendaraan: propUser?.nomer_kendaraan || profileData?.nomer_kendaraan || propUser?.bus || profileData?.bus || "",
    kapasitas: propUser?.kapasitas || profileData?.kapasitas || "",
  }), [profileData, propUser]);

  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const res = await apiService.getProfilDriver();
        const data = res?.data || res;
        if (data) {
          setProfileData((prev) => {
            const updated = {
              ...prev,
              ...data,
              trayek: data.trayek || prev.trayek,
              jenis_kendaraan: data.jenis_kendaraan || data.tipe_kendaraan || prev.jenis_kendaraan,
              nomer_kendaraan: data.nomer_kendaraan || data.bus || data.armada || prev.nomer_kendaraan,
              kapasitas: data.kapasitas || prev.kapasitas,
            };
            try {
              localStorage.setItem("siclus_user", JSON.stringify(updated));
            } catch (err) {
              console.warn(err);
            }
            return updated;
          });
        }
      } catch (err) {
        console.warn("Gagal sinkronisasi data profil driver:", err);
      }
    };

    fetchLatestProfile();
  }, []);

  // --- PERSISTENT DRAFT INITIALIZATION ---
  const getDraft = () => {
    const saved = localStorage.getItem("siclus_draft_form");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const localNow = new Date();
        const today = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, "0")}-${String(localNow.getDate()).padStart(2, "0")}`;
        // Jika draft berasal dari tanggal yang berbeda, bersihkan agar tidak memakai draft kemarin
        if (parsed.draftDate && parsed.draftDate !== today) {
          localStorage.removeItem("siclus_draft_step");
          localStorage.removeItem("siclus_draft_form");
          localStorage.removeItem("siclus_active_laporan_id");
          return null;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  };
  const initialDraft = getDraft();

  // 1. STATE UNTUK STEP AKTIF (CP1, CP2, dll)
  const [activeCP, setActiveCP] = useState(() => {
    const savedStep = localStorage.getItem("siclus_draft_step");
    return savedStep ? parseInt(savedStep, 10) : 1;
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [cpToConfirm, setCpToConfirm] = useState(null); // Fitur Safety Lock

  // 2. STATE UNTUK DATA FORM / SESI / INSPEKSI
  const [laporanId, setLaporanId] = useState(() => {
    return localStorage.getItem("siclus_active_laporan_id") || initialDraft?.laporanId || null;
  });
  const [sesiId, setSesiId] = useState(() => initialDraft?.sesiId || null);

  // SINKRONISASI: Simpan laporanId ke localStorage
  useEffect(() => {
    if (laporanId) {
      localStorage.setItem("siclus_active_laporan_id", String(laporanId));
    }
  }, [laporanId]);

  const [merkKendaraan, setMerkKendaraan] = useState(() => initialDraft?.merkKendaraan || user?.jenis_kendaraan || "");
  const [nopol, setNopol] = useState(() => initialDraft?.nopol || user?.nomer_kendaraan || "");

  useEffect(() => {
    if (user?.jenis_kendaraan) setMerkKendaraan(user.jenis_kendaraan);
    if (user?.nomer_kendaraan) setNopol(user.nomer_kendaraan);
  }, [user?.jenis_kendaraan, user?.nomer_kendaraan]);
  const [odoAwal, setOdoAwal] = useState(() => initialDraft?.odoAwal || initialDraft?.odometer_awal || "");
  const [odo3, setOdo3] = useState(() => initialDraft?.odo3 || "");
  const [odo4, setOdo4] = useState(() => initialDraft?.odo4 || "");
  const [penumpang, setPenumpang] = useState(() => initialDraft?.penumpang || "");
  const [catatan, setCatatan] = useState(() => initialDraft?.catatan || "");

  const [isPhotoSaved, setIsPhotoSaved] = useState(() => initialDraft?.isPhotoSaved || false);
  const [photoPreview, setPhotoPreview] = useState(() => initialDraft?.photoPreview || null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [inspeksi, setInspeksi] = useState(() => initialDraft?.inspeksi || {
    rem: null,
    ac: null,
    lampu: null,
    klakson: null,
    wiper: null,
    lampu_rem: null,
    bell: null,
    pintu: null,
    kebersihan: null,
  });

  // AUTO-SAVE: Sinkronisasi step ke localStorage
  useEffect(() => {
    localStorage.setItem("siclus_draft_step", activeCP.toString());
  }, [activeCP]);

  // AUTO-SAVE: Sinkronisasi seluruh field form ke localStorage
  useEffect(() => {
    const localNow = new Date();
    const today = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, "0")}-${String(localNow.getDate()).padStart(2, "0")}`;
    const draftPayload = {
      draftDate: today,
      laporanId,
      sesiId,
      merkKendaraan,
      nopol,
      odoAwal,
      odometer_awal: odoAwal,
      odo3,
      odo4,
      penumpang,
      catatan,
      inspeksi,
      isPhotoSaved,
      photoPreview,
    };
    try {
      localStorage.setItem("siclus_draft_form", JSON.stringify(draftPayload));
    } catch (e) {
      console.warn("Gagal menyimpan snapshot foto ke localStorage, menyimpan draft teks saja:", e);
      try {
        localStorage.setItem("siclus_draft_form", JSON.stringify({ ...draftPayload, photoPreview: null }));
      } catch (err) {
        console.error("Gagal auto-save form:", err);
      }
    }
  }, [
    laporanId,
    sesiId,
    merkKendaraan,
    nopol,
    odoAwal,
    odo3,
    odo4,
    penumpang,
    catatan,
    inspeksi,
    isPhotoSaved,
    photoPreview,
  ]);

  useEffect(() => {
    const initLaporan = async () => {
      // 1. Cek dari localStorage dulu
      const savedLaporanId = localStorage.getItem("siclus_active_laporan_id");
      if (savedLaporanId) {
        if (!laporanId) setLaporanId(savedLaporanId);
        return;
      }
      if (laporanId) {
        localStorage.setItem("siclus_active_laporan_id", String(laporanId));
        return;
      }

      try {
        const localNow = new Date();
        const year = localNow.getFullYear();
        const month = String(localNow.getMonth() + 1).padStart(2, "0");
        const day = String(localNow.getDate()).padStart(2, "0");
        const today = `${year}-${month}-${day}`;

        const res = await (apiService.mulaiLaporanHarian || apiService.mulaiLaporan)({
          tanggal: today,
          trayek: user?.trayek || "-",
          bus: user?.bus || "-",
        });
        if (res && res.id) {
          localStorage.setItem("siclus_active_laporan_id", String(res.id));
          setLaporanId(res.id);
        }
      } catch (err) {
        console.error("Gagal init laporan:", err);
      }
    };
    initLaporan();
  }, [user, laporanId]);

  const handleCeklis = (item, status) => setInspeksi((prev) => ({ ...prev, [item]: status }));
  const totalCeklis = Object.values(inspeksi).filter((val) => val !== null).length;
  const adaKurang = Object.values(inspeksi).includes("KURANG");

  // Logika Validasi (Jika ada "KURANG", wajib isi catatan)
  const isInspeksiValid = adaKurang ? totalCeklis === 9 && catatan.trim() !== "" : totalCeklis === 9;
  const isCP1Ready = isInspeksiValid && isPhotoSaved && odoAwal !== "" && Boolean(user?.nomer_kendaraan || nopol);

  const handlePreSubmit = (e, cpNumber) => {
    e.preventDefault();
    setCpToConfirm(cpNumber);
  };

  const submitCP1 = async () => {
    const activeLaporanId = laporanId || localStorage.getItem("siclus_active_laporan_id");
    if (!activeLaporanId) return alert("Sistem memuat ID Laporan. Tunggu sebentar.");
    setIsProcessing(true);
    try {
      const fileFoto = dataURLtoFile(photoPreview, `selfie_awal.jpg`);

      // --- PROSES KOMPRESI ---
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(fileFoto, options);

      // Kirim file yang sudah dikompres
      const uploadRes = await apiService.uploadSelfie(compressedFile);

      await apiService.submitInspeksi(activeLaporanId, { 
        ...inspeksi, 
        tipe_sesi: currentShift.toUpperCase(), // <-- WAJIB KIRIM INI
        catatan: adaKurang ? catatan : "" 
      });

      // Data plat nomor diambil langsung dari data user.nomer_kendaraan
      const platNomorFinal = user?.nomer_kendaraan || user?.bus || nopol || "-";
      const cp1Res = await apiService.submitCP1(activeLaporanId, {
        tipe_sesi: currentShift,
        nopol_kendaraan: platNomorFinal,
        km_berangkat_kantor: parseInt(odoAwal),
        foto_awal: uploadRes.url_foto,
      });

      const newSesiId = cp1Res?.data?.id || cp1Res?.id;
      if (newSesiId) setSesiId(newSesiId);
      setCpToConfirm(null);
      setActiveCP(2);
    } catch (err) {
      alert("Gagal kirim CP1: " + (err.response?.data?.detail || err.message));
      setCpToConfirm(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitCP3 = async () => {
    setIsProcessing(true);
    try {
      await apiService.submitCP3(sesiId, {
        km_tiba_finish: parseInt(odo3),
        jumlah_penumpang: parseInt(penumpang),
      });
      setIsPhotoSaved(false);
      setPhotoPreview(null);
      setCpToConfirm(null);
      setActiveCP(3);
    } catch (err) {
      alert("Gagal kirim CP2: " + (err.response?.data?.detail || err.message));
      setCpToConfirm(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitCP4 = async () => {
    setIsProcessing(true);
    try {
      const fileFoto = dataURLtoFile(photoPreview, `selfie_akhir.jpg`);

      // --- PROSES KOMPRESI ---
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(fileFoto, options);

      // Kirim file yang sudah dikompres
      const uploadRes = await apiService.uploadSelfie(compressedFile);

      await apiService.submitCP4(sesiId, {
        km_tiba_kantor: parseInt(odo4),
        foto_akhir: uploadRes.url_foto,
      });

      // BERSIHKAN DRAFT LOKAL SETELAH TUGAS SELESAI
      localStorage.removeItem("siclus_draft_step");
      localStorage.removeItem("siclus_draft_form");
      localStorage.removeItem("siclus_active_laporan_id");

      alert("Shift Berhasil Ditutup!");
      if (onFinishShift) onFinishShift();
    } catch (err) {
      alert("Gagal kirim CP4: " + (err.response?.data?.detail || err.message));
      setCpToConfirm(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const CheckItem = ({ id, label }) => (
    <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
      <span className="text-xs font-bold text-[#00206B] truncate w-20">{label}</span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => handleCeklis(id, "OK")}
          className={`text-[9px] font-black px-3 py-1.5 rounded transition-colors ${inspeksi[id] === "OK" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}
        >
          OK
        </button>
        <button
          type="button"
          onClick={() => handleCeklis(id, "KURANG")}
          className={`text-[9px] font-black px-2 py-1.5 rounded transition-colors ${inspeksi[id] === "KURANG" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"}`}
        >
          KURANG
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 px-4 md:px-0 font-sans">
      {/* 🔴 CHECK POINT 1 🔴 */}
      <div className={`border rounded-xl bg-white transition-all ${activeCP === 1 ? "border-[#00206B] shadow-md" : "border-slate-200"}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-black text-[#00206B] text-sm tracking-wide">CHECK POINT 1: KELUAR DISHUB</h3>
          {activeCP > 1 && <span className="text-emerald-600 font-black text-sm">✓</span>}
        </div>

        {activeCP >= 1 && (
          <form onSubmit={(e) => handlePreSubmit(e, 1)} className={`p-6 ${activeCP > 1 ? "opacity-60 pointer-events-none" : ""}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* TRAYEK PENUGASAN (TERKUNCI) */}
                <div className="mb-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Trayek Penugasan
                  </label>
                  <input
                    type="text"
                    value={user?.trayek || "Memuat..."} 
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 text-lg font-bold text-[#00206B] rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* MERK MOBIL / JENIS KENDARAAN (TERKUNCI) */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Merk / Jenis Mobil
                    </label>
                    <input
                      type="text"
                      value={user?.jenis_kendaraan || "Memuat..."} 
                      readOnly
                      className="w-full bg-slate-100 border border-slate-200 text-sm font-bold text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none"
                    />
                  </div>

                  {/* NO. POLISI (TERKUNCI) */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      No. Polisi
                    </label>
                    <input
                      type="text"
                      value={user?.nomer_kendaraan || "Memuat..."} 
                      readOnly
                      className="w-full bg-slate-100 border border-slate-200 text-sm font-bold text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>

                {/* KAPASITAS KENDARAAN */}
                <div className="mb-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Kapasitas Kendaraan
                  </label>
                  <input
                    type="text"
                    value={user?.kapasitas ? `${user.kapasitas} Penumpang` : "Memuat..."}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 text-sm font-bold text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none"
                  />
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">ODOMETER AWAL (KM)</label>
                  <input
                    type="number"
                    required
                    value={odoAwal}
                    onChange={(e) => setOdoAwal(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-lg font-bold text-[#00206B] outline-none focus:border-[#00206B]"
                    placeholder="Contoh: 67008"
                  />
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">AMBIL FOTO WAJAH</span>
                  {isCameraOpen ? (
                    <LiveCamera
                      onCapture={(img) => {
                        setPhotoPreview(img);
                        setIsPhotoSaved(true);
                        setIsCameraOpen(false);
                      }}
                      onCancel={() => setIsCameraOpen(false)}
                    />
                  ) : !isPhotoSaved ? (
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="w-full aspect-[3/4] max-w-sm mx-auto flex flex-col items-center justify-center border-2 border-dashed border-[#00206B] text-[#00206B] bg-blue-50 font-bold text-sm rounded-lg hover:bg-blue-100 transition"
                    >
                      Buka Kamera
                    </button>
                  ) : (
                    <div className="relative w-full aspect-[3/4] max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-emerald-500">
                      <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded shadow z-10">✓ Foto Tersimpan</div>
                      <img src={photoPreview} alt="Selfie" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setIsCameraOpen(true)} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                        Ulangi Foto
                      </button>
                    </div>
                  )}
                </div>
              </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">INSPEKSI KENDARAAN</h4>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">Lakukan pemeriksaan fungsional sebelum perjalanan.</p>
                    </div>
                    <div className="bg-[#00206B] text-white px-3 py-1.5 rounded-lg text-center shadow-sm">
                      <span className="block text-xs font-black">{totalCeklis}/9</span>
                      <span className="block text-[7px] uppercase font-bold">Diperiksa</span>
                    </div>
                  </div>

                  {/* BUNGKUS GRID 2 KOLOM HANYA UNTUK CHECKITEM */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <CheckItem id="rem" label="Rem" />
                    <CheckItem id="ac" label="AC" />
                    <CheckItem id="lampu" label="Lampu" />
                    <CheckItem id="klakson" label="Klakson" />
                    <CheckItem id="wiper" label="Wiper" />
                    <CheckItem id="lampu_rem" label="Lampu Rem" />
                    <CheckItem id="bell" label="Bell" />
                    <CheckItem id="pintu" label="Pintu" />
                    <CheckItem id="kebersihan" label="Kebersihan" />
                  </div>
                  {/* PENUTUP GRID 2 KOLOM DI SINI */}

                  {/* KOTAK CATATAN DI LUAR GRID BIAR FULL WIDTH */}
                  {adaKurang && (
                    <div className="mt-4 flex-grow flex flex-col bg-amber-50 p-4 rounded-xl border-2 border-amber-300 shadow-sm transition-all animate-[fadeIn_0.3s]">
                      <label className="text-[11px] font-black text-amber-800 uppercase tracking-wider block mb-2">Catatan Kerusakan (Wajib)</label>
                      <textarea
                        required
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        className="flex-grow w-full min-h-[120px] p-3 border border-amber-300 rounded-lg text-sm text-slate-700 font-medium outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-shadow resize-none"
                        placeholder="Jelaskan detail komponen yang kurang berfungsi atau rusak..."
                      ></textarea>
                    </div>
                  )}
                </div>
            </div>

            {activeCP === 1 &&
              (cpToConfirm === 1 ? (
                <div className="mt-6 p-4 bg-[#FCE8E6] border-2 border-[#C5221F] rounded-xl shadow-sm">
                  <p className="text-sm font-bold text-[#C5221F] mb-3">Tunggu! Pastikan angka Odometer ({odoAwal} KM) dan Nopol sudah benar. Data tidak bisa diubah setelah terkirim!</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={submitCP1} disabled={isProcessing} className="flex-1 bg-[#C5221F] text-white font-black py-3 rounded-lg shadow-md">
                      Ya, Kirim Permanen
                    </button>
                    <button type="button" onClick={() => setCpToConfirm(null)} className="flex-1 bg-white text-[#C5221F] font-bold py-3 rounded-lg border-2 border-[#C5221F]">
                      Batal / Cek Lagi
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!isCP1Ready || isProcessing}
                  className={`w-full mt-6 py-4 rounded-xl font-black text-white transition-all shadow-md ${isCP1Ready ? "bg-[#00206B]" : "bg-slate-300"}`}
                >
                  KIRIM CP 1 & CATAT JAM KELUAR
                </button>
              ))}
          </form>
        )}
      </div>

      {/* 🔴 CHECK POINT 2: TIBA DI TITIK FINISH 🔴 */}
      <div className={`border rounded-xl bg-white transition-all ${activeCP === 2 ? "border-[#00206B] shadow-md" : "border-slate-200"}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className={`font-black text-sm tracking-wide ${activeCP >= 2 ? "text-[#00206B]" : "text-slate-400"}`}>CHECK POINT 2: TIBA DI TITIK FINISH</h3>
          {activeCP > 2 && <span className="text-emerald-600 font-black text-sm">✓</span>}
        </div>
        {activeCP >= 2 && (
          <form onSubmit={(e) => handlePreSubmit(e, 2)} className={`p-6 grid grid-cols-1 md:grid-cols-2 gap-6 ${activeCP > 2 ? "opacity-60 pointer-events-none" : ""}`}>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">ODOMETER SEKOLAH (KM)</label>
              <input type="number" required value={odo3} onChange={(e) => setOdo3(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg font-bold text-[#00206B]" placeholder="0" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">TOTAL SISWA DIANGKUT</label>
              <input
                type="number"
                required
                value={penumpang}
                onChange={(e) => setPenumpang(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg font-bold text-[#00206B]"
                placeholder="0"
              />
            </div>

            {activeCP === 2 && (
              <div className="col-span-1 md:col-span-2">
                {cpToConfirm === 2 ? (
                  <div className="mt-2 p-4 bg-[#FCE8E6] border-2 border-[#C5221F] rounded-xl shadow-sm">
                    <p className="text-sm font-bold text-[#C5221F] mb-3">
                      Odometer Akhir {odo3} KM & Jumlah {penumpang} Siswa. Data Benar?
                    </p>
                    <div className="flex gap-3">
                      <button type="button" onClick={submitCP3} disabled={isProcessing} className="flex-1 bg-[#C5221F] text-white font-bold py-2 rounded-lg cursor-pointer">
                        Kirim Permanen
                      </button>
                      <button type="button" onClick={() => setCpToConfirm(null)} className="flex-1 bg-white text-[#C5221F] font-bold py-2 rounded-lg border border-[#C5221F] cursor-pointer">
                        Cek Lagi
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="submit" className="w-full mt-2 bg-[#00206B] text-white font-bold py-3 rounded-lg shadow-md cursor-pointer">
                    SIMPAN & CATAT WAKTU SELESAI
                  </button>
                )}
              </div>
            )}
          </form>
        )}
      </div>

      {/* 🔴 CHECK POINT 3: KEMBALI KE DISHUB 🔴 */}
      <div className={`border rounded-xl bg-white transition-all ${activeCP === 3 ? "border-[#C5221F] shadow-md" : "border-slate-200"}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className={`font-black text-sm tracking-wide ${activeCP >= 3 ? "text-[#00206B]" : "text-slate-400"}`}>CHECK POINT 3: KEMBALI KE DISHUB</h3>
        </div>
        {activeCP === 3 && (
          <form onSubmit={(e) => handlePreSubmit(e, 3)} className="p-6 space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">ODOMETER AKHIR GARASI (KM)</label>
              <input
                type="number"
                required
                value={odo4}
                onChange={(e) => setOdo4(e.target.value)}
                className="w-full md:w-1/2 p-3 border border-slate-200 rounded-lg font-bold text-[#00206B]"
                placeholder="0"
              />
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:w-1/2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">FOTO WAJAH AKHIR SHIFT</span>
              {isCameraOpen ? (
                <LiveCamera
                  onCapture={(img) => {
                    setPhotoPreview(img);
                    setIsPhotoSaved(true);
                    setIsCameraOpen(false);
                  }}
                  onCancel={() => setIsCameraOpen(false)}
                />
              ) : !isPhotoSaved ? (
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full aspect-[3/4] max-w-sm mx-auto flex flex-col items-center justify-center border-2 border-dashed border-[#00206B] text-[#00206B] bg-blue-50 font-bold hover:bg-blue-100 transition cursor-pointer"
                >
                  Buka Kamera Akhir
                </button>
              ) : (
                <div className="relative w-full aspect-[3/4] max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-emerald-500">
                  <img src={photoPreview} alt="Selfie" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setIsCameraOpen(true)} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-xs font-bold px-4 py-2 rounded-full shadow-lg cursor-pointer">
                    Ulangi Foto
                  </button>
                </div>
              )}
            </div>

            {cpToConfirm === 3 ? (
              <div className="p-4 bg-[#FCE8E6] border-2 border-[#C5221F] rounded-xl shadow-sm">
                <p className="text-sm font-bold text-[#C5221F] mb-3">Tutup Laporan Harian dengan Odometer Garasi {odo4} KM?</p>
                <div className="flex gap-3">
                  <button type="button" onClick={submitCP4} disabled={isProcessing} className="flex-1 bg-[#C5221F] text-white font-black py-4 rounded-xl shadow-md cursor-pointer">
                    TUTUP SHIFT SEKARANG
                  </button>
                  <button type="button" onClick={() => setCpToConfirm(null)} className="flex-1 bg-white text-[#C5221F] font-bold py-4 rounded-xl border-2 border-[#C5221F] cursor-pointer">
                    BATAL
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!isPhotoSaved}
                className={`w-full py-4 rounded-xl shadow-md font-black text-white transition-all cursor-pointer ${!isPhotoSaved ? "bg-slate-300" : "bg-[#C5221F] hover:bg-red-800"}`}
              >
                SUBMIT FINAL & TUTUP SHIFT
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default LaporanDriver;
