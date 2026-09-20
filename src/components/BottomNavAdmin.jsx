import React from 'react';
import { NavLink } from 'react-router-dom';

// ==============================================================================
// KOMPONEN: BOTTOM NAV ADMIN (NAVIGASI KHUSUS MOBILE ADMINISTRATOR)
// ==============================================================================
const BottomNavAdmin = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#131314]/95 backdrop-blur-xl border-t border-white/10 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.45)] pb-safe transition-all duration-300">
      <div className="flex items-center justify-around px-2.5 py-2 gap-1.5 max-w-md mx-auto">
        {/* BERANDA */}
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-2xl transition-all duration-200 relative group cursor-pointer ${
              isActive
                ? 'bg-[#A8C7FA]/15 text-[#A8C7FA] font-bold border border-[#A8C7FA]/30 shadow-sm shadow-[#A8C7FA]/10'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent font-medium'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute -top-1 w-6 h-0.5 bg-[#A8C7FA] rounded-full shadow-[0_0_8px_#A8C7FA]"></span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110 text-[#A8C7FA]' : 'text-slate-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'text-[#A8C7FA] font-bold' : 'text-slate-400 font-medium'}`}>Dashboard</span>
            </>
          )}
        </NavLink>

        {/* REKAP */}
        <NavLink
          to="/admin/rekap"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-2xl transition-all duration-200 relative group cursor-pointer ${
              isActive
                ? 'bg-[#A8C7FA]/15 text-[#A8C7FA] font-bold border border-[#A8C7FA]/30 shadow-sm shadow-[#A8C7FA]/10'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent font-medium'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute -top-1 w-6 h-0.5 bg-[#A8C7FA] rounded-full shadow-[0_0_8px_#A8C7FA]"></span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110 text-[#A8C7FA]' : 'text-slate-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'text-[#A8C7FA] font-bold' : 'text-slate-400 font-medium'}`}>Rekap</span>
            </>
          )}
        </NavLink>

        {/* KELOLA */}
        <NavLink
          to="/admin/kelola"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-2xl transition-all duration-200 relative group cursor-pointer ${
              isActive
                ? 'bg-[#A8C7FA]/15 text-[#A8C7FA] font-bold border border-[#A8C7FA]/30 shadow-sm shadow-[#A8C7FA]/10'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent font-medium'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute -top-1 w-6 h-0.5 bg-[#A8C7FA] rounded-full shadow-[0_0_8px_#A8C7FA]"></span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110 text-[#A8C7FA]' : 'text-slate-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'text-[#A8C7FA] font-bold' : 'text-slate-400 font-medium'}`}>Kelola</span>
            </>
          )}
        </NavLink>

        {/* AKUN */}
        <NavLink
          to="/admin/akun"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-2xl transition-all duration-200 relative group cursor-pointer ${
              isActive
                ? 'bg-[#A8C7FA]/15 text-[#A8C7FA] font-bold border border-[#A8C7FA]/30 shadow-sm shadow-[#A8C7FA]/10'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent font-medium'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute -top-1 w-6 h-0.5 bg-[#A8C7FA] rounded-full shadow-[0_0_8px_#A8C7FA]"></span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110 text-[#A8C7FA]' : 'text-slate-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'text-[#A8C7FA] font-bold' : 'text-slate-400 font-medium'}`}>Profil</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNavAdmin;
