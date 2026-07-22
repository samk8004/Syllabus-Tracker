export type SubjectId = 'physics' | 'chemistry' | 'math' | 'english' | 'pe';

export type TaskId =
  | 'lectures'
  | 'notes'
  | 'short_notes'
  | 'dpps'
  | 'ncert_read'
  | 'ncert_exam'
  | 'ncert_exer'
  | 'ncert_exen'
  | 'revision'
  | 'reattempt_imp_q'
  | 'qcb'
  | 'pyqs';

export interface TaskDef {
  id: TaskId;
  label: string;
}

export interface Chapter {
  id: string;
  name: string;
  tasks: Record<TaskId, boolean>;
  revisions?: boolean[];
  reattempts?: boolean[];
}

export interface TrackerState {
  physics: Chapter[];
  chemistry: Chapter[];
  math: Chapter[];
  english: Chapter[];
  pe: Chapter[];
}

export const TASKS: TaskDef[] = [
  { id: 'lectures', label: 'Lectures' },
  { id: 'notes', label: 'Notes' },
  { id: 'short_notes', label: 'Short Notes' },
  { id: 'dpps', label: "DPP's" },
  { id: 'ncert_read', label: 'NCERT Read' },
  { id: 'ncert_exam', label: 'NCERT Examples' },
  { id: 'ncert_exer', label: 'NCERT Exercises' },
  { id: 'ncert_exen', label: 'NCERT Exemplar' },
  { id: 'revision', label: 'Revision' },
  { id: 'reattempt_imp_q', label: 'Reattempt Imp. Questions' },
  { id: 'qcb', label: 'QCB' },
  { id: 'pyqs', label: "PYQ's" },
];

export const SUBJECT_COLORS: Record<SubjectId, { text: string; bg: string; border: string; glow: string; shadow: string }> = {
  physics: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-500/20',
    border: 'border-blue-500',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:shadow-[0_0_15px_rgba(59,130,246,0.6)]',
    shadow: 'shadow-blue-500/30 dark:shadow-blue-500/50'
  },
  chemistry: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/20',
    border: 'border-emerald-500',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)] dark:shadow-[0_0_15px_rgba(16,185,129,0.6)]',
    shadow: 'shadow-emerald-500/30 dark:shadow-emerald-500/50'
  },
  math: {
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-500/20',
    border: 'border-purple-500',
    glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)] dark:shadow-[0_0_15px_rgba(168,85,247,0.6)]',
    shadow: 'shadow-purple-500/30 dark:shadow-purple-500/50'
  },
  english: {
    text: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-500/20',
    border: 'border-yellow-500',
    glow: 'shadow-[0_0_15px_rgba(234,179,8,0.4)] dark:shadow-[0_0_15px_rgba(234,179,8,0.6)]',
    shadow: 'shadow-yellow-500/30 dark:shadow-yellow-500/50'
  },
  pe: {
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-500/20',
    border: 'border-orange-500',
    glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)] dark:shadow-[0_0_15px_rgba(249,115,22,0.6)]',
    shadow: 'shadow-orange-500/30 dark:shadow-orange-500/50'
  }
};
