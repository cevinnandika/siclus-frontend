import React, { useState } from "react";

const AppLayout = ({ children, title = "SICLUS", onBack = null, activeMenu = "beranda", onMenuClick = () => {}, user = null }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const adminMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /> },
    { id: "riwayat", label: "Riwayat Driver", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    {
      id: "rekap",
      label: "Rekap Driver",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    },
    {
      id: "kelola",
      label: "Kelola Driver",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    },
    { id: "akun", label: "Profil", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
  ];

  const driverMenuItems = [
    {
      id: "beranda",
      label: "Beranda",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      ),
    },
    {
      id: "laporan",
      label: "Laporan",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    },
    { id: "riwayat", label: "Riwayat", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { id: "akun", label: "Profil", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
  ];

  const menuItems = user?.role?.toLowerCase() === "admin" ? adminMenuItems : driverMenuItems;

  return (
    <div className="flex h-screen w-full bg-[#131314] font-sans overflow-hidden">
      <aside className={`hidden md:flex flex-col h-full bg-[#131314] text-[#C4C7C5] transition-all duration-300 ease-in-out border-r border-white/5 z-50 ${isSidebarOpen ? "w-64" : "w-[72px]"}`}>
        <div className={`flex items-center h-20 ${isSidebarOpen ? "px-4 justify-between" : "justify-center"}`}>
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
            <span className="text-xl font-black text-white tracking-widest uppercase">SICLUS</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex-shrink-0 focus:outline-none">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isReportTabActive = item.id === "laporan" && ["persiapan", "inspeksi", "kendala", "laporan"].includes(activeMenu);
            const isRiwayatTabActive = (item.id === "riwayat" || item.id === "riwayatdriver") && ["ringkasan", "riwayat", "detaillaporan"].includes(activeMenu);
            const isActive = activeMenu === item.id || isReportTabActive || isRiwayatTabActive;
            return (
              <button
                key={item.id}
                onClick={() => onMenuClick(item.id)}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${isActive ? "bg-[#A8C7FA]/10 text-[#A8C7FA]" : "hover:bg-white/5 hover:text-white"}`}
                title={!isSidebarOpen ? item.label : ""}
              >
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {item.icon}
                  </svg>
                </div>
                <div className={`overflow-hidden transition-all duration-300 flex items-center ${isSidebarOpen ? "ml-4 opacity-100 w-full" : "opacity-0 w-0"}`}>
                  <span className="text-sm font-semibold whitespace-nowrap text-left">{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* BLOK PROFIL SIDEBAR POJOK KIRI BAWAH */}
        <div className="p-3 mb-2 border-t border-slate-800 mt-auto">
          <div
            onClick={() => onMenuClick("akun")}
            className="flex items-center p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
            title={!isSidebarOpen ? "Buka Akun" : ""}
          >
            {/* RENDER AVATAR AMAN */}
            {user?.foto_profil ? (
              <img src={user.foto_profil} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-600 bg-white flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00206B] to-blue-500 text-white flex items-center justify-center font-black text-sm shadow-sm border border-slate-600 flex-shrink-0">
                {/* Pengecekan multi-key untuk nama dari database */}
                {(user?.nama_lengkap || user?.nama || user?.name || "A").charAt(0).toUpperCase()}
              </div>
            )}

            {/* RENDER NAMA AMAN */}
            <div className={`overflow-hidden transition-all duration-300 flex flex-col justify-center ${isSidebarOpen ? "ml-3 w-full opacity-100" : "w-0 opacity-0"}`}>
              <p className="text-sm font-bold text-white truncate w-full group-hover:text-cyan-200 transition-colors m-0">{user?.nama_lengkap || user?.nama || user?.name || "Pengguna"}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest truncate w-full mt-0.5 m-0">{user?.role || "USER"}</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-screen relative bg-[#F5F7FB] md:rounded-l-[2.5rem] md:my-2 md:mr-2 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300">
        <header className="sticky top-0 z-40 flex items-center justify-between bg-white/80 backdrop-blur-xl px-6 py-4 border-b border-slate-200/50">
          <div className="w-10 flex items-center justify-start">
            {onBack && (
              <button onClick={onBack} className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all duration-200 text-slate-600 active:scale-95 focus:outline-none">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>

          <div className="text-center flex-1">
            <span className="text-lg font-black tracking-widest text-[#00206B] block uppercase">{title}</span>
          </div>
          <div className="w-10"></div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-28 md:pb-8">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
