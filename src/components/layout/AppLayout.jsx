import React, { useState } from "react";

const AppLayout = ({ children, title = "SICLUS", onBack = null, activeMenu = "beranda", onMenuClick = () => {}, user = null }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const adminMenuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <>
          <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.75" />
          <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.75" />
          <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.75" />
          <rect x="14" y="14" width="6.5" height="6.5" rx="1.75" />
        </>
      ),
    },
    },
    {
      id: "rekap",
      label: "Rekap Driver",
      icon: (
        <>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M8 16V12" />
          <path d="M12 16V8" />
          <path d="M16 16V10" />
        </>
      ),
    },
    {
      id: "kelola",
      label: "Kelola Driver",
      icon: (
        <>
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </>
      ),
    },
    {
      id: "akun",
      label: "Profil",
      icon: (
        <>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      ),
    },
  ];

  const driverMenuItems = [
    {
      id: "beranda",
      label: "Beranda",
      icon: (
        <>
          <path d="M3 10.5L12 3l9 7.5v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
          <path d="M9 21V12h6v9" />
        </>
      ),
    },
    {
      id: "laporan",
      label: "Laporan",
      icon: (
        <>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M9 13.5l2 2 4-4" />
        </>
      ),
    },
    {
      id: "riwayat",
      label: "Riwayat",
      icon: (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </>
      ),
    },
    {
      id: "akun",
      label: "Profil",
      icon: (
        <>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      ),
    },
  ];

  const menuItems = user?.role?.toLowerCase() === "admin" ? adminMenuItems : driverMenuItems;

  return (
    <div className="flex h-screen w-full bg-[#131314] font-sans overflow-hidden">
      <aside className={`hidden md:flex flex-col h-full bg-[#131314] text-[#C4C7C5] transition-all duration-300 ease-in-out border-r border-white/5 z-50 ${isSidebarOpen ? "w-64" : "w-[72px]"}`}>
        <div className={`flex items-center h-20 ${isSidebarOpen ? "px-4 justify-between" : "justify-center"}`}>
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
            <span className="text-xl font-black text-white tracking-widest uppercase">SICLUS</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Kecilkan Sidebar" : "Buka Sidebar"}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-400 hover:text-white transition-all flex-shrink-0 focus:outline-none active:scale-95"
          >
            <svg className="w-5 h-5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M9 3v18" />
              <path d={isSidebarOpen ? "M14 10l-2 2 2 2" : "M12 10l2 2-2 2"} />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isReportTabActive = item.id === "laporan" && ["persiapan", "inspeksi", "kendala", "laporan"].includes(activeMenu);
            const isRiwayatTabActive = (item.id === "riwayat" || item.id === "riwayatdriver") && ["ringkasan", "riwayat", "detaillaporan", "detail-laporan"].includes(activeMenu);
            const isActive = activeMenu === item.id || isReportTabActive || isRiwayatTabActive;
            return (
              <button
                key={item.id}
                onClick={() => onMenuClick(item.id)}
                className={`w-full flex items-center transition-all duration-200 group relative rounded-xl ${
                  isSidebarOpen ? "px-3.5 py-3" : "p-3 justify-center"
                } ${
                  isActive
                    ? "bg-[#A8C7FA]/15 text-[#A8C7FA] font-bold shadow-sm shadow-[#A8C7FA]/5 border border-[#A8C7FA]/20"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent"
                }`}
                title={!isSidebarOpen ? item.label : ""}
              >
                {isActive && isSidebarOpen && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#A8C7FA] rounded-r-full"></span>
                )}

                <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center transition-transform duration-200 ${isActive ? "scale-105 text-[#A8C7FA]" : "text-slate-400 group-hover:text-white group-hover:scale-105"}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                </div>
                <div className={`overflow-hidden transition-all duration-300 flex items-center ${isSidebarOpen ? "ml-3.5 opacity-100 flex-1 min-w-0" : "opacity-0 w-0 hidden"}`}>
                  <span className="text-sm font-semibold whitespace-nowrap text-left tracking-wide">{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* BLOK PROFIL SIDEBAR POJOK KIRI BAWAH */}
        <div className="p-3 mb-2 border-t border-white/10 mt-auto">
          <div
            onClick={() => onMenuClick("akun")}
            className={`flex items-center rounded-2xl cursor-pointer transition-all duration-200 group ${
              isSidebarOpen ? "p-2.5 w-full" : "w-11 h-11 mx-auto justify-center p-0"
            } ${
              activeMenu === "akun"
                ? "bg-[#A8C7FA]/15 border border-[#A8C7FA]/35 text-white shadow-sm shadow-[#A8C7FA]/10"
                : "bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.09] hover:border-white/20 text-white"
            }`}
            title={!isSidebarOpen ? `${user?.nama_lengkap || user?.nama || "Pengguna"} (${user?.role || "USER"}) - Profil` : ""}
          >
            {/* RENDER AVATAR AMAN */}
            <div className="relative flex-shrink-0 flex items-center justify-center">
              {user?.foto_profil ? (
                <img
                  src={user.foto_profil}
                  alt="Avatar"
                  className={`${
                    isSidebarOpen ? "w-10 h-10" : "w-9 h-9"
                  } rounded-xl object-cover ring-2 ring-white/15 group-hover:ring-[#A8C7FA]/40 bg-slate-800 transition-all shadow-sm`}
                />
              ) : (
                <div
                  className={`${
                    isSidebarOpen ? "w-10 h-10 text-sm" : "w-9 h-9 text-xs"
                  } rounded-xl bg-gradient-to-tr from-[#00206B] via-[#0A328C] to-blue-500 text-white flex items-center justify-center font-black shadow-sm ring-2 ring-white/15 group-hover:ring-[#A8C7FA]/40 transition-all`}
                >
                  {(user?.nama_lengkap || user?.nama || user?.name || "A").charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#131314] rounded-full"></span>
            </div>

            {/* RENDER NAMA AMAN */}
            <div
              className={`overflow-hidden transition-all duration-300 flex flex-col justify-center text-left ${
                isSidebarOpen ? "ml-3 flex-1 min-w-0 opacity-100" : "w-0 opacity-0 hidden"
              }`}
            >
              <p className="text-xs font-bold text-white truncate w-full group-hover:text-[#A8C7FA] transition-colors m-0 tracking-tight">
                {user?.nama_lengkap || user?.nama || user?.name || "Pengguna"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-white/10 text-slate-300">
                  {user?.role || "USER"}
                </span>
              </div>
            </div>

            {/* Chevron Indicator when open */}
            {isSidebarOpen && (
              <div className="text-slate-500 group-hover:text-slate-300 transition-colors ml-1 pr-1">
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
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
