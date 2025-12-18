
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, ArrowRight, Sun, Cloud, Moon, BookOpen, History, Calendar as CalendarIcon, Edit2, ChevronRight, X } from 'lucide-react';
import { professores, turmas, alunos } from '../mockData';
import { storageService } from '../services/storageService';
import { Professor, Turma, Aluno } from '../types';
import Layout from './Layout';

const Dashboard: React.FC = () => {
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [professorTurmas, setProfessorTurmas] = useState<Turma[]>([]);
  const [allAlunos, setAllAlunos] = useState<Aluno[]>([]);
  const [selectedHistoryTurma, setSelectedHistoryTurma] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { userId, role } = storageService.getSession();
    if (role !== 'PROFESSOR' || !userId) {
      navigate('/login');
      return;
    }

    const allProfs = storageService.getProfessors(professores);
    const allTurmas = storageService.getTurmas(turmas);
    const alunosList = storageService.getAlunos(alunos);
    
    const prof = allProfs.find(p => p.id === userId);
    if (prof) {
      setProfessor(prof);
      setProfessorTurmas(allTurmas.filter(t => t.professorId === userId));
      setAllAlunos(alunosList);
    }
  }, [navigate]);

  const getPeriodIcon = (periodo: string) => {
    switch (periodo) {
      case 'Manhã': return <Sun className="text-orange-400" size={18} />;
      case 'Tarde': return <Cloud className="text-blue-400" size={18} />;
      default: return <Moon className="text-indigo-400" size={18} />;
    }
  };

  const getHistoryForTurma = (turmaId: string) => {
    const turmaAlunosIds = allAlunos.filter(a => a.turmaId === turmaId).map(a => a.id);
    return storageService.getDatasComFrequencia(turmaId, turmaAlunosIds);
  };

  if (!professor) return null;

  return (
    <Layout userName={professor.nome}>
      <div className="space-y-8 pb-10">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-20 -mt-20 opacity-50 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Boas-vindas, {professor.nome.split(' ')[0]}!</h2>
              <p className="text-slate-500 mt-2 font-medium max-w-md">
                Gerencie a frequência das suas turmas e acompanhe o histórico de registros realizados.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <BookOpen size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest text-sm">Minhas Turmas</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professorTurmas.map((turma) => (
              <div 
                key={turma.id}
                className="group bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Users size={24} />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                    {getPeriodIcon(turma.periodo)}
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{turma.periodo}</span>
                  </div>
                </div>
                
                <h4 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">{turma.nome}</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">Educação Infantil</p>

                <div className="mt-auto space-y-3">
                  <button 
                    onClick={() => navigate(`/chamada/${turma.id}`)}
                    className="w-full py-4 px-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                  >
                    Chamada de Hoje
                    <ArrowRight size={18} />
                  </button>
                  
                  <button 
                    onClick={() => setSelectedHistoryTurma(selectedHistoryTurma === turma.id ? null : turma.id)}
                    className={`w-full py-3 px-4 ${selectedHistoryTurma === turma.id ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500'} font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all`}
                  >
                    <History size={16} />
                    Ver Histórico
                  </button>
                </div>

                {/* Lista de Histórico Expansível */}
                {selectedHistoryTurma === turma.id && (
                  <div className="mt-4 pt-4 border-t border-dashed border-slate-200 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros Anteriores</span>
                      <button onClick={() => setSelectedHistoryTurma(null)} className="text-slate-300 hover:text-slate-500"><X size={14}/></button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {getHistoryForTurma(turma.id).length > 0 ? (
                        getHistoryForTurma(turma.id).map(date => (
                          <div 
                            key={date}
                            onClick={() => navigate(`/chamada/${turma.id}?date=${date}`)}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 group/item cursor-pointer transition-colors border border-transparent hover:border-indigo-100"
                          >
                            <div className="flex items-center gap-2">
                              <CalendarIcon size={14} className="text-slate-400 group-hover/item:text-indigo-500" />
                              <span className="text-xs font-bold text-slate-600">
                                {new Date(date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <Edit2 size={12} className="text-slate-300 group-hover/item:text-indigo-400" />
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-400 italic text-center py-4">Nenhum registro encontrado.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </Layout>
  );
};

export default Dashboard;
