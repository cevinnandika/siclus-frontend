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
    </div>
  );
};

export default ManageDriver;
