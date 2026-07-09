import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chapter, TaskId, TASKS, SubjectId, SUBJECT_COLORS } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ChapterCardProps {
  chapter: Chapter;
  subject: SubjectId;
  onToggleTask: (chapterId: string, taskId: TaskId) => void;
  onToggleRevision: (chapterId: string, index: number) => void;
  onToggleReattempt: (chapterId: string, index: number) => void;
  index: number;
  isEditMode: boolean;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  subject,
  onToggleTask,
  onToggleRevision,
  onToggleReattempt,
  index,
  isEditMode
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = SUBJECT_COLORS[subject];
  
  const tasksToShow = TASKS.filter(t => {
    if (subject === 'english') {
      const isCreative = chapter.id.startsWith('eng-') && parseInt(chapter.id.split('-')[1]) >= 20;
      if (isCreative) {
        const allowed = ['lectures', 'notes', 'dpps', 'revision', 'qcb', 'pyqs', 'reattempt_imp_q'];
        return allowed.includes(t.id);
      } else {
        if (t.id === 'ncert_exam' || t.id === 'ncert_exer' || t.id === 'ncert_exen' || t.id === 'short_notes') {
          return false;
        }
      }
    } else if (subject === 'pe') {
      if (t.id === 'ncert_exam' || t.id === 'ncert_exer' || t.id === 'ncert_exen' || t.id === 'short_notes' || t.id === 'reattempt_imp_q') {
        return false;
      }
    }
    return true;
  });

  const totalTasks = tasksToShow.length;
  let completedTasks = 0;
  tasksToShow.forEach(t => {
    if (t.id === 'revision') {
      const revs = chapter.revisions || [false, false, false, false, false, false, false];
      completedTasks += Math.min(3, revs.filter(Boolean).length) / 3;
    } else if (t.id === 'reattempt_imp_q') {
      const reattempts = chapter.reattempts || [false, false];
      completedTasks += Math.min(2, reattempts.filter(Boolean).length) / 2;
    } else {
      completedTasks += (chapter.tasks[t.id] ? 1 : 0);
    }
  });
  const progressPercentage = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;
  const isFullyCompleted = totalTasks > 0 && progressPercentage === 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`rounded-2xl border transition-all duration-300 ${
        isFullyCompleted 
          ? `bg-gray-50 dark:bg-[#161b22] border-gray-300 dark:border-gray-700/50` 
          : `bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-800`
      }`}
    >
      <div 
        className="p-4 md:p-5 flex items-center justify-between cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-gray-500 font-mono text-sm font-semibold">{String(index + 1).padStart(2, '0')}</span>
            <h3 className={`text-base md:text-lg font-semibold transition-colors ${isFullyCompleted ? 'text-gray-500 dark:text-gray-300' : 'text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200'}`}>
              {chapter.name}
            </h3>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                className={`h-full rounded-full ${
                  isFullyCompleted ? `bg-current ${colors.text} ${colors.glow}` : 'bg-gray-400 dark:bg-gray-500'
                }`}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex flex-col items-end w-12 shrink-0">
              <span className={`text-xs font-bold ${isFullyCompleted ? colors.text : 'text-gray-600 dark:text-gray-300'}`}>
                {Math.round(progressPercentage)}%
              </span>
              <span className="text-[10px] font-mono text-gray-500">
                {Math.round(completedTasks * 10) / 10}/{totalTasks}
              </span>
            </div>
          </div>
        </div>
        
        <button className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-[#2a2a2a] transition-colors ${isExpanded ? colors.text : ''}`}>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-gray-200 dark:border-gray-800/50"
          >
            <div className="p-4 md:p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 bg-gray-50 dark:bg-[#111] rounded-b-2xl">
              {tasksToShow.map((task) => {
                if (task.id === 'revision') {
                  const revs = chapter.revisions || [false, false, false, false, false, false, false];
                  const completedRevs = revs.filter(Boolean).length;
                  const isDone = completedRevs >= 3;
                  
                  return (
                    <div key={task.id} className={`col-span-2 lg:col-span-2 relative overflow-hidden flex flex-col justify-center py-2 px-3 rounded-xl border transition-all duration-200 ${
                      isDone ? `${colors.bg} ${colors.border} ${colors.glow}` : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-800'
                    }`}>
                      <div className="flex items-center justify-between mb-1.5 relative z-10">
                        <span className={`text-xs font-medium tracking-wide ${isDone ? colors.text : 'text-gray-500 dark:text-gray-400'}`}>
                          Revision
                        </span>
                        <span className={`text-[10px] font-mono ${isDone ? colors.text : 'text-gray-500'}`}>
                          {completedRevs}/7
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 relative z-10">
                        {revs.map((r, i) => (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (r && !isEditMode) return;
                              onToggleRevision(chapter.id, i);
                            }}
                            className={`flex-1 h-6 flex items-center justify-center rounded-[4px] text-[9px] md:text-[10px] font-bold transition-all ${
                              r 
                                ? `bg-current ${colors.text} text-white dark:text-[#111] border-transparent shadow-[0_0_8px_currentColor]`
                                : 'bg-gray-100 dark:bg-[#222] text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            R{i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (task.id === 'reattempt_imp_q') {
                  const reattempts = chapter.reattempts || [false, false];
                  const completedReattempts = reattempts.filter(Boolean).length;
                  const isDone = completedReattempts >= 2;
                  
                  return (
                    <div key={task.id} className={`col-span-2 lg:col-span-2 relative overflow-hidden flex flex-col justify-center py-2 px-3 rounded-xl border transition-all duration-200 ${
                      isDone ? `${colors.bg} ${colors.border} ${colors.glow}` : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-800'
                    }`}>
                      <div className="flex items-center justify-between mb-1.5 relative z-10">
                        <span className={`text-xs font-medium tracking-wide ${isDone ? colors.text : 'text-gray-500 dark:text-gray-400'}`}>
                          Reattempt Imp. Q
                        </span>
                        <span className={`text-[10px] font-mono ${isDone ? colors.text : 'text-gray-500'}`}>
                          {completedReattempts}/2
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 relative z-10">
                        {reattempts.map((r, i) => (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (r && !isEditMode) return;
                              onToggleReattempt(chapter.id, i);
                            }}
                            className={`flex-1 h-6 flex items-center justify-center rounded-[4px] text-[9px] md:text-[10px] font-bold transition-all ${
                              r 
                                ? `bg-current ${colors.text} text-white dark:text-[#111] border-transparent shadow-[0_0_8px_currentColor]`
                                : 'bg-gray-100 dark:bg-[#222] text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                const isDone = chapter.tasks[task.id];
                return (
                  <button
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDone && !isEditMode) return;
                      onToggleTask(chapter.id, task.id);
                    }}
                    className={`relative overflow-hidden group py-2.5 px-3 rounded-xl border transition-all duration-200 ${
                      isDone 
                        ? `${colors.bg} ${colors.border} ${colors.glow}` 
                        : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <span className={`text-xs font-medium tracking-wide ${isDone ? colors.text : 'text-gray-500 dark:text-gray-400'}`}>
                        {task.label}
                      </span>
                      <div className={`w-3 h-3 rounded-full border transition-all ${
                        isDone 
                          ? `bg-current ${colors.text} border-transparent` 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isDone && (
                          <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }} 
                            className="w-full h-full flex items-center justify-center text-white dark:text-black"
                          >
                            <svg viewBox="0 0 12 12" fill="none" className="w-2 h-2">
                              <path d="M3.5 6.5L5 8L8.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
