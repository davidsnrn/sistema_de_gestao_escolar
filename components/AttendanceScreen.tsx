
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

const AttendanceScreen: React.FC = () => {
  const { turmaId } = useParams<{ turmaId: string }>();
  const navigate = useNavigate();
  
  const [isMarking, setIsMarking] = useState(false);
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

  const handleStatusChange = (alunoId: string, status: AttendanceStatus) => {
    if (isLockedByRecord || !isWithinTenure) return;
    setAttendance(prev => ({ ...prev, [alunoId]: status }));
    if (status === AttendanceStatus.JUSTIFIED) setExpandedNotes(prev => ({ ...prev, [alunoId]: true }));
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
        <div className="space-y-6 md:space-y-8 pb-10 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 md:p-8 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm gap-4">
            <div className="flex items-center gap-4 md:gap-5">
              <button onClick={() => { const { role } = storageService.getSession(); role === 'SECRETARIO' ? navigate('/admin') : navigate('/dashboard'); }} className="p-3 md:p-4 bg-slate-50 text-slate-400 rounded-xl md:rounded-3xl"><ArrowLeft size={18} /></button>
              <div>
                <h2 className="text-xl md:text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">{currentTurma.nome}</h2>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Painel de Frequência</p>
              </div>
            </div>
            <button onClick={() => { setSelectedDate(getLocalDateString()); setIsMarking(true); }} className="w-full sm:w-auto px-6 md:px-10 py-4 md:py-5 sky-gradient text-white rounded-xl md:rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl"><Plus size={18} /> Novo Registro</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
               <div className="bg-white rounded-2xl md:rounded-[4rem] border border-slate-200 shadow-sm p-2 md:p-4">
                 <div className="flex items-center gap-3 mb-4 md:mb-8 px-4 md:px-8 pt-4 md:pt-8">
                    <div className="p-3 md:p-4 bg-indigo-50 text-indigo-600 rounded-lg md:rounded-[1.5rem]"><Users size={20} /></div>
                    <h3 className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-tight">Estudantes</h3>
                 </div>
                 <div className="px-4 md:px-8 pb-4 md:pb-8 space-y-2 md:space-y-4">
                    {turmaAlunos.map(aluno => (
                      <div key={aluno.id} className="flex items-center gap-3 md:gap-5 p-3 md:p-6 bg-slate-50 rounded-xl md:rounded-[2.5rem]">
                        <img src={aluno.fotoUrl} className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-3xl object-cover border-2 md:border-4 border-white shadow-md" />
                        <div>
                          <p className="font-black text-slate-800 text-sm md:text-lg uppercase leading-tight truncate">{aluno.nome}</p>
                          <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">{aluno.responsavel}</p>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
            <div className="bg-white rounded-2xl md:rounded-[4rem] border border-slate-200 shadow-sm p-2 md:p-4 h-fit">
              <div className="flex items-center gap-3 mb-4 md:mb-8 px-4 md:px-8 pt-4 md:pt-8">
                <div className="p-3 md:p-4 sun-gradient text-white rounded-lg md:rounded-[1.5rem]"><Clock size={20} /></div>
                <h3 className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-tight">Histórico</h3>
              </div>
              <div className="px-4 md:px-8 pb-4 md:pb-8 space-y-2 md:space-y-3">
                {registeredDates.map(date => (
                  <button key={date} onClick={() => { setSelectedDate(date); setIsMarking(true); }} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl md:rounded-[2rem] transition-all group">
                    <span className="font-bold text-slate-600 text-xs md:text-sm">{date.split('-').reverse().join('/')}</span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 pb-24 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-8 rounded-2xl md:rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsMarking(false)} className="p-3 md:p-4 bg-slate-50 text-slate-300 rounded-lg md:rounded-2xl active:scale-90"><X size={18} /></button>
            <div>
              <h2 className="text-lg md:text-2xl font-black text-slate-800 uppercase leading-none">{isLockedByRecord ? 'Ver' : 'Fazer'} Chamada</h2>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-[9px] md:text-xs font-black text-slate-400 outline-none bg-slate-50 px-2 md:px-3 py-1 rounded-full mt-1" />
            </div>
          </div>
          <div className="flex gap-2">
            {isWithinTenure && !isLockedByRecord && (
              <button onClick={() => setShowConfirmModal(true)} className="w-full md:w-auto sky-gradient text-white font-black uppercase text-[10px] py-4 px-8 rounded-xl md:rounded-3xl shadow-xl">Gravar</button>
            )}
            {isLockedByRecord && (
              <button onClick={() => setIsLockedByRecord(false)} className="w-full md:w-auto border-2 border-indigo-600 text-indigo-600 font-black uppercase text-[10px] py-4 px-8 rounded-xl md:rounded-3xl">Editar</button>
            )}
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          {turmaAlunos.map((aluno, idx) => (
            <div key={aluno.id} className="bg-white rounded-2xl md:rounded-[3rem] border border-slate-100 overflow-hidden">
              <div className="p-4 md:p-6 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3 md:gap-5 flex-1 w-full">
                  <div className="relative shrink-0">
                    <img src={aluno.fotoUrl} className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-3xl object-cover border-2 md:border-4 border-white shadow-lg" />
                    <span className="absolute -top-1.5 -left-1.5 w-6 h-6 md:w-8 md:h-8 sun-gradient text-white rounded-lg md:rounded-2xl flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-slate-800 text-sm md:text-lg uppercase leading-tight truncate">{aluno.nome}</h4>
                    <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase mt-0.5">Mat: {aluno.id}</p>
                  </div>
                  <button onClick={() => setExpandedNotes(prev => ({ ...prev, [aluno.id]: !prev[aluno.id] }))} className={`p-3 md:p-4 rounded-lg md:rounded-2xl shrink-0 transition-all ${notes[aluno.id] ? 'sky-gradient text-white' : 'bg-slate-50 text-slate-300'}`}><MessageSquare size={18} /></button>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {[
                    { id: AttendanceStatus.PRESENT, icon: Smile, label: 'P', color: 'text-emerald-600', active: 'bg-emerald-50 border-emerald-500' },
                    { id: AttendanceStatus.ABSENT, icon: Frown, label: 'F', color: 'text-rose-600', active: 'bg-rose-50 border-rose-500' },
                    { id: AttendanceStatus.JUSTIFIED, icon: Heart, label: 'J', color: 'text-amber-600', active: 'bg-amber-50 border-amber-500' },
                  ].map(status => (
                    <button key={status.id} disabled={isLockedByRecord || !isWithinTenure} onClick={() => handleStatusChange(aluno.id, status.id)} className={`flex-1 sm:w-16 py-3.5 md:py-5 rounded-xl md:rounded-3xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all ${attendance[aluno.id] === status.id ? `${status.active} ${status.color} font-black` : 'bg-white border-slate-50 text-slate-200 opacity-60'}`}>
                      <status.icon size={22} className="md:w-6 md:h-6" />
                      <span className="text-[8px] font-black">{status.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {expandedNotes[aluno.id] && (
                <div className="px-4 md:px-8 pb-4 md:pb-8 pt-2">
                  <textarea disabled={isLockedByRecord || !isWithinTenure} value={notes[aluno.id] || ''} onChange={(e) => setNotes(prev => ({...prev, [aluno.id]: e.target.value}))} className="w-full h-24 p-4 bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-[2rem] text-xs font-bold text-slate-600 outline-none" placeholder="Observações..." />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceScreen;
