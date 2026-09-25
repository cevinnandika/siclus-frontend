import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import toast from "react-hot-toast";

const ManageAdmin = () => {
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [staffToEdit, setStaffToEdit] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formStaff, setFormStaff] = useState({
    nama_lengkap: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Ambil profil admin yang sedang login untuk verifikasi keamanan
  const savedAdminUser = JSON.parse(localStorage.getItem("siclus_user") || "{}");
  const currentAdminEmail = savedAdminUser?.email || "";

  // State Verifikasi Keamanan Modal Hapus Staf
  const [deleteEmailAdmin, setDeleteEmailAdmin] = useState("");
  const [deletePasswordAdmin, setDeletePasswordAdmin] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

  // State Modal Edit Staf
  const [formEditStaff, setFormEditStaff] = useState({
    nama_lengkap: "",
    password: "",
    password_admin: "",
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditAdminPassword, setShowEditAdminPassword] = useState(false);

  // Perhitungan otomatis ID staf berikutnya
  const getNextStaffId = () => {
    const existingNumbers = staffList
      .map((s) => {
        const match = String(s.id || s.raw_id || "").match(/DSHB-OPS-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers, 0) : 0;
    return `DSHB-OPS-${String(maxNum + 1).padStart(2, "0")}`;
  };

  const nextStaffId = getNextStaffId();

  // validasi kombinasi nama sandi
  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password wajib minimal 8 karakter.";
    if (!/[A-Z]/.test(pwd)) return "Password wajib mengandung minimal 1 huruf kapital.";
    if (!/[a-z]/.test(pwd)) return "Password wajib mengandung minimal 1 huruf kecil.";
    if (!/[0-9]/.test(pwd)) return "Password wajib mengandung minimal 1 angka.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password wajib mengandung minimal 1 simbol (contoh: #, @, $, !).";
    return null;
  };

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getStafAdmin();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setStaffList(list);
    } catch (err) {
      console.error("Gagal memuat staf admin:", err);
      toast.error(err.response?.data?.detail || "Gagal memuat data staf admin");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    const nama = formStaff.nama_lengkap.trim();
    const rawEmail = formStaff.email.trim().toLowerCase();
    const password = formStaff.password.trim();

    if (!nama || !rawEmail || !password) {
      toast.error("Semua kolom wajib diisi.");
      return;
    }

    const username = rawEmail.includes("@") ? rawEmail.split("@")[0] : rawEmail;
    const emailFull = `${username}@siclus.id`;

    const pwdErr = validatePassword(password);
    if (pwdErr) {
      toast.error(pwdErr);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.createStafAdmin({
        nama_lengkap: nama,
        email: emailFull,
        password,
      });
      toast.success(res?.pesan || "Staf admin berhasil ditambahkan!");
      setShowAddModal(false);
      setFormStaff({ nama_lengkap: "", email: "", password: "" });
      setShowPassword(false);
      fetchStaff();
    } catch (err) {
      console.error("Gagal menambah staf admin:", err);
      toast.error(err.response?.data?.detail || "Gagal menambahkan staf admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (staff) => {
    setStaffToDelete(staff);
    setDeleteEmailAdmin(currentAdminEmail || "");
    setDeletePasswordAdmin("");
    setShowDeletePassword(false);
    setDeleteErrorMessage("");
  };

  const handleDeleteStaff = async (e) => {
    if (e) e.preventDefault();
    if (!staffToDelete) return;

    setDeleteErrorMessage("");
    if (!deleteEmailAdmin.trim()) {
      setDeleteErrorMessage("Email administrator wajib diisi.");
      return;
    }
    if (!deletePasswordAdmin) {
      setDeleteErrorMessage("Password administrator wajib diisi untuk verifikasi keamanan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetId = staffToDelete.raw_id || staffToDelete.id;
      const res = await apiService.deleteStafAdmin(targetId, {
        email_admin: deleteEmailAdmin.trim(),
        password_admin: deletePasswordAdmin,
      });
      toast.success(res?.pesan || "Staf admin berhasil dihapus!");
      if (staffToDelete?.email) {
        localStorage.setItem("siclus_revoked_account", JSON.stringify({ email: staffToDelete.email, time: Date.now() }));
      }
      setStaffToDelete(null);
      fetchStaff();
    } catch (err) {
      console.error("Gagal menghapus staf:", err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((d) => d.msg).join(", ") : "Gagal menghapus staf admin.";
      setDeleteErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (staff) => {
    setStaffToEdit(staff);
    setFormEditStaff({
      nama_lengkap: staff.nama || "",
      password: "",
      password_admin: "",
    });
    setShowEditPassword(false);
    setShowEditAdminPassword(false);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!staffToEdit) return;

    const nama = formEditStaff.nama_lengkap.trim();
    const password = formEditStaff.password.trim();
    const passwordAdmin = (formEditStaff.password_admin || "").trim();

    if (!nama) {
      toast.error("Nama lengkap tidak boleh kosong.");
      return;
    }

    if (!passwordAdmin) {
      toast.error("Password administrator wajib diisi untuk verifikasi keamanan.");
      return;
    }

    const payload = {
      nama_lengkap: nama,
      password_admin: passwordAdmin,
    };
    if (password) {
      const pwdErr = validatePassword(password);
      if (pwdErr) {
        toast.error(pwdErr);
        return;
      }
      payload.password = password;
    }

    setIsSubmitting(true);
    try {
      const targetId = staffToEdit.raw_id || staffToEdit.id;
      const res = await apiService.updateStafAdmin(targetId, payload);
      toast.success(res?.pesan || "Data staf admin berhasil diperbarui!");
      setStaffToEdit(null);
      fetchStaff();
    } catch (err) {
      console.error("Gagal memperbarui staf admin:", err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((d) => d.msg).join(", ") : "Gagal memperbarui staf admin";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const q = searchQuery.toLowerCase();
    const name = (s.nama || "").toLowerCase();
    const email = (s.email || "").toLowerCase();
    const id = (s.id || "").toLowerCase();
    return name.includes(q) || email.includes(q) || id.includes(q);
  });

  return (
    <div className="space-y-5 text-left max-w-7xl mx-auto pb-12 font-sans animate-[fadeIn_0.2s]">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#00206B] m-0 tracking-tight">Kelola Administrator</h2>
          <p className="text-xs text-slate-500 font-normal mt-1">Daftar akun administrator sistem monitoring angkutan sekolah.</p>
        </div>
      </div>

      {/* Toolbar: Search + Tombol Tambah */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:px-5 sm:py-3 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, ID, atau email..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00206B] focus:ring-2 focus:ring-[#00206B]/10 transition-all"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider cursor-pointer flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          TAMBAH ADMIN
        </button>
      </div>

      {/* Tabel Data Staf */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-[0_4px_24px_-6px_rgba(0,32,107,0.06)] overflow-hidden text-left">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#00206B] rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-medium text-slate-400 mt-4">Memuat daftar staf administrator...</p>
          </div>
        ) : filteredStaff.length > 0 ? (
          <div className="overflow-x-auto w-full min-h-[300px]">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead className="bg-slate-50 border-b border-slate-200/80">
                <tr className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  <th className="py-4 px-6">Administrator</th>
                  <th className="py-4 px-6 text-center">ID Kedinasan</th>
                  <th className="py-4 px-6">Email Kedinasan</th>
                  <th className="py-4 px-6 text-center">Tingkat Peran</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90 text-sm">
                {filteredStaff.map((staff) => {
                  const staffName = staff.nama || "Administrator";
                  const initials = staffName.slice(0, 2).toUpperCase();
                  const isMaster = staff.is_master;

                  return (
                    <tr key={staff.id || staff.raw_id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nama & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 text-[#00206B] flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                            {staff.foto_profil ? <img src={staff.foto_profil} alt={staffName} className="w-full h-full object-cover" /> : initials}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block">{staffName}</span>
                            {isMaster && <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Penanggung Jawab Utama</span>}
                          </div>
                        </div>
                      </td>

                      {/* ID Kedinasan */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200/80 tracking-wider">{staff.id}</span>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6">
                        <span className="text-xs font-semibold text-slate-600 block">{staff.email}</span>
                      </td>

                      {/* Tingkat Peran */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        {isMaster ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-[#00206B]/10 text-[#00206B] border border-[#00206B]/20 shadow-2xs">
                            ADMIN UTAMA
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                            OPERASIONAL
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        {isMaster ? (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200/60">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                              />
                            </svg>
                            Terproteksi
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(staff)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer active:scale-95 shadow-2xs"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(staff)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer active:scale-95 shadow-2xs"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              <span>Hapus</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
            <p className="text-sm font-semibold text-slate-600">Tidak ada staf administrator ditemukan.</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol "+ Tambah Staf Admin" di atas untuk mendaftarkan staf baru.</p>
          </div>
        )}
      </div>

      {/* Modal Tambah Staf Admin */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-[fadeIn_0.15s]">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-base font-bold text-[#00206B] m-0">Tambah Administrator</h4>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 space-y-4" autoComplete="off">
              {/* Trap anti-autofill browser: menyerap autofill browser agar field utama tetap kosong */}
              <div className="sr-only opacity-0 h-0 w-0 absolute -z-10 overflow-hidden" aria-hidden="true">
                <input type="text" name="fake_admin_username" tabIndex="-1" autoComplete="username" />
                <input type="password" name="fake_admin_password" tabIndex="-1" autoComplete="current-password" />
              </div>

              {/* 1. Nama Lengkap */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">NAMA LENGKAP</label>
                <input
                  type="text"
                  name="new_admin_name"
                  autoComplete="off"
                  value={formStaff.nama_lengkap}
                  onChange={(e) => setFormStaff({ ...formStaff, nama_lengkap: e.target.value })}
                  placeholder="Masukkan nama lengkap staf"
                  className="w-full bg-white border border-slate-200 text-sm font-semibold text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B] focus:ring-2 focus:ring-[#00206B]/10 transition-all"
                  required
                  autoFocus
                />
              </div>

              {/* 2. Email Akun (Single Input, otomatis @siclus.id) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">EMAIL KEDINASAN</label>
                <input
                  type="text"
                  name="new_admin_email"
                  autoComplete="new-password"
                  readOnly
                  onFocus={(e) => {
                    e.target.readOnly = false;
                  }}
                  value={formStaff.email}
                  onChange={(e) => setFormStaff({ ...formStaff, email: e.target.value })}
                  onBlur={() => {
                    const val = formStaff.email.trim();
                    if (val && !val.includes("@")) {
                      setFormStaff((prev) => ({ ...prev, email: `${val}@siclus.id` }));
                    }
                  }}
                  placeholder="@siclus.id"
                  className="w-full bg-white border border-slate-200 text-sm font-semibold text-[#00206B] rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B] focus:ring-2 focus:ring-[#00206B]/10 transition-all"
                  required
                />
              </div>

              {/* 3. Kata Sandi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">KATA SANDI</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="new_admin_password"
                    autoComplete="new-password"
                    readOnly
                    onFocus={(e) => {
                      e.target.readOnly = false;
                    }}
                    value={formStaff.password}
                    onChange={(e) => setFormStaff({ ...formStaff, password: e.target.value })}
                    placeholder="Contoh: Example27#"
                    className="w-full bg-white border border-slate-200 text-sm font-normal text-[#00206B] rounded-xl pl-4 pr-11 py-2.5 outline-none focus:border-[#00206B] focus:ring-2 focus:ring-[#00206B]/10 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#00206B] transition-colors focus:outline-none cursor-pointer"
                    title={showPassword ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-normal">Wajib min. 8 karakter, kombinasi huruf kapital, angka, dan simbol.</p>
              </div>

              {/* 4. ID Administrator (Otomatis & Terkunci) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">ID ADMINISTRATOR (OTOMATIS)</label>
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-700 select-none">
                  <span>{nextStaffId}</span>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-normal">
                    <span>Urut Otomatis</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormStaff({ nama_lengkap: "", email: "", password: "" });
                    setShowPassword(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#00206B] hover:bg-[#001850] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-900/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {isSubmitting ? "MENYIMPAN..." : "SIMPAN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Staf Admin */}
      {staffToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-[fadeIn_0.15s]">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-[#00206B] m-0">Edit Administrator</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Perbarui nama atau reset kata sandi staf operasional.</p>
              </div>
              <button
                type="button"
                onClick={() => setStaffToEdit(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="p-6 space-y-4" autoComplete="off">
              {/* Trap anti-autofill browser */}
              <div className="sr-only opacity-0 h-0 w-0 absolute -z-10 overflow-hidden" aria-hidden="true">
                <input type="text" name="fake_edit_username" tabIndex="-1" autoComplete="username" />
                <input type="password" name="fake_edit_password" tabIndex="-1" autoComplete="current-password" />
              </div>

              {/* 1. Nama Lengkap (Editable) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">NAMA LENGKAP</label>
                <input
                  type="text"
                  name="edit_admin_name"
                  value={formEditStaff.nama_lengkap}
                  onChange={(e) => setFormEditStaff({ ...formEditStaff, nama_lengkap: e.target.value })}
                  placeholder="Masukkan nama lengkap staf"
                  className="w-full bg-white border border-slate-200 text-sm font-semibold text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:border-[#00206B] focus:ring-2 focus:ring-[#00206B]/10 transition-all"
                  required
                  autoFocus
                />
              </div>

              {/* 2. Email Akun (Terkunci) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">EMAIL KEDINASAN (TERKUNCI)</label>
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-700 select-none">
                  <span>{staffToEdit.email}</span>
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-normal">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 3. Kata Sandi Baru (Opsional) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  PASSWORD BARU (OPSIONAL)
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    name="edit_admin_password"
                    autoComplete="new-password"
                    readOnly
                    onFocus={(e) => {
                      e.target.readOnly = false;
                    }}
                    value={formEditStaff.password}
                    onChange={(e) => setFormEditStaff({ ...formEditStaff, password: e.target.value })}
                    placeholder="Kosongkan jika tidak diganti"
                    className="w-full bg-white border border-slate-200 text-sm font-normal text-[#00206B] rounded-xl pl-4 pr-11 py-2.5 outline-none focus:border-[#00206B] focus:ring-2 focus:ring-[#00206B]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#00206B] transition-colors focus:outline-none cursor-pointer"
                    title={showEditPassword ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                  >
                    {showEditPassword ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-normal">
                  Kosongkan jika tidak diganti. Min. 8 karakter kombinasi huruf kapital, angka, dan simbol.
                </p>
              </div>

              {/* 4. ID Administrator (Terkunci) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">ID ADMINISTRATOR (TERKUNCI)</label>
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-700 select-none">
                  <span>{staffToEdit.id}</span>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-normal">
                    <span>Terkunci</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 5. Security Notice & Verifikasi Password Admin */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-amber-900 text-xs">
                <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
                <div className="leading-snug">
                  <span className="font-bold block">Verifikasi Keamanan Administrator</span>
                  <span className="text-[11px] text-amber-800">
                    Masukkan password akun administrator Anda untuk mengonfirmasi perubahan data akun ini.
                  </span>
                </div>
              </div>

              {/* Input Password Admin Konfirmasi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  PASSWORD ADMINISTRATOR (KONFIRMASI) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                      />
                    </svg>
                  </div>
                  <input
                    type={showEditAdminPassword ? "text" : "password"}
                    name="edit_confirm_admin_password"
                    autoComplete="new-password"
                    readOnly
                    onFocus={(e) => {
                      e.target.readOnly = false;
                    }}
                    value={formEditStaff.password_admin || ""}
                    onChange={(e) => setFormEditStaff({ ...formEditStaff, password_admin: e.target.value })}
                    placeholder="Ketik password admin Anda untuk konfirmasi"
                    required
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00206B] focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditAdminPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showEditAdminPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showEditAdminPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setStaffToEdit(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formEditStaff.password_admin?.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#00206B] hover:bg-[#001850] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-900/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {isSubmitting ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Staf (Verifikasi Keamanan Kredensial Administrator Sesuai Gambar 2) */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-[fadeIn_0.15s]">
          <div className="bg-white rounded-3xl p-6 md:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-[scaleIn_0.15s]" onClick={(e) => e.stopPropagation()}>
            {/* Header Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
                />
              </svg>
            </div>

            {/* Title */}
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-[#00206B] tracking-tight">Hapus Akun Administrator?</h3>
              <p className="text-xs text-slate-500 font-normal">Tindakan ini bersifat permanen. Seluruh data akun & akses operasional akan dicabut dari sistem.</p>
            </div>

            {/* Staff Card Info */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-100/70 border border-rose-200/80 text-rose-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {staffToDelete.foto_profil ? (
                  <img
                    src={staffToDelete.foto_profil}
                    alt={staffToDelete.nama}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement.innerText = (staffToDelete.nama || "AD").slice(0, 2).toUpperCase();
                    }}
                  />
                ) : (
                  (staffToDelete.nama || "AD").slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs text-[#00206B] uppercase tracking-tight block truncate">{staffToDelete.nama || "Administrator"}</span>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                  <span className="inline-block font-semibold px-1.5 py-0.2 rounded-md bg-white border border-slate-200/80 text-slate-700">{staffToDelete.id}</span>
                  <span className="truncate">{staffToDelete.email || "-"}</span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-amber-900 text-xs">
              <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <div className="leading-snug">
                <span className="font-bold block">Verifikasi Keamanan Administrator</span>
                <span className="text-[11px] text-amber-800">Demi mencegah kesalahan fatal, masukkan kredensial akun administrator Anda.</span>
              </div>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleDeleteStaff} className="space-y-3.5" autoComplete="off">
              {/* Anti-autofill trap */}
              <div className="sr-only opacity-0 h-0 w-0 absolute -z-10 overflow-hidden" aria-hidden="true">
                <input type="text" name="fake_admin_del_user" tabIndex="-1" autoComplete="username" />
                <input type="password" name="fake_admin_del_pwd" tabIndex="-1" autoComplete="current-password" />
              </div>

              {/* Email Admin */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">EMAIL ADMINISTRATOR</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={deleteEmailAdmin}
                    onChange={(e) => setDeleteEmailAdmin(e.target.value)}
                    placeholder="admin@siclus.id"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00206B] focus:bg-white transition-all font-medium disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password Admin */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">PASSWORD ADMINISTRATOR</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                      />
                    </svg>
                  </div>
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePasswordAdmin}
                    onChange={(e) => setDeletePasswordAdmin(e.target.value)}
                    placeholder="Ketik password admin Anda"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    readOnly
                    onFocus={(e) => {
                      e.target.readOnly = false;
                    }}
                    autoFocus
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00206B] focus:bg-white transition-all font-medium disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showDeletePassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showDeletePassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {deleteErrorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-start gap-2 animate-[fadeIn_0.15s]">
                  <svg className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <span>{deleteErrorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStaffToDelete(null)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase cursor-pointer transition-colors disabled:opacity-50"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !deletePasswordAdmin || !deleteEmailAdmin.trim()}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold rounded-xl text-xs uppercase shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>MEMVALIDASI...</span>
                    </>
                  ) : (
                    <span>KONFIRMASI HAPUS</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAdmin;
