
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Home, Users, Calendar } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer'}}>
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Calendar size={24} />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            EducaFrequência
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {userName && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-700">Olá, {userName}</span>
              <span className="text-xs text-slate-500 italic">Professora Titular</span>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors rounded-full"
            title="Sair do sistema"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-slate-400 text-sm">
        © 2024 EducaFrequência - Transformando o cuidado em dados.
      </footer>
    </div>
  );
};

export default Layout;
