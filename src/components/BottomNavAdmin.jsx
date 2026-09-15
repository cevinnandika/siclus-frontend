import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNavAdmin = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-lg pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {/* BERANDA */}
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full ${isActive ? 'text-[#00206B] font-bold' : 'text-slate-400'}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
          <span className="text-[10px]">Beranda</span>
        </NavLink>

        {/* MENU RIWAYAT */}
        <NavLink
          to="/admin/riwayat"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full ${isActive ? 'text-[#00206B] font-bold' : 'text-slate-400'}`
          }
        >
          {/* Ikon Jam/Riwayat SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px]">Riwayat</span>
        </NavLink>

        {/* REKAP */}
        <NavLink
          to="/admin/rekap"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full ${isActive ? 'text-[#00206B] font-bold' : 'text-slate-400'}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[10px]">Rekap</span>
        </NavLink>

        {/* KELOLA */}
        <NavLink
          to="/admin/kelola"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full ${isActive ? 'text-[#00206B] font-bold' : 'text-slate-400'}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-[10px]">Kelola</span>
        </NavLink>

        {/* AKUN */}
        <NavLink
          to="/admin/akun"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full ${isActive ? 'text-[#00206B] font-bold' : 'text-slate-400'}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px]">Akun</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNavAdmin;
