
import { Frequencia, AttendanceStatus, Professor, Aluno, Turma, UserRole } from '../types';

const FREQUENCY_KEY = 'educafrequencia_data';
const PROFESSORS_KEY = 'educafrequencia_profs';
const STUDENTS_KEY = 'educafrequencia_students';
const TURMAS_KEY = 'educafrequencia_turmas';

export const storageService = {
  // Session
  getSession: () => {
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole') as UserRole | null;
    return { userId, role };
  },

  setSession: (id: string, role: UserRole) => {
    localStorage.setItem('userId', id);
    localStorage.setItem('userRole', role);
  },

  clearSession: () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
  },

  // Frequency
  getFrequencia: (date: string, turmaId?: string): Frequencia[] => {
    const data = localStorage.getItem(FREQUENCY_KEY);
    if (!data) return [];
    const allRecords: Frequencia[] = JSON.parse(data);
    // Nota: Se turmaId for passado, precisamos filtrar os alunos que pertencem a essa turma
    // Mas os registros de frequência já contém o alunoId. 
    // Para simplificar, retornamos todos daquela data e o componente filtra se necessário.
    return allRecords.filter(r => r.data === date);
  },

  getDatasComFrequencia: (turmaId: string, alunosDaTurmaIds: string[]): string[] => {
    const data = localStorage.getItem(FREQUENCY_KEY);
    if (!data) return [];
    const allRecords: Frequencia[] = JSON.parse(data);
    
    // Filtra registros que pertencem aos alunos desta turma
    const turmaRecords = allRecords.filter(r => alunosDaTurmaIds.includes(r.alunoId));
    
    // Retorna datas únicas ordenadas (mais recentes primeiro)
    const dates = Array.from(new Set(turmaRecords.map(r => r.data)));
    return dates.sort().reverse();
  },

  getFrequenciaPeriodo: (startDate: string, endDate: string): Frequencia[] => {
    const data = localStorage.getItem(FREQUENCY_KEY);
    if (!data) return [];
    const allRecords: Frequencia[] = JSON.parse(data);
    return allRecords.filter(r => r.data >= startDate && r.data <= endDate);
  },

  saveFrequencia: (records: Frequencia[]) => {
    const data = localStorage.getItem(FREQUENCY_KEY);
    let allRecords: Frequencia[] = data ? JSON.parse(data) : [];
    records.forEach(newRecord => {
      const index = allRecords.findIndex(r => r.data === newRecord.data && r.alunoId === newRecord.alunoId);
      if (index > -1) allRecords[index] = newRecord;
      else allRecords.push(newRecord);
    });
    localStorage.setItem(FREQUENCY_KEY, JSON.stringify(allRecords));
  },

  // Generic Data Handling
  getData: <T>(key: string, defaults: T[]): T[] => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaults;
  },

  saveData: <T>(key: string, data: T[]) => {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // Professors CRUD
  getProfessors: (defaults: Professor[]) => storageService.getData(PROFESSORS_KEY, defaults),
  saveProfessors: (profs: Professor[]) => storageService.saveData(PROFESSORS_KEY, profs),

  // Students CRUD
  getAlunos: (defaults: Aluno[]) => storageService.getData(STUDENTS_KEY, defaults),
  saveAlunos: (alunos: Aluno[]) => storageService.saveData(STUDENTS_KEY, alunos),

  // Turmas CRUD
  getTurmas: (defaults: Turma[]) => storageService.getData(TURMAS_KEY, defaults),
  saveTurmas: (turmas: Turma[]) => storageService.saveData(TURMAS_KEY, turmas)
};
