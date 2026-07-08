import React from 'react';
import { SubjectId, SUBJECT_COLORS } from '../types';

interface RadialProgressProps {
  percentage: number;
  label: string;
  subLabel?: string;
  size?: number;
  strokeWidth?: number;
  subject?: SubjectId | 'global';
}

export const RadialProgress: React.FC<RadialProgressProps> = ({
  percentage,
  label,
  subLabel,
  size = 120,
  strokeWidth = 10,
  subject = 'global',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let colorClass = 'text-white';
  if (subject !== 'global') {
    colorClass = SUBJECT_COLORS[subject as SubjectId].text;
  }
  
  const isGlobal = subject === 'global';
  const glowFilterId = `glow-${subject}`;

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <defs>
          <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          className="stroke-gray-200 dark:stroke-gray-800"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${isGlobal ? 'text-indigo-600 dark:text-indigo-500' : colorClass}`}
          style={percentage > 0 ? { filter: `url(#${glowFilterId})` } : {}}
        />
      </svg>
      
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold tracking-tighter text-gray-900 dark:text-white">
          {Math.round(percentage)}%
        </span>
        {label && <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-0.5">{label}</span>}
      </div>
    </div>
  );
};
