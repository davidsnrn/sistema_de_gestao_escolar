
import { Professor, Turma, Aluno, Secretario } from './types';

export const secretarios: Secretario[] = [
  { id: 'S1', nome: 'Admin Escolar', email: 'secretaria@escola.com' }
];

export const professores: Professor[] = [
  { id: '1', matricula: '2210561', nome: 'Sheyla Charlyse Rodrigues de Oliveira', email: 'sheyla@escola.com', whatsapp: '11999998888' },
  { id: '2', matricula: '2024002', nome: 'Bia Oliveira', email: 'bia@escola.com', whatsapp: '11888887777' }
];

export const turmas: Turma[] = [
  { 
    id: 'T1', 
    nome: 'Maternal A', 
    periodo: 'Manhã', 
    professorId: '1',
    vinculos: [
      { professorId: '1', ativo: true, dataInicio: '2025-09-09', dataFim: '2026-02-20' }
    ]
  },
  { id: 'T2', nome: 'Maternal B', periodo: 'Tarde', professorId: '1' },
  { id: 'T3', nome: 'Berçário II', periodo: 'Manhã', professorId: '2' }
];

export const alunos: Aluno[] = [
  { id: 'A1', nome: 'Joãozinho Souza', turmaId: 'T1', responsavel: 'Maria Souza', telefoneResponsavel: '11911112222', fotoUrl: 'https://picsum.photos/seed/joao/100/100', nee: false },
  { id: 'A2', nome: 'Maria Eduarda', turmaId: 'T1', responsavel: 'Carlos Lima', telefoneResponsavel: '11922223333', fotoUrl: 'https://picsum.photos/seed/maria/100/100', nee: true },
  { id: 'A3', nome: 'Pedro Henrique', turmaId: 'T1', responsavel: 'Fernanda Rocha', telefoneResponsavel: '11933334444', fotoUrl: 'https://picsum.photos/seed/pedro/100/100', nee: false },
  { id: 'A4', nome: 'Alice Silva', turmaId: 'T2', responsavel: 'Juliana Silva', telefoneResponsavel: '11944445555', fotoUrl: 'https://picsum.photos/seed/alice/100/100', nee: false },
  { id: 'A5', nome: 'Lucas Gabriel', turmaId: 'T2', responsavel: 'Roberto Luz', telefoneResponsavel: '11955556666', fotoUrl: 'https://picsum.photos/seed/lucas/100/100', nee: false },
  { id: 'A6', nome: 'Beatriz Martins', turmaId: 'T3', responsavel: 'Sandra Martins', telefoneResponsavel: '11966667777', fotoUrl: 'https://picsum.photos/seed/beatriz/100/100', nee: true }
];
