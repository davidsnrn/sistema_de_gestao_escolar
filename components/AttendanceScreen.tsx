
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Smile, Frown, Heart, 
  MessageSquare, Sparkles, Calendar as CalendarIcon, History,
  Edit2, X, RotateCcw, CheckCircle2, Lock, Plus, Users, ChevronRight, Clock
} from 'lucide-react';
import { turmas, alunos } from '../mockData';
import { storageService } from '../services/storageService';
import { Aluno, AttendanceStatus, Frequencia } from '../types';
import Layout from './Layout';
import { GoogleGenAI } from "@google/genai";

const AttendanceScreen: React.FC = () => {
  const { turmaId } = useParams<{ turmaId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [isMarking, setIsMarking] = useState(false);
  // Correção da data: Garante data local para evitar problemas de "um dia anterior"
  const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  
  const [currentTurma] = useState(storageService.getTurmas(turmas).find(t => t.id === turmaId));
  const [turmaAlunos, setTurmaAlunos] = useState<Aluno[]>([]);
  const [registeredDates, setRegisteredDates] = useState<string[]>([]);
  
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  
  const [isLockedByRecord, setIsLockedByRecord] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isWithinTenure = useMemo(() => {
    const { userId } = storageService.getSession();
    if (!currentTurma || !userId) return false;
    const vinculo = (currentTurma.vinculos || []).find(v => v.professorId === userId);
    if (!vinculo) return false;
    return selectedDate >= vinculo.dataInicio && selectedDate <= vinculo.dataFim && vinculo.ativo;
  }, [currentTurma, selectedDate]);

  const loadTurmaData = useCallback(() => {
    if (!turmaId) return;
    const matchedAlunos = storageService.getAlunos(alunos).filter(a => a.turmaId === turmaId);
    setTurmaAlunos(matchedAlunos);
    const dates = storageService.getDatasComFrequencia(turmaId, matchedAlunos.map(a => a.id));
    setRegisteredDates(dates);
  }, [turmaId]);

  useEffect(() => {
    loadTurmaData();
  }, [loadTurmaData]);

  const loadAttendance = useCallback(() => {
    if (!turmaId || !isMarking) return;

    const initialAttendance: Record<string, AttendanceStatus> = {};
    const initialNotes: Record<string, string> = {};
    const existing = storageService.getFrequencia(selectedDate, turmaId);
    
    turmaAlunos.forEach(aluno => {
      const record = existing.find(r => r.alunoId === aluno.id);
      initialAttendance[aluno.id] = record?.status || AttendanceStatus.PRESENT;
      initialNotes[aluno.id] = record?.observacao || '';
    });

    setAttendance(initialAttendance);
    setNotes(initialNotes);
    setIsLockedByRecord(existing.length > 0);
  }, [turmaId, selectedDate, isMarking, turmaAlunos]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMarking) {
          setIsMarking(false);
          loadTurmaData();
        } else {
          const { role } = storageService.getSession();
          if (role === 'SECRETARIO') navigate('/admin');
          else navigate('/dashboard');
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMarking, navigate, loadTurmaData]);

  const handleStatusChange = (alunoId: string, status: AttendanceStatus) => {
    if (isLockedByRecord || !isWithinTenure) return;
    setAttendance(prev => ({ ...prev, [alunoId]: status }));
    if (status === AttendanceStatus.JUSTIFIED) {
      setExpandedNotes(prev => ({ ...prev, [alunoId]: true }));
    }
  };

  const confirmSave = () => {
    setIsSaving(true);
    const records: Frequencia[] = turmaAlunos.map(aluno => ({
      alunoId: aluno.id,
      data: selectedDate,
      status: attendance[aluno.id],
      observacao: notes[aluno.id]
    }));

    setTimeout(() => {
      storageService.saveFrequencia(records);
      setIsSaving(false);
      setShowConfirmModal(false);
      setIsLockedByRecord(true);
      setIsMarking(false);
      loadTurmaData();
    }, 600);
  };

  if (!currentTurma) return null;

  if (!isMarking) {
    return (
      <Layout>
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative">
            <div className="flex items-center gap-5 relative z-10">
              <button 
                onClick={() => {
                  const { role } = storageService.getSession();
                  if (role === 'SECRETARIO') navigate('/admin');
                  else navigate('/dashboard');
                }} 
                className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-3xl active:scale-90 transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">{currentTurma.nome}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{currentTurma.periodo} • Diário de Classe</p>
              </div>
            </div>
            {/* NOVO ESTILO DO BOTÃO ADICIONAR FREQUÊNCIA */}
            <button 
              onClick={() => { setSelectedDate(getLocalDateString()); setIsMarking(true); }}
              className="relative group px-10 py-5 sky-gradient text-white rounded-3xl font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-[0_15px_30px_-5px_rgba(77,150,255,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(77,150,255,0.6)] hover:-translate-y-1 active:scale-95 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <Plus size={20} strokeWidth={3} className="relative z-10" />
              <span className="relative z-10">Adicionar Frequência</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm p-4">
                 <div className="flex items-center gap-4 mb-8 px-8 pt-8">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem]"><Users size={28} /></div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Estudantes</h3>
                 </div>
                 <div className="px-8 pb-8 space-y-4">
                    {turmaAlunos.map(aluno => (
                      <div key={aluno.id} className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2.5rem] border border-transparent hover:bg-white hover:border-slate-100 transition-all">
                        <img src={aluno.fotoUrl || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded-3xl object-cover border-4 border-white shadow-md" />
                        <div>
                          <p className="font-black text-slate-800 text-lg uppercase leading-tight">{aluno.nome}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Responsável: {aluno.responsavel}</p>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>

            {/* SEÇÃO HISTÓRICO REMODELADA */}
            <div className="space-y-6">
              <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm p-4 overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 opacity-50 blur-3xl"></div>
                 <div className="flex items-center gap-4 mb-8 px-8 pt-8 relative z-10">
                    <div className="p-4 sun-gradient text-white rounded-[1.5rem] shadow-lg shadow-orange-100"><Clock size={28} /></div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Histórico</h3>
                 </div>
                 <div className="px-8 pb-8 space-y-3 relative z-10">
                    {registeredDates.map(date => (
                      <button 
                        key={date}
                        onClick={() => { setSelectedDate(date); setIsMarking(true); }}
                        className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-[2rem] transition-all group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                           <div className="p-2 bg-white rounded-xl text-slate-400 group-hover:text-indigo-500 shadow-sm">
                             <CalendarIcon size={18} />
                           </div>
                           <span className="font-bold text-slate-600 text-sm">
                             {/* Formatação segura da data local */}
                             {(() => {
                               const [y, m, d] = date.split('-');
                               return `${d}/${m}/${y}`;
                             })()}
                           </span>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                    {registeredDates.length === 0 && (
                      <div className="text-center py-10">
                        <CalendarIcon size={40} className="mx-auto text-slate-100 mb-4" />
                        <p className="text-slate-300 font-black uppercase tracking-widest text-[9px]">Nenhum registro encontrado</p>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-24 md:pb-8 animate-in zoom-in-95 duration-300">
        {!isWithinTenure && (
            <div className="bg-rose-50 border border-rose-200 p-6 rounded-[2.5rem] flex items-center gap-4 text-rose-700 font-bold shadow-sm">
                <Lock size={24} />
                <p>Atenção: Data fora do período de posse. Registro bloqueado.</p>
            </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMarking(false)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl active:scale-90 transition-all"><X size={20} /></button>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">{isLockedByRecord ? 'Editar' : 'Novo'} Registro</h2>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-black text-slate-400 outline-none bg-slate-50 px-3 py-1 rounded-full cursor-pointer hover:text-indigo-600 uppercase tracking-widest transition-all"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isWithinTenure && (
                isLockedByRecord ? (
                    <button onClick={() => setIsLockedByRecord(false)} className="bg-white border-2 border-indigo-600 text-indigo-600 font-black uppercase text-[10px] tracking-widest py-4 px-10 rounded-3xl shadow-sm active:scale-95 transition-all">Editar Agora</button>
                ) : (
                    <button onClick={() => setShowConfirmModal(true)} className="sky-gradient text-white font-black uppercase text-[10px] tracking-widest py-4 px-10 rounded-3xl shadow-xl shadow-blue-100 active:scale-95 transition-all">Gravar Diário</button>
                )
            )}
          </div>
        </div>

        <div className="space-y-4">
          {turmaAlunos.map((aluno, idx) => (
            <div key={aluno.id} className={`bg-white rounded-[3rem] border transition-all ${isLockedByRecord || !isWithinTenure ? 'opacity-90 border-slate-100' : 'hover:border-indigo-100 shadow-sm border-slate-200'}`}>
              <div className="p-6 flex flex-col sm:flex-row items-center gap-5">
                <div className="flex items-center gap-5 flex-1 w-full">
                  <div className="relative">
                    <img src={aluno.fotoUrl || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded-3xl object-cover border-4 border-white shadow-xl" />
                    <span className="absolute -top-2 -left-2 w-8 h-8 sun-gradient text-white rounded-2xl flex items-center justify-center text-xs font-black shadow-md border-2 border-white">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-800 text-lg uppercase leading-tight">{aluno.nome}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Matrícula: {aluno.id}</p>
                  </div>
                  <button onClick={() => setExpandedNotes(prev => ({ ...prev, [aluno.id]: !prev[aluno.id] }))} className={`p-4 rounded-2xl transition-all ${notes[aluno.id] ? 'sky-gradient text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}><MessageSquare size={22} /></button>
                </div>
                <div className="flex gap-2.5 w-full sm:w-auto">
                  {[
                    { id: AttendanceStatus.PRESENT, icon: Smile, label: 'Presente', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500' },
                    { id: AttendanceStatus.ABSENT, icon: Frown, label: 'Faltou', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-500' },
                    { id: AttendanceStatus.JUSTIFIED, icon: Heart, label: 'Justif.', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-500' },
                  ].map(status => (
                    <button
                      key={status.id}
                      disabled={isLockedByRecord || !isWithinTenure}
                      onClick={() => handleStatusChange(aluno.id, status.id)}
                      className={`flex-1 sm:w-28 py-5 rounded-3xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${attendance[aluno.id] === status.id ? `${status.bg} ${status.border} ${status.text} font-black shadow-inner` : 'bg-white border-slate-50 text-slate-300 opacity-40 hover:opacity-100'}`}
                    >
                      <status.icon size={26} strokeWidth={3} />
                      <span className="text-[9px] uppercase font-black tracking-widest">{status.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {expandedNotes[aluno.id] && (
                <div className="px-8 pb-8 bg-slate-50/50 pt-6 rounded-b-[3rem] animate-in slide-in-from-top-2 duration-300">
                  <textarea 
                    disabled={isLockedByRecord || !isWithinTenure}
                    value={notes[aluno.id] || ''}
                    onChange={(e) => setNotes(prev => ({...prev, [aluno.id]: e.target.value}))}
                    className="w-full h-32 p-6 bg-white border-2 border-slate-100 rounded-[2rem] text-sm font-bold text-slate-600 outline-none shadow-inner focus:border-indigo-200 transition-all"
                    placeholder="Notas pedagógicas ou justificativas..."
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[4rem] p-12 shadow-2xl border border-white text-center modal-animate-in">
              <div className="w-24 h-24 sky-gradient text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <CheckCircle2 size={48} strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-8 tracking-tight">Salvar Diário?</h3>
              <p className="text-slate-500 mb-8 font-medium">Os registros de frequência desta turma serão atualizados para a data selecionada.</p>
              <div className="flex flex-col gap-4">
                <button onClick={confirmSave} className="w-full sky-gradient text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Sim, Salvar</button>
                <button onClick={() => setShowConfirmModal(false)} className="w-full bg-slate-100 text-slate-400 py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors">Revisar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AttendanceScreen;
