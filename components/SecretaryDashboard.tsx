
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, FileText, Plus, 
  Trash2, Search, Briefcase, GraduationCap, Edit3, X, Save,
  BarChart3, Calendar as CalendarIcon, ArrowLeft,
  ChevronRight, LayoutDashboard, Phone, CreditCard, Sun, CheckCircle2, UserCheck, Camera, History, AlertCircle, MoveHorizontal, Trash, Bell
} from 'lucide-react';
import { professores, turmas, alunos } from '../mockData';
import { storageService } from '../services/storageService';
import { Professor, Turma, Aluno, AttendanceStatus, ProfessorVinculo, Frequencia } from '../types';
import Layout from './Layout';

const SecretaryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'geral' | 'professores' | 'alunos' | 'turmas' | 'relatorios'>('geral');
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [profs, setProfs] = useState<Professor[]>([]);
  const [students, setStudents] = useState<Aluno[]>([]);
  const [classes, setClasses] = useState<Turma[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isVinculoModalOpen, setIsVinculoModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingVinculo, setEditingVinculo] = useState<ProfessorVinculo | null>(null);
  const [viewingProfessor, setViewingProfessor] = useState<Professor | null>(null);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Aluno | null>(null);
  const [studentToTransfer, setStudentToTransfer] = useState<Aluno | null>(null);

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

  // ESC: Volta apenas até o Painel de Gestão (Tab 'geral')
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) closeModal();
        else if (isDetailModalOpen) closeDetailModal();
        else if (isVinculoModalOpen) setIsVinculoModalOpen(false);
        else if (isHistoryModalOpen) setIsHistoryModalOpen(false);
        else if (isTransferModalOpen) setIsTransferModalOpen(false);
        else if (selectedTurmaId) setSelectedTurmaId(null);
        else if (activeTab !== 'geral') setActiveTab('geral');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen, isDetailModalOpen, isVinculoModalOpen, isHistoryModalOpen, isTransferModalOpen, selectedTurmaId, activeTab]);

  const refreshData = () => {
    setProfs(storageService.getProfessors(professores));
    setStudents(storageService.getAlunos(alunos));
    setClasses(storageService.getTurmas(turmas));
  };

  const pendingEnrollments = useMemo(() => students.filter(a => !a.turmaId).length, [students]);

  // Seleção automática de turma para relatórios
  useEffect(() => {
    if (activeTab === 'relatorios' && !repTurmaId && classes.length > 0) {
      setRepTurmaId(classes[0].id);
    }
  }, [activeTab, classes, repTurmaId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
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
        ? students.map(a => a.id === editingItem.id ? { ...a, ...data, fotoUrl: editingItem.fotoUrl } : a)
        : [...students, { id: Date.now().toString(), ...data, fotoUrl: editingItem?.fotoUrl || 'https://via.placeholder.com/150' } as Aluno];
      storageService.saveAlunos(newAlunos);
    } else if (activeTab === 'turmas') {
      const newTurmas = editingItem
        ? classes.map(t => t.id === editingItem.id ? { ...t, ...data } : t)
        : [...classes, { id: Date.now().toString(), ...data, vinculos: [] } as Turma];
      storageService.saveTurmas(newTurmas);
    }
    refreshData();
    closeModal();
    if (viewingProfessor) closeDetailModal();
  };

  const handleDelete = (id: string, type: string) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente este ${type}?`)) return;
    if (type === 'professor') storageService.saveProfessors(profs.filter(p => p.id !== id));
    if (type === 'aluno') storageService.saveAlunos(students.filter(a => a.id !== id));
    if (type === 'turma') storageService.saveTurmas(classes.filter(t => t.id !== id));
    refreshData();
  };

  const desvincularAluno = (alunoId: string) => {
    if (!confirm('Remover este aluno desta turma? Ele ficará sem turma vinculada.')) return;
    const newStudents = students.map(a => a.id === alunoId ? { ...a, turmaId: undefined } : a);
    storageService.saveAlunos(newStudents);
    refreshData();
  };

  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };
  const closeDetailModal = () => { setIsDetailModalOpen(false); setViewingProfessor(null); };
  const openDetailModal = (prof: Professor) => { setViewingProfessor(prof); setIsDetailModalOpen(true); };
  const openModal = (item: any = null) => { setEditingItem(item); setIsModalOpen(true); };

  const fuzzyFilter = (item: any) => {
    if (!searchTerm) return true;
    const terms = searchTerm.toLowerCase().split(' ').filter(t => t.length > 0);
    const text = item.nome.toLowerCase();
    return terms.every(term => text.includes(term));
  };

  const selectedTurma = useMemo(() => classes.find(t => t.id === selectedTurmaId), [selectedTurmaId, classes]);
  const turmaAlunos = useMemo(() => students.filter(a => a.turmaId === selectedTurmaId), [selectedTurmaId, students]);

  const consolidatedReport = useMemo(() => {
    if (!repTurmaId) return null;
    const turmaAlunosList = students.filter(a => a.turmaId === repTurmaId);
    const startDate = `${repYear}-${String(repMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(repYear, repMonth, 0).getDate();
    const endDate = `${repYear}-${String(repMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
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

  const handleTransferStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToTransfer) return;
    const targetTurmaId = new FormData(e.target as HTMLFormElement).get('targetTurmaId') as string;
    const newStudents = students.map(a => a.id === studentToTransfer.id ? { ...a, turmaId: targetTurmaId || undefined } : a);
    storageService.saveAlunos(newStudents);
    refreshData();
    setIsTransferModalOpen(false);
    setStudentToTransfer(null);
  };

  if (selectedTurmaId && selectedTurma) {
    return (
      <Layout userName="Secretaria Escolar">
        <div className="space-y-8 pb-20">
          <div className="flex items-center justify-between bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedTurmaId(null)} className="p-4 bg-slate-50 text-slate-400 rounded-3xl active:scale-90"><ArrowLeft size={20} /></button>
              <div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{selectedTurma.nome}</h2>
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{selectedTurma.periodo}</p>
              </div>
            </div>
          </div>
          <section className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden p-2">
            <div className="p-10 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={28} /></div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Alunos Matriculados</h3>
              </div>
              <button onClick={() => { setActiveTab('alunos'); openModal(); }} className="px-8 py-4 bg-indigo-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100">+ Matricular Aluno</button>
            </div>
            <div className="px-10 pb-10 space-y-4">
              {turmaAlunos.map(aluno => (
                <div key={aluno.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2.5rem] hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-5">
                    <img src={aluno.fotoUrl} className="w-16 h-16 rounded-3xl object-cover border-4 border-white shadow-md" />
                    <p className="font-black text-slate-800 text-lg uppercase">{aluno.nome}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setStudentToTransfer(aluno); setIsTransferModalOpen(true); }} className="p-4 bg-white text-slate-300 hover:text-indigo-600 rounded-2xl shadow-sm"><MoveHorizontal size={20}/></button>
                    <button onClick={() => desvincularAluno(aluno.id)} className="p-4 bg-white text-slate-300 hover:text-rose-500 rounded-2xl shadow-sm"><Trash2 size={20}/></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userName="Secretaria Escolar">
      <div className="space-y-8 pb-20">
        <div className="flex items-center flex-wrap gap-4">
          <div className="flex overflow-x-auto gap-2 scrollbar-hide">
            <button onClick={() => setActiveTab('geral')} className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${activeTab === 'geral' || ['professores', 'alunos', 'turmas'].includes(activeTab) ? 'sky-gradient text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>
              <LayoutDashboard size={18} /> Painel de Gestão
            </button>
            <button onClick={() => setActiveTab('relatorios')} className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${activeTab === 'relatorios' ? 'sun-gradient text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>
              <FileText size={18} /> Relatórios Mensais
            </button>
          </div>

          {pendingEnrollments > 0 && (
            <div className="flex items-center gap-2 px-6 py-4 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 animate-pulse shadow-sm shadow-rose-100/50">
              <Bell size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">{pendingEnrollments} Matrícula{pendingEnrollments > 1 ? 's' : ''} Pendente{pendingEnrollments > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {activeTab === 'geral' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 sky-gradient rounded-full -mr-32 -mt-32 opacity-5 blur-3xl"></div>
              <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tight relative z-10">CMEI CLARA CAMARÃO</h2>
              <p className="text-slate-500 font-medium relative z-10 mt-2">Portal Administrativo</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { tab: 'turmas', icon: BookOpen, color: 'amber', label: 'Turma', sub: 'TURMAS', count: classes.length },
                { tab: 'alunos', icon: GraduationCap, color: 'purple', label: 'Alunos', sub: 'ALUNOS', count: students.length, alert: pendingEnrollments },
                { tab: 'professores', icon: Briefcase, color: 'sky', label: 'Professor', sub: 'PROFESSORES', count: profs.length }
              ].map((item) => (
                <div key={item.tab} onClick={() => setActiveTab(item.tab as any)} className="group cursor-pointer bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col gap-6 active:scale-[0.98]">
                  <div className="flex items-center gap-5">
                    <div className={`p-6 rounded-[1.8rem] w-fit ${item.color === 'amber' ? 'sun-gradient' : item.color === 'purple' ? 'bg-indigo-600' : 'sky-gradient'} text-white shadow-xl shadow-slate-100`}>
                      <item.icon size={32} />
                    </div>
                    <span className="text-2xl font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{item.label}</span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex items-baseline gap-3">
                      <p className="text-7xl font-black text-slate-800 tracking-tighter leading-none">{item.count}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.sub}</p>
                    </div>
                    {item.alert > 0 && (
                      <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-500 rounded-full border border-rose-100">
                        <AlertCircle size={10} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{item.alert} PENDENTE</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {['professores', 'alunos', 'turmas'].includes(activeTab) && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveTab('geral')} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-colors"><ArrowLeft size={16} /> Voltar ao Início</button>
              <button onClick={() => openModal()} className={`${activeTab === 'professores' ? 'sky-gradient shadow-blue-100' : activeTab === 'alunos' ? 'bg-indigo-600 shadow-indigo-100' : 'sun-gradient shadow-yellow-100'} text-white px-10 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95`}>
                + NOVO {activeTab.slice(0, -1).toUpperCase()}
              </button>
            </div>
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden p-2">
               <div className="p-8 border-b border-slate-50">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input placeholder={`Buscar por nome...`} className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] outline-none font-bold text-slate-600 focus:bg-white transition-all shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
               </div>
               <div className="divide-y divide-slate-50">
                  {activeTab === 'turmas' ? (
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {classes.filter(fuzzyFilter).map(t => (
                         <div key={t.id} onClick={() => setSelectedTurmaId(t.id)} className="bg-slate-50 hover:bg-white rounded-[3rem] p-8 border-2 border-transparent hover:border-amber-100 hover:shadow-2xl transition-all cursor-pointer group">
                           <div className="flex justify-between items-start mb-6">
                              <div className="p-4 bg-white text-amber-500 rounded-2xl group-hover:sun-gradient group-hover:text-white transition-all shadow-sm"><BookOpen size={24} /></div>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id, 'turma'); }} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                           </div>
                           <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t.nome}</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t.periodo}</p>
                         </div>
                       ))}
                    </div>
                  ) : (
                    (activeTab === 'professores' ? profs : students).filter(fuzzyFilter).map((item: any) => (
                      <div key={item.id} onClick={() => activeTab === 'professores' ? openDetailModal(item) : openModal(item)} className="p-8 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer group transition-all">
                        <div className="flex items-center gap-6">
                           <div className="relative">
                              <img src={item.fotoUrl || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded-full border-2 border-white shadow-md object-cover" />
                              {!item.turmaId && activeTab === 'alunos' && <div className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full border-2 border-white"><AlertCircle size={10} /></div>}
                           </div>
                           <div>
                              <p className="font-black text-slate-800 text-lg uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{item.nome}</p>
                              {!item.turmaId && activeTab === 'alunos' && <p className="text-[10px] text-rose-500 font-black flex items-center gap-1 uppercase tracking-widest mt-1">Matrícula Pendente</p>}
                           </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id, activeTab.slice(0, -1)); }} className="p-4 text-slate-200 hover:text-rose-500 rounded-2xl transition-all"><Trash2 size={20} /></button>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'relatorios' && (
           <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm">
                 <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-10 flex items-center gap-4">
                    <BarChart3 className="text-amber-500" size={32} /> Relatórios Mensais
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-8 rounded-[3rem] border border-slate-100 mb-10">
                    <select value={repTurmaId} onChange={(e) => setRepTurmaId(e.target.value)} className="p-5 bg-white border-2 border-white rounded-[1.5rem] font-bold text-slate-700 outline-none focus:border-indigo-100 transition-all">
                       <option value="">Selecione a turma...</option>
                       {classes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    <select value={repMonth} onChange={(e) => setRepMonth(Number(e.target.value))} className="p-5 bg-white border-2 border-white rounded-[1.5rem] font-bold text-slate-700 outline-none">
                       {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('pt-BR', {month: 'long'})}</option>)}
                    </select>
                    <select value={repYear} onChange={(e) => setRepYear(Number(e.target.value))} className="p-5 bg-white border-2 border-white rounded-[1.5rem] font-bold text-slate-700 outline-none">
                       {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                 </div>
                 {consolidatedReport ? (
                    <div className="space-y-8 animate-in fade-in">
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {[{ l: 'Presenças', c: consolidatedReport.totals.presencas, co: 'text-emerald-500' },
                            { l: 'Faltas', c: consolidatedReport.totals.faltas, co: 'text-rose-500' },
                            { l: 'Justificativas', c: consolidatedReport.totals.justificadas, co: 'text-amber-500' },
                            { l: 'Assiduidade', c: consolidatedReport.totals.total > 0 ? `${Math.round((consolidatedReport.totals.presencas / consolidatedReport.totals.total) * 100)}%` : '0%', co: 'text-blue-500' }].map(x => (
                            <div key={x.l} className="bg-slate-50 p-8 rounded-[2.5rem] text-center border border-slate-100 shadow-sm">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{x.l}</p>
                               <p className={`text-4xl font-black ${x.co} tracking-tighter`}>{x.c}</p>
                            </div>
                          ))}
                       </div>
                       <div className="overflow-x-auto bg-slate-50 rounded-[3rem] p-2 border border-slate-100">
                          <table className="w-full text-left">
                             <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                   <th className="p-8">Aluno</th>
                                   <th className="p-8 text-center">P</th>
                                   <th className="p-8 text-center">F</th>
                                   <th className="p-8 text-center">J</th>
                                   <th className="p-8 text-right">%</th>
                                </tr>
                             </thead>
                             <tbody>
                                {consolidatedReport.studentsData.map(st => (
                                   <tr key={st.id} className="border-b border-slate-100 hover:bg-white transition-colors">
                                      <td className="p-8 font-bold text-slate-700 uppercase">{st.nome}</td>
                                      <td className="p-8 text-center text-emerald-500 font-black">{st.presencas}</td>
                                      <td className="p-8 text-center text-rose-500 font-black">{st.faltas}</td>
                                      <td className="p-8 text-center text-amber-500 font-black">{st.justificadas}</td>
                                      <td className="p-8 text-right font-black text-slate-400">
                                         {st.total > 0 ? `${Math.round((st.presencas / st.total) * 100)}%` : '0%'}
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 ) : (
                    <div className="text-center py-24 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-100">
                       <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Selecione uma turma para visualizar os relatórios</p>
                    </div>
                 )}
              </div>
           </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in">
            <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden border border-white p-1 modal-animate-in">
              <div className="p-12 pb-8 flex justify-between items-center border-b border-slate-50">
                <div className="flex flex-col gap-1">
                  <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">CADASTRO</h3>
                  {activeTab === 'alunos' && editingItem?.nome && <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">nome do aluno</p>}
                </div>
                <button onClick={closeModal} className="p-4 bg-slate-50 text-slate-300 rounded-3xl active:scale-90 transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSave} className="p-12 pt-8 space-y-8">
                 {activeTab === 'alunos' && (
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative group">
                           <img src={editingItem?.fotoUrl || 'https://via.placeholder.com/150'} className="w-32 h-32 rounded-[2.5rem] border-4 border-slate-50 shadow-xl object-cover transition-all group-hover:brightness-90" />
                           <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-[2.5rem] opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                              <Camera size={24} />
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, (b64) => setEditingItem((prev: any) => ({ ...prev, fotoUrl: b64 })))} />
                           </label>
                        </div>
                        <div className="flex flex-col items-center gap-1 mt-3">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Foto do Estudante</p>
                           {editingItem?.fotoUrl && editingItem.fotoUrl !== 'https://via.placeholder.com/150' && (
                             <button type="button" onClick={() => setEditingItem((p:any) => ({...p, fotoUrl: 'https://via.placeholder.com/150'}))} className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1 hover:text-rose-600 transition-colors">
                               <Trash size={10}/> Remover Foto
                             </button>
                           )}
                        </div>
                    </div>
                 )}
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Nome Completo</label>
                       <input name="nome" required defaultValue={editingItem?.nome} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-100 transition-all shadow-inner" />
                    </div>
                    {activeTab === 'alunos' && (
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Responsável</label>
                          <input name="responsavel" required defaultValue={editingItem?.responsavel} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-100 transition-all shadow-inner" />
                       </div>
                    )}
                    {activeTab === 'professores' && (
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Matrícula</label>
                             <input name="matricula" required defaultValue={editingItem?.matricula} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] font-bold text-slate-700 outline-none focus:bg-white shadow-inner" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-4">WhatsApp</label>
                             <input name="whatsapp" defaultValue={editingItem?.whatsapp} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] font-bold text-slate-700 outline-none focus:bg-white shadow-inner" />
                          </div>
                       </div>
                    )}
                 </div>
                 <div className="pt-6 flex gap-4">
                    <button type="button" onClick={closeModal} className="flex-1 py-5 bg-slate-50 text-slate-400 font-black uppercase text-[10px] rounded-3xl active:scale-95 transition-all">Cancelar</button>
                    <button type="submit" className="flex-1 py-5 sky-gradient text-white font-black uppercase text-[10px] rounded-3xl shadow-xl shadow-blue-100 active:scale-95 transition-all">Salvar</button>
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
