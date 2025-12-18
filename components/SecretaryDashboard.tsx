
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, BookOpen, FileText, Plus, 
  Trash2, Search, Briefcase, GraduationCap, Edit3, X, Save,
  BarChart3, Calendar as CalendarIcon, ArrowDownToLine, ArrowLeft,
  ChevronRight, ChevronUp, ChevronDown, Filter
} from 'lucide-react';
import { professores, turmas, alunos } from '../mockData';
import { storageService } from '../services/storageService';
import { Professor, Turma, Aluno, AttendanceStatus, Frequencia } from '../types';
import Layout from './Layout';

const SecretaryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'geral' | 'professores' | 'alunos' | 'turmas' | 'relatorios'>('geral');
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
  const [isProfSectionOpen, setIsProfSectionOpen] = useState(true);
  const navigate = useNavigate();

  const [profs, setProfs] = useState<Professor[]>([]);
  const [students, setStudents] = useState<Aluno[]>([]);
  const [classes, setClasses] = useState<Turma[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [repTurmaId, setRepTurmaId] = useState('');
  const [repMonth, setRepMonth] = useState(new Date().getMonth() + 1);
  const [repYear, setRepYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const { role } = storageService.getSession();
    if (role !== 'SECRETARIO') {
      navigate('/login');
      return;
    }
    refreshData();
  }, [navigate]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen]);

  const refreshData = () => {
    setProfs(storageService.getProfessors(professores));
    setStudents(storageService.getAlunos(alunos));
    setClasses(storageService.getTurmas(turmas));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    if (activeTab === 'professores') {
      const newProfs = editingItem 
        ? profs.map(p => p.id === editingItem.id ? { ...p, ...data } : p)
        : [...profs, { id: Date.now().toString(), ...data } as Professor];
      storageService.saveProfessors(newProfs);
    } else if (activeTab === 'alunos') {
      const newAlunos = editingItem
        ? students.map(a => a.id === editingItem.id ? { ...a, ...data } : a)
        : [...students, { id: Date.now().toString(), fotoUrl: `https://picsum.photos/seed/${Date.now()}/100/100`, ...data } as Aluno];
      storageService.saveAlunos(newAlunos);
    } else if (activeTab === 'turmas') {
      const newTurmas = editingItem
        ? classes.map(t => t.id === editingItem.id ? { ...t, ...data } : t)
        : [...classes, { id: Date.now().toString(), ...data } as Turma];
      storageService.saveTurmas(newTurmas);
    }

    refreshData();
    closeModal();
  };

  const handleDelete = (id: string, type: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    if (type === 'professor') storageService.saveProfessors(profs.filter(p => p.id !== id));
    if (type === 'aluno') storageService.saveAlunos(students.filter(a => a.id !== id));
    if (type === 'turma') storageService.saveTurmas(classes.filter(t => t.id !== id));
    refreshData();
  };

  const openModal = (item?: any) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const gridDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates.sort();
  }, []);

  const selectedTurma = useMemo(() => classes.find(t => t.id === selectedTurmaId), [selectedTurmaId, classes]);
  const turmaAlunos = useMemo(() => students.filter(a => a.turmaId === selectedTurmaId), [selectedTurmaId, students]);
  const linkedProfessor = useMemo(() => profs.find(p => p.id === selectedTurma?.professorId), [selectedTurma, profs]);

  const consolidatedReport = useMemo(() => {
    if (!repTurmaId || !repMonth || !repYear) return null;

    const turmaAlunosList = students.filter(a => a.turmaId === repTurmaId);
    const startDate = `${repYear}-${String(repMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(repYear, repMonth, 0).getDate();
    const endDate = `${repYear}-${String(repMonth).padStart(2, '0')}-${lastDay}`;
    
    const allFreq = storageService.getFrequenciaPeriodo(startDate, endDate);

    const studentsData = turmaAlunosList.map(aluno => {
      const records = allFreq.filter(f => f.alunoId === aluno.id);
      return {
        ...aluno,
        presencas: records.filter(r => r.status === AttendanceStatus.PRESENT).length,
        faltas: records.filter(r => r.status === AttendanceStatus.ABSENT).length,
        justificadas: records.filter(r => r.status === AttendanceStatus.JUSTIFIED).length,
        total: records.length
      };
    });

    const totals = studentsData.reduce((acc, curr) => ({
      presencas: acc.presencas + curr.presencas,
      faltas: acc.faltas + curr.faltas,
      justificadas: acc.justificadas + curr.justificadas,
      total: acc.total + curr.total
    }), { presencas: 0, faltas: 0, justificadas: 0, total: 0 });

    return { studentsData, totals };
  }, [repTurmaId, repMonth, repYear, students]);

  const getAttendanceForGrid = (alunoId: string, date: string) => {
    const all = storageService.getFrequencia(date);
    const rec = all.find(f => f.alunoId === alunoId);
    if (!rec) return '-';
    if (rec.status === AttendanceStatus.PRESENT) return 'P';
    if (rec.status === AttendanceStatus.ABSENT) return 'F';
    return 'J';
  };

  const countAbsences = (alunoId: string) => {
    let count = 0;
    gridDates.forEach(d => {
      const all = storageService.getFrequencia(d);
      const rec = all.find(f => f.alunoId === alunoId);
      if (rec?.status === AttendanceStatus.ABSENT) count++;
    });
    return count;
  };

  if (selectedTurmaId && selectedTurma) {
    return (
      <Layout userName="Secretaria Escolar">
        <div className="space-y-6 pb-20">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedTurmaId(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors"
            >
              <ArrowLeft size={20} /> Voltar para Turmas
            </button>
            <div className="flex gap-2">
              <button onClick={() => openModal(selectedTurma)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all"><Edit3 size={18}/></button>
              <button onClick={() => { setActiveTab('alunos'); openModal(); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md"><Plus size={16}/> Matricular Aluno</button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{selectedTurma.nome}</h2>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">{selectedTurma.periodo} • Diário de Classe</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-[10px] font-black text-slate-600 border-b border-slate-200 uppercase">
                    <th className="px-4 py-4 border-r border-slate-200 min-w-[280px]">Aluno</th>
                    {gridDates.map(date => (
                      <th key={date} className="px-2 py-4 border-r border-slate-200 text-center min-w-[100px]">
                        {new Date(date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                      </th>
                    ))}
                    <th className="px-4 py-4 bg-slate-200/30">Faltas recentes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {turmaAlunos.map((aluno, index) => {
                    const absences = countAbsences(aluno.id);
                    return (
                      <tr key={aluno.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4 border-r border-slate-200">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-300 w-4">{index + 1}</span>
                            <img src={aluno.fotoUrl} className="w-9 h-9 rounded-full border border-slate-200 shadow-sm" />
                            <div className="truncate">
                              <p className="text-sm font-bold text-slate-700 truncate">{aluno.nome}</p>
                            </div>
                          </div>
                        </td>
                        {gridDates.map(date => (
                          <td key={date} className="px-2 py-4 border-r border-slate-200 text-center text-xs font-bold text-slate-500">
                            {getAttendanceForGrid(aluno.id, date)}
                          </td>
                        ))}
                        <td className="px-4 py-4 bg-slate-50/30">
                          {absences > 0 ? (
                            <span className="text-rose-600 font-bold text-xs">{absences} falta(s)</span>
                          ) : <span className="text-slate-300 text-[10px]">Sem faltas</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userName="Secretaria Escolar">
      <div className="space-y-8 pb-20">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {[
            { id: 'geral', label: 'Início', icon: Search },
            { id: 'professores', label: 'Professores', icon: Briefcase },
            { id: 'alunos', label: 'Alunos', icon: GraduationCap },
            { id: 'turmas', label: 'Turmas', icon: BookOpen },
            { id: 'relatorios', label: 'Relatórios', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'geral' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-100"><Briefcase size={24} /></div>
              <div><p className="text-slate-400 text-xs font-black uppercase tracking-widest">Professores</p><p className="text-3xl font-black">{profs.length}</p></div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-purple-500 text-white shadow-lg shadow-purple-100"><GraduationCap size={24} /></div>
              <div><p className="text-slate-400 text-xs font-black uppercase tracking-widest">Alunos</p><p className="text-3xl font-black">{students.length}</p></div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-100"><BookOpen size={24} /></div>
              <div><p className="text-slate-400 text-xs font-black uppercase tracking-widest">Turmas</p><p className="text-3xl font-black">{classes.length}</p></div>
            </div>
          </div>
        )}

        {/* ... Resto da UI de listagens ... */}

        {activeTab === 'relatorios' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><BarChart3 size={24} /></div>
                    Relatório Mensal
                  </h3>
                  <p className="text-slate-400 text-sm font-medium mt-1">Consolidação de frequência da turma.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Turma</label>
                  <select 
                    value={repTurmaId}
                    onChange={(e) => setRepTurmaId(e.target.value)}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 text-sm"
                  >
                    <option value="">Escolha...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mês</label>
                  <select value={repMonth} onChange={(e) => setRepMonth(Number(e.target.value))} className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 text-sm">
                    {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('pt-BR', {month: 'long'})}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ano</label>
                  <select value={repYear} onChange={(e) => setRepYear(Number(e.target.value))} className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 text-sm">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {consolidatedReport && consolidatedReport.totals.total > 0 ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                      <p className="text-emerald-600 text-[10px] font-black mb-1 uppercase">Presenças</p>
                      <p className="text-3xl font-black text-emerald-700">{consolidatedReport.totals.presencas}</p>
                    </div>
                    <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 text-center">
                      <p className="text-rose-600 text-[10px] font-black mb-1 uppercase">Faltas</p>
                      <p className="text-3xl font-black text-rose-700">{consolidatedReport.totals.faltas}</p>
                    </div>
                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 text-center">
                      <p className="text-amber-600 text-[10px] font-black mb-1 uppercase">Justificadas</p>
                      <p className="text-3xl font-black text-amber-700">{consolidatedReport.totals.justificadas}</p>
                    </div>
                    <div className="p-6 bg-indigo-600 rounded-3xl text-center">
                      <p className="text-indigo-100 text-[10px] font-black mb-1 uppercase">Média</p>
                      <p className="text-3xl font-black text-white">
                        {Math.round((consolidatedReport.totals.presencas / consolidatedReport.totals.total) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold italic uppercase tracking-widest text-xs">Selecione filtros para gerar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
              <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold uppercase tracking-tight">{editingItem ? 'Editar' : 'Adicionar'} Registro</h3>
                <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nome Completo</label>
                  <input name="nome" required defaultValue={editingItem?.nome} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200">Cancelar (ESC)</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SecretaryDashboard;
