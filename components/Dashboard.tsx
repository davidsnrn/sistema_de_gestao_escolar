
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Sun, Cloud, Moon } from 'lucide-react';
import { professores, turmas, alunos } from '../mockData';
import { storageService } from '../services/storageService';
import { Professor, Turma, Aluno } from '../types';
import Layout from './Layout';

const Dashboard: React.FC = () => {
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [professorTurmas, setProfessorTurmas] = useState<Turma[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const { userId, role } = storageService.getSession();
    if (role !== 'PROFESSOR' || !userId) {
      navigate('/login');
      return;
    }

    const allProfs = storageService.getProfessors(professores);
    const allTurmas = storageService.getTurmas(turmas);
    
    const prof = allProfs.find(p => p.id === userId);
    if (prof) {
      setProfessor(prof);
      setProfessorTurmas(allTurmas.filter(t => t.professorId === userId));
    }
  }, [navigate]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/login');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [navigate]);

  const getPeriodIcon = (periodo: string) => {
    switch (periodo) {
      case 'Manhã': return <Sun className="text-orange-400" size={18} />;
      case 'Tarde': return <Cloud className="text-blue-400" size={18} />;
      default: return <Moon className="text-indigo-400" size={18} />;
    }
  };

  if (!professor) return null;

  return (
    <Layout userName={professor.nome}>
      <div className="space-y-8 pb-10">
        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 sky-gradient rounded-full -mr-32 -mt-32 opacity-5 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase">Minhas Turmas</h2>
            <p className="text-slate-500 mt-3 font-medium max-w-lg">
              Bem-vinda de volta! Selecione uma turma para gerenciar a frequência e acompanhar seus alunos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {professorTurmas.map((turma) => (
            <div 
              key={turma.id}
              onClick={() => navigate(`/chamada/${turma.id}`)}
              className="group cursor-pointer bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col active:scale-[0.97]"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="bg-slate-50 p-4 rounded-3xl group-hover:sky-gradient group-hover:text-white transition-all shadow-sm">
                  <Users size={28} />
                </div>
                <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                  {getPeriodIcon(turma.periodo)}
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{turma.periodo}</span>
                </div>
              </div>
              
              <h4 className="text-2xl font-black text-slate-800 mb-1 tracking-tight uppercase leading-tight group-hover:text-indigo-600 transition-colors">{turma.nome}</h4>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">CMEI Clara Camarão • Educação Infantil</p>

              <div className="mt-8 pt-6 border-t border-dashed border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Abrir Diário</span>
                <ChevronRight className="text-slate-300 group-hover:translate-x-2 transition-transform" size={20} />
              </div>
            </div>
          ))}
          {professorTurmas.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
               <p className="text-slate-300 font-black uppercase tracking-widest text-xs">Nenhuma turma vinculada ao seu registro</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const ChevronRight = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default Dashboard;
