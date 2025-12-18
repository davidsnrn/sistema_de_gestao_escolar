
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Sparkles, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="p-8 text-center bg-indigo-600 text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold">EducaFrequência</h2>
            <p className="text-indigo-100 mt-2">Portal Escolar</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    placeholder="exemplo@escola.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Senha</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <LogIn size={20} /> Entrar
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDevLogin('PROFESSOR')}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold border border-slate-100"
                >
                  Dev Professor
                </button>
                <button
                  type="button"
                  onClick={() => handleDevLogin('SECRETARIO')}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-2 rounded-xl text-xs font-bold border border-indigo-100"
                >
                  Dev Secretário
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
