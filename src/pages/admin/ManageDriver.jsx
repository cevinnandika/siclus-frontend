import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";

const ManageDriver = ({ onBack }) => {
  // PENTING: Jika sebelumnya menggunakan nama state selain 'activeTab' (misal: 'tab'),
  // sesuaikan nama variabel di bawah ini dengan UI Tab yang sudah ada.
  const [activeTab, setActiveTab] = useState("supir");
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingJadwals, setIsLoadingJadwals] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const initialUserForm = {
    id_driver: "",
    nama_lengkap: "",
    email: "",
    password: "",
    trayek: "",
    nomer_kendaraan: "",
    jenis_kendaraan: "",
    kapasitas: "",
  };
  const [formData, setFormData] = useState({
    id_driver: "",
    nama_lengkap: "",
    email: "",
    password: "",
    trayek: "",
    nomer_kendaraan: "",
    jenis_kendaraan: "",
    kapasitas: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    const randomId = `DRV-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      ...initialUserForm,
      id_driver: randomId,
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
      password: "", // kosongkan jika tidak ingin ganti password
      trayek: u.trayek || "",
      nomer_kendaraan: u.nomer_kendaraan || u.bus || u.armada || "",
      jenis_kendaraan: u.jenis_kendaraan || u.tipe_kendaraan || "",
      kapasitas: u.kapasitas ?? u.kapasitas_bus ?? u.kapasitas_penumpang ?? "",
    });
    setShowEditUserModal(true);
  };

  const handleCreateUser = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmitting(true);
    try {
      const generatedId = formData.id_driver?.trim() || `DRV-${Math.floor(1000 + Math.random() * 9000)}`;
      const namaDriver = formData.nama_lengkap?.trim() || "";

      // Payload MATCH 100% dengan skema Pydantic backend
      const payload = {
        id: generatedId, // WAJIB ADA
        id_driver: generatedId,
        nama_lengkap: namaDriver, // PERHATIKAN: Backend meminta 'nama_lengkap'
        email: formData.email, // WAJIB format email
        password: formData.password, // WAJIB ADA
        role: "driver",
        trayek: formData.trayek || null,
        bus: formData.nomer_kendaraan || null,
        nomer_kendaraan: formData.nomer_kendaraan || null,
        jenis_kendaraan: formData.jenis_kendaraan || null,
        kapasitas: formData.kapasitas ? Number(formData.kapasitas) : null,
      };

      await apiService.createUserAdmin(payload);
      showToast(`Driver ${payload.nama_lengkap} berhasil ditambahkan!`);
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
        trayek: formData.trayek || null,
        bus: formData.nomer_kendaraan || null,
        nomer_kendaraan: formData.nomer_kendaraan || null,
        jenis_kendaraan: formData.jenis_kendaraan || null,
        kapasitas: formData.kapasitas ? Number(formData.kapasitas) : null,
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
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-8 animate-[fadeIn_0.3s]">
      {/* Toast Alert */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm border animate-[slideDown_0.2s] ${
            toast.type === "success" ? "bg-[#E6F7ED] border-[#BCECD2] text-[#137333]" : "bg-[#FCE8E6] border-[#FAD2CF] text-[#C5221F]"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header (Tanpa Tombol Back) */}
      <div className="space-y-1 mb-6">
        <h2 className="text-2xl md:text-3xl font-black text-[#00206B] m-0 tracking-wide uppercase">Kelola Driver & Jadwal</h2>
        <p className="text-sm text-slate-400 font-semibold mt-0.5">Manajemen master akun driver dan konfigurasi toleransi waktu cut-off operasional</p>
      </div>

      {/* Navigation Tabs (Tab 1: DAFTAR DRIVER | Tab 2: JADWAL CUT-OFF) */}
      <div className="flex items-center gap-2 bg-slate-200/70 p-1.5 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab("supir")}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "supir" ? "bg-[#00206B] text-white shadow-md scale-[1.02]" : "text-slate-600 hover:text-[#00206B] hover:bg-white/50"
          }`}
        >
          <span>🚌</span>
          <span>Daftar Driver</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-extrabold">{(drivers || []).length}</span>
        </button>

        <button
          onClick={() => setActiveTab("jadwal")}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "jadwal" ? "bg-[#00206B] text-white shadow-md scale-[1.02]" : "text-slate-600 hover:text-[#00206B] hover:bg-white/50"
          }`}
        >
          <span>⏱️</span>
          <span>Jadwal Cut-Off</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-extrabold">{(jadwalList || []).length}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAFTAR DRIVER                                                     */}
      {/* ========================================================================= */}
      {activeTab === "supir" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
            <div>
              <h3 className="text-base font-black text-[#00206B] m-0 uppercase tracking-wide">Master Data Driver</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Kelola kredensial login, penugasan trayek, dan armada bus</p>
            </div>
            <button
              onClick={handleOpenAddUser}
              className="bg-[#00206B] hover:bg-[#00174E] text-white font-black py-3.5 px-5 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              TAMBAH DRIVER BARU
            </button>
          </div>

          {/* TAB 1 CONTENT: DAFTAR DRIVER TABLE */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
            {isLoading ? (
              <div className="text-center py-10 font-bold text-[#00206B] animate-pulse">Memuat data driver...</div>
            ) : (drivers || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50">
                      <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase rounded-tl-xl">Nama Driver</th>
                      <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase">Email Terdaftar</th>
                      <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase text-center">Trayek</th>
                      <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase text-center">Armada</th>
                      <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase text-center">Kapasitas</th>
                      <th className="py-4 px-5 text-xs font-extrabold text-slate-500 uppercase text-center rounded-tr-xl">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(drivers || []).map((driver, index) => (
                      <tr key={driver?.id || driver?._id || driver?.id_supir || index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-5 font-black text-[#00206B] uppercase">{driver?.nama_lengkap || driver?.nama || driver?.name || "-"}</td>
                        <td className="py-4 px-5 text-sm font-bold text-slate-500">{driver?.email || "-"}</td>
                        <td className="py-4 px-5 text-center text-sm font-black text-[#00206B] uppercase">{driver?.trayek || "-"}</td>
                        <td className="py-4 px-5 text-center text-sm font-bold text-slate-600 uppercase">{driver?.nomer_kendaraan || driver?.bus || driver?.armada || "-"}</td>
                        <td className="py-4 px-5 text-center text-sm font-bold text-slate-600">{driver?.kapasitas ? `${driver.kapasitas} Kursi` : "-"}</td>
                        <td className="py-4 px-5 text-center space-x-2">
                          <button
                            onClick={() => handleOpenEditUser(driver)}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setUserToDelete(driver)}
                            className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-2xl">🚌</div>
                <h3 className="text-lg font-black text-[#00206B]">Belum Ada Data Driver</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Klik tombol "+ TAMBAH DRIVER BARU" untuk mendaftarkan akun driver pertama.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: JADWAL CUT-OFF                                                    */}
      {/* ========================================================================= */}
      {activeTab === "jadwal" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
            <div>
              <h3 className="text-base font-black text-[#00206B] m-0 uppercase tracking-wide">Konfigurasi Batas Waktu Cut-Off Per Trayek</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Tentukan batas toleransi waktu keberangkatan dari Dishub dan tiba di titik start untuk deteksi keterlambatan otomatis</p>
            </div>
            <button
              onClick={() => {
                setIsEditMode(false); // Pastikan bukan dalam mode edit
                setEditJadwalId(null);
                setFormJadwal({ trayek: "", tipe_sesi: "PAGI", batas_keluar_dishub: "", batas_tiba_start: "" }); // Kosongkan form
                setShowJadwalModal(true); // Tampilkan modal
              }}
              className="bg-[#00206B] hover:bg-[#00174E] text-white font-black py-3.5 px-5 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              + TAMBAH JADWAL BARU
            </button>
          </div>

          {/* Tabel Jadwal */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {isLoadingJadwals ? (
              <div className="p-16 text-center text-[#00206B] font-bold animate-pulse">Memuat Konfigurasi Jadwal... ⏳</div>
            ) : (jadwalList || []).length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto text-2xl">⏱️</div>
                <h4 className="text-base font-extrabold text-slate-700 m-0">Belum Ada Jadwal Dikonfigurasi</h4>
                <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
                  Belum ada data cut-off jadwal operasional di server. Silakan gunakan tombol di atas untuk menambahkan jadwal pertama.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b-2 border-slate-200">
                      <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase tracking-wider">TRAYEK</th>
                      <th className="py-4 px-4 text-xs font-black text-[#00206B] uppercase tracking-wider text-center">SESI</th>
                      <th className="py-4 px-4 text-xs font-black text-[#00206B] uppercase tracking-wider text-center">BATAS KELUAR</th>
                      <th className="py-4 px-4 text-xs font-black text-[#00206B] uppercase tracking-wider text-center">BATAS TIBA START</th>
                      <th className="py-4 px-5 text-xs font-black text-[#00206B] uppercase tracking-wider text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(jadwalList || []).map((jadwal, index) => (
                      <tr key={jadwal?.id || jadwal?._id || index} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-5 font-black text-sm text-[#00206B] uppercase">{jadwal?.trayek || jadwal?.nama_trayek || `Trayek ${jadwal?.id || index + 1}`}</td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-xl text-xs font-black uppercase ${
                              (jadwal?.tipe_sesi || jadwal?.sesi || "").toUpperCase() === "PAGI"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {jadwal?.tipe_sesi || jadwal?.sesi || "PAGI"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">🕒 {jadwal?.batas_keluar_dishub || "-"} WIB</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block text-xs font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">📍 {jadwal?.batas_tiba_start || "-"} WIB</span>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => handleEditClick(jadwal)}
                            className="inline-flex items-center gap-1.5 bg-[#00206B] hover:bg-[#00174E] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                <span className="text-[10px] font-black uppercase text-[#00206B] tracking-wider block">REGISTRASI DRIVER</span>
                <h3 className="text-xl font-black text-[#00206B] m-0">Tambah Driver Baru</h3>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* --- SEKSI 1: DATA AKUN --- */}
              <div className="mb-2">
                <span className="text-[10px] font-bold text-[#00206B] uppercase tracking-widest">Data Akun Login</span>
                <div className="w-full h-[1px] bg-slate-200 mt-1 mb-3"></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Driver</label>
                  <input
                    type="text"
                    name="id_driver"
                    value={formData.id_driver}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    name="nama_lengkap"
                    value={formData.nama_lengkap}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Akun</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Password Login</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
                  />
                </div>
              </div>

              {/* --- SEKSI 2: DATA KENDARAAN & OPERASIONAL --- */}
              <div className="mb-2 mt-2">
                <span className="text-[10px] font-bold text-[#00206B] uppercase tracking-widest">Data Kendaraan & Operasional</span>
                <div className="w-full h-[1px] bg-slate-200 mt-1 mb-3"></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nomer Kendaraan</label>
                  <input
                    type="text"
                    name="nomer_kendaraan"
                    value={formData.nomer_kendaraan}
                    onChange={handleChange}
                    placeholder="Contoh: W 1234 XY"
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jenis Kendaraan</label>
                  <input
                    type="text"
                    name="jenis_kendaraan"
                    value={formData.jenis_kendaraan}
                    onChange={handleChange}
                    placeholder="Contoh: Minibus"
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapasitas Kendaraan</label>
                  <input
                    type="number"
                    name="kapasitas"
                    value={formData.kapasitas}
                    onChange={handleChange}
                    placeholder="Contoh: 16"
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trayek</label>
                  <input
                    type="text"
                    name="trayek"
                    value={formData.trayek}
                    onChange={handleChange}
                    placeholder="Contoh: Trayek A"
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
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
                <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block">PERBARUI DRIVER</span>
                <h3 className="text-xl font-black text-[#00206B] m-0">Edit Data Driver</h3>
              </div>
              <button onClick={() => setShowEditUserModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3.5">
              {/* --- SEKSI 1: DATA AKUN --- */}
              <div className="mb-2">
                <span className="text-[10px] font-bold text-[#00206B] uppercase tracking-widest">Data Akun Login</span>
                <div className="w-full h-[1px] bg-slate-200 mt-1 mb-3"></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Driver</label>
                  <input
                    type="text"
                    name="id_driver"
                    disabled
                    value={formData.id_driver}
                    className="w-full bg-slate-100 border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none opacity-70 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    name="nama_lengkap"
                    value={formData.nama_lengkap}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Akun</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Password Baru</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Opsional - ganti password"
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
                  />
                </div>
              </div>

              {/* --- SEKSI 2: DATA KENDARAAN & OPERASIONAL --- */}
              <div className="mb-2 mt-2">
                <span className="text-[10px] font-bold text-[#00206B] uppercase tracking-widest">Data Kendaraan & Operasional</span>
                <div className="w-full h-[1px] bg-slate-200 mt-1 mb-3"></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nomer Kendaraan</label>
                  <input
                    type="text"
                    name="nomer_kendaraan"
                    value={formData.nomer_kendaraan}
                    onChange={handleChange}
                    placeholder="Contoh: W 1234 XY"
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jenis Kendaraan</label>
                  <input
                    type="text"
                    name="jenis_kendaraan"
                    value={formData.jenis_kendaraan}
                    onChange={handleChange}
                    placeholder="Contoh: Minibus"
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapasitas Kendaraan</label>
                  <input
                    type="number"
                    name="kapasitas"
                    value={formData.kapasitas}
                    onChange={handleChange}
                    placeholder="Contoh: 16"
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trayek</label>
                  <input
                    type="text"
                    name="trayek"
                    value={formData.trayek}
                    onChange={handleChange}
                    placeholder="Contoh: Trayek A"
                    className="w-full bg-white border border-slate-200 text-sm font-bold text-[#00206B] rounded-xl px-4 py-2 outline-none focus:border-[#00206B]"
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
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl">🗑️</div>
            <div>
              <h3 className="text-lg font-black text-[#00206B] m-0">Hapus Akun Driver?</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Apakah Anda yakin ingin menghapus akun driver <span className="font-black text-rose-600">{userToDelete.nama_lengkap || userToDelete.nama || userToDelete.name}</span>? Tindakan ini
                tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button onClick={() => setUserToDelete(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase cursor-pointer">
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs uppercase shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Menghapus..." : "Ya, Hapus"}
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
