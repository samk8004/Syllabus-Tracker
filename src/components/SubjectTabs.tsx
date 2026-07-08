import React from 'react';
import { SubjectId, SUBJECT_COLORS } from '../types';
import { motion } from 'motion/react';

interface SubjectTabsProps {
  activeSubject: SubjectId;
  onSubjectChange: (subject: SubjectId) => void;
  progress: Record<SubjectId, number>;
}

export const SubjectTabs: React.FC<SubjectTabsProps> = ({
  activeSubject,
  onSubjectChange,
  progress,
}) => {
  const subjects: { id: SubjectId; label: string }[] = [
    { id: 'physics', label: 'Physics' },
    { id: 'chemistry', label: 'Chemistry' },
    { id: 'math', label: 'Maths' },
    { id: 'english', label: 'English' },
    { id: 'pe', label: 'Physical Ed' },
  ];

  return (
    <div className="grid grid-cols-6 md:flex w-full gap-2 md:gap-6 bg-white dark:bg-[#1a1a1a] p-2 rounded-2xl border border-gray-200 dark:border-gray-800/50 shadow-sm transition-colors duration-300">
      {subjects.map((sub, index) => {
        const isActive = activeSubject === sub.id;
        const colors = SUBJECT_COLORS[sub.id];
        
        const colClass = index < 3 ? 'col-span-2 md:col-span-1' : (index === 3 ? 'col-span-2 col-start-2 md:col-start-auto md:col-span-1' : 'col-span-2 md:col-span-1');
        
        return (
          <button
            key={sub.id}
            onClick={() => onSubjectChange(sub.id)}
            className={`relative flex-col items-center py-2 px-1 md:py-3 md:px-4 rounded-xl transition-all duration-300 ${colClass} ${
              isActive 
                ? `${colors.bg} ${colors.glow} border border-transparent` 
                : 'bg-gray-50 dark:bg-[#222] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] border border-gray-100 dark:border-gray-800'
            } md:flex-1 md:min-w-[100px] flex`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className={`absolute inset-0 rounded-xl border ${colors.border}`}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            
            <span className={`relative z-10 text-sm md:text-base font-bold uppercase tracking-widest ${isActive ? colors.text : 'text-gray-500 dark:text-gray-400'}`}>
              {sub.label}
            </span>
            
            <div className="relative z-10 w-full h-1.5 bg-gray-200 dark:bg-gray-900 rounded-full mt-3 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress[sub.id]}%` }}
                className={`h-full rounded-full ${isActive ? `bg-current ${colors.text}` : 'bg-gray-300 dark:bg-gray-600'}`}
                transition={{ duration: 0.8 }}
              />
            </div>
            <span className="relative z-10 mt-1 text-[10px] text-gray-500 font-mono">
              {Math.round(progress[sub.id])}%
            </span>
          </button>
        );
      })}
    </div>
  );
};
