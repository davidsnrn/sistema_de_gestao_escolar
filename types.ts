
export enum AttendanceStatus {
  PRESENT = 'P',
  ABSENT = 'F',
  JUSTIFIED = 'J'
}

export type UserRole = 'PROFESSOR' | 'SECRETARIO';

export interface Professor {
  id: string;
  nome: string;
  email: string;
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
  professorId: string;
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
