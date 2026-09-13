import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../../services/api";
import toast from 'react-hot-toast';
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
    let isMounted = true;
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (!isMounted) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) {
        if (!isMounted) return;
        toast.error("Akses kamera ditolak!", { id: "camera-access-error" });
        onCancel();
      }
    };
    startCamera();
    return () => {
      isMounted = false;
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
      <div className="relative w-full aspect-[3/4] max-w-xs mx-auto bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="flex gap-2 w-full max-w-xs mx-auto">
        <button
          type="button"
          onClick={takePhoto}
          className="flex-1 bg-[#00206B] hover:bg-[#00174E] text-white font-semibold py-2.5 rounded-xl shadow-xs text-xs cursor-pointer transition-colors"
        >
          Ambil Foto
        </button>
        <button
          type="button"
          onClick={() => {
            if (stream) stream.getTracks().forEach((t) => t.stop());
            onCancel();
          }}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-colors"
        >
          Batal
        </button>
      </div>
    </div>
  );
};

const LaporanDriver = ({ user: propUser, onFinishShift }) => {
  const navigate = useNavigate();
  const [activeShift, setActiveShift] = useState("pagi");
  const [isAllShiftDone, setIsAllShiftDone] = useState(false);

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
    trayek: profileData?.trayek || "",
    jenis_kendaraan: profileData?.jenis_kendaraan || "",
    nomer_kendaraan: profileData?.nomer_kendaraan || "",
    kapasitas: profileData?.kapasitas || "",
  }), [profileData, propUser]);

  useEffect(() => {
    let isMounted = true;

    const fetchLatestProfile = async () => {
      try {
        const resProfile = await apiService.getProfilDriver();
        if (!isMounted) return;
        const dataProfile = resProfile?.data || resProfile;
        
        let dataPenugasan = {};
        try {
          const resPenugasan = await apiService.getPenugasanHariIni();
          if (!isMounted) return;

          const penugasanList = resPenugasan?.penugasan_list || (resPenugasan?.data ? [resPenugasan.data] : []);
          const activeId = localStorage.getItem("siclus_active_penugasan_id");
          let currentTask = null;
          if (activeId) {
            currentTask = penugasanList.find((p) => String(p.id) === String(activeId));
          }
          if (!currentTask) {
            currentTask = resPenugasan?.data || (penugasanList.length > 0 ? penugasanList[0] : null);
          }

          if (currentTask) {
            dataPenugasan = currentTask;
            localStorage.setItem("siclus_active_penugasan_id", String(currentTask.id));
          } else {
             // Jika tidak ada penugasan, cek apakah ada draft aktif yang terputus
             const hadDraft = Boolean(
               localStorage.getItem("siclus_draft_step") ||
               localStorage.getItem("siclus_draft_form") ||
               localStorage.getItem("siclus_active_laporan_id")
             );

             localStorage.removeItem("siclus_draft_step");
             localStorage.removeItem("siclus_draft_form");
             localStorage.removeItem("siclus_active_laporan_id");

             const alertMsg = hadDraft
               ? "Penugasan Anda telah dibatalkan atau diubah oleh Admin. Silakan periksa beranda."
               : "Belum ada penugasan kendaraan untuk Anda hari ini. Silakan periksa beranda.";

             toast.error(alertMsg, { id: "penugasan-driver-alert" });
             navigate("/driver/beranda", { replace: true });
             return; // Hentikan proses
          }
        } catch (error) {
           console.log("Belum ada penugasan hari ini.");
        }

        if (dataProfile && isMounted) {
          setProfileData((prev) => {
            const updated = {
              ...prev,
              ...dataProfile,
              trayek: dataPenugasan.trayek || "-",
              jenis_kendaraan: dataPenugasan.jenis_kendaraan || "-",
              nomer_kendaraan: dataPenugasan.nopol_kendaraan || "-",
              kapasitas: dataPenugasan.kapasitas_penumpang || "-",
            };
            
            try {
              localStorage.setItem("siclus_user", JSON.stringify(updated));
            } catch (err) {
              console.warn(err);
            }
            return updated;
          });
        }

        // Sinkronisasi Laporan Hari Ini dari Backend (spesifik untuk penugasan terpilih)
        try {
          const activeLapId = localStorage.getItem("siclus_active_laporan_id");
          const resLaporan = await apiService.getLaporanHariIni({
            trayek: dataPenugasan.trayek || "",
            bus: dataPenugasan.nopol_kendaraan || "",
            laporan_id: activeLapId || undefined,
          });
          const reportData = resLaporan?.data || resLaporan;
          if (reportData && reportData.id) {
            setLaporanId(reportData.id);
            localStorage.setItem("siclus_active_laporan_id", String(reportData.id));

            // Cek status sesi Pagi dan Siang dari riwayat nyata backend
            const sessions = Array.isArray(reportData.trip_sessions) ? reportData.trip_sessions : [];
            const hasFinishedPagi = sessions.some(
              (s) => (s?.tipe_sesi || "").toLowerCase() === "pagi" && Boolean(s?.km_tiba_kantor)
            );
            const hasFinishedSiang = sessions.some(
              (s) => (s?.tipe_sesi || "").toLowerCase() === "siang" && Boolean(s?.km_tiba_kantor)
            );

            if (hasFinishedPagi && hasFinishedSiang) {
              setIsAllShiftDone(true);
              setActiveShift("selesai");
              setActiveCP(4);
            } else {
              setIsAllShiftDone(false);
              const effectiveShift = hasFinishedPagi ? "siang" : "pagi";
              setActiveShift(effectiveShift);

              const currentShiftSession = sessions.find(
                (s) => (s?.tipe_sesi || "").toLowerCase() === effectiveShift.toLowerCase()
              );

              if (currentShiftSession) {
                setSesiId(currentShiftSession.id);
                if (currentShiftSession.km_tiba_kantor) {
                  // Sesi ini sudah selesai tuntas
                  setActiveCP(4);
                } else if (currentShiftSession.km_tiba_finish) {
                  setActiveCP(3);
                  localStorage.setItem("siclus_draft_step", "3");
                } else if (currentShiftSession.km_berangkat_kantor) {
                  setActiveCP(2);
                  localStorage.setItem("siclus_draft_step", "2");
                } else {
                  setActiveCP(1);
                  localStorage.setItem("siclus_draft_step", "1");
                }
              } else {
                setActiveCP(1);
                localStorage.setItem("siclus_draft_step", "1");
              }
            }
          } else if (dataPenugasan && dataPenugasan.trayek) {
            const localNow = new Date();
            const todayStr = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, "0")}-${String(localNow.getDate()).padStart(2, "0")}`;
            const initRes = await apiService.mulaiLaporanHarian({
              tanggal: todayStr,
              trayek: dataPenugasan.trayek || "-",
              bus: dataPenugasan.nopol_kendaraan || "-",
            });
            const newReport = initRes?.data || initRes;
            if (newReport && newReport.id) {
              setLaporanId(newReport.id);
              localStorage.setItem("siclus_active_laporan_id", String(newReport.id));
            }
            setActiveCP(1);
          }
        } catch (errLaporan) {
          console.warn("Gagal auto-sinkronisasi laporan hari ini:", errLaporan);
        }
      } catch (err) {
        console.warn("Gagal sinkronisasi data profil driver:", err);
      }
    };

    fetchLatestProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // --- PERSISTENT DRAFT INITIALIZATION ---
  const getDraft = () => {
    const saved = localStorage.getItem("siclus_draft_form");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const localNow = new Date();
        const today = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, "0")}-${String(localNow.getDate()).padStart(2, "0")}`;
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

  // STATE UNTUK STEP AKTIF (CP1, CP2, CP3) - DEFAULT SELALU 1 (TAHAP 1 TERBUKA)
  const [activeCP, setActiveCP] = useState(() => {
    const savedStep = localStorage.getItem("siclus_draft_step");
    const parsed = savedStep ? parseInt(savedStep, 10) : 1;
    return parsed >= 1 && parsed <= 3 ? parsed : 1;
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [cpToConfirm, setCpToConfirm] = useState(null); // Fitur Safety Lock

  // STATE UNTUK DATA FORM / SESI / INSPEKSI
  const [laporanId, setLaporanId] = useState(() => {
    return localStorage.getItem("siclus_active_laporan_id") || initialDraft?.laporanId || null;
  });
  const [sesiId, setSesiId] = useState(() => initialDraft?.sesiId || null);

  // SINKRONISASI: Simpan laporanId ke localStorage jika ada
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
  const [photoPreview, setPhotoPreview] = useState(() => initialDraft?.photoPreview || null);
  const [isPhotoSaved, setIsPhotoSaved] = useState(() => initialDraft?.isPhotoSaved || false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // State Checklist Inspeksi (10 item seimbang: 5 kiri, 5 kanan)
  const [inspeksi, setInspeksi] = useState(() => initialDraft?.inspeksi || {
    rem: null,
    lampu: null,
    wiper: null,
    ban: null,
    kebersihan: null,
    ac: null,
    klakson: null,
    lampu_rem: null,
    pintu: null,
    mesin: null,
  });

  // AUTO-SAVE: Sinkronisasi step ke localStorage hanya jika sudah mulai
  useEffect(() => {
    if (activeCP > 0) {
      localStorage.setItem("siclus_draft_step", activeCP.toString());
    }
  }, [activeCP]);

  // AUTO-SAVE: Sinkronisasi field form ke localStorage
  useEffect(() => {
    if (activeCP === 0) return;
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
      try {
        localStorage.setItem("siclus_draft_form", JSON.stringify({ ...draftPayload, photoPreview: null }));
      } catch (err) {
        console.error("Gagal auto-save form:", err);
      }
    }
  }, [
    activeCP,
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

  const handleCeklis = (item, status) => setInspeksi((prev) => ({ ...prev, [item]: status }));
  const totalCeklis = Object.values(inspeksi).filter((val) => val !== null).length;
  const adaKurang = Object.values(inspeksi).includes("KURANG");

  // Logika Validasi (10 item lengkap)
  const isInspeksiValid = adaKurang ? totalCeklis === 10 && catatan.trim() !== "" : totalCeklis === 10;
  const isCP1Ready = isInspeksiValid && isPhotoSaved && odoAwal !== "" && Boolean(user?.nomer_kendaraan || nopol);

  const handlePreSubmit = (e, cpNumber) => {
    e.preventDefault();
    setCpToConfirm(cpNumber);
  };

  const submitCP1 = async () => {
    const activeLaporanId = laporanId || localStorage.getItem("siclus_active_laporan_id");
    if (!activeLaporanId) return toast.error("Sistem memuat ID Laporan. Silakan kembali ke Beranda dan klik Mulai Laporan.", { id: "load-laporan-id" });
    setIsProcessing(true);
    try {
      const fileFoto = dataURLtoFile(photoPreview, `selfie_awal.jpg`);
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(fileFoto, options);
      const uploadRes = await apiService.uploadSelfie(compressedFile);

      await apiService.submitInspeksi(activeLaporanId, { 
        ...inspeksi, 
        tipe_sesi: (activeShift || "pagi").toUpperCase(),
        catatan: adaKurang ? catatan : "" 
      });

      const platNomorFinal = user?.nomer_kendaraan || user?.bus || nopol || "-";
      const cp1Res = await apiService.submitCP1(activeLaporanId, {
        tipe_sesi: activeShift || "pagi",
        nopol_kendaraan: platNomorFinal,
        km_berangkat_kantor: parseInt(odoAwal),
        foto_awal: uploadRes.url_foto,
      });

      const newSesiId = cp1Res?.data?.id || cp1Res?.id;
      if (newSesiId) setSesiId(newSesiId);
      setCpToConfirm(null);
      setIsPhotoSaved(false);
      setPhotoPreview(null);
      setActiveCP(2);
    } catch (err) {
      toast.error("Gagal kirim CP1: " + (err.response?.data?.detail || err.message), { id: "cp1-error" });
      setCpToConfirm(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitCP2 = async () => {
    setIsProcessing(true);
    try {
      await apiService.submitCP2(sesiId, {
        km_tiba_finish: parseInt(odo3),
        jumlah_penumpang: parseInt(penumpang),
      });
      setIsPhotoSaved(false);
      setPhotoPreview(null);
      setCpToConfirm(null);
      setActiveCP(3);
    } catch (err) {
      toast.error("Gagal kirim CP2: " + (err.response?.data?.detail || err.message), { id: "cp2-error" });
      setCpToConfirm(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitCP3 = async () => {
    setIsProcessing(true);
    try {
      const fileFoto = dataURLtoFile(photoPreview, `selfie_akhir.jpg`);
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(fileFoto, options);
      const uploadRes = await apiService.uploadSelfie(compressedFile);

      await apiService.submitCP3(sesiId, {
        km_tiba_kantor: parseInt(odo4),
        foto_akhir: uploadRes.url_foto,
      });

      // Bersihkan draft lokal setelah tugas selesai
      localStorage.removeItem("siclus_draft_step");
      localStorage.removeItem("siclus_draft_form");

      const isSiangDone = activeShift === "siang";
      if (isSiangDone) {
        setIsAllShiftDone(true);
        setActiveShift("selesai");
        localStorage.removeItem("siclus_active_laporan_id");
      }

      toast.success(`Sesi ${activeShift === "siang" ? "Siang" : "Pagi"} Berhasil Ditutup!`, { id: "shift-finish-success" });
      if (onFinishShift) onFinishShift();
      navigate("/driver/beranda");
    } catch (err) {
      toast.error("Gagal kirim CP3: " + (err.response?.data?.detail || err.message), { id: "cp3-error" });
      setCpToConfirm(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const CheckItem = ({ id, label }) => (
    <div className="flex items-center justify-between bg-white border border-slate-200/80 p-2.5 rounded-xl shadow-2xs transition-colors">
      <span className="text-xs font-semibold text-slate-800 truncate pr-2">{label}</span>
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => handleCeklis(id, "OK")}
          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            inspeksi[id] === "OK"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
          }`}
        >
          OK
        </button>
        <button
          type="button"
          onClick={() => handleCeklis(id, "KURANG")}
          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            inspeksi[id] === "KURANG"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
          }`}
        >
          KURANG
        </button>
      </div>
    </div>
  );

  if (isAllShiftDone) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12 px-4 font-sans text-center animate-[fadeIn_0.3s]">
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_2px_15px_-3px_rgba(6,81,237,0.05)] space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 text-[#00206B] flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900 m-0 tracking-tight">Operasional Selesai</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Laporan operasional untuk rute {user?.trayek || "ini"} telah berhasil tercatat di sistem Dishub.
            </p>
          </div>

          <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 text-left space-y-2.5 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">Sesi Pagi</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                Selesai
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">Sesi Siang</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                Selesai
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("siclus_draft_step");
              localStorage.removeItem("siclus_draft_form");
              localStorage.removeItem("siclus_active_laporan_id");
              localStorage.removeItem("siclus_active_penugasan_id");
              navigate("/driver/beranda");
            }}
            className="w-full max-w-sm mx-auto bg-[#00206B] hover:bg-[#00174E] text-white font-semibold text-xs py-3.5 px-6 rounded-xl shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12 px-4 md:px-0 font-sans text-left">
      {/* Header Halaman */}
      <div className="pb-1">
        <h2 className="text-2xl font-bold text-slate-900 m-0 tracking-tight">Laporan Operasional</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5 tracking-wide">
          Sesi {activeShift === "siang" ? "Siang" : "Pagi"} • Formulir Operasional Perjalanan
        </p>
      </div>

      {/* ========================================================================= */}
      {/* TAHAP 1: KEBERANGKATAN DISHUB */}
      {/* ========================================================================= */}
      {activeCP === 1 ? (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_2px_15px_-3px_rgba(6,81,237,0.05)] overflow-hidden transition-all duration-300">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00206B]"></span>
              <h3 className="font-semibold text-slate-800 text-xs tracking-wide m-0">
                Tahap 1: Keberangkatan Dishub
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
              Sedang Diisi
            </span>
          </div>

          <form onSubmit={(e) => handlePreSubmit(e, 1)} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Kolom Kiri: Spesifikasi Armada, Odo, Foto */}
              <div className="space-y-4">
                {/* 4 Rincian Penugasan Armada */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Rincian Penugasan Armada
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Trayek</span>
                      <p className="text-xs font-bold text-[#00206B] mt-0.5 truncate">{user?.trayek || "-"}</p>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Jenis Kendaraan</span>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">{user?.jenis_kendaraan || user?.bus || "-"}</p>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Nomor Polisi</span>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">{user?.nomer_kendaraan || user?.bus || "-"}</p>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Kapasitas</span>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">{user?.kapasitas ? `${user.kapasitas} Penumpang` : "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Odometer Awal */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Odometer Awal (KM)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={odoAwal}
                      onChange={(e) => setOdoAwal(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] outline-none focus:border-[#00206B] focus:ring-1 focus:ring-[#00206B]/20"
                      placeholder="Contoh: 67008"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">KM</span>
                  </div>
                </div>

                {/* Selfie Awal */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Ambil Selfie Driver
                  </label>
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
                      className="w-full py-8 border-2 border-dashed border-slate-200 hover:border-[#00206B] text-slate-600 rounded-xl flex flex-col items-center justify-center gap-2 bg-slate-50/50 hover:bg-blue-50/30 transition-all cursor-pointer"
                    >
                      <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                      <span className="text-xs font-semibold text-[#00206B]">Buka Kamera Selfie</span>
                    </button>
                  ) : (
                    <div className="relative w-full max-w-xs mx-auto aspect-[3/4] rounded-xl overflow-hidden border border-emerald-300 shadow-sm">
                      <img src={photoPreview} alt="Selfie Awal" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xs text-xs font-semibold text-slate-700 px-3 py-1.5 rounded-full shadow-md hover:bg-white cursor-pointer"
                      >
                        Ulangi Foto
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Kolom Kanan: 10 Checklist Inspeksi Kendaraan (5 kiri, 5 kanan) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Inspeksi Kendaraan
                    </label>
                    <p className="text-[11px] text-slate-400 font-normal m-0">
                      Pemeriksaan kelayakan sebelum berangkat
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    totalCeklis === 10 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                  }`}>
                    {totalCeklis}/10 Terperiksa
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <CheckItem id="rem" label="Rem" />
                  <CheckItem id="lampu" label="Lampu" />
                  <CheckItem id="wiper" label="Wiper" />
                  <CheckItem id="ban" label="Ban" />
                  <CheckItem id="kebersihan" label="Kebersihan" />
                  <CheckItem id="ac" label="AC" />
                  <CheckItem id="klakson" label="Klakson" />
                  <CheckItem id="lampu_rem" label="Lampu Rem" />
                  <CheckItem id="pintu" label="Pintu Kendaraan" />
                  <CheckItem id="mesin" label="Mesin" />
                </div>

                {/* Input Catatan jika ada item KURANG */}
                {adaKurang && (
                  <div className="pt-2 animate-fadeIn">
                    <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                      Catatan Kendala (Wajib Diisi)
                    </label>
                    <textarea
                      value={catatan}
                      required
                      onChange={(e) => setCatatan(e.target.value)}
                      className="w-full min-h-[80px] p-3 border border-amber-300 rounded-xl text-xs text-slate-700 font-medium outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500/30"
                      placeholder="Jelaskan detail komponen yang kurang berfungsi atau rusak..."
                    ></textarea>
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Aksi / Konfirmasi CP 1 */}
            <div className="pt-6 border-t border-slate-100 mt-6">
              {cpToConfirm === 1 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
                  <p className="text-xs font-semibold text-slate-800 m-0">
                    Pastikan angka Odometer (<span className="font-bold text-[#00206B]">{odoAwal} KM</span>) dan kelengkapan armada sudah sesuai. Kirim data keberangkatan?
                  </p>
                  <div className="flex gap-2.5 max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={submitCP1}
                      disabled={isProcessing}
                      className="flex-1 bg-[#00206B] hover:bg-[#00174E] text-white font-semibold text-xs py-2.5 rounded-xl shadow-xs cursor-pointer"
                    >
                      {isProcessing ? "Mengirim..." : "Ya, Kirim Data"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCpToConfirm(null)}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!isCP1Ready || isProcessing}
                  className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                    isCP1Ready ? "bg-[#00206B] hover:bg-[#00174E] hover:shadow-md text-white" : "bg-slate-100 border border-slate-200/80 text-slate-400 cursor-not-allowed active:scale-100"
                  }`}
                >
                  <span>Kirim Laporan Keberangkatan</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>
      ) : activeCP > 1 ? (
        /* CP 1 Selesai: Collapsed dengan Badge Selesai */
        <div className="border border-slate-200/80 rounded-xl bg-slate-50/50 p-4 flex justify-between items-center transition-all">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
              ✓
            </span>
            <h3 className="font-semibold text-xs text-slate-800 m-0">
              Tahap 1: Keberangkatan Dishub
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500">Terkirim</span>
        </div>
      ) : (
        /* CP 1 Belum Mulai / Klik untuk Buka */
        <button
          type="button"
          onClick={() => setActiveCP(1)}
          className="w-full text-left border border-slate-200/80 rounded-xl bg-slate-50/70 p-4 flex justify-between items-center transition-all hover:bg-slate-100/70 cursor-pointer"
        >
          <h3 className="font-semibold text-xs text-slate-700 m-0">
            Tahap 1: Keberangkatan Dishub
          </h3>
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 2: TIBA DI TITIK AKHIR */}
      {/* ========================================================================= */}
      {activeCP === 2 ? (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_2px_15px_-3px_rgba(6,81,237,0.05)] overflow-hidden transition-all duration-300">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00206B]"></span>
              <h3 className="font-semibold text-slate-800 text-xs tracking-wide m-0">
                Tahap 2: Tiba di Titik Akhir
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
              Sedang Diisi
            </span>
          </div>

          <form onSubmit={(e) => handlePreSubmit(e, 2)} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Odometer Titik Akhir (KM)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={odo3}
                    onChange={(e) => setOdo3(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] outline-none focus:border-[#00206B] focus:ring-1 focus:ring-[#00206B]/20"
                    placeholder="Contoh: 67025"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">KM</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Jumlah Penumpang / Siswa
                </label>
                <input
                  type="number"
                  required
                  value={penumpang}
                  onChange={(e) => setPenumpang(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] outline-none focus:border-[#00206B] focus:ring-1 focus:ring-[#00206B]/20"
                  placeholder="Jumlah penumpang"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              {cpToConfirm === 2 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
                  <p className="text-xs font-semibold text-slate-800 m-0">
                    Odometer Titik Akhir: <span className="font-bold text-[#00206B]">{odo3} KM</span> & Penumpang: <span className="font-bold text-[#00206B]">{penumpang} orang</span>. Kirim data sekarang?
                  </p>
                  <div className="flex gap-2.5 max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={submitCP2}
                      disabled={isProcessing}
                      className="flex-1 bg-[#00206B] hover:bg-[#00174E] text-white font-semibold text-xs py-2.5 rounded-xl shadow-xs cursor-pointer"
                    >
                      {isProcessing ? "Mengirim..." : "Ya, Kirim Data"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCpToConfirm(null)}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!odo3 || !penumpang || isProcessing}
                  className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                    odo3 && penumpang ? "bg-[#00206B] hover:bg-[#00174E] hover:shadow-md text-white" : "bg-slate-100 border border-slate-200/80 text-slate-400 cursor-not-allowed active:scale-100"
                  }`}
                >
                  <span>Kirim Laporan Titik Akhir</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>
      ) : activeCP > 2 ? (
        /* CP 2 Selesai: Collapsed dengan Badge Selesai */
        <div className="border border-slate-200/80 rounded-xl bg-slate-50/50 p-4 flex justify-between items-center transition-all">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
              ✓
            </span>
            <h3 className="font-semibold text-xs text-slate-800 m-0">
              Tahap 2: Tiba di Titik Akhir
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500">Terkirim</span>
        </div>
      ) : (
        /* CP 2 Terkunci: Bar Abu-abu Tertutup */
        <div className="border border-slate-200/80 rounded-xl bg-slate-50/70 p-4 flex justify-between items-center transition-all cursor-not-allowed">
          <h3 className="font-semibold text-xs text-slate-400 m-0">
            Tahap 2: Tiba di Titik Akhir
          </h3>
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 3: KEMBALI KE DISHUB */}
      {/* ========================================================================= */}
      {activeCP === 3 ? (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_2px_15px_-3px_rgba(6,81,237,0.05)] overflow-hidden transition-all duration-300">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00206B]"></span>
              <h3 className="font-semibold text-slate-800 text-xs tracking-wide m-0">
                Tahap 3: Kembali ke Dishub
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
              Tahap Akhir
            </span>
          </div>

          <form onSubmit={(e) => handlePreSubmit(e, 3)} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Odometer Akhir (KM)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={odo4}
                    onChange={(e) => setOdo4(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] outline-none focus:border-[#00206B] focus:ring-1 focus:ring-[#00206B]/20"
                    placeholder="Contoh: 67050"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">KM</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Foto Selfie Pengemudi
                </label>
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
                    className="w-full py-6 border-2 border-dashed border-slate-200 hover:border-[#00206B] text-slate-600 rounded-xl flex flex-col items-center justify-center gap-1.5 bg-slate-50/50 hover:bg-blue-50/30 transition-all cursor-pointer"
                  >
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                    <span className="text-xs font-semibold text-[#00206B]">Buka Kamera Selfie Akhir</span>
                  </button>
                ) : (
                  <div className="relative w-full max-w-xs mx-auto aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={photoPreview} alt="Selfie Akhir" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xs text-xs font-semibold text-slate-700 px-3 py-1.5 rounded-full shadow-md hover:bg-white cursor-pointer"
                    >
                      Ulangi Foto
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              {cpToConfirm === 3 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
                  <p className="text-xs font-semibold text-slate-800 m-0">
                    Selesaikan operasional dengan Odometer Akhir: <span className="font-bold text-[#00206B]">{odo4} KM</span>?
                  </p>
                  <div className="flex gap-2.5 max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={submitCP3}
                      disabled={isProcessing}
                      className="flex-1 bg-[#00206B] hover:bg-[#00174E] text-white font-semibold text-xs py-2.5 rounded-xl shadow-xs cursor-pointer"
                    >
                      {isProcessing ? "Menutup..." : "Ya, Selesaikan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCpToConfirm(null)}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!odo4 || !isPhotoSaved || isProcessing}
                  className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                    odo4 && isPhotoSaved ? "bg-[#00206B] hover:bg-[#00174E] hover:shadow-md text-white" : "bg-slate-100 border border-slate-200/80 text-slate-400 cursor-not-allowed active:scale-100"
                  }`}
                >
                  <span>Selesaikan & Tutup Operasional</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>
      ) : activeCP > 3 ? (
        /* CP 3 Selesai: Collapsed dengan Badge Selesai */
        <div className="border border-slate-200/80 rounded-xl bg-slate-50/50 p-4 flex justify-between items-center transition-all">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
              ✓
            </span>
            <h3 className="font-semibold text-xs text-slate-800 m-0">
              Tahap 3: Kembali ke Dishub
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500">Terkirim</span>
        </div>
      ) : (
        /* CP 3 Terkunci: Bar Abu-abu Tertutup */
        <div className="border border-slate-200/80 rounded-xl bg-slate-50/70 p-4 flex justify-between items-center transition-all cursor-not-allowed">
          <h3 className="font-semibold text-xs text-slate-400 m-0">
            Tahap 3: Kembali ke Dishub
          </h3>
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default LaporanDriver;
