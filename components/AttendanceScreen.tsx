
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, CheckCircle2, XCircle, AlertCircle, 
  MessageSquare, Sparkles, Calendar as CalendarIcon, ChevronDown, ChevronUp
} from 'lucide-react';
import { turmas, alunos } from '../mockData';
import { storageService } from '../services/storageService';
import { Aluno, AttendanceStatus, Frequencia } from '../types';
import Layout from './Layout';
import { GoogleGenAI } from "@google/genai";

const AttendanceScreen: React.FC = () => {
  const { turmaId } = useParams<{ turmaId: string }>();
  const navigate = useNavigate();
  const [currentTurma] = useState(turmas.find(t => t.id === turmaId));
  const [turmaAlunos, setTurmaAlunos] = useState<Aluno[]>([]);
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  
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

    const matchedAlunos = alunos.filter(a => a.turmaId === turmaId);
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
      alert(`Frequência de ${new Date(selectedDate).toLocaleDateString()} salva!`);
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
          systemInstruction: "Você é uma professora gentil. Seja breve e profissional.",
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
        {/* Header com Seletor de Data */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{currentTurma.nome}</h2>
              <div className="flex items-center gap-2 mt-1">
                <CalendarIcon size={14} className="text-indigo-500" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-sm font-bold text-slate-600 outline-none bg-transparent cursor-pointer hover:text-indigo-600"
                />
              </div>
            </div>
          </div>
          
          <button onClick={saveAll} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50">
            {isSaving ? 'Gravando...' : <><Save size={20} /> Salvar Frequência</>}
          </button>
        </div>

        {/* Lista de Alunos Simplificada */}
        <div className="space-y-3">
          {turmaAlunos.map(aluno => (
            <div key={aluno.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 flex flex-col sm:flex-row items-center gap-4">
                {/* Info Aluno */}
                <div className="flex items-center gap-3 flex-1 w-full">
                  <img src={aluno.fotoUrl} alt={aluno.nome} className="w-12 h-12 rounded-full object-cover border-2 border-slate-50" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 truncate">{aluno.nome}</h4>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">{aluno.responsavel}</p>
                  </div>
                  
                  {/* Botão de Observação */}
                  <button 
                    onClick={() => toggleNote(aluno.id)}
                    className={`p-2 rounded-xl transition-all ${notes[aluno.id] ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    title="Adicionar Observação"
                  >
                    <MessageSquare size={18} />
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
                      className={`flex-1 sm:flex-none sm:w-24 py-2 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                        attendance[aluno.id] === status.id 
                          ? `bg-${status.color}-50 border-${status.color}-500 text-${status.color}-600 font-bold` 
                          : 'bg-white border-slate-100 text-slate-300'
                      }`}
                    >
                      <status.icon size={16} />
                      <span className="text-xs uppercase">{status.full}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Área de Observação Expansível */}
              {expandedNotes[aluno.id] && (
                <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anotações do Professor</span>
                    <button 
                      onClick={() => generateAiObservation(aluno)}
                      disabled={isAiLoading === aluno.id}
                      className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg flex items-center gap-1 font-bold hover:bg-indigo-200 transition-colors"
                    >
                      {isAiLoading === aluno.id ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full"></div> : <Sparkles size={10} />}
                      Sugerir com IA
                    </button>
                  </div>
                  <textarea 
                    value={notes[aluno.id] || ''}
                    onChange={(e) => setNotes(prev => ({...prev, [aluno.id]: e.target.value}))}
                    placeholder="Escreva algo sobre o aluno hoje..."
                    className="w-full h-20 p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner"
                  />
                  <button 
                    onClick={() => toggleNote(aluno.id)}
                    className="w-full mt-2 py-1 text-[10px] text-slate-400 font-bold uppercase hover:text-slate-600 transition-colors"
                  >
                    Fechar Observação
                  </button>
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
