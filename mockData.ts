
import { Professor, Turma, Aluno, Secretario } from './types';

export const secretarios: Secretario[] = [
  { id: 'S1', nome: 'Admin Escolar', email: 'secretaria@escola.com' }
];

export const professores: Professor[] = [
  { id: '1', nome: 'Ana Silva', email: 'ana@escola.com' },
  { id: '2', nome: 'Bia Oliveira', email: 'bia@escola.com' }
];

export const turmas: Turma[] = [
  { id: 'T1', nome: 'Maternal A', periodo: 'Manhã', professorId: '1' },
  { id: 'T2', nome: 'Maternal B', periodo: 'Tarde', professorId: '1' },
  { id: 'T3', nome: 'Berçário II', periodo: 'Manhã', professorId: '2' }
];

export const alunos: Aluno[] = [
  { id: 'A1', nome: 'Joãozinho Souza', turmaId: 'T1', responsavel: 'Maria Souza', fotoUrl: 'https://picsum.photos/seed/joao/100/100' },
  { id: 'A2', nome: 'Maria Eduarda', turmaId: 'T1', responsavel: 'Carlos Lima', fotoUrl: 'https://picsum.photos/seed/maria/100/100' },
  { id: 'A3', nome: 'Pedro Henrique', turmaId: 'T1', responsavel: 'Fernanda Rocha', fotoUrl: 'https://picsum.photos/seed/pedro/100/100' },
  { id: 'A4', nome: 'Alice Silva', turmaId: 'T2', responsavel: 'Juliana Silva', fotoUrl: 'https://picsum.photos/seed/alice/100/100' },
  { id: 'A5', nome: 'Lucas Gabriel', turmaId: 'T2', responsavel: 'Roberto Luz', fotoUrl: 'https://picsum.photos/seed/lucas/100/100' },
  { id: 'A6', nome: 'Beatriz Martins', turmaId: 'T3', responsavel: 'Sandra Martins', fotoUrl: 'https://picsum.photos/seed/beatriz/100/100' }
];
