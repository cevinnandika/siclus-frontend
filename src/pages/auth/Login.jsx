import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";

const Login = ({ onLoginSuccess }) => {
  const [driverId, setDriverId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. Tembak API Login (ngelewatin apiService yang udah disetting axios)
      const response = await apiService.login(driverId, pin);

      // 2. SIMPAN TIKET VIP (JWT) KE BRANKAS BROWSER!
      localStorage.setItem("siclus_token", response.access_token);

      // 3. Rapihin data dari Backend lu biar gampang dibaca FE Cevin
      const userData = {
        id: response.user.id,
        name: response.user.nama_lengkap,
        email: response.user.email,
        role: response.user.role,
        trayek: response.user.trayek,
        bus: response.user.bus,
        foto_profil: response.user.foto_profil,
      };

      setTimeout(() => {
        onLoginSuccess(userData);
      }, 500);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        if (Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(", "));
        } else if (typeof err.response.data.detail === "string") {
          setError(err.response.data.detail);
        } else {
          setError("Format data login tidak valid.");
        }
      } else {
        setError(err.message || "Terjadi kesalahan!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 sm:-top-32 w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] bg-gradient-to-b from-blue-500 via-cyan-500 to-indigo-600 rounded-full blur-[80px] sm:blur-[120px] opacity-60 animate-pulse"></div>
      <div
        className="absolute -bottom-24 left-1/2 -translate-x-1/2 sm:-bottom-32 w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] bg-gradient-to-t from-purple-600 via-indigo-700 to-pink-500 rounded-full blur-[80px] sm:blur-[120px] opacity-50 animate-pulse"
        style={{ animationDelay: "2.5s" }}
      ></div>
      <div
        className={`relative w-full max-w-[360px] xs:max-w-[390px] sm:max-w-[440px] md:max-w-[480px] lg:max-w-[520px] bg-white/85 backdrop-blur-2xl rounded-[2.2rem] sm:rounded-[2.5rem] p-5 sm:p-8 lg:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white/70 transition-all duration-1000 ease-out transform ${isMounted ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}
      >
        <div className="flex flex-col items-center text-center mt-1 mb-5 sm:mb-8">
          <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br from-[#00206B] via-[#00174E] to-[#000F33] flex items-center justify-center shadow-md border border-white/20">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <rect x="4" y="3" width="16" height="15" rx="3" />
              <line x1="4" y1="13" x2="20" y2="13" />
              <circle cx="8" cy="9" r="1.5" fill="currentColor" />
              <circle cx="16" cy="9" r="1.5" fill="currentColor" />
              <path d="M6 18v1.5a0.5 0 000.5 0.5h1a0.5 0 000.5-0.5V18H6zM16 18v1.5a0.5 0 000.5 0.5h1a0.5 0 000.5-0.5V18h-2z" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-4xl sm:text-3xl lg:text-4xl font-black text-[#00206B] tracking-tight mt-3 sm:mt-5 uppercase">SICLUS</h2>
          <p className="text-[7px] sm:text-xs font-bold text-slate-500 mt-1 tracking-widest leading-relaxed uppercase">School Integrated Check-in & Logbook Unit System</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className={`overflow-hidden transition-all duration-300 ${error ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="p-3 bg-red-500/10 border border-red-200/80 backdrop-blur-sm rounded-2xl text-xs text-red-600 font-bold text-center flex items-center justify-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
          <div className="space-y-1 group">
            <label className="text-[11px] sm:text-sm font-bold text-[#00206B] ml-1 uppercase tracking-wide">ID Driver / Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#00206B] transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="9" cy="11" r="2.5" />
                  <path d="M15 9h3M15 13h3M15 17h3" />
                </svg>
              </div>
              <input
                type="text"
                required
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full bg-slate-100/80 border-2 border-slate-200/70 focus:border-[#00206B] focus:bg-white focus:ring-4 focus:ring-[#00206B]/10 rounded-2xl pl-10 sm:pl-11 pr-4 py-3 sm:py-4 text-xs sm:text-base font-bold text-[#00206B] placeholder-slate-400 outline-none transition-all duration-300"
                placeholder="Contoh: admin@siclus.id"
              />
            </div>
          </div>
          <div className="space-y-1 group">
            <label className="text-[11px] sm:text-sm font-bold text-[#00206B] ml-1 uppercase tracking-wide">PIN / Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#00206B] transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <input
                type={showPin ? "text" : "password"}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-100/80 border-2 border-slate-200/70 focus:border-[#00206B] focus:bg-white focus:ring-4 focus:ring-[#00206B]/10 rounded-2xl pl-10 sm:pl-11 pr-11 py-3 sm:py-4 text-xs sm:text-base font-bold text-[#00206B] placeholder-slate-400 outline-none transition-all duration-300 tracking-wider"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-3.5 sm:pr-4 flex items-center text-slate-400 hover:text-[#00206B] transition-colors focus:outline-none"
              >
                {showPin ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative overflow-hidden bg-gradient-to-r from-[#00206B] via-[#001D60] to-[#001240] text-white font-black py-3.5 sm:py-4 px-4 rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,32,107,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(0,32,107,0.6)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 mt-3 sm:mt-6 group"
          >
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/30 opacity-20 group-hover:animate-[shine_1s] pointer-events-none" />
            <div className="flex items-center justify-center gap-2 relative z-10 text-xs sm:text-base">
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white/70" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>MEMPROSES...</span>
                </>
              ) : (
                <>
                  <span>MASUK SISTEM</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </div>
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200/60">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="text-[9px] sm:text-xs font-bold text-slate-500 tracking-wide uppercase">Siclus 1.0</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
