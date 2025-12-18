
export enum AttendanceStatus {
  PRESENT = 'P',
  ABSENT = 'F',
  JUSTIFIED = 'J'
}

export type UserRole = 'PROFESSOR' | 'SECRETARIO';

export interface Professor {
  id: string;
  matricula: string;
  nome: string;
  email?: string;
  whatsapp?: string;
}

export interface ProfessorVinculo {
  professorId: string;
  ativo: boolean;
  dataInicio: string;
  dataFim: string;
}

export interface Secretario {
  id: string;
  nome: string;
  email: string;
}

export interface Turma {
  id: string;
  nome: string;
  periodo: 'Manhã' | 'Tarde' | 'Integral';
  professorId: string; // Professor principal (legado/principal)
  vinculos?: ProfessorVinculo[];
}

export interface Aluno {
  id: string;
  nome: string;
  turmaId: string;
  responsavel: string;
  fotoUrl: string;
}

export interface Frequencia {
  data: string; // YYYY-MM-DD
  alunoId: string;
  status: AttendanceStatus;
  observacao: string;
}

export interface AuthState {
  user: Professor | Secretario | null;
  role: UserRole | null;
}
