
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, FileText, Plus, 
  Trash2, Search, Briefcase, GraduationCap, Edit3, X, Save,
  BarChart3, Calendar as CalendarIcon, ArrowLeft,
  ChevronRight, LayoutDashboard, Phone, CreditCard, Sun, CheckCircle2, UserCheck, Camera, History, AlertCircle, MoveHorizontal, Trash, Bell, Mail, Link, Pencil, Calendar, Clock, ShieldCheck, ShieldAlert, Filter, FileSpreadsheet, Download, Check, Minus
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
  const [searchEnroll, setSearchEnroll] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isEnrollListOpen, setIsEnrollListOpen] = useState(false);
  const [isLinkProfModalOpen, setIsLinkProfModalOpen] = useState(false);
  const [isDailyViewOpen, setIsDailyViewOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingVinculo, setEditingVinculo] = useState<{professorId: string, dataInicio: string} | null>(null);
  const [viewingProfessor, setViewingProfessor] = useState<Professor | null>(null);
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

  const refreshData = () => {
    setProfs(storageService.getProfessors(professores));
    setStudents(storageService.getAlunos(alunos));
    setClasses(storageService.getTurmas(turmas));
  };

  const pendingStudents = useMemo(() => students.filter(a => !a.turmaId), [students]);
  const pendingCount = pendingStudents.length;

  const fuzzyFilter = (item: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.nome && item.nome.toLowerCase().includes(term)) ||
      (item.id && item.id.toString().toLowerCase().includes(term)) ||
      (item.matricula && item.matricula.toLowerCase().includes(term))
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
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
        ? students.map(a => a.id === editingItem.id ? { ...a, ...data, nee: formData.get('nee') === 'on', fotoUrl: editingItem.fotoUrl } : a)
        : [...students, { id: Date.now().toString(), ...data, nee: formData.get('nee') === 'on', fotoUrl: editingItem?.fotoUrl || 'https://via.placeholder.com/150' } as Aluno];
      storageService.saveAlunos(newAlunos);
    } else if (activeTab === 'turmas') {
      const newTurmas = editingItem
        ? classes.map(t => t.id === editingItem.id ? { ...t, ...data } : t)
        : [...classes, { id: Date.now().toString(), ...data, vinculos: [] } as Turma];
      storageService.saveTurmas(newTurmas);
    }
    refreshData();
    closeModal();
  };

  const handleDelete = (id: string, type: string) => {
    if (!confirm(`Deseja excluir permanentemente este ${type}?`)) return;
    if (type === 'professor') storageService.saveProfessors(profs.filter(p => p.id !== id));
    else if (type === 'aluno') storageService.saveAlunos(students.filter(a => a.id !== id));
    else if (type === 'turma') {
      storageService.saveTurmas(classes.filter(t => t.id !== id));
      storageService.saveAlunos(students.map(aluno => aluno.turmaId === id ? { ...aluno, turmaId: undefined } : aluno));
    }
    refreshData();
    if (type === 'turma') setSelectedTurmaId(null);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };
  const openModal = (item: any = null) => { setEditingItem(item); setIsModalOpen(true); };

  const handleEnrollExisting = (alunoId: string) => {
    if (!selectedTurmaId) return;
    storageService.saveAlunos(students.map(a => a.id === alunoId ? { ...a, turmaId: selectedTurmaId } : a));
    refreshData();
    setIsEnrollListOpen(false);
    setSearchEnroll('');
  };

  const selectedTurma = useMemo(() => classes.find(t => t.id === selectedTurmaId), [selectedTurmaId, classes]);
  const turmaAlunos = useMemo(() => students.filter(a => a.turmaId === selectedTurmaId), [selectedTurmaId, students]);
  const registeredDatesForCurrentTurma = useMemo(() => {
    if (!selectedTurmaId) return [];
    return storageService.getDatasComFrequencia(selectedTurmaId, turmaAlunos.map(a => a.id)).slice(0, 8);
  }, [selectedTurmaId, turmaAlunos]);

  const renderAttendanceGrid = (alunosList: Aluno[], datesList: string[]) => {
    return (
      <div className="overflow-x-auto rounded-2xl border border-slate-200 relative">
        <table className="w-full text-left border-collapse bg-white table-fixed">
          <thead className="bg-slate-50">
            <tr>
              <th className="sticky left-0 z-30 bg-slate-50 px-4 py-4 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[180px] md:min-w-[300px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Aluno</th>
              {datesList.map(date => {
                const [y, m, d] = date.split('-');
                const dayName = new Date(Number(y), Number(m)-1, Number(d)).toLocaleDateString('pt-BR', {weekday: 'short'});
                return (
                  <th key={date} className="px-2 md:px-4 py-4 border-b border-slate-200 text-center min-w-[80px] md:min-w-[100px]">
                    <p className="text-[9px] md:text-[10px] font-black text-slate-800">{d}/{m}/{y}</p>
                    <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">{dayName}</p>
                  </th>
                );
              })}
              <th className="px-4 py-4 border-b border-slate-200 text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest text-center min-w-[120px]">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alunosList.map((aluno, index) => {
              let totalFaltas = 0;
              return (
                <tr key={aluno.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50/80 px-4 py-3 md:py-4 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="relative shrink-0">
                        <img src={aluno.fotoUrl} className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-slate-100 object-cover" />
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-slate-100 text-[7px] font-black text-slate-500 rounded-full flex items-center justify-center border border-white">{index + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-tight truncate">
                          {aluno.nome.split(' ')[0]} {aluno.nome.split(' ').pop()}
                        </p>
                        {aluno.nee && <p className="text-[8px] font-black text-rose-500 uppercase">Possui NEE</p>}
                      </div>
                    </div>
                  </td>
                  {datesList.map(date => {
                    const freq = storageService.getFrequencia(date).find(f => f.alunoId === aluno.id);
                    if (freq?.status === AttendanceStatus.ABSENT) totalFaltas += 2;
                    return (
                      <td key={date} className="px-2 md:px-4 py-3 md:py-4 text-center">
                        {freq?.status === AttendanceStatus.ABSENT ? (
                          <span className="text-[10px] md:text-xs font-black text-rose-500">2</span>
                        ) : freq?.status === AttendanceStatus.JUSTIFIED ? (
                          <span className="text-[10px] md:text-xs font-black text-amber-500">J</span>
                        ) : freq?.status === AttendanceStatus.PRESENT ? (
                          <span className="text-[10px] md:text-xs font-black text-slate-300">0</span>
                        ) : (
                          <Minus className="mx-auto text-slate-100" size={12} />
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2 md:px-4 py-3 md:py-4 text-center">
                    {totalFaltas > 0 ? (
                      <div className="bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                        <p className="text-[8px] md:text-[9px] font-black text-yellow-700 uppercase">{totalFaltas} Faltas</p>
                      </div>
                    ) : (
                      <span className="text-[8px] text-slate-300 font-bold uppercase">OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Layout userName="Secretaria Escolar">
      <div className="space-y-6 md:space-y-8 pb-20">
        
        {/* VIEW: DETALHES TURMA (QUANDO SELECIONADA) */}
        {selectedTurmaId && selectedTurma ? (
          <div className="space-y-6 md:space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-5 md:p-6 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm gap-4">
              <div className="flex items-center gap-4 md:gap-6">
                <button onClick={() => setSelectedTurmaId(null)} className="p-3 md:p-4 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 active:scale-90 transition-all"><ArrowLeft size={18} /></button>
                <div>
                  <h2 className="text-xl md:text-3xl font-black text-[#1e3a8a] uppercase tracking-tight leading-none">{selectedTurma.nome}</h2>
                  <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{selectedTurma.periodo} • DIÁRIO DE CLASSE</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsDailyViewOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase text-[10px]"><History size={16} /> Diário</button>
                <button onClick={() => { setActiveTab('turmas'); openModal(selectedTurma); }} className="p-3.5 bg-slate-50 text-indigo-500 rounded-xl"><Pencil size={20}/></button>
                <button onClick={() => handleDelete(selectedTurma.id, 'turma')} className="p-3.5 bg-white text-rose-500 rounded-xl border-2 border-slate-900"><Trash2 size={20}/></button>
              </div>
            </div>

            <section className="bg-white rounded-2xl md:rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden p-1">
              <div className="p-6 md:p-10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={24} /></div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Estudantes Matriculados</h3>
                </div>
                <button onClick={() => { setIsEnrollListOpen(true); setSearchEnroll(''); }} className="px-6 py-3.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><Plus size={16} /> Matricular Aluno</button>
              </div>
              <div className="px-5 md:px-10 pb-6 md:pb-10 space-y-3">
                {turmaAlunos.map(aluno => (
                  <div key={aluno.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-200 transition-all group">
                    <div className="flex items-center gap-3">
                      <img src={aluno.fotoUrl} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md" />
                      <div>
                        <p className="font-black text-slate-800 text-sm uppercase leading-tight">{aluno.nome}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase">{aluno.responsavel} • {aluno.telefoneResponsavel || 'S/ Tel'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setActiveTab('alunos'); openModal(aluno); }} className="p-2 bg-white text-slate-300 hover:text-indigo-600 rounded-lg shadow-sm"><Edit3 size={18}/></button>
                      <button onClick={() => { if(confirm('Remover aluno desta turma?')) { storageService.saveAlunos(students.map(a => a.id === aluno.id ? {...a, turmaId: undefined} : a)); refreshData(); } }} className="p-2 bg-white text-slate-300 hover:text-rose-500 rounded-lg shadow-sm"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          /* PAINEL E GESTÃO */
          <div className="space-y-6 md:space-y-8 animate-in fade-in">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button onClick={() => setActiveTab('geral')} className={`whitespace-nowrap px-6 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'geral' ? 'sky-gradient text-white shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border'}`}>Painel Geral</button>
              <button onClick={() => setActiveTab('professores')} className={`whitespace-nowrap px-6 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'professores' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border'}`}>Docentes</button>
              <button onClick={() => setActiveTab('alunos')} className={`whitespace-nowrap px-6 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'alunos' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border'}`}>Alunos</button>
              <button onClick={() => setActiveTab('turmas')} className={`whitespace-nowrap px-6 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'turmas' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border'}`}>Turmas</button>
              <button onClick={() => setActiveTab('relatorios')} className={`whitespace-nowrap px-6 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'relatorios' ? 'sun-gradient text-white shadow-lg shadow-orange-100' : 'bg-white text-slate-400 border'}`}>Relatórios</button>
            </div>

            {/* BUSCA E ADIÇÃO (EXCETO PARA GERAL E RELATÓRIOS) */}
            {['professores', 'alunos', 'turmas'].includes(activeTab) && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    placeholder={`Buscar ${activeTab}...`} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-300 transition-all"
                  />
                </div>
                <button onClick={() => openModal()} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Plus size={16} /> Novo {activeTab.slice(0, -1)}
                </button>
              </div>
            )}

            {/* ABA GERAL */}
            {activeTab === 'geral' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div onClick={() => setActiveTab('turmas')} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm cursor-pointer hover:shadow-xl transition-all group">
                   <div className="w-14 h-14 sun-gradient text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-100 group-hover:rotate-6 transition-transform"><BookOpen size={28} /></div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Turmas</h3>
                   <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mt-1">{classes.length} Unidades Educacionais</p>
                </div>
                <div onClick={() => setActiveTab('alunos')} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm cursor-pointer hover:shadow-xl transition-all group">
                   <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-100 group-hover:rotate-6 transition-transform"><GraduationCap size={28} /></div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Alunos</h3>
                   <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mt-1">{students.length} Estudantes Matriculados</p>
                </div>
                <div onClick={() => setActiveTab('professores')} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm cursor-pointer hover:shadow-xl transition-all group">
                   <div className="w-14 h-14 sky-gradient text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-100 group-hover:rotate-6 transition-transform"><Briefcase size={28} /></div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Docentes</h3>
                   <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mt-1">{profs.length} Professores Ativos</p>
                </div>
              </div>
            )}

            {/* ABA PROFESSORES (DOCENTES) */}
            {activeTab === 'professores' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3">
                {profs.filter(fuzzyFilter).map(prof => (
                  <div key={prof.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 sky-gradient text-white rounded-xl flex items-center justify-center font-black text-lg shadow-sm">{prof.nome.charAt(0)}</div>
                       <div>
                          <p className="font-black text-slate-800 text-sm uppercase leading-tight">{prof.nome}</p>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Matrícula: {prof.matricula || '---'} • {prof.whatsapp || 'Sem WhatsApp'}</p>
                       </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={() => openModal(prof)} className="p-2.5 bg-white text-indigo-500 rounded-lg shadow-sm border border-slate-100 hover:bg-indigo-50"><Edit3 size={18}/></button>
                       <button onClick={() => handleDelete(prof.id, 'professor')} className="p-2.5 bg-white text-rose-500 rounded-lg shadow-sm border border-slate-100 hover:bg-rose-50"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
                {profs.filter(fuzzyFilter).length === 0 && (
                  <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Nenhum docente encontrado</div>
                )}
              </div>
            )}

            {/* ABA ALUNOS */}
            {activeTab === 'alunos' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3">
                {students.filter(fuzzyFilter).map(aluno => (
                  <div key={aluno.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                    <div className="flex items-center gap-4">
                       <img src={aluno.fotoUrl} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" />
                       <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-slate-800 text-sm uppercase leading-tight">{aluno.nome}</p>
                            {aluno.nee && <span className="px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full text-[7px] font-black uppercase">NEE</span>}
                          </div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Turma: {classes.find(t => t.id === aluno.turmaId)?.nome || 'Pendente'} • Mat: {aluno.id}</p>
                       </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={() => openModal(aluno)} className="p-2.5 bg-white text-indigo-500 rounded-lg shadow-sm border border-slate-100 hover:bg-indigo-50"><Edit3 size={18}/></button>
                       <button onClick={() => handleDelete(aluno.id, 'aluno')} className="p-2.5 bg-white text-rose-500 rounded-lg shadow-sm border border-slate-100 hover:bg-rose-50"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
                {students.filter(fuzzyFilter).length === 0 && (
                  <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Nenhum aluno encontrado</div>
                )}
              </div>
            )}

            {/* ABA TURMAS */}
            {activeTab === 'turmas' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.filter(fuzzyFilter).map(t => (
                  <div key={t.id} onClick={() => setSelectedTurmaId(t.id)} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-slate-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all"><BookOpen size={24} /></div>
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{t.nome}</h4>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{t.periodo}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ABA RELATÓRIOS */}
            {activeTab === 'relatorios' && (
              <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-200 space-y-8">
                <select value={repTurmaId} onChange={(e) => setRepTurmaId(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-100">
                  <option value="">Selecione a turma para o relatório...</option>
                  {classes.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
                {repTurmaId ? (
                   renderAttendanceGrid(students.filter(a => a.turmaId === repTurmaId), storageService.getDatasComFrequencia(repTurmaId, students.filter(a => a.turmaId === repTurmaId).map(a => a.id)))
                ) : (
                   <div className="py-16 text-center text-slate-300 font-black uppercase tracking-widest text-[9px]">Escolha uma turma para visualizar os dados consolidados</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODAL GERAL DE CADASTRO/EDIÇÃO */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 md:p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white p-1 modal-animate-in max-h-[95vh] overflow-y-auto">
              <div className="p-6 md:p-8 flex justify-between items-center border-b border-slate-50 sticky top-0 bg-white z-10">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                  {editingItem ? 'Editar' : 'Novo'} {activeTab === 'professores' ? 'Docente' : activeTab === 'alunos' ? 'Aluno' : 'Turma'}
                </h3>
                <button onClick={closeModal} className="p-3 bg-slate-50 text-slate-300 rounded-xl"><X size={20} /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
                 {/* Campos comuns e específicos baseados na activeTab */}
                 <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-4">Nome Completo</label>
                      <input name="nome" required defaultValue={editingItem?.nome} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700 outline-none focus:bg-white transition-all" />
                    </div>

                    {activeTab === 'professores' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-4">Matrícula</label>
                          <input name="matricula" required defaultValue={editingItem?.matricula} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700 outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-4">WhatsApp</label>
                          <input name="whatsapp" defaultValue={editingItem?.whatsapp} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700 outline-none" placeholder="(00) 00000-0000" />
                        </div>
                      </div>
                    )}

                    {activeTab === 'alunos' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-4">Responsável</label>
                            <input name="responsavel" required defaultValue={editingItem?.responsavel} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-4">Telefone</label>
                            <input name="telefoneResponsavel" defaultValue={editingItem?.telefoneResponsavel} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-4">Turma</label>
                          <select name="turmaId" defaultValue={editingItem?.turmaId || ""} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700 appearance-none">
                            <option value="">Aguardando Matrícula</option>
                            {classes.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-2xl">
                          <input type="checkbox" name="nee" defaultChecked={editingItem?.nee} className="w-5 h-5 rounded-lg text-rose-500" />
                          <span className="text-[10px] font-black text-slate-500 uppercase">Possui Necessidades Especiais (NEE)</span>
                        </div>
                      </>
                    )}

                    {activeTab === 'turmas' && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-4">Período</label>
                        <select name="periodo" defaultValue={editingItem?.periodo || "Manhã"} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700">
                          <option value="Manhã">Manhã</option>
                          <option value="Tarde">Tarde</option>
                          <option value="Integral">Integral</option>
                        </select>
                      </div>
                    )}
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={closeModal} className="flex-1 py-4 bg-slate-100 text-slate-400 font-black uppercase text-[10px] rounded-2xl">Cancelar</button>
                    <button type="submit" className="flex-1 py-4 sky-gradient text-white font-black uppercase text-[10px] rounded-2xl shadow-xl shadow-blue-50">Confirmar</button>
                 </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DIÁRIO (DETALHADO) */}
        {isDailyViewOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in">
             <div className="bg-white w-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden flex flex-col modal-animate-in max-h-[95vh]">
                <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center">
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Diário de Frequência - {selectedTurma?.nome}</h3>
                   <button onClick={() => setIsDailyViewOpen(false)} className="p-3 bg-slate-50 text-slate-300 rounded-xl"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-auto p-4 md:p-8">
                   {registeredDatesForCurrentTurma.length > 0 ? (
                      renderAttendanceGrid(turmaAlunos, registeredDatesForCurrentTurma)
                   ) : (
                      <div className="py-20 text-center text-slate-300 font-black uppercase text-[10px]">Nenhum registro encontrado</div>
                   )}
                </div>
             </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default SecretaryDashboard;
