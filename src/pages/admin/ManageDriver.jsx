import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";

const ManageDriver = ({ onBack }) => {
  // PENTING: Jika sebelumnya menggunakan nama state selain 'activeTab' (misal: 'tab'),
  // sesuaikan nama variabel di bawah ini dengan UI Tab yang sudah ada.
  const [activeTab, setActiveTab] = useState("penugasan");
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingJadwals, setIsLoadingJadwals] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(5);

  // --- STATE JADWAL CUT-OFF (SESUAI INSTRUKSI) ---
  const [showJadwalModal, setShowJadwalModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editJadwalId, setEditJadwalId] = useState(null);
  const [jadwalList, setJadwalList] = useState([]);
  const jadwals = jadwalList;
  const setJadwals = setJadwalList;

  // Alerts / Notifications
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    const msgStr = typeof message === "string" ? message : JSON.stringify(message);
    setToast({ show: true, message: msgStr, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  // --- MODAL STATES: SUPIR ---
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // --- STATE PENUGASAN & JADWAL OPERASIONAL GABUNGAN ---
  const [penugasanList, setPenugasanList] = useState([]);
  const [isLoadingPenugasan, setIsLoadingPenugasan] = useState(true);
  const [showPenugasanModal, setShowPenugasanModal] = useState(false);
  const [isEditPenugasanMode, setIsEditPenugasanMode] = useState(false);
  const [editPenugasanId, setEditPenugasanId] = useState(null);
  const [penugasanToDelete, setPenugasanToDelete] = useState(null);

  // Auto-cancel timer 5 detik untuk modal hapus (batal otomatis saat waktu habis)
  useEffect(() => {
    if (!penugasanToDelete && !userToDelete) {
      setDeleteCountdown(5);
      return;
    }

    setDeleteCountdown(5);
    const timer = setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPenugasanToDelete(null);
          setUserToDelete(null);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [penugasanToDelete, userToDelete]);

  const initialUserForm = {
    id_driver: "DRV-",
    nama_lengkap: "",
    email: "",
    password: "",
  };
  const [formData, setFormData] = useState({
    id_driver: "DRV-",
    nama_lengkap: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleIdDriverChange = (e) => {
    let val = e.target.value.toUpperCase();
    if (!val.startsWith("DRV-")) {
      const rest = val.replace(/^DRV-?/i, "").replace(/^D?R?V?-?/i, "");
      val = "DRV-" + rest;
    }
    setFormData((prev) => ({
      ...prev,
      id_driver: val,
    }));
  };

  const initialPenugasanForm = {
    id_supir: "",
    tanggal: "",
    nopol_kendaraan: "",
    jenis_kendaraan: "",
    kapasitas_penumpang: "",
    trayek: "",
    jam_pengisian_pagi: "00:00",
    batas_keluar_pagi: "00:00",
    batas_kembali_pagi: "00:00",
    jam_pengisian_siang: "00:00",
    batas_keluar_siang: "00:00",
    batas_kembali_siang: "00:00",
  };

  const [formPenugasan, setFormPenugasan] = useState(initialPenugasanForm);

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
    fetchPenugasan();
  }, []);

  const handleOpenAddPenugasan = () => {
    setIsEditPenugasanMode(false);
    setEditPenugasanId(null);
    setFormPenugasan({
      ...initialPenugasanForm,
      id_supir: "",
    });
    setShowPenugasanModal(true);
  };

  const handleOpenEditPenugasan = (p) => {
    setIsEditPenugasanMode(true);
    setEditPenugasanId(p.id);
    setFormPenugasan({
      id_supir: p.id_supir || "",
      tanggal: p.tanggal || new Date().toISOString().split("T")[0],
      nopol_kendaraan: p.nopol_kendaraan || "",
      jenis_kendaraan: p.jenis_kendaraan || "",
      kapasitas_penumpang: p.kapasitas_penumpang || "",
      trayek: p.trayek || "",
      jam_pengisian_pagi: p.jadwal_pagi?.jam_formulir_pengisian || "06:00",
      batas_keluar_pagi: p.jadwal_pagi?.batas_keluar_dishub || "06:30",
      batas_kembali_pagi: p.jadwal_pagi?.batas_tiba_start || p.jadwal_pagi?.batas_kembali_dishub || "08:00",
      jam_pengisian_siang: p.jadwal_siang?.jam_formulir_pengisian || "13:00",
      batas_keluar_siang: p.jadwal_siang?.batas_keluar_dishub || "13:30",
      batas_kembali_siang: p.jadwal_siang?.batas_tiba_start || p.jadwal_siang?.batas_kembali_dishub || "14:30",
    });
    setShowPenugasanModal(true);
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

  const handleSubmitPenugasan = async (e) => {
    e.preventDefault();
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
        nopol_kendaraan: formPenugasan.nopol_kendaraan,
        jenis_kendaraan: formPenugasan.jenis_kendaraan,
        kapasitas_penumpang: parseInt(formPenugasan.kapasitas_penumpang, 10) || 0,
        trayek: formPenugasan.trayek,
        jadwal_pagi: {
          jam_formulir_pengisian: formPenugasan.jam_pengisian_pagi || "00:00",
          batas_keluar_dishub: formPenugasan.batas_keluar_pagi || "00:00",
          batas_kembali_dishub: formPenugasan.batas_kembali_pagi || "00:00",
        },
        jadwal_siang: {
          jam_formulir_pengisian: formPenugasan.jam_pengisian_siang || "00:00",
          batas_keluar_dishub: formPenugasan.batas_keluar_siang || "00:00",
          batas_kembali_dishub: formPenugasan.batas_kembali_siang || "00:00",
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

  // --- FORM STATE: JADWAL ---
  const initialJadwalForm = {
    trayek: "",
    tipe_sesi: "PAGI",
    batas_keluar_dishub: "",
    batas_tiba_start: "",
  };
  const [formJadwal, setFormJadwal] = useState({
    trayek: "",
    tipe_sesi: "PAGI",
    batas_keluar_dishub: "",
    batas_tiba_start: "",
  });

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getUsersAdmin();
      console.log("CEK DATA MENTAH DARI SERVER:", res); // Alat interogasi

      let dataSupir = [];

      // Ekstraksi data super agresif (menangani berbagai bentuk JSON dari Backend)
      if (Array.isArray(res)) {
        dataSupir = res;
      } else if (res && Array.isArray(res.data)) {
        dataSupir = res.data;
      } else if (res && res.users && Array.isArray(res.users)) {
        dataSupir = res.users;
      }

      console.log("DATA YANG BERHASIL DIEKSTRAK:", dataSupir);
      setDrivers(dataSupir);

      if (dataSupir.length === 0) {
        console.warn("Server merespons sukses, tapi data supir kosong dari database.");
      }
    } catch (error) {
      console.error("Gagal menarik data driver:", error);
      setDrivers([]);
      const errMsg = error.response?.data?.detail || error.message || "Gagal menarik data driver";
      showToast(typeof errMsg === "string" ? errMsg : "Gagal menarik data driver", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchJadwals = async () => {
    setIsLoadingJadwals(true);
    try {
      const res = await apiService.getJadwalAdmin();
      let data = [];
      if (Array.isArray(res)) {
        data = res;
      } else if (res && Array.isArray(res.data)) {
        data = res.data;
      } else if (res && Array.isArray(res.jadwal)) {
        data = res.jadwal;
      } else if (res && Array.isArray(res.items)) {
        data = res.items;
      }
      setJadwalList(data);
    } catch (err) {
      console.error("Gagal mengambil data jadwal:", err);
      setJadwalList([]);
      showToast("Gagal memuat data jadwal cut-off", "error");
    } finally {
      setIsLoadingJadwals(false);
    }
  };

  useEffect(() => {
    fetchJadwals();
  }, []);

  // --- HANDLER USER (TAB 1) ---
  const handleOpenAddUser = () => {
    setFormData({
      id_driver: "DRV-",
      nama_lengkap: "",
      email: "",
      password: "",
    });
    setShowAddUserModal(true);
  };

  const handleOpenEditUser = (u) => {
    setSelectedUser(u);
    const namaSupir = u.nama_lengkap || u.nama || u.name || "";
    setFormData({
      id_driver: u.id_driver || u.id || u.id_supir || "",
      nama_lengkap: namaSupir,
      email: u.email || "",
      password: "",
    });
    setShowEditUserModal(true);
  };

  const handleCreateUser = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
    if (!formData.password || formData.password.trim().length < 6) {
      showToast("Password driver minimal 6 karakter!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Payload MATCH 100% dengan skema Pydantic backend
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
      setShowAddUserModal(false);
      fetchDrivers();
    } catch (err) {
      console.error("Gagal menambahkan user:", err);
      let errorMsg = "Gagal menambahkan driver. Periksa koneksi/data.";
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

  const handleSubmit = handleCreateUser;

  const handleUpdateUser = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const namaDriver = formData.nama_lengkap?.trim() || "";
      const targetId = selectedUser.id || selectedUser._id || selectedUser.id_supir || formData.id_driver;
      const payload = {
        id: formData.id_driver || targetId,
        id_driver: formData.id_driver || targetId,
        nama_lengkap: namaDriver,
        email: formData.email,
        role: "driver",
      };
      if (formData.password && formData.password.trim() !== "") {
        payload.password = formData.password;
      }

      await apiService.updateUserAdmin(targetId, payload);
      showToast(`Data driver ${payload.nama_lengkap} berhasil diperbarui!`);
      setShowEditUserModal(false);
      fetchDrivers();
    } catch (err) {
      console.error("Gagal update user:", err);
      let errorMsg = "Gagal memperbarui driver";
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

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      const targetId = userToDelete.id || userToDelete._id || userToDelete.id_supir;
      await apiService.deleteUserAdmin(targetId);
      showToast(`Akun driver ${userToDelete.nama_lengkap || userToDelete.nama || userToDelete.name} berhasil dihapus!`);
      setUserToDelete(null);
      fetchDrivers();
    } catch (err) {
      console.error("Gagal hapus user:", err);
      showToast("Gagal menghapus driver", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLER JADWAL (TAB 2) ---
  const handleOpenAddJadwal = () => {
    setIsEditMode(false);
    setEditJadwalId(null);
    setFormJadwal({
      trayek: "",
      tipe_sesi: "PAGI",
      batas_keluar_dishub: "",
      batas_tiba_start: "",
    });
    setShowJadwalModal(true);
  };
  const handleEditClick = (jadwal) => {
    setFormJadwal({
      trayek: jadwal?.trayek || "",
      tipe_sesi: (jadwal?.tipe_sesi || jadwal?.sesi || "PAGI").toUpperCase(),
      batas_keluar_dishub: jadwal?.batas_keluar_dishub || "",
      batas_tiba_start: jadwal?.batas_tiba_start || "",
    });
    setIsEditMode(true);
    setEditJadwalId(jadwal?.id || jadwal?._id);
    setShowJadwalModal(true);
  };
  const handleOpenEditJadwal = handleEditClick;

  const handleSubmitJadwal = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        trayek: (formJadwal?.trayek || "").trim(),
        tipe_sesi: (formJadwal?.tipe_sesi || "PAGI").toUpperCase(),
        batas_keluar_dishub: formJadwal?.batas_keluar_dishub || "",
        batas_tiba_start: formJadwal?.batas_tiba_start || "",
      };

      if (isEditMode) {
        await apiService.updateJadwalAdmin(editJadwalId, payload);
        showToast(`Jadwal cut-off Trayek ${payload.trayek} berhasil diperbarui!`);
      } else {
        await apiService.createJadwalAdmin(payload);
        showToast(`Jadwal cut-off Trayek ${payload.trayek} (${payload.tipe_sesi}) berhasil ditambahkan!`);
      }

      setShowJadwalModal(false);
      setIsEditMode(false);
      setEditJadwalId(null);
      setFormJadwal(initialJadwalForm);
      fetchJadwals();
    } catch (err) {
      console.error("Gagal menyimpan jadwal:", err);
      let errorMsg = isEditMode ? "Gagal memperbarui jadwal cut-off" : "Gagal menambahkan jadwal cut-off";
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

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-8 animate-[fadeIn_0.3s]">
      {/* Toast Alert */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm border animate-[slideDown_0.2s] ${
            toast.type === "success" ? "bg-[#E6F7ED] border-[#BCECD2] text-[#137333]" : "bg-[#FCE8E6] border-[#FAD2CF] text-[#C5221F]"
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

      {/* Header Halaman: Konsisten dengan RiwayatDriver */}
      <div className="pb-1">
        <h2 className="text-2xl font-bold text-slate-900 m-0 tracking-tight">Kelola Driver & Jadwal</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5 tracking-wide">Manajemen master akun driver dan konfigurasi toleransi waktu cut-off operasional</p>
      </div>

      {/* Navigation Tabs: Penugasan di Kiri, Daftar Driver di Kanan */}
      <div className="flex items-center gap-2.5 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("penugasan")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "penugasan"
              ? "bg-[#00206B] text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <span>Penugasan & Jadwal</span>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
              activeTab === "penugasan"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            {(penugasanList || []).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("supir")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "supir"
              ? "bg-[#00206B] text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <span>Daftar Driver</span>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
              activeTab === "supir"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            {(drivers || []).length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAFTAR DRIVER                                                     */}
      {/* ========================================================================= */}
      {activeTab === "supir" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
            <div>
              <h3 className="text-base font-black text-[#00206B] m-0 tracking-wide">Master Data Driver</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Kelola akun login dan kredensial driver</p>
            </div>
            <button
              onClick={handleOpenAddUser}
              className="bg-white border border-slate-200 hover:border-slate-300 text-[#00206B] font-bold py-2.5 px-4 rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              TAMBAH DRIVER BARU
            </button>
          </div>

          {/* TAB 1 CONTENT: DAFTAR DRIVER TABLE */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
            {isLoading ? (
              <div className="text-center py-10 font-bold text-[#00206B] animate-pulse">Memuat data driver...</div>
            ) : (drivers || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50">
                      <th className="py-4 px-5 text-[10px] font-bold text-slate-400 tracking-widest uppercase rounded-tl-xl">Driver</th>
                      <th className="py-4 px-5 text-[10px] font-bold text-slate-400 tracking-widest uppercase">Email Terdaftar</th>
                      <th className="py-4 px-5 text-[10px] font-bold text-slate-400 tracking-widest uppercase text-center">Status Akun</th>
                      <th className="py-4 px-5 text-[10px] font-bold text-slate-400 tracking-widest uppercase text-center rounded-tr-xl">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(drivers || []).map((driver, index) => {
                      const driverName = driver?.nama_lengkap || driver?.nama || driver?.name || "-";
                      const driverId = driver?.id_driver || driver?.id || driver?.id_supir || "-";
                      const initials = (driverName !== "-" ? driverName.slice(0, 2) : "DR").toUpperCase();

                      return (
                        <tr key={driver?.id || driver?._id || driver?.id_supir || index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#00206B] font-black text-xs">{initials}</div>
                              <div>
                                <div className="font-black text-sm text-[#00206B] uppercase">{driverName}</div>
                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded inline-block mt-0.5">{driverId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-sm font-semibold text-slate-600">{driver?.email || "-"}</td>
                          <td className="py-4 px-5 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              DRIVER AKTIF
                            </span>
                          </td>
                          <td className="py-4 px-5 text-center space-x-2">
                            <button
                              onClick={() => handleOpenEditUser(driver)}
                              className="bg-white border border-slate-200 hover:border-[#00206B] text-slate-600 hover:text-[#00206B] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => setUserToDelete(driver)}
                              className="bg-white border border-slate-200 hover:border-rose-400 text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                />
                              </svg>
                              Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-extrabold text-[#00206B]">Belum Ada Data Driver</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Klik tombol tambah driver untuk mendaftarkan akun.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PENUGASAN & JADWAL OPERASIONAL HARIAN (ALL-IN-ONE)                 */}
      {/* ========================================================================= */}
      {activeTab === "penugasan" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
            <div>
              <h3 className="text-base font-black text-[#00206B] m-0 tracking-wide">Penugasan & Jadwal Armada</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Atur rute trayek, armada, nopol, serta toleransi jam operasional</p>
            </div>
            <button
              onClick={handleOpenAddPenugasan}
              className="bg-white border border-slate-200 hover:border-slate-300 text-[#00206B] font-bold py-2.5 px-4 rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Tugaskan Armada
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
            {isLoadingPenugasan ? (
              <div className="text-center py-10 font-bold text-[#00206B] animate-pulse">Memuat data penugasan & jadwal...</div>
            ) : (penugasanList || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50">
                      <th className="py-4 px-5 text-[10px] font-bold text-slate-400 tracking-widest uppercase rounded-tl-xl">Driver</th>
                      <th className="py-4 px-5 text-[10px] font-bold text-slate-400 tracking-widest uppercase">Tanggal & Trayek</th>
                      <th className="py-4 px-5 text-[10px] font-bold text-slate-400 tracking-widest uppercase">Armada & Kapasitas</th>
                      <th className="py-4 px-5 text-[10px] font-bold text-slate-400 tracking-widest uppercase">Jadwal Toleransi</th>
                      <th className="py-4 px-5 text-[10px] font-bold text-slate-400 tracking-widest uppercase text-center rounded-tr-xl">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {penugasanList.map((p, idx) => {
                      const driverName = p.users?.nama || p.users?.nama_lengkap || p.id_supir || "-";
                      const initials = (driverName !== "-" ? driverName.slice(0, 2) : "DR").toUpperCase();
                      const pagiKeluar = p.jadwal_pagi?.batas_keluar_dishub || "06:30";
                      const pagiKembali = p.jadwal_pagi?.batas_tiba_start || p.jadwal_pagi?.batas_kembali_dishub || "08:00";
                      const siangKeluar = p.jadwal_siang?.batas_keluar_dishub || "13:30";
                      const siangKembali = p.jadwal_siang?.batas_tiba_start || p.jadwal_siang?.batas_kembali_dishub || "14:30";

                      return (
                        <tr key={p.id || idx} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#00206B] font-black text-xs">
                                {initials}
                              </div>
                              <div>
                                <div className="font-bold text-sm text-[#00206B] uppercase">{driverName}</div>
                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                  {p.id_supir}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <div className="font-bold text-xs text-slate-900">{p.tanggal}</div>
                            <div className="text-[11px] font-semibold text-slate-500 uppercase mt-0.5">{p.trayek}</div>
                          </td>
                          <td className="py-4 px-5">
                            <div className="text-xs font-bold text-slate-800 uppercase">{p.nopol_kendaraan}</div>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                              {p.jenis_kendaraan} • <span className="text-slate-600 font-semibold">{p.kapasitas_penumpang} Kursi</span>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <div className="text-[11px] font-medium text-slate-600 space-y-0.5">
                              <div><span className="font-bold text-slate-800">Pagi:</span> {pagiKeluar} – {pagiKembali}</div>
                              <div><span className="font-bold text-slate-800">Siang:</span> {siangKeluar} – {siangKembali}</div>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEditPenugasan(p)}
                                className="bg-white border border-slate-200 hover:border-[#00206B] text-slate-600 hover:text-[#00206B] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => setPenugasanToDelete(p)}
                                className="bg-white border border-slate-200 hover:border-rose-400 text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 font-semibold text-xs">Belum ada penugasan armada hari ini. Silakan klik tombol "+ TUGASKAN ARMADA & JADWAL" di atas.</div>
            )}
          </div>
        </div>
      )}

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
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder=""
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B]"
                  />
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
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Kosongkan jika tidak diganti"
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B]"
                  />
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
                Apakah Anda yakin ingin menghapus akun driver <span className="font-black text-rose-600">{userToDelete.nama_lengkap || userToDelete.nama || userToDelete.name}</span>? Tindakan ini tidak dapat dibatalkan.
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
              <span className="text-xs font-black bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-lg tabular-nums">
                {deleteCountdown}s
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
              <div
                className="bg-amber-500 h-1 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(deleteCountdown / 5) * 100}%` }}
              />
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
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">
                  {isEditPenugasanMode ? "Perbarui Penugasan" : "Penugasan Armada"}
                </span>
                <h3 className="text-xl font-extrabold text-[#00206B] m-0">
                  {isEditPenugasanMode ? "Edit Penugasan & Jadwal" : "Tugaskan Armada Baru"}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPenugasanModal(false)} 
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
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
                      type="text"
                      value={formPenugasan.jam_pengisian_pagi}
                      onChange={(e) => setFormPenugasan({ ...formPenugasan, jam_pengisian_pagi: e.target.value })}
                      placeholder="00:00"
                      className="w-full bg-white border border-slate-200 text-xs font-bold text-[#00206B] rounded-xl px-3 py-2 text-center outline-none focus:border-[#00206B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Batas Keluar</label>
                    <input
                      type="text"
                      value={formPenugasan.batas_keluar_pagi}
                      onChange={(e) => setFormPenugasan({ ...formPenugasan, batas_keluar_pagi: e.target.value })}
                      placeholder="00:00"
                      className="w-full bg-white border border-slate-200 text-xs font-bold text-[#00206B] rounded-xl px-3 py-2 text-center outline-none focus:border-[#00206B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Batas Kembali</label>
                    <input
                      type="text"
                      value={formPenugasan.batas_kembali_pagi}
                      onChange={(e) => setFormPenugasan({ ...formPenugasan, batas_kembali_pagi: e.target.value })}
                      placeholder="00:00"
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
                      type="text"
                      value={formPenugasan.jam_pengisian_siang}
                      onChange={(e) => setFormPenugasan({ ...formPenugasan, jam_pengisian_siang: e.target.value })}
                      placeholder="00:00"
                      className="w-full bg-white border border-slate-200 text-xs font-bold text-[#00206B] rounded-xl px-3 py-2 text-center outline-none focus:border-[#00206B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Batas Keluar</label>
                    <input
                      type="text"
                      value={formPenugasan.batas_keluar_siang}
                      onChange={(e) => setFormPenugasan({ ...formPenugasan, batas_keluar_siang: e.target.value })}
                      placeholder="00:00"
                      className="w-full bg-white border border-slate-200 text-xs font-bold text-[#00206B] rounded-xl px-3 py-2 text-center outline-none focus:border-[#00206B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Batas Kembali</label>
                    <input
                      type="text"
                      value={formPenugasan.batas_kembali_siang}
                      onChange={(e) => setFormPenugasan({ ...formPenugasan, batas_kembali_siang: e.target.value })}
                      placeholder="00:00"
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
                  {isSubmitting ? "Menyimpan..." : (isEditPenugasanMode ? "Simpan Perubahan" : "Simpan Penugasan")}
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
                Apakah Anda yakin ingin membatalkan & menghapus penugasan untuk <span className="font-black text-rose-600">{penugasanToDelete.users?.nama || penugasanToDelete.id_supir}</span> pada tanggal <span className="font-black text-slate-700">{penugasanToDelete.tanggal}</span>? Tindakan ini tidak dapat dibatalkan.
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
              <span className="text-xs font-black bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-lg tabular-nums">
                {deleteCountdown}s
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
              <div
                className="bg-amber-500 h-1 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(deleteCountdown / 5) * 100}%` }}
              />
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
