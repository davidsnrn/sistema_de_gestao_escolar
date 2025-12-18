
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Sparkles, Sun } from 'lucide-react';
import { professores, secretarios } from '../mockData';
import { storageService } from '../services/storageService';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const prof = professores.find(p => p.email === email);
      const sec = secretarios.find(s => s.email === email);

      if (sec) {
        storageService.setSession(sec.id, 'SECRETARIO');
        navigate('/admin');
      } else if (prof) {
        storageService.setSession(prof.id, 'PROFESSOR');
        navigate('/dashboard');
      } else {
        setError('Acesso negado ou usuário não encontrado.');
        setIsLoading(false);
      }
    }, 800);
  };

  const handleDevLogin = (role: 'PROFESSOR' | 'SECRETARIO') => {
    if (role === 'SECRETARIO') {
      storageService.setSession(secretarios[0].id, 'SECRETARIO');
      navigate('/admin');
    } else {
      storageService.setSession(professores[0].id, 'PROFESSOR');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fbff] p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-100/50 rounded-full blur-[100px]"></div>
      
      <div className="w-full max-w-lg relative z-10">
        <div className="bg-white rounded-[4rem] shadow-2xl shadow-indigo-100/50 overflow-hidden border border-white p-2">
          <div className="bg-slate-50 rounded-[3.5rem] overflow-hidden">
            <div className="p-12 text-center sky-gradient text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sun size={120} strokeWidth={1} />
              </div>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl mb-6 backdrop-blur-md shadow-inner">
                <Sun className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-1">CMEI CLARA CAMARÃO</h2>
              <p className="text-indigo-100 text-xs font-black uppercase tracking-[0.2em] opacity-80">EducaFrequência Digital</p>
            </div>

            <div className="p-12">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">E-mail de Acesso</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail size={18} />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-14 pr-6 py-4.5 bg-white border-2 border-slate-100 rounded-3xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 shadow-sm"
                        placeholder="nome@escola.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Sua Senha</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock size={18} />
                      </span>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-14 pr-6 py-4.5 bg-white border-2 border-slate-100 rounded-3xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 shadow-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                {error && <p className="text-rose-500 text-sm font-black text-center bg-rose-50 py-3 rounded-2xl border border-rose-100">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sky-gradient hover:opacity-90 text-white font-black uppercase text-xs tracking-[0.2em] py-5 rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-100 disabled:opacity-50"
                >
                  {isLoading ? 'Acessando...' : <><LogIn size={20} /> Entrar no Portal</>}
                </button>

                <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleDevLogin('PROFESSOR')}
                    className="bg-white hover:bg-slate-50 text-slate-400 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 transition-colors"
                  >
                    Atalho Professor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDevLogin('SECRETARIO')}
                    className="bg-white hover:bg-slate-50 text-indigo-400 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 transition-colors"
                  >
                    Atalho Secretaria
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <style>{`.py-4\\.5 { padding-top: 1.125rem; padding-bottom: 1.125rem; }`}</style>
    </div>
  );
};

export default LoginScreen;
