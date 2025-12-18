
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, BookOpen, FileText, Plus, 
  Trash2, Search, Briefcase, GraduationCap, Edit3, X, Save,
  BarChart3, Calendar as CalendarIcon, ArrowDownToLine, ArrowLeft,
  ChevronRight, ChevronUp, ChevronDown
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

  // Dados do Estado
  const [profs, setProfs] = useState<Professor[]>([]);
  const [students, setStudents] = useState<Aluno[]>([]);
  const [classes, setClasses] = useState<Turma[]>([]);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

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

  // Lógica para gerar a grade de datas
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

  const getAttendanceForGrid = (alunoId: string, date: string) => {
    const all = storageService.getFrequencia(date);
    const rec = all.find(f => f.alunoId === alunoId);
    if (!rec) return '0';
    if (rec.status === AttendanceStatus.PRESENT) return '0';
    if (rec.status === AttendanceStatus.ABSENT) return '2';
    return 'J';
  };

  const countAbsences = (alunoId: string) => {
    let count = 0;
    gridDates.forEach(d => {
      const all = storageService.getFrequencia(d);
      const rec = all.find(f => f.alunoId === alunoId);
      if (rec?.status === AttendanceStatus.ABSENT) count += 2;
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

          {/* Grade de Alunos (Diário) */}
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
                        {new Date(date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'})}
                        <br/>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">
                          {new Date(date).toLocaleDateString('pt-BR', {weekday: 'short'})}, 2 aulas
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-4 bg-slate-200/30 min-w-[150px]">Situação da frequência</th>
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
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">({aluno.id.slice(-10)})</p>
                            </div>
                          </div>
                        </td>
                        {gridDates.map(date => (
                          <td key={date} className="px-2 py-4 border-r border-slate-200 text-center text-xs font-medium text-slate-500">
                            {getAttendanceForGrid(aluno.id, date)}
                          </td>
                        ))}
                        <td className="px-4 py-4 bg-slate-50/30">
                          {absences > 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg">
                              <p className="text-[11px] font-bold text-yellow-700">{absences} falta(s) no diário</p>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Seção de Professores (Estilo Imagem Fornecida) */}
          <div className="bg-white rounded-xl border border-teal-500 overflow-hidden shadow-sm">
            <div 
              className="p-4 bg-white border-b border-teal-500 flex justify-between items-center cursor-pointer"
              onClick={() => setIsProfSectionOpen(!isProfSectionOpen)}
            >
              <div className="flex items-center gap-3">
                <span className="text-teal-600 font-bold text-sm uppercase tracking-wide">Professores</span>
                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">1</span>
              </div>
              {isProfSectionOpen ? <ChevronUp className="text-teal-600" size={20}/> : <ChevronDown className="text-teal-600" size={20}/>}
            </div>
            
            {isProfSectionOpen && (
              <div className="p-6 animate-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-6">
                   <h4 className="text-xs font-bold text-slate-500 uppercase">Professores vinculados ao diário</h4>
                   <button 
                    onClick={() => { setActiveTab('turmas'); openModal(selectedTurma); }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-2"
                   >
                     Adicionar Professor
                   </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-800 uppercase border-b border-slate-200">
                        <th className="px-4 py-3 border-r border-slate-200">Ações</th>
                        <th className="px-4 py-3 border-r border-slate-200">Matrícula</th>
                        <th className="px-4 py-3 border-r border-slate-200">Nome</th>
                        <th className="px-4 py-3 border-r border-slate-200 text-center">Ativo</th>
                        <th className="px-4 py-3">Período da Posse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedProfessor ? (
                        <tr className="border-b border-slate-100 text-sm">
                          <td className="px-4 py-4 border-r border-slate-200">
                            <button onClick={() => { setActiveTab('professores'); openModal(linkedProfessor); }} className="w-8 h-8 rounded-full border border-teal-500 flex items-center justify-center text-teal-600 hover:bg-teal-50 transition-colors">
                              <Edit3 size={16} />
                            </button>
                          </td>
                          <td className="px-4 py-4 border-r border-slate-200 font-medium text-slate-600">{linkedProfessor.id.slice(-7)}</td>
                          <td className="px-4 py-4 border-r border-slate-200 font-medium text-slate-600 uppercase">{linkedProfessor.nome}</td>
                          <td className="px-4 py-4 border-r border-slate-200 text-center">
                            <span className="bg-green-100 text-green-700 px-6 py-1 rounded-lg text-xs font-bold border-l-4 border-green-500">Sim</span>
                          </td>
                          <td className="px-4 py-4 text-xs font-medium text-slate-500">De 09/09/2025 até 20/02/2026</td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">Nenhum professor vinculado.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Dashboard Tab Views
  return (
    <Layout userName="Secretaria Escolar">
      <div className="space-y-8 pb-20">
        {/* Navigation Tabs */}
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

        {(activeTab === 'professores' || activeTab === 'alunos' || activeTab === 'turmas') && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{activeTab}</h3>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder={`Filtrar...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border-none outline-none text-sm focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <button 
                  onClick={() => openModal()}
                  className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Plus size={20} /> Novo Registro
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Nome / Info</th>
                    <th className="px-6 py-4">{activeTab === 'turmas' ? 'Docente' : 'Turma Vinculada'}</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeTab === 'professores' ? profs : activeTab === 'alunos' ? students : classes)
                    .filter((i:any) => i.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {activeTab === 'alunos' && <img src={item.fotoUrl} className="w-9 h-9 rounded-full border border-slate-100 shadow-sm" />}
                          <div>
                            <p className="font-bold text-slate-700">{item.nome}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">{item.email || item.responsavel}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {activeTab === 'turmas' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600 uppercase">{profs.find(p => p.id === item.professorId)?.nome || 'Sem Docente'}</span>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {activeTab === 'alunos' ? (classes.find(c => c.id === item.turmaId)?.nome || 'Sem Turma') : 'Secretaria'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {activeTab === 'turmas' && (
                            <button 
                              onClick={() => setSelectedTurmaId(item.id)}
                              className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all"
                            >
                              Abrir Diário <ChevronRight size={14}/>
                            </button>
                          )}
                          <button onClick={() => openModal(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit3 size={18}/></button>
                          <button onClick={() => handleDelete(item.id, activeTab.slice(0, -1))} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Único para CRUD */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
              <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold uppercase tracking-tight">{editingItem ? 'Editar' : 'Adicionar'} {activeTab.slice(0, -1)}</h3>
                <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome Completo</label>
                  <input name="nome" required defaultValue={editingItem?.nome} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
                {activeTab === 'professores' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">E-mail de Acesso</label>
                    <input name="email" type="email" required defaultValue={editingItem?.email} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                  </div>
                )}
                {activeTab === 'alunos' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável Legal</label>
                      <input name="responsavel" required defaultValue={editingItem?.responsavel} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Turma de Destino</label>
                      <select name="turmaId" defaultValue={editingItem?.turmaId} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all">
                        <option value="">Nenhuma</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                  </>
                )}
                {activeTab === 'turmas' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Docente Titular</label>
                      <select name="professorId" required defaultValue={editingItem?.professorId} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all">
                        <option value="">Selecione um professor...</option>
                        {profs.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Período de Aula</label>
                      <select name="periodo" defaultValue={editingItem?.periodo || 'Manhã'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all">
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Integral">Integral</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-all">Descartar</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"><Save size={18}/> Confirmar</button>
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
