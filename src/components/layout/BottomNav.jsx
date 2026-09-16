import React from 'react';
import { useLocation, NavLink } from 'react-router-dom';

const BottomNav = ({ user = null }) => {
  const location = useLocation();
  const currentPath = location.pathname.split("/").pop(); // Ambil path terakhir

  const adminNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.75" />
          <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.75" />
          <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.75" />
          <rect x="14" y="14" width="6.5" height="6.5" rx="1.75" />
        </svg>
      ),
    },
    {
      id: 'rekap',
      label: 'Rekap',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M8 16V12" />
          <path d="M12 16V8" />
          <path d="M16 16V10" />
        </svg>
      ),
    },
    {
      id: 'kelola',
      label: 'Kelola',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
    {
      id: 'akun',
      label: 'Profil',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  const driverNavItems = [
    {
      id: 'beranda',
      label: 'Beranda',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 3l9 7.5v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
          <path d="M9 21V12h6v9" />
        </svg>
      ),
    },
    {
      id: 'laporan',
      label: 'Laporan',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M9 13.5l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'riwayat',
      label: 'Riwayat',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      ),
    },
    {
      id: 'akun',
      label: 'Profil',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const navItems = isAdmin ? adminNavItems : driverNavItems;
  const baseRoute = isAdmin ? '/admin' : '/driver';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-lg pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          // Cek apakah item aktif berdasarkan path URL saat ini
          const isReportTabActive = item.id === 'laporan' && currentPath === 'laporan';
          const isRiwayatTabActive = item.id === 'riwayat' && (currentPath === 'riwayat' || currentPath === 'detail-laporan');
          const isItemActive = currentPath === item.id || isReportTabActive || isRiwayatTabActive;

          return (
            <NavLink
              key={item.id}
              to={`${baseRoute}/${item.id}`}
              className={({ isActive }) => {
                const active = isActive || isItemActive;
                if (isAdmin) {
                  return `flex flex-col items-center justify-center w-full py-1.5 transition-all duration-200 ${
                    active ? 'text-[#00206B] font-semibold' : 'text-slate-400 font-medium'
                  }`;
                }
                return `flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-all duration-200 ${
                  active ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs' : 'text-slate-500 font-medium hover:text-slate-800 hover:bg-slate-50'
                }`;
              }}
            >
              {item.icon}
              <span className="text-[11px] font-medium mt-0.5 tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;