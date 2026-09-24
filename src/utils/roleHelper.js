// Validasi peran admin master
export const isMasterAdmin = (user) => {
  if (!user) return false;
  const id = String(user.id || user.id_driver || "")
    .trim()
    .toUpperCase();
  const email = String(user.email || "")
    .trim()
    .toLowerCase();
  const role = String(user.role || "")
    .trim()
    .toLowerCase();

  return id === "DSHB-ADM-01" || id === "ADM001" || id === "ADM-MASTER" || email === "admin@siclus.id" || role === "master_admin";
};

// Judul peran untuk UI
export const getAdminRoleTitle = (user) => {
  return isMasterAdmin(user) ? "ADMINISTRATOR UTAMA" : "ADMINISTRATOR OPERASIONAL";
};

// Format tampilan ID kedinasan resmi
export const getAdminFormattedId = (user) => {
  if (!user) return "DSHB-ADM-01";
  const id = String(user.id || user.id_driver || "")
    .trim()
    .toUpperCase();
  if (isMasterAdmin(user)) {
    return id.startsWith("DSHB-") ? id : "DSHB-ADM-01";
  }
  return id || "DSHB-OPS-01";
};

// Deskripsi penugasan profil
export const getAdminDutyLabel = (user) => {
  return isMasterAdmin(user) ? "Penanggung Jawab Utama Sistem Monitoring Angkutan Sekolah" : "Petugas Monitoring Operasional Angkutan Sekolah";
};

// Deskripsi hak akses akun
export const getAdminAccessLabel = (user) => {
  return isMasterAdmin(user) ? "Akses Penuh Kedinasan (Monitoring, Penugasan & Manajemen Staf)" : "Operasional Harian (Monitoring Driver & Pelaporan Armada)";
};

// Greeting sambutan dashboard
export const getAdminGreeting = (user) => {
  return isMasterAdmin(user) ? "Selamat Datang, Administrator Utama Dishub Kota Mojokerto" : "Selamat Datang, Administrator Operasional Dishub Kota Mojokerto";
};
