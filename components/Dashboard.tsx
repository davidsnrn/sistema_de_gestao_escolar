
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, ArrowRight, Sun, Cloud, Moon, BookOpen } from 'lucide-react';
import { professores, turmas, alunos } from '../mockData';
import { storageService } from '../services/storageService';
import { Professor, Turma } from '../types';
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

    // Busca dados persistidos ou mock
    const allProfs = storageService.getProfessors(professores);
    const allTurmas = storageService.getTurmas(turmas);
    
    const prof = allProfs.find(p => p.id === userId);
    if (prof) {
      setProfessor(prof);
      setProfessorTurmas(allTurmas.filter(t => t.professorId === userId));
    }
  }, [navigate]);

  const getPeriodIcon = (periodo: string) => {
    switch (periodo) {
      case 'Manhã': return <Sun className="text-orange-400" />;
      case 'Tarde': return <Cloud className="text-blue-400" />;
      default: return <Moon className="text-indigo-400" />;
    }
  };

  if (!professor) return null;

  return (
    <Layout userName={professor.nome}>
      <div className="space-y-8">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-20 -mt-20 opacity-50 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Boas-vindas, {professor.nome.split(' ')[0]}!</h2>
              <p className="text-slate-500 mt-2 max-w-md">
                Selecione uma turma abaixo para iniciar a chamada e o acompanhamento diário.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="text-indigo-500" size={24} />
            <h3 className="text-xl font-bold text-slate-800">Minhas Turmas</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professorTurmas.map((turma) => (
              <div 
                key={turma.id}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
                onClick={() => navigate(`/chamada/${turma.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Users size={24} />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                    {getPeriodIcon(turma.periodo)}
                    <span className="text-xs font-semibold text-slate-600">{turma.periodo}</span>
                  </div>
                </div>
                
                <h4 className="text-xl font-bold text-slate-800 mb-1">{turma.nome}</h4>
                <button 
                  className="w-full mt-4 py-3 px-4 bg-slate-50 text-indigo-600 font-bold rounded-xl flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white transition-all active:scale-95"
                >
                  Fazer Chamada
                  <ArrowRight size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
