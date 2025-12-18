
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Sun, CloudRain, Heart, 
  MessageSquare, Sparkles, Calendar as CalendarIcon, History,
  Edit2, X, AlertTriangle, RotateCcw
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
  
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(initialDate);
  
  const [currentTurma] = useState(turmas.find(t => t.id === turmaId));
  const [turmaAlunos, setTurmaAlunos] = useState<Aluno[]>([]);
  
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  
  const [originalAttendance, setOriginalAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [originalNotes, setOriginalNotes] = useState<Record<string, string>>({});

  const [isLocked, setIsLocked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null);

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
    
    setIsLocked(existing.length > 0);
  }, [turmaId, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmModal) {
          setShowConfirmModal(false);
        } else if (!isLocked && Object.keys(originalAttendance).length > 0) {
          handleCancelEdit();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showConfirmModal, isLocked, originalAttendance]);

  const handleStatusChange = (alunoId: string, status: AttendanceStatus) => {
    if (isLocked) return;
    setAttendance(prev => ({ ...prev, [alunoId]: status }));
    if (status === AttendanceStatus.JUSTIFIED) {
      setExpandedNotes(prev => ({ ...prev, [alunoId]: true }));
    }
  };

  const handleCancelEdit = () => {
    setAttendance({...originalAttendance});
    setNotes({...originalNotes});
    setIsLocked(true);
    setExpandedNotes({});
  };

  const validateAndSave = () => {
    const missingJustification = turmaAlunos.find(a => 
      attendance[a.id] === AttendanceStatus.JUSTIFIED && !notes[a.id]?.trim()
    );

    if (missingJustification) {
      alert(`Ops! Precisamos saber o motivo da falta justificade de ${missingJustification.nome}. Por favor, escreva no campo de observação.`);
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
      setIsLocked(true);
      setOriginalAttendance({...attendance});
      setOriginalNotes({...notes});
      alert("Diário atualizado com sucesso! ❤️");
    }, 600);
  };

  const generateAiObservation = async (aluno: Aluno) => {
    if (!process.env.API_KEY || isLocked) return;

    setIsAiLoading(aluno.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const statusLabel = attendance[aluno.id] === AttendanceStatus.PRESENT ? 'Presente' : 
                          attendance[aluno.id] === AttendanceStatus.ABSENT ? 'Faltou' : 'Justificou';
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere uma observação curta e carinhosa de 1 frase para o diário escolar do aluno ${aluno.nome} que está com status "${statusLabel}" no dia ${selectedDate}.`,
        config: {
          systemInstruction: "Você é uma professora gentil de educação infantil (Maternal). Use tom acolhedor e profissional.",
          temperature: 0.7
        }
      });

      if (response.text) {
        setNotes(prev => ({ ...prev, [aluno.id]: response.text.trim() }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(null);
    }
  };

  if (!currentTurma) return null;

  return (
    <Layout>
      <div className="space-y-6 pb-24 md:pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors text-slate-600">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">{currentTurma.nome}</h2>
                {isLocked && (
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-full border border-indigo-100 flex items-center gap-1">
                    <History size={10} /> Diário Completo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <CalendarIcon size={14} className="text-indigo-500" />
                <input 
                  type="date" 
                  value={selectedDate}
                  disabled={!isLocked && Object.keys(originalAttendance).length > 0}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    navigate(`/chamada/${turmaId}?date=${e.target.value}`);
                  }}
                  className="text-xs font-black text-slate-500 outline-none bg-transparent cursor-pointer hover:text-indigo-600 uppercase tracking-widest disabled:opacity-50"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isLocked ? (
              <button 
                onClick={() => setIsLocked(false)}
                className="bg-white border-2 border-indigo-600 text-indigo-600 font-black uppercase text-xs tracking-widest py-4 px-8 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all active:scale-95"
              >
                <Edit2 size={18} /> Habilitar Edição
              </button>
            ) : (
              <>
                <button 
                  onClick={handleCancelEdit}
                  className="bg-slate-100 text-slate-500 font-black uppercase text-xs tracking-widest py-4 px-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                >
                  <RotateCcw size={18} /> Reverter (ESC)
                </button>
                <button 
                  onClick={validateAndSave} 
                  disabled={isSaving} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest py-4 px-8 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save size={20} /> Salvar Diário
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {turmaAlunos.map((aluno, idx) => (
            <div key={aluno.id} className={`bg-white rounded-[2rem] border shadow-sm overflow-hidden transition-all ${isLocked ? 'opacity-90 border-slate-100 bg-slate-50/20' : 'hover:border-indigo-100 border-slate-200'}`}>
              <div className="p-5 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="relative">
                    <img src={aluno.fotoUrl} alt={aluno.nome} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md" />
                    <span className="absolute -top-1 -left-1 w-7 h-7 bg-amber-400 text-white rounded-full flex items-center justify-center text-[11px] font-black border-2 border-white">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-800 truncate text-lg tracking-tight">{aluno.nome}</h4>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Resp: {aluno.responsavel}</p>
                  </div>
                  
                  <button 
                    onClick={() => setExpandedNotes(prev => ({ ...prev, [aluno.id]: !prev[aluno.id] }))}
                    className={`p-3.5 rounded-2xl transition-all shadow-sm ${notes[aluno.id] ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    <MessageSquare size={20} />
                  </button>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {[
                    { id: AttendanceStatus.PRESENT, icon: Sun, label: 'Presente', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500' },
                    { id: AttendanceStatus.ABSENT, icon: CloudRain, label: 'Faltou', color: 'rose', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-500' },
                    { id: AttendanceStatus.JUSTIFIED, icon: Heart, label: 'Justif.', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-500' },
                  ].map(status => (
                    <button
                      key={status.id}
                      disabled={isLocked}
                      onClick={() => handleStatusChange(aluno.id, status.id)}
                      className={`flex-1 sm:flex-none sm:w-28 py-4 rounded-[1.5rem] border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                        attendance[aluno.id] === status.id 
                          ? `${status.bg} ${status.border} ${status.text} font-black shadow-inner` 
                          : 'bg-white border-slate-50 text-slate-300 opacity-40'
                      } ${isLocked ? 'cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                    >
                      <status.icon size={26} className={attendance[aluno.id] === status.id ? 'animate-bounce-slow' : ''} />
                      <span className="text-[10px] uppercase font-black tracking-tighter">{status.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {expandedNotes[aluno.id] && (
                <div className="px-5 pb-5 bg-slate-50/50 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      {attendance[aluno.id] === AttendanceStatus.JUSTIFIED ? '✨ Motivo da Ausência (Obrigatório)' : '📝 Observação Pedagógica'}
                    </span>
                    {!isLocked && (
                      <button 
                        onClick={() => generateAiObservation(aluno)}
                        disabled={isAiLoading === aluno.id}
                        className="text-[10px] bg-white text-indigo-600 px-3 py-2 rounded-xl flex items-center gap-2 font-black uppercase tracking-widest hover:bg-indigo-50 transition-all border border-indigo-100 shadow-sm"
                      >
                        {isAiLoading === aluno.id ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full"></div> : <Sparkles size={12} />}
                        Sugerir com IA
                      </button>
                    )}
                  </div>
                  <textarea 
                    disabled={isLocked}
                    value={notes[aluno.id] || ''}
                    onChange={(e) => setNotes(prev => ({...prev, [aluno.id]: e.target.value}))}
                    placeholder={attendance[aluno.id] === AttendanceStatus.JUSTIFIED ? "Ex: Atestado médico, viagem familiar, etc..." : "Como foi o desenvolvimento hoje? Alimentação, sono, interação..."}
                    className={`w-full h-28 p-4 bg-white border rounded-2xl text-sm outline-none transition-all resize-none shadow-sm font-medium ${
                      attendance[aluno.id] === AttendanceStatus.JUSTIFIED && !notes[aluno.id] ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:border-indigo-300'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
              <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Salvar o Diário?</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Você está prestes a registrar a frequência de <b>{turmaAlunos.length} alunos</b> para o dia selecionado.</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmSave}
                  className="w-full bg-indigo-600 text-white py-4.5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                >
                  Sim, Confirmar!
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full bg-slate-50 text-slate-400 py-4.5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all"
                >
                  Vou revisar (ESC)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2.5s infinite ease-in-out;
        }
        .py-4\\.5 { padding-top: 1.125rem; padding-bottom: 1.125rem; }
      `}</style>
    </Layout>
  );
};

export default AttendanceScreen;
