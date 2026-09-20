import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import UserDriverTable from "./manage-driver/components/UserDriverTable";
import UserDriverModal from "./manage-driver/components/UserDriverModal";
import PenugasanTable from "./manage-driver/components/PenugasanTable";
import PenugasanModal from "./manage-driver/components/PenugasanModal";
import DeleteDriverModal from "./manage-driver/components/DeleteDriverModal";
import BatalOperasionalModal from "./manage-driver/components/BatalOperasionalModal";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import { getTodayDateStr, sanitizeTime } from "../../utils/dateUtils";

const initialPenugasanForm = {
  id_supir: "",
  tanggal: getTodayDateStr(),
  nopol_kendaraan: "",
  jenis_kendaraan: "",
  kapasitas_penumpang: "",
  trayek: "",
  tipe_sesi: "SEMUA",
  jam_pengisian_pagi: "06:00",
  batas_keluar_pagi: "06:30",
  batas_kembali_pagi: "08:00",
  jam_pengisian_siang: "13:00",
  batas_keluar_siang: "13:30",
  batas_kembali_siang: "14:30",
};

// ==============================================================================
// KOMPONEN: MANAGE DRIVER (MANAJEMEN AKUN PENGEMUDI & PENUGASAN HARIAN ARMADA)
// ==============================================================================
const ManageDriver = () => {
  const [activeTab, setActiveTab] = useState("penugasan");
  const [drivers, setDrivers] = useState([]);
  const [penugasanList, setPenugasanList] = useState([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [isLoadingPenugasan, setIsLoadingPenugasan] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(5);

  // Ambil profil admin yang sedang login untuk auto-fill email verifikasi
  const savedAdminUser = JSON.parse(localStorage.getItem("siclus_user") || "{}");
  const currentAdminEmail = savedAdminUser?.email || "";

  // Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    const msgStr = typeof message === "string" ? message : JSON.stringify(message);
    setToast({ show: true, message: msgStr, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  // Driver Modals State
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [isEditDriverMode, setIsEditDriverMode] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverToDelete, setDriverToDelete] = useState(null);

  // Penugasan Modals State
  const [showPenugasanModal, setShowPenugasanModal] = useState(false);
  const [isEditPenugasanMode, setIsEditPenugasanMode] = useState(false);
  const [editPenugasanId, setEditPenugasanId] = useState(null);
  const [formPenugasan, setFormPenugasan] = useState(initialPenugasanForm);
  const [penugasanToDelete, setPenugasanToDelete] = useState(null);
  const [penugasanToBatal, setPenugasanToBatal] = useState(null);

  // Auto-cancel countdown khusus modal konfirmasi hapus penugasan
  useEffect(() => {
    if (!penugasanToDelete) {
      setDeleteCountdown(5);
      return;
    }

    setDeleteCountdown(5);
    const timer = setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPenugasanToDelete(null);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [penugasanToDelete]);

  // =========================================================================
  // FETCH DATA
  // =========================================================================
  const fetchDrivers = async () => {
    setIsLoadingDrivers(true);
    try {
      const res = await apiService.getUsersAdmin();
      let dataSupir = [];
      if (Array.isArray(res)) {
        dataSupir = res;
      } else if (res && Array.isArray(res.data)) {
        dataSupir = res.data;
      } else if (res && res.users && Array.isArray(res.users)) {
        dataSupir = res.users;
      }
      setDrivers(dataSupir);
    } catch (error) {
      console.error("Gagal menarik data driver:", error);
      setDrivers([]);
      const errMsg = error.response?.data?.detail || error.message || "Gagal menarik data driver";
      showToast(typeof errMsg === "string" ? errMsg : "Gagal menarik data driver", "error");
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  const fetchPenugasan = async (silent = false) => {
    if (!silent) setIsLoadingPenugasan(true);
    try {
      const res = await apiService.getSemuaPenugasan();
      const data = res?.data || (Array.isArray(res) ? res : []);
      setPenugasanList(data);
    } catch (err) {
      console.error("Gagal mengambil data penugasan:", err);
      if (!silent) setPenugasanList([]);
    } finally {
      if (!silent) setIsLoadingPenugasan(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchDrivers(), fetchPenugasan(true)]);
      showToast("Data penugasan dan driver berhasil diperbarui!", "success");
    } catch {
      showToast("Gagal memperbarui data.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchPenugasan();

    // 1. Auto-revalidate saat admin kembali memfokuskan tab browser
    const handleRevalidate = () => {
      if (document.visibilityState === "visible") {
        fetchDrivers();
        fetchPenugasan();
      }
    };

    window.addEventListener("focus", handleRevalidate);
    document.addEventListener("visibilitychange", handleRevalidate);

    // 2. Interval background sync berkala
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchDrivers();
        fetchPenugasan();
      }
    }, 45000);

    return () => {
      window.removeEventListener("focus", handleRevalidate);
      document.removeEventListener("visibilitychange", handleRevalidate);
      clearInterval(intervalId);
    };
  }, []);

  // ==============================================================================
  // HANDLER: OPERASI DATA AKUN DRIVER (TAMBAH, EDIT, HAPUS)
  // ==============================================================================
  const handleOpenAddDriver = () => {
    setIsEditDriverMode(false);
    setSelectedDriver(null);
    setShowDriverModal(true);
  };

  const handleOpenEditDriver = (driver) => {
    setIsEditDriverMode(true);
    setSelectedDriver(driver);
    setShowDriverModal(true);
  };

  const handleSubmitDriverForm = async (formData) => {
    const idDriverTrimmed = (formData.id_driver || "").trim();
    if (!idDriverTrimmed || idDriverTrimmed === "DRV-") {
      showToast("Mohon lengkapi ID Driver setelah 'DRV-'! (Bebas terserah admin)", "error");
      return;
    }
    if (!formData.nama_lengkap?.trim()) {
      showToast("Nama lengkap driver wajib diisi!", "error");
      return;
    }
    if (!formData.email?.trim()) {
      showToast("Email akun driver wajib diisi!", "error");
      return;
    }
    if (!formData.email.trim().toLowerCase().endsWith("@siclus.id")) {
      showToast("Email driver wajib berakhiran @siclus.id (contoh: budi@siclus.id)!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditDriverMode && selectedDriver) {
        const targetId = selectedDriver.id || selectedDriver._id || selectedDriver.id_supir || formData.id_driver;
        const payload = {
          id: formData.id_driver || targetId,
          id_driver: formData.id_driver || targetId,
          nama_lengkap: formData.nama_lengkap.trim(),
          email: formData.email.trim(),
          role: "driver",
        };
        if (formData.password && formData.password.trim() !== "") {
          payload.password = formData.password;
        }

        await apiService.updateUserAdmin(targetId, payload);
        showToast(`Data driver ${payload.nama_lengkap} berhasil diperbarui!`);
      } else {
        if (!formData.password || formData.password.trim().length < 8) {
          showToast("Password driver minimal 8 karakter!", "error");
          setIsSubmitting(false);
          return;
        }

        const payload = {
          id: idDriverTrimmed,
          id_driver: idDriverTrimmed,
          nama_lengkap: formData.nama_lengkap.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: "driver",
        };

        await apiService.createUserAdmin(payload);
        showToast(`Driver ${payload.nama_lengkap} (${payload.id}) berhasil ditambahkan!`);
      }

      setShowDriverModal(false);
      fetchDrivers();
    } catch (err) {
      console.error("Gagal simpan user driver:", err);
      let errorMsg = "Gagal memproses data driver. Periksa koneksi/data.";
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(", ");
        } else if (typeof err.response.data.detail === "string") {
          errorMsg = err.response.data.detail;
        }
      }
      showToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteDriver = async ({ email_admin, password_admin }) => {
    if (!driverToDelete) return;
    setIsSubmitting(true);
    try {
      const targetId = driverToDelete.id || driverToDelete._id || driverToDelete.id_supir;
      await apiService.deleteUserAdmin(targetId, {
        email_admin: email_admin.trim(),
        password_admin: password_admin,
      });
      showToast(`Akun driver ${driverToDelete.nama_lengkap || driverToDelete.nama || driverToDelete.name} berhasil dihapus!`);
      setDriverToDelete(null);
      fetchDrivers();
    } catch (err) {
      console.error("Gagal hapus user driver:", err);
      let errorMsg = "Gagal menghapus driver";
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          errorMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map((d) => d.msg).join(", ");
        }
      }
      showToast(errorMsg, "error");
      throw err; // Lempar error agar DeleteDriverModal menampilkan pesan error inline
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================================================================
  // HANDLER: OPERASI DATA PENUGASAN KENDARAAN & JADWAL DISHUB
  // ==============================================================================
  const handleOpenAddPenugasan = () => {
    setIsEditPenugasanMode(false);
    setEditPenugasanId(null);
    setFormPenugasan({
      ...initialPenugasanForm,
      tanggal: getTodayDateStr(),
      id_supir: "",
    });
    setShowPenugasanModal(true);
  };

  const handleOpenEditPenugasan = (p) => {
    if (p.status_operasional === "BERJALAN") {
      showToast("Penugasan ini terkunci karena driver sedang aktif beroperasi di rute.", "error");
      fetchPenugasan(true);
      return;
    }
    if (p.status_operasional === "SELESAI") {
      showToast("Penugasan ini terkunci karena operasional hari ini telah selesai.", "error");
      fetchPenugasan(true);
      return;
    }

    setIsEditPenugasanMode(true);
    setEditPenugasanId(p.id);
    setFormPenugasan({
      id_supir: p.id_supir || "",
      tanggal: p.tanggal || new Date().toISOString().split("T")[0],
      nopol_kendaraan: p.nopol_kendaraan || "",
      jenis_kendaraan: p.jenis_kendaraan || "",
      kapasitas_penumpang: p.kapasitas_penumpang || "",
      trayek: p.trayek || "",
      tipe_sesi: p.tipe_sesi || "SEMUA",
      jam_pengisian_pagi: p.jadwal_pagi?.jam_formulir_pengisian ? String(p.jadwal_pagi.jam_formulir_pengisian).slice(0, 5) : "06:00",
      batas_keluar_pagi: p.jadwal_pagi?.batas_keluar_dishub ? String(p.jadwal_pagi.batas_keluar_dishub).slice(0, 5) : "06:30",
      batas_kembali_pagi: p.jadwal_pagi?.batas_tiba_start ? String(p.jadwal_pagi.batas_tiba_start).slice(0, 5) : (p.jadwal_pagi?.batas_kembali_dishub ? String(p.jadwal_pagi.batas_kembali_dishub).slice(0, 5) : "08:00"),
      jam_pengisian_siang: p.jadwal_siang?.jam_formulir_pengisian ? String(p.jadwal_siang.jam_formulir_pengisian).slice(0, 5) : "13:00",
      batas_keluar_siang: p.jadwal_siang?.batas_keluar_dishub ? String(p.jadwal_siang.batas_keluar_dishub).slice(0, 5) : "13:30",
      batas_kembali_siang: p.jadwal_siang?.batas_tiba_start ? String(p.jadwal_siang.batas_tiba_start).slice(0, 5) : (p.jadwal_siang?.batas_kembali_dishub ? String(p.jadwal_siang.batas_kembali_dishub).slice(0, 5) : "14:30"),
    });
    setShowPenugasanModal(true);
  };

  const handleSubmitPenugasanForm = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formPenugasan.id_supir) {
      showToast("Pilih supir terlebih dahulu!", "error");
      return;
    }
    if (!formPenugasan.tanggal) {
      showToast("Pilih tanggal penugasan terlebih dahulu!", "error");
      return;
    }
    const platRegex = /^[A-Z]{1,2}\s[0-9]{1,4}(\s[A-Z]{1,3})?$/;
    if (!formPenugasan.nopol_kendaraan || !platRegex.test(formPenugasan.nopol_kendaraan.trim())) {
      showToast("Format plat nomor belum sesuai! Contoh: W 7689 NBH atau B 1234 CD", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id_supir: formPenugasan.id_supir,
        tanggal: formPenugasan.tanggal,
        nopol_kendaraan: (formPenugasan.nopol_kendaraan || "").trim().toUpperCase(),
        jenis_kendaraan: (formPenugasan.jenis_kendaraan || "").trim().toUpperCase(),
        kapasitas_penumpang: Math.min(60, Math.max(1, parseInt(formPenugasan.kapasitas_penumpang, 10) || 0)),
        trayek: (formPenugasan.trayek || "").trim().toUpperCase(),
        tipe_sesi: formPenugasan.tipe_sesi || "SEMUA",
        jadwal_pagi: {
          jam_formulir_pengisian: sanitizeTime(formPenugasan.jam_pengisian_pagi),
          batas_keluar_dishub: sanitizeTime(formPenugasan.batas_keluar_pagi),
          batas_kembali_dishub: sanitizeTime(formPenugasan.batas_kembali_pagi),
        },
        jadwal_siang: {
          jam_formulir_pengisian: sanitizeTime(formPenugasan.jam_pengisian_siang),
          batas_keluar_dishub: sanitizeTime(formPenugasan.batas_keluar_siang),
          batas_kembali_dishub: sanitizeTime(formPenugasan.batas_kembali_siang),
        },
      };

      if (isEditPenugasanMode && editPenugasanId) {
        await apiService.updatePenugasanHarian(editPenugasanId, payload);
        showToast("Penugasan kendaraan & jadwal cut-off berhasil diperbarui!");
      } else {
        await apiService.createPenugasanHarian(payload);
        showToast("Penugasan kendaraan & jadwal cut-off berhasil disimpan!");
      }

      setShowPenugasanModal(false);
      setIsEditPenugasanMode(false);
      setEditPenugasanId(null);
      fetchPenugasan();
    } catch (err) {
      console.error("Gagal simpan penugasan & jadwal:", err);
      const errMsg = err.response?.data?.detail || err.message || "Gagal menyimpan penugasan";
      const errStr = typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg);
      showToast(errStr, "error");

      // Auto-close modal dan refresh tabel jika penugasan terkunci karena driver sudah operasional
      if (
        errStr.toLowerCase().includes("telah mengirim") ||
        errStr.toLowerCase().includes("telah memulai") ||
        errStr.toLowerCase().includes("terkunci") ||
        errStr.toLowerCase().includes("operasional")
      ) {
        setShowPenugasanModal(false);
        setIsEditPenugasanMode(false);
        setEditPenugasanId(null);
        fetchPenugasan(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeletePenugasan = async () => {
    if (!penugasanToDelete) return;
    setIsSubmitting(true);
    try {
      await apiService.deletePenugasanHarian(penugasanToDelete.id);
      showToast("Penugasan kendaraan berhasil dihapus!");
      setPenugasanToDelete(null);
      fetchPenugasan();
    } catch (err) {
      console.error("Gagal menghapus penugasan:", err);
      const errMsg = err.response?.data?.detail || err.message || "Gagal menghapus penugasan";
      const errStr = typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg);
      showToast(errStr, "error");

      if (
        errStr.toLowerCase().includes("telah memulai") ||
        errStr.toLowerCase().includes("telah mengirim") ||
        errStr.toLowerCase().includes("operasional")
      ) {
        setPenugasanToDelete(null);
        fetchPenugasan(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBatalkanPenugasan = async () => {
    if (!penugasanToBatal) return;
    setIsSubmitting(true);
    try {
      await apiService.batalkanOperasionalPenugasan(penugasanToBatal.id);
      showToast("Sisa operasional berhasil dibatalkan. Driver kini berstatus Selesai & Siaga.");
      setPenugasanToBatal(null);
      fetchPenugasan();
    } catch (err) {
      console.error("Gagal membatalkan operasional:", err);
      const errMsg = err.response?.data?.detail || err.message || "Gagal membatalkan operasional";
      showToast(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3.5 text-left max-w-6xl mx-auto pb-8 animate-[fadeIn_0.3s]">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm border animate-[slideDown_0.2s] ${
            toast.type === "success"
              ? "bg-[#E6F7ED] border-[#BCECD2] text-[#137333]"
              : "bg-[#FCE8E6] border-[#FAD2CF] text-[#C5221F]"
          }`}
        >
          {toast.type === "success" ? (
            <svg className="w-5 h-5 text-[#137333] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-[#C5221F] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#00206B] tracking-tight m-0">Kelola Driver</h2>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Manajemen akun driver dan konfigurasi toleransi waktu cut-off operasional
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isLoadingDrivers || isLoadingPenugasan || isRefreshing}
          className="self-start sm:self-auto flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-700 px-4 py-2 rounded-xl font-semibold text-xs shadow-xs hover:shadow-sm hover:shadow-blue-500/10 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          title="Segarkan data penugasan dan akun driver"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : "text-blue-600"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRefreshing ? "Memperbarui..." : "Segarkan Data"}
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="inline-flex self-start p-1 bg-slate-100/90 border border-slate-200/80 rounded-2xl gap-1 shadow-2xs backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setActiveTab("penugasan")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === "penugasan"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
          }`}
        >
          <span>Penugasan & Jadwal</span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
              activeTab === "penugasan"
                ? "bg-white/20 text-white"
                : "bg-white text-slate-600 border border-slate-200/80"
            }`}
          >
            {(penugasanList || []).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("supir")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === "supir"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
          }`}
        >
          <span>Daftar Akun Driver</span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
              activeTab === "supir"
                ? "bg-white/20 text-white"
                : "bg-white text-slate-600 border border-slate-200/80"
            }`}
          >
            {(drivers || []).length}
          </span>
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === "supir" ? (
        <UserDriverTable
          drivers={drivers}
          isLoading={isLoadingDrivers}
          onAddDriver={handleOpenAddDriver}
          onEditDriver={handleOpenEditDriver}
          onDeleteDriver={(driver) => setDriverToDelete(driver)}
        />
      ) : (
        <PenugasanTable
          penugasanList={penugasanList}
          drivers={drivers}
          isLoading={isLoadingPenugasan}
          onAddPenugasan={handleOpenAddPenugasan}
          onEditPenugasan={handleOpenEditPenugasan}
          onDeletePenugasan={(penugasan) => setPenugasanToDelete(penugasan)}
          onBatalkanPenugasan={(penugasan) => setPenugasanToBatal(penugasan)}
        />
      )}

      {/* Modal: User Driver Form (Add / Edit) */}
      <UserDriverModal
        isOpen={showDriverModal}
        isEdit={isEditDriverMode}
        initialData={selectedDriver}
        drivers={drivers}
        isSubmitting={isSubmitting}
        onClose={() => setShowDriverModal(false)}
        onSubmit={handleSubmitDriverForm}
      />

      {/* Modal: Penugasan Form (Add / Edit) */}
      <PenugasanModal
        isOpen={showPenugasanModal}
        isEdit={isEditPenugasanMode}
        formPenugasan={formPenugasan}
        setFormPenugasan={setFormPenugasan}
        drivers={drivers}
        isSubmitting={isSubmitting}
        onClose={() => setShowPenugasanModal(false)}
        onSubmit={handleSubmitPenugasanForm}
      />

      {/* Modal: Delete Driver Confirmation dengan Pengamanan Kredensial Admin */}
      <DeleteDriverModal
        isOpen={Boolean(driverToDelete)}
        driver={driverToDelete}
        currentAdminEmail={currentAdminEmail}
        isSubmitting={isSubmitting}
        onClose={() => setDriverToDelete(null)}
        onConfirm={handleConfirmDeleteDriver}
      />

      {/* Modal: Batalkan Operasional Driver (Amankan SPJ & Laporan) */}
      <BatalOperasionalModal
        isOpen={Boolean(penugasanToBatal)}
        penugasan={penugasanToBatal}
        isSubmitting={isSubmitting}
        onClose={() => setPenugasanToBatal(null)}
        onConfirm={handleConfirmBatalkanPenugasan}
      />

      {/* Modal: Delete Penugasan Confirmation */}
      <DeleteConfirmModal
        isOpen={Boolean(penugasanToDelete)}
        title="Hapus Penugasan Kendaraan?"
        description={
          penugasanToDelete ? (
            <>
              Apakah Anda yakin ingin membatalkan & menghapus penugasan untuk{" "}
              <span className="font-semibold text-rose-600">
                {penugasanToDelete.users?.nama || penugasanToDelete.id_supir}
              </span>{" "}
              pada tanggal <span className="font-semibold text-slate-700">{penugasanToDelete.tanggal}</span>? Tindakan ini
              tidak dapat dibatalkan.
            </>
          ) : null
        }
        countdown={deleteCountdown}
        isSubmitting={isSubmitting}
        onClose={() => setPenugasanToDelete(null)}
        onConfirm={handleConfirmDeletePenugasan}
      />
    </div>
  );
};

export default ManageDriver;

