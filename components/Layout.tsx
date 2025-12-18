
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Sun } from 'lucide-react';
import { storageService } from '../services/storageService';

interface LayoutProps {
  children: React.ReactNode;
  userName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, userName }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    storageService.clearSession();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/70 backdrop-blur-md border-b border-white/50 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative sun-gradient p-2.5 rounded-2xl text-white shadow-lg shadow-yellow-100 group-hover:rotate-12 transition-transform">
              <Sun size={24} strokeWidth={3} />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-800 leading-none tracking-tight">CMEI CLARA CAMARÃO</h1>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mt-1">Portal EducaFrequência</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {userName && (
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Acesso Autorizado</span>
              <span className="text-sm font-bold text-slate-700">{userName}</span>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-2xl active:scale-90"
            title="Sair do sistema"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {children}
      </main>

      <footer className="py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">
          <span>CMEI Clara Camarão</span>
          <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
          <span>Diário Digital v2.5</span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
