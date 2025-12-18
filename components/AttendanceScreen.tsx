
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Sun, CloudRain, Heart, 
  MessageSquare, Sparkles, Calendar as CalendarIcon, History,
  Edit2, X, AlertTriangle, RotateCcw, CheckCircle2, Lock
} from 'lucide-react';
import { turmas, alunos, professores } from '../mockData';
import { storageService } from '../services/storageService';
import { Aluno, AttendanceStatus, Frequencia, Turma, Professor } from '../types';
import Layout from './Layout';
import { GoogleGenAI } from "@google/genai";

const AttendanceScreen: React.FC = () => {
  const { turmaId } = useParams<{ turmaId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(initialDate);
  
  const [currentTurma] = useState(storageService.getTurmas(turmas).find(t => t.id === turmaId));
  const [turmaAlunos, setTurmaAlunos] = useState<Aluno[]>([]);
  
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  
  const [originalAttendance, setOriginalAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [originalNotes, setOriginalNotes] = useState<Record<string, string>>({});

  const [isLockedByRecord, setIsLockedByRecord] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null);

  // Lógica de Período de Posse
  const isWithinTenure = useMemo(() => {
    const { userId } = storageService.getSession();
    if (!currentTurma || !userId) return false;
    
    // Procura o vínculo do professor logado nesta turma
    const vinculo = (currentTurma.vinculos || []).find(v => v.professorId === userId);
    if (!vinculo) return false; // Se não tem vínculo, não pode editar nada

    // Verifica se a data selecionada está dentro do período do vínculo
    return selectedDate >= vinculo.dataInicio && selectedDate <= vinculo.dataFim && vinculo.ativo;
  }, [currentTurma, selectedDate]);

  const loadData = useCallback(() => {
    if (!turmaId) return;

    const matchedAlunos = storageService.getAlunos(alunos).filter(a => a.turmaId === turmaId);
    setTurmaAlunos(matchedAlunos);

    const initialAttendance: Record<string, AttendanceStatus> = {};
    const initialNotes: Record<string, string> = {};
    
    const existing = storageService.getFrequencia(selectedDate, turmaId);
    
    matchedAlunos.forEach(aluno => {
      const record = existing.find(r => r.alunoId === aluno.id);
      initialAttendance[aluno.id] = record?.status || AttendanceStatus.PRESENT;
      initialNotes[aluno.id] = record?.observacao || '';
    });

    setAttendance(initialAttendance);
    setNotes(initialNotes);
    setOriginalAttendance({...initialAttendance});
    setOriginalNotes({...initialNotes});
    
    setIsLockedByRecord(existing.length > 0);
  }, [turmaId, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = (alunoId: string, status: AttendanceStatus) => {
    if (isLockedByRecord || !isWithinTenure) return;
    setAttendance(prev => ({ ...prev, [alunoId]: status }));
    if (status === AttendanceStatus.JUSTIFIED) {
      setExpandedNotes(prev => ({ ...prev, [alunoId]: true }));
    }
  };

  const handleCancelEdit = () => {
    setAttendance({...originalAttendance});
    setNotes({...originalNotes});
    setIsLockedByRecord(true);
    setExpandedNotes({});
  };

  const validateAndSave = () => {
    if (!isWithinTenure) {
        alert("Você não possui permissão para registrar frequência nesta data (fora do seu período de posse).");
        return;
    }

    const missingJustification = turmaAlunos.find(a => 
      attendance[a.id] === AttendanceStatus.JUSTIFIED && !notes[a.id]?.trim()
    );

    if (missingJustification) {
      alert(`Ops! Precisamos saber o motivo da falta justificade de ${missingJustification.nome}.`);
      setExpandedNotes(prev => ({ ...prev, [missingJustification.id]: true }));
      return;
    }

    setShowConfirmModal(true);
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
      setOriginalAttendance({...attendance});
      setOriginalNotes({...notes});
    }, 600);
  };

  const generateAiObservation = async (aluno: Aluno) => {
    if (!process.env.API_KEY || !isWithinTenure || isLockedByRecord) return;
    setIsAiLoading(aluno.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const statusLabel = attendance[aluno.id] === AttendanceStatus.PRESENT ? 'Presente' : 
                          attendance[aluno.id] === AttendanceStatus.ABSENT ? 'Faltou' : 'Justificou';
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere uma observação pedagógica curta e gentil para ${aluno.nome} que está com status "${statusLabel}" hoje.`,
        config: {
          systemInstruction: "Você é uma professora gentil de Maternal no CMEI Clara Camarão.",
          temperature: 0.7
        }
      });
      if (response.text) setNotes(prev => ({ ...prev, [aluno.id]: response.text.trim() }));
    } catch (err) { console.error(err); } finally { setIsAiLoading(null); }
  };

  if (!currentTurma) return null;

  return (
    <Layout>
      <div className="space-y-6 pb-24 md:pb-8">
        {!isWithinTenure && (
            <div className="bg-rose-50 border border-rose-200 p-6 rounded-[2.5rem] flex items-center gap-4 text-rose-700 font-bold animate-pulse">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-500"><Lock size={24} /></div>
                <p>Atenção: A data selecionada está fora do seu período de posse vinculado a esta turma. Edição bloqueada.</p>
            </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all text-slate-400 active:scale-90">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">{currentTurma.nome}</h2>
                {isLockedByRecord && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full border border-emerald-100 flex items-center gap-1">
                    <History size={10} /> Registro Gravado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="p-1 bg-blue-50 text-blue-500 rounded-md"><CalendarIcon size={12} /></div>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    navigate(`/chamada/${turmaId}?date=${e.target.value}`);
                  }}
                  className="text-xs font-black text-slate-400 outline-none bg-transparent cursor-pointer hover:text-indigo-600 uppercase tracking-widest"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isWithinTenure && (
                isLockedByRecord ? (
                    <button 
                      onClick={() => setIsLockedByRecord(false)}
                      className="bg-white border-2 border-indigo-600 text-indigo-600 font-black uppercase text-[10px] tracking-widest py-4.5 px-10 rounded-3xl flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
                    >
                      <Edit2 size={16} /> Reabrir Edição
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={handleCancelEdit}
                        className="bg-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest py-4.5 px-8 rounded-3xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                      >
                        <RotateCcw size={16} /> Descartar
                      </button>
                      <button 
                        onClick={validateAndSave} 
                        disabled={isSaving} 
                        className="sky-gradient hover:opacity-90 text-white font-black uppercase text-[10px] tracking-widest py-4.5 px-10 rounded-3xl flex items-center justify-center gap-2 shadow-xl shadow-blue-100 transition-all active:scale-95"
                      >
                        <Save size={18} /> Salvar Chamada
                      </button>
                    </>
                )
            )}
          </div>
        </div>

        <div className="space-y-4">
          {turmaAlunos.map((aluno, idx) => (
            <div key={aluno.id} className={`bg-white rounded-[3rem] border transition-all ${isLockedByRecord || !isWithinTenure ? 'opacity-90 border-slate-100 bg-slate-50/20' : 'hover:border-indigo-100 border-slate-200 shadow-sm'}`}>
              <div className="p-6 flex flex-col sm:flex-row items-center gap-5">
                <div className="flex items-center gap-5 flex-1 w-full">
                  <div className="relative">
                    <img src={aluno.fotoUrl || 'https://via.placeholder.com/100'} alt={aluno.nome} className="w-16 h-16 rounded-3xl object-cover border-4 border-white shadow-xl" />
                    <span className="absolute -top-2 -left-2 w-8 h-8 sun-gradient text-white rounded-2xl flex items-center justify-center text-xs font-black border-2 border-white shadow-md">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-800 truncate text-xl tracking-tight leading-tight uppercase">{aluno.nome}</h4>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">Responsável: {aluno.responsavel}</p>
                  </div>
                  
                  <button 
                    onClick={() => setExpandedNotes(prev => ({ ...prev, [aluno.id]: !prev[aluno.id] }))}
                    className={`p-4 rounded-2xl transition-all ${notes[aluno.id] ? 'sky-gradient text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}
                  >
                    <MessageSquare size={22} />
                  </button>
                </div>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  {[
                    { id: AttendanceStatus.PRESENT, icon: Sun, label: 'Presente', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500' },
                    { id: AttendanceStatus.ABSENT, icon: CloudRain, label: 'Faltou', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-500' },
                    { id: AttendanceStatus.JUSTIFIED, icon: Heart, label: 'Justif.', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-500' },
                  ].map(status => (
                    <button
                      key={status.id}
                      disabled={isLockedByRecord || !isWithinTenure}
                      onClick={() => handleStatusChange(aluno.id, status.id)}
                      className={`flex-1 sm:flex-none sm:w-28 py-5 rounded-3xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                        attendance[aluno.id] === status.id 
                          ? `${status.bg} ${status.border} ${status.text} font-black shadow-inner` 
                          : 'bg-white border-slate-50 text-slate-300 opacity-30'
                      } ${(isLockedByRecord || !isWithinTenure) ? 'cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                    >
                      <status.icon size={26} strokeWidth={attendance[aluno.id] === status.id ? 3 : 2} />
                      <span className="text-[9px] uppercase font-black tracking-widest">{status.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {expandedNotes[aluno.id] && (
                <div className="px-8 pb-8 bg-slate-50/50 border-t border-slate-100/50 pt-6 animate-in slide-in-from-top-2 duration-300 rounded-b-[3rem]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      {attendance[aluno.id] === AttendanceStatus.JUSTIFIED ? '✨ JUSTIFICATIVA OBRIGATÓRIA' : '📝 NOTAS PEDAGÓGICAS'}
                    </span>
                    {isWithinTenure && !isLockedByRecord && (
                      <button 
                        onClick={() => generateAiObservation(aluno)}
                        disabled={isAiLoading === aluno.id}
                        className="text-[10px] bg-white text-indigo-600 px-5 py-2.5 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest hover:bg-indigo-50 transition-all border border-indigo-100 shadow-sm active:scale-95"
                      >
                        {isAiLoading === aluno.id ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full"></div> : <Sparkles size={14} />}
                        Sugerir IA
                      </button>
                    )}
                  </div>
                  <textarea 
                    disabled={isLockedByRecord || !isWithinTenure}
                    value={notes[aluno.id] || ''}
                    onChange={(e) => setNotes(prev => ({...prev, [aluno.id]: e.target.value}))}
                    placeholder={attendance[aluno.id] === AttendanceStatus.JUSTIFIED ? "Relate o motivo aqui..." : "Descreva o desenvolvimento do aluno hoje..."}
                    className={`w-full h-32 p-6 bg-white border-2 rounded-[2rem] text-sm outline-none transition-all resize-none shadow-inner font-medium ${
                      attendance[aluno.id] === AttendanceStatus.JUSTIFIED && !notes[aluno.id] ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-100 focus:border-indigo-300'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white w-full max-sm rounded-[4rem] p-12 shadow-2xl border border-white text-center modal-animate-in">
              <div className="w-24 h-24 sky-gradient text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-100">
                <CheckCircle2 size={48} strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Tudo pronto?</h3>
              <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Os registros de frequência para o dia <b>{new Date(selectedDate).toLocaleDateString('pt-BR')}</b> serão atualizados.</p>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={confirmSave}
                  className="w-full sky-gradient text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all shadow-xl shadow-blue-100 active:scale-95"
                >
                  Sim, Salvar Registro
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full bg-slate-50 text-slate-400 py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                >
                  Voltar e Revisar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`.py-4\\.5 { padding-top: 1.125rem; padding-bottom: 1.125rem; }`}</style>
    </Layout>
  );
};

export default AttendanceScreen;
