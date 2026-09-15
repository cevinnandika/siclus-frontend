import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://siclus-backend.vercel.app/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor Token Masuk
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("siclus_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor Token Keluar
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && !error.config?.url?.includes("/auth/login")) {
      localStorage.removeItem("siclus_token");
      localStorage.removeItem("siclus_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const apiService = {
  // ==========================================
  // AUTHENTIKASI & USER
  // ==========================================
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await apiClient.post("/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  },

  // ==========================================
  // ZONA DRIVER
  // ==========================================
  getPenugasanHariIni: async () => {
    const response = await apiClient.get("/driver/penugasan/hari-ini");
    return response.data;
  },
  getProfilDriver: async () => {
    const response = await apiClient.get("/driver/profil");
    return response.data;
  },
  getJadwalDriver: async () => {
    const response = await apiClient.get("/driver/jadwal");
    return response.data;
  },
  getRiwayatDriver: async () => {
    const response = await apiClient.get("/driver/riwayat");
    return response.data;
  },
  updateFotoProfil: async (fileBlob) => {
    const formData = new FormData();
    formData.append("foto", fileBlob, "profile.jpg");
    const response = await apiClient.put("/driver/profil/foto", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // -- Laporan Operasional --
  getLaporanHariIni: async (params) => {
    const response = await apiClient.get("/laporan/hari-ini", { params });
    return response.data;
  },
  mulaiLaporan: async (data) => {
    const response = await apiClient.post("/laporan/mulai", data);
    return response.data;
  },
  submitInspeksi: async (laporanId, data) => {
    const response = await apiClient.post(`/laporan/inspeksi?laporan_id=${laporanId}`, data);
    return response.data;
  },
  uploadSelfie: async (fileBlob) => {
    const formData = new FormData();
    formData.append("foto", fileBlob, "selfie.jpg");
    const response = await apiClient.post("/laporan/upload-selfie", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // -- Checkpoints --
  // CP 1: Keluar Garasi
  submitCP1: async (laporanId, data) => {
    const response = await apiClient.post(`/laporan/sesi/cp1?laporan_id=${laporanId}`, data);
    return response.data;
  },
  // CP 2: Tiba di Titik Finish (Di Backend Menggunakan Endpoint CP3)
  submitCP2: async (sesiId, data) => {
    const response = await apiClient.put(`/laporan/sesi/cp3/${sesiId}`, data);
    return response.data;
  },
  // CP 3: Kembali ke Garasi (Di Backend Menggunakan Endpoint CP4)
  submitCP3: async (sesiId, data) => {
    const response = await apiClient.put(`/laporan/sesi/cp4/${sesiId}`, data);
    return response.data;
  },

  // ==========================================
  // ZONA ADMIN
  // ==========================================
  createPenugasanHarian: async (data) => {
    const response = await apiClient.post("/admin/penugasan", data);
    return response.data;
  },
  updatePenugasanHarian: async (id, data) => {
    const response = await apiClient.put(`/admin/penugasan/${id}`, data);
    return response.data;
  },
  deletePenugasanHarian: async (id) => {
    const response = await apiClient.delete(`/admin/penugasan/${id}`);
    return response.data;
  },
  getSemuaPenugasan: async () => {
    const response = await apiClient.get("/admin/penugasan");
    return response.data;
  },
  getDashboardAdmin: async () => (await apiClient.get("/admin/dashboard")).data,
  getRekapAdmin: async () => (await apiClient.get("/admin/rekap")).data,
  getRiwayatHarianAdmin: async () => (await apiClient.get("/admin/riwayat-harian")).data,
  getUsersAdmin: async () => (await apiClient.get("/admin/users")).data,
  createUserAdmin: async (data) => (await apiClient.post("/admin/users", data)).data,
  updateUserAdmin: async (id, data) => (await apiClient.put(`/admin/users/${id}`, data)).data,
  deleteUserAdmin: async (id) => (await apiClient.delete(`/admin/users/${id}`)).data,
  getJadwalAdmin: async () => (await apiClient.get("/admin/jadwal")).data,
  createJadwalAdmin: async (data) => (await apiClient.post("/admin/jadwal", data)).data,
  updateJadwalAdmin: async (id, data) => (await apiClient.put(`/admin/jadwal/${id}`, data)).data,
  updateFotoProfilAdmin: async (fileBlob) => {
    const formData = new FormData();
    formData.append("foto", fileBlob, "profile_admin.jpg");
    const response = await apiClient.put("/admin/profil/foto", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export default apiClient;
