import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import UserDriverTable from "./manage-driver/components/UserDriverTable";
import UserDriverModal from "./manage-driver/components/UserDriverModal";
import PenugasanTable from "./manage-driver/components/PenugasanTable";
import PenugasanModal from "./manage-driver/components/PenugasanModal";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import { sanitizeTime } from "../../components/common/TimePickerInput";
import { getTodayDateStr } from "../../utils/dateUtils";

const initialPenugasanForm = {
  id_supir: "",
  tanggal: getTodayDateStr(),
  nopol_kendaraan: "",
  jenis_kendaraan: "",
  kapasitas_penumpang: "",
  trayek: "",
  jam_pengisian_pagi: "06:00",
  batas_keluar_pagi: "06:30",
  batas_kembali_pagi: "08:00",
  jam_pengisian_siang: "13:00",
  batas_keluar_siang: "13:30",
  batas_kembali_siang: "14:30",
};

const ManageDriver = () => {
  const [activeTab, setActiveTab] = useState("penugasan");
  const [drivers, setDrivers] = useState([]);
  const [penugasanList, setPenugasanList] = useState([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [isLoadingPenugasan, setIsLoadingPenugasan] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(5);

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

  // Auto-cancel countdown untuk modal konfirmasi hapus
  useEffect(() => {
    if (!penugasanToDelete && !driverToDelete) {
      setDeleteCountdown(5);
      return;
    }

    setDeleteCountdown(5);
    const timer = setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPenugasanToDelete(null);
          setDriverToDelete(null);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [penugasanToDelete, driverToDelete]);

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

  const fetchPenugasan = async () => {
    setIsLoadingPenugasan(true);
    try {
      const res = await apiService.getSemuaPenugasan();
      const data = res?.data || (Array.isArray(res) ? res : []);
      setPenugasanList(data);
    } catch (err) {
      console.error("Gagal mengambil data penugasan:", err);
      setPenugasanList([]);
    } finally {
      setIsLoadingPenugasan(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchPenugasan();
  }, []);

  // =========================================================================
  // HANDLERS: DRIVER
  // =========================================================================
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

  const handleConfirmDeleteDriver = async () => {
    if (!driverToDelete) return;
    setIsSubmitting(true);
    try {
      const targetId = driverToDelete.id || driverToDelete._id || driverToDelete.id_supir;
      await apiService.deleteUserAdmin(targetId);
      showToast(`Akun driver ${driverToDelete.nama_lengkap || driverToDelete.nama || driverToDelete.name} berhasil dihapus!`);
      setDriverToDelete(null);
      fetchDrivers();
    } catch (err) {
      console.error("Gagal hapus user:", err);
      showToast("Gagal menghapus driver", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // HANDLERS: PENUGASAN
  // =========================================================================
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
    setIsEditPenugasanMode(true);
    setEditPenugasanId(p.id);
    setFormPenugasan({
      id_supir: p.id_supir || "",
<<<<<<< HEAD
      tanggal: p.tanggal || getTodayDateStr(),
      nopol_kendaraan: (p.nopol_kendaraan || "").toUpperCase(),
      jenis_kendaraan: (p.jenis_kendaraan || "").toUpperCase(),
      kapasitas_penumpang: p.kapasitas_penumpang ? Math.min(60, p.kapasitas_penumpang) : "",
      trayek: (p.trayek || "").toUpperCase(),
      jam_pengisian_pagi: p.jadwal_pagi?.jam_formulir_pengisian || "06:00",
      batas_keluar_pagi: p.jadwal_pagi?.batas_keluar_dishub || "06:30",
      batas_kembali_pagi: p.jadwal_pagi?.batas_tiba_start || p.jadwal_pagi?.batas_kembali_dishub || "08:00",
      jam_pengisian_siang: p.jadwal_siang?.jam_formulir_pengisian || "13:00",
      batas_keluar_siang: p.jadwal_siang?.batas_keluar_dishub || "13:30",
      batas_kembali_siang: p.jadwal_siang?.batas_tiba_start || p.jadwal_siang?.batas_kembali_dishub || "14:30",
=======
      tanggal: p.tanggal || new Date().toISOString().split("T")[0],
      nopol_kendaraan: p.nopol_kendaraan || "",
      jenis_kendaraan: p.jenis_kendaraan || "",
      kapasitas_penumpang: p.kapasitas_penumpang || "",
      trayek: p.trayek || "",
      jam_pengisian_pagi: p.jadwal_pagi?.jam_formulir_pengisian ? String(p.jadwal_pagi.jam_formulir_pengisian).slice(0, 5) : "06:00",
      batas_keluar_pagi: p.jadwal_pagi?.batas_keluar_dishub ? String(p.jadwal_pagi.batas_keluar_dishub).slice(0, 5) : "06:30",
      batas_kembali_pagi: p.jadwal_pagi?.batas_tiba_start ? String(p.jadwal_pagi.batas_tiba_start).slice(0, 5) : (p.jadwal_pagi?.batas_kembali_dishub ? String(p.jadwal_pagi.batas_kembali_dishub).slice(0, 5) : "08:00"),
      jam_pengisian_siang: p.jadwal_siang?.jam_formulir_pengisian ? String(p.jadwal_siang.jam_formulir_pengisian).slice(0, 5) : "13:00",
      batas_keluar_siang: p.jadwal_siang?.batas_keluar_dishub ? String(p.jadwal_siang.batas_keluar_dishub).slice(0, 5) : "13:30",
      batas_kembali_siang: p.jadwal_siang?.batas_tiba_start ? String(p.jadwal_siang.batas_tiba_start).slice(0, 5) : (p.jadwal_siang?.batas_kembali_dishub ? String(p.jadwal_siang.batas_kembali_dishub).slice(0, 5) : "14:30"),
>>>>>>> 2007b1c (feat: perbaikan UI ManageDriver dan penambahan komponen KelolaPenugasan)
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

    setIsSubmitting(true);
    try {
      const payload = {
        id_supir: formPenugasan.id_supir,
        tanggal: formPenugasan.tanggal,
        nopol_kendaraan: (formPenugasan.nopol_kendaraan || "").trim().toUpperCase(),
        jenis_kendaraan: (formPenugasan.jenis_kendaraan || "").trim().toUpperCase(),
        kapasitas_penumpang: Math.min(60, Math.max(1, parseInt(formPenugasan.kapasitas_penumpang, 10) || 0)),
        trayek: (formPenugasan.trayek || "").trim().toUpperCase(),
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
        showToast("Penugasan armada & jadwal cut-off berhasil diperbarui!");
      } else {
        await apiService.createPenugasanHarian(payload);
        showToast("Penugasan armada & jadwal cut-off berhasil disimpan!");
      }

      setShowPenugasanModal(false);
      setIsEditPenugasanMode(false);
      setEditPenugasanId(null);
      fetchPenugasan();
    } catch (err) {
      console.error("Gagal simpan penugasan & jadwal:", err);
      const errMsg = err.response?.data?.detail || err.message || "Gagal menyimpan penugasan";
      showToast(typeof errMsg === "string" ? errMsg : "Gagal menyimpan penugasan", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeletePenugasan = async () => {
    if (!penugasanToDelete) return;
    setIsSubmitting(true);
    try {
      await apiService.deletePenugasanHarian(penugasanToDelete.id);
      showToast("Penugasan armada berhasil dihapus!");
      setPenugasanToDelete(null);
      fetchPenugasan();
    } catch (err) {
      console.error("Gagal menghapus penugasan:", err);
      const errMsg = err.response?.data?.detail || err.message || "Gagal menghapus penugasan";
      showToast(typeof errMsg === "string" ? errMsg : "Gagal menghapus penugasan", "error");
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

      {/* Page Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-[#00206B] tracking-tight m-0">Kelola Driver</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Manajemen master akun driver dan konfigurasi toleransi waktu cut-off operasional
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="inline-flex self-start p-1 bg-slate-100/90 border border-slate-200/80 rounded-2xl gap-1 shadow-2xs backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setActiveTab("penugasan")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === "penugasan"
              ? "bg-[#00206B] text-white shadow-xs"
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
              ? "bg-[#00206B] text-white shadow-xs"
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
          isLoading={isLoadingPenugasan}
          onAddPenugasan={handleOpenAddPenugasan}
          onEditPenugasan={handleOpenEditPenugasan}
          onDeletePenugasan={(penugasan) => setPenugasanToDelete(penugasan)}
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

      {/* Modal: Delete Driver Confirmation */}
      <DeleteConfirmModal
        isOpen={Boolean(driverToDelete)}
        title="Hapus Akun Driver?"
        description={
          driverToDelete ? (
            <>
              Apakah Anda yakin ingin menghapus akun driver{" "}
              <span className="font-black text-rose-600">
                {driverToDelete.nama_lengkap || driverToDelete.nama || driverToDelete.name}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </>
          ) : null
        }
        countdown={deleteCountdown}
        isSubmitting={isSubmitting}
        onClose={() => setDriverToDelete(null)}
        onConfirm={handleConfirmDeleteDriver}
      />

<<<<<<< HEAD
      {/* Modal: Delete Penugasan Confirmation */}
      <DeleteConfirmModal
        isOpen={Boolean(penugasanToDelete)}
        title="Hapus Penugasan Armada?"
        description={
          penugasanToDelete ? (
            <>
              Apakah Anda yakin ingin membatalkan & menghapus penugasan untuk{" "}
              <span className="font-black text-rose-600">
                {penugasanToDelete.users?.nama || penugasanToDelete.id_supir}
              </span>{" "}
              pada tanggal <span className="font-black text-slate-700">{penugasanToDelete.tanggal}</span>? Tindakan ini
              tidak dapat dibatalkan.
            </>
          ) : null
        }
        countdown={deleteCountdown}
        isSubmitting={isSubmitting}
        onClose={() => setPenugasanToDelete(null)}
        onConfirm={handleConfirmDeletePenugasan}
      />
=======
      {/* ========================================================================= */}
      {/* MODAL: TAMBAH SUPIR BARU                                                 */}
      {/* ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">Registrasi Driver</span>
                <h3 className="text-xl font-extrabold text-[#00206B] m-0">Tambah Driver Baru</h3>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-[#00206B] uppercase tracking-widest">Data Akun Login</span>
                <div className="w-full h-[1px] bg-slate-200 mt-1 mb-3"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    ID Driver <span className="text-[#00206B] font-bold lowercase"></span>
                  </label>
                  <input
                    type="text"
                    name="id_driver"
                    required
                    value={formData.id_driver}
                    onChange={handleIdDriverChange}
                    placeholder="DRV-..."
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    name="nama_lengkap"
                    required
                    value={formData.nama_lengkap}
                    onChange={handleChange}
                    placeholder=""
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Akun</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder=""
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Password Login</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimal 8 karakter"
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
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
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
                  onClick={() => setShowAddUserModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-[#00206B] hover:bg-[#00174E] text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT DRIVER                                                       */}
      {/* ========================================================================= */}
      {showEditUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">Perbarui Driver</span>
                <h3 className="text-xl font-extrabold text-[#00206B] m-0">Edit Data Driver</h3>
              </div>
              <button onClick={() => setShowEditUserModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-[#00206B] uppercase tracking-widest">Data Akun Login</span>
                <div className="w-full h-[1px] bg-slate-200 mt-1 mb-3"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Driver</label>
                  <input
                    type="text"
                    name="id_driver"
                    disabled
                    value={formData.id_driver}
                    className="w-full bg-slate-100 border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none opacity-70 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    name="nama_lengkap"
                    value={formData.nama_lengkap}
                    onChange={handleChange}
                    placeholder=""
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Akun</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder=""
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Kosongkan jika tidak diganti"
                      className="w-full bg-white border border-slate-200 text-sm font-normal text-[#00206B] rounded-xl pl-4 pr-11 py-2.5 outline-none focus:border-[#00206B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#00206B] transition-colors focus:outline-none cursor-pointer"
                      title={showEditPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                    >
                      {showEditPassword ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
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
                  onClick={() => setShowEditUserModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-[#00206B] hover:bg-[#00174E] text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS SUPIR                                             */}
      {/* ========================================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.15s]">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-[#00206B] m-0">Hapus Akun Driver?</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Apakah Anda yakin ingin menghapus akun driver <span className="font-black text-rose-600">{userToDelete.nama_lengkap || userToDelete.nama || userToDelete.name}</span>? Tindakan ini
                tidak dapat dibatalkan.
              </p>
            </div>

            {/* Indikator Hitung Mundur 5 Detik (Batal Otomatis) */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-2.5 flex items-center justify-between px-3.5 text-amber-800">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span className="text-[11px] font-bold">Batal otomatis dalam:</span>
              </div>
              <span className="text-xs font-black bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-lg tabular-nums">{deleteCountdown}s</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
              <div className="bg-amber-500 h-1 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${(deleteCountdown / 5) * 100}%` }} />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs uppercase shadow-md cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                <span>{isSubmitting ? "Menghapus..." : "Ya, Hapus"}</span>
                {!isSubmitting && <span className="opacity-80 font-semibold">({deleteCountdown}s)</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TUGASKAN ARMADA & JADWAL OPERASIONAL HARIAN                       */}
      {/* ========================================================================= */}
      {showPenugasanModal && (
        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">{isEditPenugasanMode ? "Perbarui Penugasan" : "Penugasan Armada"}</span>
                <h3 className="text-xl font-extrabold text-[#00206B] m-0">{isEditPenugasanMode ? "Edit Penugasan & Jadwal" : "Tugaskan Armada Baru"}</h3>
              </div>
              <button type="button" onClick={() => setShowPenugasanModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPenugasan} autoComplete="off" className="space-y-4">
              {/* SEKSI 1: DATA ARMADA & SUPIR */}
              <div>
                <span className="text-[10px] font-bold text-[#00206B] uppercase tracking-widest">Informasi Armada & Supir</span>
                <div className="w-full h-[1px] bg-slate-200 mt-1 mb-3"></div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pilih Supir</label>
                <select
                  required
                  value={formPenugasan.id_supir}
                  onChange={(e) => setFormPenugasan({ ...formPenugasan, id_supir: e.target.value })}
                  className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B] cursor-pointer"
                >
                  <option value="">-- Pilih Supir --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama_lengkap || d.nama || d.name} ({d.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    autoComplete="off"
                    value={formPenugasan.tanggal}
                    onChange={(e) => setFormPenugasan({ ...formPenugasan, tanggal: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trayek Rute</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={formPenugasan.trayek}
                    onChange={(e) => setFormPenugasan({ ...formPenugasan, trayek: e.target.value })}
                    placeholder=""
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nopol Bus</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={formPenugasan.nopol_kendaraan}
                    onChange={(e) => setFormPenugasan({ ...formPenugasan, nopol_kendaraan: e.target.value })}
                    placeholder=""
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-3 py-2.5 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jenis Mobil</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={formPenugasan.jenis_kendaraan}
                    onChange={(e) => setFormPenugasan({ ...formPenugasan, jenis_kendaraan: e.target.value })}
                    placeholder=""
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-3 py-2.5 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapasitas</label>
                  <input
                    type="number"
                    required
                    autoComplete="off"
                    value={formPenugasan.kapasitas_penumpang}
                    onChange={(e) => setFormPenugasan({ ...formPenugasan, kapasitas_penumpang: e.target.value })}
                    placeholder=""
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-3 py-2.5 outline-none focus:border-[#00206B]"
                  />
                </div>
              </div>

              {/* SEKSI 2: TOLERANSI JAM OPERASIONAL SESI PAGI */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-[#00206B] uppercase tracking-widest">Toleransi Sesi Pagi (Penjemputan)</span>
                <div className="w-full h-[1px] bg-slate-200 mt-1 mb-3"></div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Buka Formulir</label>
                    <input
                      type="time"
                      value={formPenugasan.jam_pengisian_pagi}
                      onChange={(e) => setFormPenugasan({ ...formPenugasan, jam_pengisian_pagi: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white border border-slate-200 text-xs font-bold text-[#00206B] rounded-xl px-3 py-2 text-center outline-none focus:border-[#00206B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Batas Keluar</label>
                    <input
                      type="time"
                      value={formPenugasan.batas_keluar_pagi}
                      onChange={(e) => setFormPenugasan({ ...formPenugasan, batas_keluar_pagi: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white border border-slate-200 text-xs font-bold text-[#00206B] rounded-xl px-3 py-2 text-center outline-none focus:border-[#00206B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Batas Kembali</label>
                    <input
                      type="time"
                      value={formPenugasan.batas_kembali_pagi}
                      onChange={(e) => setFormPenugasan({ ...formPenugasan, batas_kembali_pagi: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white border border-slate-200 text-xs font-bold text-[#00206B] rounded-xl px-3 py-2 text-center outline-none focus:border-[#00206B]"
                    />
                  </div>
                </div>
              </div>

              {/* SEKSI 3: TOLERANSI JAM OPERASIONAL SESI SIANG */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-[#00206B] uppercase tracking-widest">Toleransi Sesi Siang (Pengantaran)</span>
                <div className="w-full h-[1px] bg-slate-200 mt-1 mb-3"></div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Buka Formulir</label>
                    <input
                      type="time"
                      value={formPenugasan.jam_pengisian_siang}
                      onChange={(e) => setFormPenugasan({ ...formPenugasan, jam_pengisian_siang: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white border border-slate-200 text-xs font-bold text-[#00206B] rounded-xl px-3 py-2 text-center outline-none focus:border-[#00206B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Batas Keluar</label>
                    <input
                      type="time"
                      value={formPenugasan.batas_keluar_siang}
                      onChange={(e) => setFormPenugasan({ ...formPenugasan, batas_keluar_siang: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white border border-slate-200 text-xs font-bold text-[#00206B] rounded-xl px-3 py-2 text-center outline-none focus:border-[#00206B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Batas Kembali</label>
                    <input
                      type="time"
                      value={formPenugasan.batas_kembali_siang}
                      onChange={(e) => setFormPenugasan({ ...formPenugasan, batas_kembali_siang: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white border border-slate-200 text-xs font-bold text-[#00206B] rounded-xl px-3 py-2 text-center outline-none focus:border-[#00206B]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPenugasanModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-[#00206B] hover:bg-[#00174E] text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                >
                  {isSubmitting ? "Menyimpan..." : isEditPenugasanMode ? "Simpan Perubahan" : "Simpan Penugasan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS PENUGASAN ARMADA                                  */}
      {/* ========================================================================= */}
      {penugasanToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.15s]">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-[#00206B] m-0">Hapus Penugasan Armada?</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Apakah Anda yakin ingin membatalkan & menghapus penugasan untuk <span className="font-black text-rose-600">{penugasanToDelete.users?.nama || penugasanToDelete.id_supir}</span> pada
                tanggal <span className="font-black text-slate-700">{penugasanToDelete.tanggal}</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            {/* Indikator Hitung Mundur 5 Detik (Batal Otomatis) */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-2.5 flex items-center justify-between px-3.5 text-amber-800">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span className="text-[11px] font-bold">Batal otomatis dalam:</span>
              </div>
              <span className="text-xs font-black bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-lg tabular-nums">{deleteCountdown}s</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
              <div className="bg-amber-500 h-1 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${(deleteCountdown / 5) * 100}%` }} />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setPenugasanToDelete(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDeletePenugasan}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs uppercase shadow-md cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                <span>{isSubmitting ? "Menghapus..." : "Ya, Hapus"}</span>
                {!isSubmitting && <span className="opacity-80 font-semibold">({deleteCountdown}s)</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORM JADWAL CUT-OFF (TAMBAH & EDIT GOD MODE)                      */}
      {/* ========================================================================= */}
      {showJadwalModal && (
        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider block ${isEditMode ? "text-amber-700" : "text-[#00206B]"}`}>
                  {isEditMode ? "EDIT CUT-OFF (GOD MODE)" : "KONFIGURASI CUT-OFF"}
                </span>
                <h3 className="text-xl font-black text-[#00206B] m-0">{isEditMode ? "Edit Toleransi Jadwal" : "Tambah Jadwal Baru"}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowJadwalModal(false);
                  setIsEditMode(false);
                  setEditJadwalId(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitJadwal} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Trayek</label>
                <input
                  type="text"
                  required
                  value={formJadwal?.trayek || ""}
                  onChange={(e) => setFormJadwal({ ...(formJadwal || {}), trayek: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] focus:bg-white focus:outline-none focus:border-[#00206B]"
                  placeholder="cth: AEROX, Trayek A"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Tipe Sesi</label>
                <select
                  value={formJadwal?.tipe_sesi || "PAGI"}
                  onChange={(e) => setFormJadwal({ ...(formJadwal || {}), tipe_sesi: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#00206B] focus:bg-white focus:outline-none focus:border-[#00206B]"
                >
                  <option value="PAGI">PAGI</option>
                  <option value="SIANG">SIANG</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Batas Keluar Dishub</label>
                  <input
                    type="time"
                    required
                    value={formJadwal?.batas_keluar_dishub || ""}
                    onChange={(e) => setFormJadwal({ ...(formJadwal || {}), batas_keluar_dishub: e.target.value })}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-rose-700 focus:bg-white focus:outline-none focus:border-[#00206B]"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Format: JJ:MM (cth: 06:00)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Batas Tiba di Titik Start</label>
                  <input
                    type="time"
                    required
                    value={formJadwal?.batas_tiba_start || ""}
                    onChange={(e) => setFormJadwal({ ...(formJadwal || {}), batas_tiba_start: e.target.value })}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-amber-800 focus:bg-white focus:outline-none focus:border-[#00206B]"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Format: JJ:MM (cth: 06:30)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowJadwalModal(false);
                    setIsEditMode(false);
                    setEditJadwalId(null);
                  }}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-[#00206B] hover:bg-[#00174E] text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDriver;
