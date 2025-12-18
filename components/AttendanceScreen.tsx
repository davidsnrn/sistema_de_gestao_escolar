
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, CheckCircle2, XCircle, AlertCircle, 
  MessageSquare, Sparkles, Calendar as CalendarIcon, ChevronDown, ChevronUp, History,
  Edit2
} from 'lucide-react';
import { turmas, alunos } from '../mockData';
import { storageService } from '../services/storageService';
import { Aluno, AttendanceStatus, Frequencia } from '../types';
import Layout from './Layout';
import { GoogleGenAI } from "@google/genai";

const AttendanceScreen: React.FC = () => {
  const { turmaId } = useParams<{ turmaId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(initialDate);
  
  const [currentTurma] = useState(turmas.find(t => t.id === turmaId));
  const [turmaAlunos, setTurmaAlunos] = useState<Aluno[]>([]);
  
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!turmaId) {
      navigate('/dashboard');
      return;
    }

    const matchedAlunos = storageService.getAlunos(alunos).filter(a => a.turmaId === turmaId);
    setTurmaAlunos(matchedAlunos);

    const initialAttendance: Record<string, AttendanceStatus> = {};
    const initialNotes: Record<string, string> = {};
    
    // Carrega frequências da data selecionada
    const existing = storageService.getFrequencia(selectedDate, turmaId);
    
    matchedAlunos.forEach(aluno => {
      const record = existing.find(r => r.alunoId === aluno.id);
      initialAttendance[aluno.id] = record?.status || AttendanceStatus.PRESENT;
      initialNotes[aluno.id] = record?.observacao || '';
    });

    setAttendance(initialAttendance);
    setNotes(initialNotes);
  }, [turmaId, navigate, selectedDate]);

  const handleStatusChange = (alunoId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [alunoId]: status }));
  };

  const toggleNote = (alunoId: string) => {
    setExpandedNotes(prev => ({ ...prev, [alunoId]: !prev[alunoId] }));
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setSearchParams({ date: newDate });
  };

  const saveAll = () => {
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
      alert(`Frequência de ${new Date(selectedDate).toLocaleDateString()} salva com sucesso!`);
      navigate('/dashboard');
    }, 600);
  };

  const generateAiObservation = async (aluno: Aluno) => {
    if (!process.env.API_KEY) {
      alert("IA não configurada");
      return;
    }

    setIsAiLoading(aluno.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const statusLabel = attendance[aluno.id] === AttendanceStatus.PRESENT ? 'Presente' : 
                          attendance[aluno.id] === AttendanceStatus.ABSENT ? 'Faltou' : 'Justificou';
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere uma observação curta de 1 frase para o diário escolar do aluno ${aluno.nome} que está com status "${statusLabel}" no dia ${selectedDate}.`,
        config: {
          systemInstruction: "Você é uma professora gentil de educação infantil. Seja breve, profissional e acolhedora.",
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

  const isEditing = storageService.getFrequencia(selectedDate, turmaId).length > 0;

  return (
    <Layout>
      <div className="space-y-6 pb-24 md:pb-8">
        {/* Header com Seletor de Data */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors text-slate-600">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">{currentTurma.nome}</h2>
                {isEditing && (
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-full border border-indigo-100 flex items-center gap-1">
                    <History size={10} /> Editando Registro
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <CalendarIcon size={14} className="text-indigo-500" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="text-xs font-black text-slate-500 outline-none bg-transparent cursor-pointer hover:text-indigo-600 uppercase tracking-widest"
                />
              </div>
            </div>
          </div>
          
          <button 
            onClick={saveAll} 
            disabled={isSaving} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest py-4 px-8 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? 'Gravando...' : <><Save size={20} /> {isEditing ? 'Atualizar' : 'Finalizar'} Chamada</>}
          </button>
        </div>

        {/* Lista de Alunos */}
        <div className="space-y-3">
          {turmaAlunos.map((aluno, idx) => (
            <div key={aluno.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:border-indigo-100 transition-colors">
              <div className="p-5 flex flex-col sm:flex-row items-center gap-4">
                {/* Info Aluno */}
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="relative">
                    <img src={aluno.fotoUrl} alt={aluno.nome} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md" />
                    <span className="absolute -top-1 -left-1 w-6 h-6 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-800 truncate text-lg tracking-tight">{aluno.nome}</h4>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Responsável: {aluno.responsavel}</p>
                  </div>
                  
                  {/* Botão de Observação */}
                  <button 
                    onClick={() => toggleNote(aluno.id)}
                    className={`p-3 rounded-2xl transition-all shadow-sm ${notes[aluno.id] ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    title="Adicionar Observação"
                  >
                    <MessageSquare size={20} />
                  </button>
                </div>

                {/* Status Toggles */}
                <div className="flex gap-2 w-full sm:w-auto">
                  {[
                    { id: AttendanceStatus.PRESENT, icon: CheckCircle2, label: 'P', color: 'emerald', full: 'Presente' },
                    { id: AttendanceStatus.ABSENT, icon: XCircle, label: 'F', color: 'rose', full: 'Faltou' },
                    { id: AttendanceStatus.JUSTIFIED, icon: AlertCircle, label: 'J', color: 'amber', full: 'Justif.' },
                  ].map(status => (
                    <button
                      key={status.id}
                      onClick={() => handleStatusChange(aluno.id, status.id)}
                      className={`flex-1 sm:flex-none sm:w-28 py-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                        attendance[aluno.id] === status.id 
                          ? `bg-${status.color}-50 border-${status.color}-500 text-${status.color}-600 font-black shadow-inner` 
                          : 'bg-white border-slate-50 text-slate-200 hover:border-slate-100'
                      }`}
                    >
                      <status.icon size={18} className={attendance[aluno.id] === status.id ? '' : 'opacity-30'} />
                      <span className="text-[10px] uppercase font-black tracking-tighter">{status.full}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Área de Observação Expansível */}
              {expandedNotes[aluno.id] && (
                <div className="px-5 pb-5 bg-slate-50 border-t border-slate-100 pt-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Edit2 size={12} /> Observações Pedagógicas
                    </span>
                    <button 
                      onClick={() => generateAiObservation(aluno)}
                      disabled={isAiLoading === aluno.id}
                      className="text-[10px] bg-white text-indigo-600 px-3 py-1.5 rounded-xl flex items-center gap-2 font-black uppercase tracking-widest hover:bg-indigo-50 transition-all border border-indigo-100 shadow-sm"
                    >
                      {isAiLoading === aluno.id ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full"></div> : <Sparkles size={12} />}
                      Sugerir com IA
                    </button>
                  </div>
                  <textarea 
                    value={notes[aluno.id] || ''}
                    onChange={(e) => setNotes(prev => ({...prev, [aluno.id]: e.target.value}))}
                    placeholder="Como foi o dia desta criança hoje? Cite comportamento, alimentação ou saúde..."
                    className="w-full h-24 p-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none shadow-sm font-medium"
                  />
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={() => toggleNote(aluno.id)}
                      className="px-4 py-1.5 text-[10px] text-slate-400 font-black uppercase hover:text-indigo-600 transition-colors"
                    >
                      Recolher Anotação
                    </button>
                  </div>
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
