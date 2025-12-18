
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, BookOpen, FileText, Plus, 
  Trash2, Search, Briefcase, GraduationCap, Edit3, X, Save,
  BarChart3, Calendar as CalendarIcon, ArrowLeft,
  ChevronRight, LayoutDashboard,
  Mail, Phone, CreditCard, Sun, CheckCircle2, UserCheck, ExternalLink, Camera, History
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
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingVinculo, setEditingVinculo] = useState<ProfessorVinculo | null>(null);
  const [viewingProfessor, setViewingProfessor] = useState<Professor | null>(null);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Aluno | null>(null);

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

  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const openWhatsApp = (number?: string) => {
    if (!number) return;
    const digits = number.replace(/\D/g, '');
    window.open(`https://wa.me/55${digits}`, '_blank');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    if (activeTab === 'professores') {
      const matricula = data.matricula as string;
      const isDuplicate = profs.some(p => p.matricula === matricula && p.id !== editingItem?.id);
      
      if (isDuplicate) {
        alert('Erro: Já existe um professor cadastrado com esta matrícula.');
        return;
      }

      const newProfs = editingItem 
        ? profs.map(p => p.id === editingItem.id ? { ...p, ...data } : p)
        : [...profs, { id: Date.now().toString(), ...data } as Professor];
      storageService.saveProfessors(newProfs);
    } else if (activeTab === 'alunos') {
      const newAlunos = editingItem
        ? students.map(a => a.id === editingItem.id ? { ...a, ...data } : a)
        : [...students, { id: Date.now().toString(), ...data } as Aluno];
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

  const handleSaveVinculo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTurmaId) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    const newVinculo: ProfessorVinculo = {
      professorId: data.professorId as string,
      ativo: data.ativo === 'on',
      dataInicio: data.dataInicio as string,
      dataFim: data.dataFim as string
    };

    const updatedTurmas = classes.map(t => {
      if (t.id === selectedTurmaId) {
        const vinculos = t.vinculos || [];
        const existingIdx = vinculos.findIndex(v => v.professorId === newVinculo.professorId);
        const newVinculos = [...vinculos];
        if (existingIdx > -1) newVinculos[existingIdx] = newVinculo;
        else newVinculos.push(newVinculo);
        return { ...t, vinculos: newVinculos };
      }
      return t;
    });

    storageService.saveTurmas(updatedTurmas);
    refreshData();
    setEditingVinculo(null);
    setIsVinculoModalOpen(false);
  };

  const handleDelete = (id: string, type: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente?')) return;
    if (type === 'professor') storageService.saveProfessors(profs.filter(p => p.id !== id));
    if (type === 'aluno') storageService.saveAlunos(students.filter(a => a.id !== id));
    if (type === 'turma') storageService.saveTurmas(classes.filter(t => t.id !== id));
    refreshData();
    if (viewingProfessor && viewingProfessor.id === id) closeDetailModal();
  };

  const removeVinculo = (profId: string) => {
    if (!confirm('Remover este professor desta turma?')) return;
    const updatedTurmas = classes.map(t => {
      if (t.id === selectedTurmaId) {
        return { ...t, vinculos: (t.vinculos || []).filter(v => v.professorId !== profId) };
      }
      return t;
    });
    storageService.saveTurmas(updatedTurmas);
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

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setViewingProfessor(null);
  };

  const openDetailModal = (prof: Professor) => {
    setViewingProfessor(prof);
    setIsDetailModalOpen(true);
  };

  const openVinculoModal = (vinculo?: ProfessorVinculo) => {
    setEditingVinculo(vinculo || null);
    setIsVinculoModalOpen(true);
  };

  const openHistoryModal = (aluno: Aluno) => {
    setSelectedStudentForHistory(aluno);
    setIsHistoryModalOpen(true);
  };

  const selectedTurma = useMemo(() => classes.find(t => t.id === selectedTurmaId), [selectedTurmaId, classes]);
  const turmaAlunos = useMemo(() => students.filter(a => a.turmaId === selectedTurmaId), [selectedTurmaId, students]);

  const studentAbsenceHistory = useMemo(() => {
    if (!selectedStudentForHistory) return [];
    // Busca todas as frequências desse aluno onde o status é ABSENT
    // Para simplificar, iteramos por todas as chaves do storage filtrando pelo alunoId e status
    // Como nossa storage API é simples, vamos buscar um range amplo ou todas
    const data = localStorage.getItem('educafrequencia_data');
    if (!data) return [];
    const allRecords: Frequencia[] = JSON.parse(data);
    return allRecords
      .filter(r => r.alunoId === selectedStudentForHistory.id && r.status === AttendanceStatus.ABSENT)
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [selectedStudentForHistory]);

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

  if (selectedTurmaId && selectedTurma) {
    return (
      <Layout userName="Secretaria Escolar">
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedTurmaId(null)}
                className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-3xl transition-all active:scale-90"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{selectedTurma.nome}</h2>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Turma • {selectedTurma.periodo}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openModal(selectedTurma)} className="p-4 bg-white border-2 border-slate-100 rounded-3xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-90">
                <Edit3 size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10">
            {/* Quadro de Alunos */}
            <section className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden p-2">
              <div className="p-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem]"><Users size={28} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Alunos Matriculados</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total de {turmaAlunos.length} estudantes</p>
                  </div>
                </div>
                <button onClick={() => { setActiveTab('alunos'); openModal(); }} className="px-8 py-4 bg-indigo-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all w-full md:w-auto">
                  <Plus size={18} strokeWidth={3} /> Matricular Aluno
                </button>
              </div>

              <div className="overflow-x-auto px-8 pb-8">
                <div className="space-y-4">
                   {turmaAlunos.map(aluno => (
                     <div key={aluno.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2.5rem] border border-transparent hover:border-slate-200 hover:bg-white transition-all group">
                       <div className="flex items-center gap-5">
                          <img src={aluno.fotoUrl || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded-3xl border-2 border-white shadow-md object-cover" />
                          <div>
                             <p className="font-black text-slate-800 text-lg uppercase tracking-tight">{aluno.nome}</p>
                             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Responsável: {aluno.responsavel}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                         <button 
                           onClick={() => openHistoryModal(aluno)}
                           className="p-4 bg-white text-slate-400 hover:text-indigo-600 rounded-2xl shadow-sm transition-all"
                           title="Ver Frequência"
                         >
                           <History size={18} />
                         </button>
                         <button 
                           onClick={() => openModal(aluno)}
                           className="p-4 bg-white text-slate-400 hover:text-amber-500 rounded-2xl shadow-sm transition-all"
                         >
                           <Edit3 size={18} />
                         </button>
                         <button 
                           onClick={() => handleDelete(aluno.id, 'aluno')}
                           className="p-4 bg-white text-slate-400 hover:text-rose-500 rounded-2xl shadow-sm transition-all"
                         >
                           <Trash2 size={18} />
                         </button>
                       </div>
                     </div>
                   ))}
                   {turmaAlunos.length === 0 && (
                     <div className="text-center py-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-300 font-bold uppercase text-[10px] tracking-widest">Nenhum aluno nesta turma</div>
                   )}
                </div>
              </div>
            </section>

            {/* Quadro de Professores Vinculados */}
            <section className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden p-2">
              <div className="p-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-amber-50 text-amber-600 rounded-[1.5rem]"><UserCheck size={28} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Corpo Docente</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Professores vinculados ao diário</p>
                  </div>
                </div>
                <button onClick={() => openVinculoModal()} className="px-8 py-4 sun-gradient text-white rounded-3xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-yellow-100 hover:opacity-90 active:scale-95 transition-all w-full md:w-auto">
                  <Plus size={18} strokeWidth={3} /> Vincular Professor
                </button>
              </div>

              <div className="overflow-x-auto px-8 pb-8">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest">
                      <th className="px-6 py-6 text-center">Ações</th>
                      <th className="px-6 py-6">Matrícula</th>
                      <th className="px-6 py-6">Nome do Professor</th>
                      <th className="px-6 py-6 text-center">Ativo</th>
                      <th className="px-6 py-6">Período da Posse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(selectedTurma.vinculos || []).map(v => {
                      const prof = profs.find(p => p.id === v.professorId);
                      if (!prof) return null;
                      return (
                        <tr key={v.professorId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-6 text-center">
                            <div className="flex justify-center gap-2">
                               <button onClick={() => openVinculoModal(v)} className="p-3 bg-white border border-slate-200 text-slate-300 hover:text-amber-500 rounded-2xl shadow-sm transition-all" title="Editar Vínculo"><Edit3 size={16} /></button>
                               <button onClick={() => removeVinculo(v.professorId)} className="p-3 bg-white border border-slate-200 text-slate-300 hover:text-rose-500 rounded-2xl shadow-sm transition-all" title="Remover Vínculo"><Trash2 size={16} /></button>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <span className="font-black text-slate-500 text-xs">{prof.matricula}</span>
                          </td>
                          <td className="px-6 py-6">
                            <p className="font-black text-slate-800 text-sm">{prof.nome}</p>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border font-black text-[10px] uppercase tracking-widest ${v.ativo ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                              <div className={`w-2 h-2 rounded-full ${v.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                              {v.ativo ? 'Sim' : 'Não'}
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <span className="text-xs font-bold text-slate-400 uppercase">De {new Date(v.dataInicio).toLocaleDateString('pt-BR')} até {new Date(v.dataFim).toLocaleDateString('pt-BR')}</span>
                          </td>
                        </tr>
                      );
                    })}
                    {(selectedTurma.vinculos || []).length === 0 && (
                      <tr><td colSpan={5} className="text-center py-16 text-slate-300 font-bold uppercase text-[10px] tracking-widest">Nenhum professor vinculado a esta turma</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Modal de Histórico de Faltas */}
          {isHistoryModalOpen && selectedStudentForHistory && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-lg rounded-[4rem] shadow-2xl overflow-hidden border border-white modal-animate-in p-1">
                <div className="p-10 pb-8 border-b border-slate-50 flex justify-between items-center">
                   <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Histórico de Faltas</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedStudentForHistory.nome}</p>
                   </div>
                   <button onClick={() => setIsHistoryModalOpen(false)} className="p-4 bg-slate-50 text-slate-300 hover:text-slate-500 rounded-3xl transition-all"><X size={24} /></button>
                </div>
                <div className="p-10 max-h-[60vh] overflow-y-auto">
                   {studentAbsenceHistory.length > 0 ? (
                     <div className="space-y-3">
                        {studentAbsenceHistory.map((rec, i) => (
                          <div key={i} className="flex items-center justify-between p-5 bg-rose-50 rounded-3xl border border-rose-100">
                             <div className="flex items-center gap-3">
                                <CalendarIcon size={18} className="text-rose-400" />
                                <span className="font-bold text-rose-700">{new Date(rec.data).toLocaleDateString('pt-BR')}</span>
                             </div>
                             {rec.observacao && (
                                <span className="text-[10px] font-medium text-rose-400 italic truncate max-w-[150px]">"{rec.observacao}"</span>
                             )}
                          </div>
                        ))}
                        <p className="text-center pt-4 text-[10px] font-black text-rose-300 uppercase tracking-[0.2em]">Total: {studentAbsenceHistory.length} faltas registradas</p>
                     </div>
                   ) : (
                     <div className="text-center py-16 bg-emerald-50 rounded-[3rem] border-2 border-dashed border-emerald-100">
                        <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
                        <p className="text-emerald-700 font-black uppercase tracking-widest text-xs">Nenhuma falta registrada</p>
                     </div>
                   )}
                </div>
                <div className="p-10 pt-0">
                  <button onClick={() => setIsHistoryModalOpen(false)} className="w-full py-5 bg-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] rounded-3xl active:scale-95 transition-all">Fechar</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Vínculo (Adicionar/Editar) */}
          {isVinculoModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-lg rounded-[4rem] shadow-2xl overflow-hidden border border-white modal-animate-in p-1">
                <div className="p-12 pb-8 border-b border-slate-50 flex justify-between items-center">
                   <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{editingVinculo ? 'Editar Vínculo' : 'Vincular Professor'}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Gestão de Posse Docente</p>
                   </div>
                   <button onClick={() => { setIsVinculoModalOpen(false); setEditingVinculo(null); }} className="p-4 bg-slate-50 text-slate-300 hover:text-slate-500 rounded-3xl transition-all"><X size={24} /></button>
                </div>
                <form onSubmit={handleSaveVinculo} className="p-12 space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Professor</label>
                      <select name="professorId" required defaultValue={editingVinculo?.professorId} disabled={!!editingVinculo} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] outline-none font-bold text-slate-700 shadow-inner disabled:opacity-50">
                         <option value="">Escolha um docente...</option>
                         {profs.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.matricula})</option>)}
                      </select>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Início da Posse</label>
                        <input name="dataInicio" type="date" required defaultValue={editingVinculo?.dataInicio} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] outline-none font-bold text-slate-700 shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Fim da Posse</label>
                        <input name="dataFim" type="date" required defaultValue={editingVinculo?.dataFim} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] outline-none font-bold text-slate-700 shadow-inner" />
                      </div>
                   </div>
                   <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem]">
                      <input type="checkbox" name="ativo" id="chk-ativo" defaultChecked={editingVinculo ? editingVinculo.ativo : true} className="w-6 h-6 rounded-xl text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                      <label htmlFor="chk-ativo" className="text-xs font-black text-slate-500 uppercase tracking-widest cursor-pointer select-none">Professor Ativo na Turma</label>
                   </div>
                   <div className="pt-4 flex gap-4">
                      <button type="button" onClick={() => { setIsVinculoModalOpen(false); setEditingVinculo(null); }} className="flex-1 py-5 bg-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] rounded-3xl transition-all active:scale-95">Descartar</button>
                      <button type="submit" className="flex-1 py-5 sky-gradient text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-3xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-95">
                        <Save size={18} /> {editingVinculo ? 'Salvar Alteração' : 'Confirmar Vínculo'}
                      </button>
                   </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Visualização de Listagem Padrão
  return (
    <Layout userName="Secretaria Escolar">
      <div className="space-y-8 pb-20">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('geral')}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest whitespace-nowrap transition-all active:scale-95 ${
              activeTab === 'geral' || activeTab === 'professores' || activeTab === 'alunos' || activeTab === 'turmas' ? 'sky-gradient text-white shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard size={16} /> Painel de Gestão
          </button>
          <button
            onClick={() => setActiveTab('relatorios')}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest whitespace-nowrap transition-all active:scale-95 ${
              activeTab === 'relatorios' ? 'sun-gradient text-white shadow-lg shadow-yellow-100' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            <FileText size={16} /> Relatórios Mensais
          </button>
        </div>

        {activeTab === 'geral' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 sky-gradient rounded-full -mr-32 -mt-32 opacity-5 blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-yellow-100 text-yellow-600 rounded-lg"><Sun size={14} fill="currentColor" /></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Portal Administrativo</span>
                </div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">Gestão CMEI Clara Camarão</h2>
                <p className="text-slate-500 mt-3 font-medium max-w-lg leading-relaxed">
                  Gerencie o quadro docente, o corpo discente e as turmas ativas da nossa instituição.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { tab: 'professores', icon: Briefcase, color: 'sky', label: 'Professores', count: profs.length, sub: 'Gerenciar Quadros' },
                { tab: 'alunos', icon: GraduationCap, color: 'purple', label: 'Estudantes', count: students.length, sub: 'Fichas Cadastrais' },
                { tab: 'turmas', icon: BookOpen, color: 'amber', label: 'Turmas Ativas', count: classes.length, sub: 'Diários de Classe' }
              ].map((item) => (
                <div 
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab as any)}
                  className={`group cursor-pointer bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col gap-6 relative overflow-hidden active:scale-[0.97]`}
                >
                  <div className={`p-6 rounded-[2rem] w-fit group-hover:scale-110 transition-transform ${
                    item.color === 'sky' ? 'sky-gradient text-white shadow-blue-100' : 
                    item.color === 'purple' ? 'bg-indigo-600 text-white shadow-indigo-100' : 'sun-gradient text-white shadow-yellow-100'
                  } shadow-xl`}>
                    <item.icon size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1">{item.sub}</p>
                    <p className="text-5xl font-black text-slate-800 tracking-tighter">{item.count}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className={`text-sm font-black uppercase tracking-tighter ${
                      item.color === 'sky' ? 'text-blue-600' : 
                      item.color === 'purple' ? 'text-indigo-600' : 'text-amber-600'
                    }`}>Acessar Módulo</span>
                    <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listagens */}
        {['professores', 'alunos', 'turmas'].includes(activeTab) && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-400">
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveTab('geral')} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black uppercase text-[10px] tracking-widest transition-all"><ArrowLeft size={16} /> Voltar ao Início</button>
              <button 
                onClick={() => openModal()} 
                className={`${
                  activeTab === 'professores' ? 'sky-gradient shadow-blue-100' :
                  activeTab === 'alunos' ? 'bg-indigo-600 shadow-indigo-100' : 'sun-gradient shadow-yellow-100'
                } text-white px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:opacity-90 transition-all shadow-xl active:scale-95`}
              >
                <Plus size={18} strokeWidth={3}/> Adicionar {activeTab === 'professores' ? 'Docente' : activeTab === 'alunos' ? 'Estudante' : 'Turma'}
              </button>
            </div>
            
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden p-2">
               <div className="p-6 border-b border-slate-50 flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      placeholder={`Buscar por nome ou registro...`} 
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] outline-none focus:bg-white focus:border-indigo-100 transition-all font-bold text-slate-600"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
               </div>

               {activeTab === 'turmas' ? (
                 <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map(t => {
                      const prof = profs.find(p => p.id === t.professorId);
                      const count = students.filter(a => a.turmaId === t.id).length;
                      return (
                        <div key={t.id} onClick={() => setSelectedTurmaId(t.id)} className="group cursor-pointer bg-slate-50 hover:bg-white rounded-[2.5rem] p-6 border-2 border-transparent hover:border-amber-100 hover:shadow-2xl transition-all active:scale-[0.98]">
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-4 rounded-2xl bg-white text-amber-500 shadow-sm group-hover:sun-gradient group-hover:text-white transition-all"><BookOpen size={24} /></div>
                            <div className="flex gap-1">
                              <button onClick={(e) => { e.stopPropagation(); openModal(t); }} className="p-2 text-slate-300 hover:text-indigo-600"><Edit3 size={16}/></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id, 'turma'); }} className="p-2 text-slate-300 hover:text-rose-600"><Trash2 size={16}/></button>
                            </div>
                          </div>
                          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t.nome}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t.periodo} • {count} alunos</p>
                          <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-100">
                               {prof?.nome.charAt(0) || '?'}
                             </div>
                             <p className="text-xs font-bold text-slate-500 truncate">{prof?.nome || 'Sem professor'}</p>
                          </div>
                        </div>
                      );
                    })}
                 </div>
               ) : (
                 <div className="divide-y divide-slate-50">
                    {(activeTab === 'professores' ? profs : students).filter(item => 
                      item.nome.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((item: any) => (
                      <div 
                        key={item.id} 
                        onClick={() => activeTab === 'professores' ? openDetailModal(item) : openModal(item)}
                        className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-5">
                          {activeTab === 'professores' ? (
                            <div className="w-14 h-14 rounded-[1.25rem] bg-white border border-slate-100 text-indigo-500 flex items-center justify-center font-black text-xl group-hover:sky-gradient group-hover:text-white transition-all shadow-sm">
                              {item.nome.charAt(0)}
                            </div>
                          ) : (
                            <img src={item.fotoUrl || 'https://via.placeholder.com/100'} className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover" />
                          )}
                          <div>
                            <p className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{item.nome}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                              {activeTab === 'professores' ? `Matrícula: ${item.matricula}` : `Turma: ${classes.find(t => t.id === item.turmaId)?.nome || 'Pendente'}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id, activeTab === 'professores' ? 'professor' : 'aluno'); }} 
                            className="p-4 text-slate-300 hover:text-rose-500 hover:bg-white rounded-2xl transition-all active:scale-90"
                          >
                            <Trash2 size={20} />
                          </button>
                          <ChevronRight size={20} className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-2 transition-all" />
                        </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Modal Detalhes Professor (WhatsApp Mask e Redirect) */}
        {isDetailModalOpen && viewingProfessor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white/95 w-full max-w-md rounded-[4rem] shadow-2xl overflow-hidden border border-white modal-animate-in">
              <div className="p-1 sky-gradient">
                <div className="bg-white rounded-[3.8rem] overflow-hidden">
                  <div className="p-12 pb-8 flex flex-col items-center relative">
                    <button onClick={closeDetailModal} className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all"><X size={20} /></button>
                    <div className="w-28 h-28 sky-gradient text-white rounded-[2.5rem] flex items-center justify-center text-4xl font-black mb-6 shadow-2xl shadow-blue-200">
                      {viewingProfessor.nome.charAt(0)}
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 text-center uppercase tracking-tight leading-tight">{viewingProfessor.nome}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="p-1 bg-blue-50 text-blue-500 rounded-md"><CreditCard size={12} strokeWidth={3} /></span>
                       <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest">Matrícula {viewingProfessor.matricula}</p>
                    </div>
                  </div>
                  
                  <div className="px-12 pb-12 space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                        <div onClick={() => openWhatsApp(viewingProfessor.whatsapp)} className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100/50 cursor-pointer hover:bg-emerald-50/50 group/phone transition-all">
                           <div className={`p-3 bg-white text-emerald-500 rounded-2xl shadow-sm group-hover/phone:sky-gradient group-hover/phone:text-white`}><Phone size={20} /></div>
                           <div className="truncate">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">WhatsApp</p>
                              <p className="font-bold text-slate-700 truncate flex items-center gap-2">
                                {viewingProfessor.whatsapp ? formatWhatsApp(viewingProfessor.whatsapp) : 'Não informado'}
                                {viewingProfessor.whatsapp && <ExternalLink size={10} className="text-slate-300" />}
                              </p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100/50">
                           <div className={`p-3 bg-white text-indigo-500 rounded-2xl shadow-sm`}><Mail size={20} /></div>
                           <div className="truncate">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">E-mail Institucional</p>
                              <p className="font-bold text-slate-700 truncate">{viewingProfessor.email || 'Não informado'}</p>
                           </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                      <button 
                        onClick={() => openModal(viewingProfessor)} 
                        className="flex-1 py-5 sky-gradient text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-3xl shadow-xl shadow-blue-100 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        <Edit3 size={16} strokeWidth={3} /> Editar Registro
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Geral (Professor/Aluno/Turma) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white/95 w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden border border-white modal-animate-in">
              <div className="p-12 flex justify-between items-center border-b border-slate-50">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                     {editingItem?.id ? 'Atualizar Dados' : 'Novo Registro'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">CMEI CLARA CAMARÃO • {activeTab}</p>
                </div>
                <button onClick={closeModal} className="p-4 bg-slate-50 text-slate-300 hover:text-slate-500 rounded-3xl transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={handleSave} className="p-12 pt-10 space-y-8">
                <div className="space-y-6">
                  {activeTab === 'professores' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Matrícula *</label>
                          <input name="matricula" required defaultValue={editingItem?.matricula} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-indigo-100 transition-all font-bold text-slate-600 shadow-inner" placeholder="0000000" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">WhatsApp</label>
                          <input 
                            name="whatsapp" 
                            defaultValue={editingItem?.whatsapp} 
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                e.target.value = formatWhatsApp(val);
                            }}
                            className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-indigo-100 transition-all font-bold text-slate-600 shadow-inner" 
                            placeholder="(xx) xxxxx-xxxx" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Nome do Docente *</label>
                        <input name="nome" required defaultValue={editingItem?.nome} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-indigo-100 transition-all font-bold text-slate-600 shadow-inner" placeholder="Nome completo" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">E-mail</label>
                        <input name="email" type="email" defaultValue={editingItem?.email} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-indigo-100 transition-all font-bold text-slate-600 shadow-inner" placeholder="nome@escola.com" />
                      </div>
                    </>
                  )}
                  
                  {activeTab === 'alunos' && (
                    <>
                      <div className="flex justify-center mb-6">
                         <div className="relative group">
                            <img src={editingItem?.fotoUrl || 'https://via.placeholder.com/150'} className="w-32 h-32 rounded-[2.5rem] border-4 border-slate-50 shadow-xl object-cover" />
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-[2.5rem] opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                               <Camera size={24} />
                               <input 
                                 type="file" 
                                 accept="image/*" 
                                 className="hidden" 
                                 onChange={(e) => handleFileUpload(e, (b64) => {
                                    setEditingItem((prev: any) => ({ ...prev, fotoUrl: b64 }));
                                 })}
                               />
                            </label>
                            <input type="hidden" name="fotoUrl" value={editingItem?.fotoUrl || ''} />
                         </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Nome do Estudante</label>
                        <input name="nome" required defaultValue={editingItem?.nome} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-indigo-100 transition-all font-bold text-slate-600 shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Responsável Legal</label>
                        <input name="responsavel" required defaultValue={editingItem?.responsavel} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-indigo-100 transition-all font-bold text-slate-600 shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Turma</label>
                        <select name="turmaId" required defaultValue={editingItem?.turmaId} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none font-bold text-slate-600 shadow-inner appearance-none">
                          {classes.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  {activeTab === 'turmas' && (
                     <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Identificação da Turma</label>
                        <input name="nome" required defaultValue={editingItem?.nome} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-indigo-100 transition-all font-bold text-slate-600 shadow-inner" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Turno</label>
                          <select name="periodo" required defaultValue={editingItem?.periodo} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none font-bold text-slate-600 shadow-inner">
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Integral">Integral</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Regente Principal</label>
                          <select name="professorId" required defaultValue={editingItem?.professorId} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none font-bold text-slate-600 shadow-inner">
                            {profs.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-5 bg-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] rounded-3xl hover:bg-slate-200 transition-all active:scale-95">Descartar</button>
                  <button type="submit" className="flex-1 py-5 sky-gradient text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-3xl shadow-xl shadow-blue-100 hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95">
                    <Save size={18} /> Confirmar Registro
                  </button>
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
