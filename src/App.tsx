import React, { useState, useEffect, useRef } from 'react';
import { SubjectId, TaskId, TrackerState, TASKS } from './types';
import { INITIAL_STATE } from './data';
import { RadialProgress } from './components/RadialProgress';
import { SubjectTabs } from './components/SubjectTabs';
import { ChapterCard } from './components/ChapterCard';
import { Settings, RefreshCw, AlertTriangle, BookOpen, Edit2, CheckCircle2, Moon, Sun, Monitor, Download, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY = 'exam-prep-tracker-v2';

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, setState] = useState<TrackerState>(INITIAL_STATE);
  const [activeSubject, setActiveSubject] = useState<SubjectId>('physics');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const targetDate = new Date('2027-02-15T00:00:00');
    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      const days = Math.ceil(difference / (1000 * 3600 * 24));
      setDaysRemaining(days > 0 ? days : 0);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000 * 60 * 60); // Update every hour
    return () => clearInterval(interval);
  }, []);

  // Theme Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as any;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
        document.body.style.backgroundColor = '#121212';
      } else {
        root.classList.remove('dark');
        document.body.style.backgroundColor = '#f9fafb';
      }
    };

    applyTheme();

    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "syllabus_tracker_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedState = JSON.parse(event.target?.result as string);
          setState(importedState);
          setShowSettings(false);
          alert('Data imported successfully!');
        } catch (error) {
          alert('Invalid backup file. Please upload a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => {
          const merged = { ...prev };
          (Object.keys(merged) as SubjectId[]).forEach(subject => {
            if (parsed[subject]) {
              merged[subject] = merged[subject].map(chapter => {
                const savedChapter = parsed[subject].find((c: any) => c.id === chapter.id);
                if (savedChapter) {
                  return { ...chapter, tasks: { ...chapter.tasks, ...savedChapter.tasks } };
                }
                return chapter;
              });
            }
          });
          return merged;
        });
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const handleToggleTask = (chapterId: string, taskId: TaskId) => {
    setState(prev => {
      const subjectChapters = [...(prev[activeSubject] || [])];
      const chapterIndex = subjectChapters.findIndex(c => c.id === chapterId);
      
      if (chapterIndex !== -1) {
        const updatedChapter = { ...subjectChapters[chapterIndex] };
        updatedChapter.tasks = { 
          ...updatedChapter.tasks, 
          [taskId]: !updatedChapter.tasks[taskId] 
        };
        subjectChapters[chapterIndex] = updatedChapter;
        
        return {
          ...prev,
          [activeSubject]: subjectChapters
        };
      }
      return prev;
    });
  };

  const handleToggleRevision = (chapterId: string, revisionIndex: number) => {
    setState(prev => {
      const subjectChapters = [...(prev[activeSubject] || [])];
      const chapterIndex = subjectChapters.findIndex(c => c.id === chapterId);
      
      if (chapterIndex !== -1) {
        const updatedChapter = { ...subjectChapters[chapterIndex] };
        const updatedRevisions = [...(updatedChapter.revisions || [false, false, false, false, false, false, false])];
        updatedRevisions[revisionIndex] = !updatedRevisions[revisionIndex];
        updatedChapter.revisions = updatedRevisions;
        subjectChapters[chapterIndex] = updatedChapter;
        
        return {
          ...prev,
          [activeSubject]: subjectChapters
        };
      }
      return prev;
    });
  };

  const handleReset = () => {
    setState(INITIAL_STATE);
    setShowResetConfirm(false);
  };

  // Calculate Progress Stats
  const calculateSubjectStats = (subject: SubjectId) => {
    const chapters = state[subject] || [];
    let totalTasks = 0;
    let completedTasks = 0;
    
    chapters.forEach(chapter => {
      const tasksToShow = TASKS.filter(t => {
        if (subject === 'english') {
          const isCreative = chapter.id.startsWith('eng-') && parseInt(chapter.id.split('-')[1]) >= 20;
          if (isCreative) {
            const allowed = ['lectures', 'notes', 'dpps', 'revision', 'qcb', 'pyqs'];
            return allowed.includes(t.id);
          } else {
            if (t.id === 'ncert_exam' || t.id === 'ncert_exer' || t.id === 'ncert_exen' || t.id === 'short_notes') {
              return false;
            }
          }
        } else if (subject === 'pe') {
          if (t.id === 'ncert_exam' || t.id === 'ncert_exer' || t.id === 'ncert_exen' || t.id === 'short_notes') {
            return false;
          }
        }
        return true;
      });
      totalTasks += tasksToShow.length;
      let completedInChapter = 0;
      tasksToShow.forEach(t => {
        if (t.id === 'revision') {
          const revs = chapter.revisions || [false, false, false, false, false, false, false];
          completedInChapter += Math.min(3, revs.filter(Boolean).length) / 3;
        } else {
          completedInChapter += (chapter.tasks[t.id] ? 1 : 0);
        }
      });
      completedTasks += completedInChapter;
    });
    
    return { 
      total: totalTasks, 
      completed: completedTasks, 
      percentage: totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100 
    };
  };

  const phyStats = calculateSubjectStats('physics');
  const chemStats = calculateSubjectStats('chemistry');
  const mathStats = calculateSubjectStats('math');
  const engStats = calculateSubjectStats('english');
  const peStats = calculateSubjectStats('pe');
  
  const globalTotal = phyStats.total + chemStats.total + mathStats.total + engStats.total + peStats.total;
  const globalCompleted = phyStats.completed + chemStats.completed + mathStats.completed + engStats.completed + peStats.completed;
  const globalPercentage = globalTotal === 0 ? 0 : (globalCompleted / globalTotal) * 100;

  const subjectProgress = {
    physics: phyStats.percentage,
    chemistry: chemStats.percentage,
    math: mathStats.percentage,
    english: engStats.percentage,
    pe: peStats.percentage
  };

  if (!isLoaded) return <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white font-sans selection:bg-indigo-500/30 pb-20 transition-colors duration-300 overflow-x-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/60">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
              <BookOpen size={18} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Syllabus<span className="text-indigo-400">Tracker</span></h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isEditMode 
                  ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/50' 
                  : 'bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              {isEditMode ? <CheckCircle2 size={16} /> : <Edit2 size={16} />}
              <span className="hidden sm:inline">{isEditMode ? 'Done Editing' : 'Edit Tasks'}</span>
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-8 pb-12">
        {/* Global Summary */}
        <section className="mb-10 p-6 md:p-8 rounded-3xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center gap-8 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors duration-300">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-[80px] dark:blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 shrink-0">
            <RadialProgress 
              percentage={globalPercentage} 
              label="Overall" 
              size={140} 
              strokeWidth={12} 
            />
          </div>
          
          <div className="relative z-10 flex-1 w-full text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Master Progress</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mb-6">Keep pushing forward. Consistency is the key to cracking the exam.</p>
            
            <div className="grid grid-cols-3 gap-3 md:gap-6">
              <div className="bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 p-3 md:p-4 rounded-2xl flex flex-col items-center md:items-start transition-colors duration-300">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Tasks</span>
                <span className="text-xl md:text-2xl font-mono font-bold text-gray-700 dark:text-gray-200">{globalTotal}</span>
              </div>
              <div className="bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 p-3 md:p-4 rounded-2xl flex flex-col items-center md:items-start transition-colors duration-300">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Completed</span>
                <span className="text-xl md:text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">{Math.round(globalCompleted * 10) / 10}</span>
              </div>
              <div className="bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 p-3 md:p-4 rounded-2xl flex flex-col items-center md:items-start transition-colors duration-300">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Remaining</span>
                <span className="text-xl md:text-2xl font-mono font-bold text-gray-700 dark:text-gray-200">{Math.round((globalTotal - globalCompleted) * 10) / 10}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Live Countdown Card */}
        <section className="mb-10 relative group">
          <div className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse pointer-events-none" />
          <div className="relative bg-white/80 dark:bg-[#161616]/80 backdrop-blur-md border border-cyan-200 dark:border-cyan-500/30 p-4 md:p-6 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] dark:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <h2 className="text-xl md:text-2xl font-bold text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] dark:drop-shadow-[0_0_10px_rgba(6,182,212,0.6)] text-center tracking-wide">
              ⚡ {daysRemaining} Days Remaining ⚡
            </h2>
          </div>
        </section>

        {/* Subject Navigation */}
        <section className="mb-8 sticky top-[72px] z-30 pt-2 pb-4 bg-gray-50/90 dark:bg-[#121212]/90 backdrop-blur-md">
          <SubjectTabs 
            activeSubject={activeSubject}
            onSubjectChange={setActiveSubject}
            progress={subjectProgress}
          />
        </section>

        {/* Chapter List */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold tracking-tight capitalize">{activeSubject} Syllabus</h2>
            <span className="text-sm font-mono text-gray-500">
              {state[activeSubject]?.length || 0} Chapters
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSubject}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-3"
              >
                {(state[activeSubject] || []).map((chapter, idx) => {
                  let sectionHeader = null;
                  if (activeSubject === 'chemistry') {
                    if (idx === 0) {
                      sectionHeader = <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-4 mb-1 pl-2 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">Physical Chemistry</h3>;
                    } else if (idx === 3) {
                      sectionHeader = <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-4 mb-1 pl-2 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">Inorganic Chemistry</h3>;
                    } else if (idx === 5) {
                      sectionHeader = <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-4 mb-1 pl-2 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">Organic Chemistry</h3>;
                    }
                  } else if (activeSubject === 'english') {
                    if (idx === 0) {
                      sectionHeader = <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mt-4 mb-1 pl-2 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)] dark:drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">Flamingo</h3>;
                    } else if (idx === 8) {
                      sectionHeader = <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mt-4 mb-1 pl-2 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)] dark:drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">Poetry</h3>;
                    } else if (idx === 13) {
                      sectionHeader = <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mt-4 mb-1 pl-2 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)] dark:drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">Vistas</h3>;
                    } else if (idx === 19) {
                      sectionHeader = <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mt-4 mb-1 pl-2 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)] dark:drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">Creative Writing</h3>;
                    }
                  }

                  return (
                    <React.Fragment key={chapter.id}>
                      {sectionHeader}
                      <ChapterCard 
                        chapter={chapter}
                        subject={activeSubject}
                        index={idx}
                        onToggleTask={handleToggleTask}
                        onToggleRevision={handleToggleRevision}
                        isEditMode={isEditMode}
                      />
                    </React.Fragment>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Settings Modal Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800/60">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings size={20} className="text-indigo-500" />
                  Settings
                </h2>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto no-scrollbar flex-1">
                {/* Theme Management */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Appearance</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                        theme === 'light' 
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                          : 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                    >
                      <Sun size={24} />
                      <span className="text-xs font-semibold">Light Mode</span>
                    </button>
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                        theme === 'dark' 
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                          : 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                    >
                      <Moon size={24} />
                      <span className="text-xs font-semibold">Dark Mode</span>
                    </button>
                    <button
                      onClick={() => handleThemeChange('system')}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                        theme === 'system' 
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                          : 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                    >
                      <Monitor size={24} />
                      <span className="text-xs font-semibold">System</span>
                    </button>
                  </div>
                </div>

                {/* Backup & Restore */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Data Management</h3>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleExport}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                          <Download size={18} />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Export Backup</h4>
                          <p className="text-xs text-gray-500">Download your progress as JSON</p>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                          <Upload size={18} />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Import Backup</h4>
                          <p className="text-xs text-gray-500">Restore progress from a JSON file</p>
                        </div>
                      </div>
                    </button>
                    <input 
                      type="file" 
                      accept=".json" 
                      ref={fileInputRef} 
                      onChange={handleImport} 
                      className="hidden" 
                    />
                  </div>
                </div>

                {/* About Developer */}
                <div className="mb-8 flex flex-col items-center text-center mt-4">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-5 tracking-tight">About Developer</h2>
                  
                  <h3 className="text-[16px] sm:text-[18px] font-bold text-indigo-600 dark:text-indigo-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)] mb-4 leading-snug px-2">
                    Looking for a Custom App or<br/>Expert Video Editing?
                  </h3>
                  
                  <p className="text-[13px] sm:text-[14px] text-gray-600 dark:text-gray-300 leading-relaxed max-w-[340px] mb-8 font-medium">
                    <span className="uppercase tracking-wide text-gray-800 dark:text-gray-100 font-semibold">NEXUS_VIBESHQ</span> delivers premium web development and professional video editing services to elevate your brand.
                  </p>

                  <div className="w-full p-8 rounded-[2rem] bg-gray-50/80 dark:bg-[#1a1a1a]/80 border border-gray-200/80 dark:border-gray-800/80 flex flex-col items-center group relative overflow-hidden backdrop-blur-sm shadow-sm dark:shadow-none">
                    <div className="relative mb-6 z-10">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 blur-lg opacity-50 group-hover:opacity-80 transition-opacity duration-700 animate-pulse" />
                      <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                        <img 
                          src="/profile.jpg" 
                          alt="Satyam Kushwaha" 
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-[4px] border-white dark:border-[#1a1a1a]"
                        />
                      </div>
                    </div>
                    
                    <h4 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight z-10">Satyam Kushwaha</h4>
                    <p className="text-[11px] sm:text-[12px] font-bold tracking-[0.2em] text-indigo-600 dark:text-indigo-400/90 z-10 uppercase">LEAD DEVELOPER & EDITOR</p>
                  </div>
                </div>

                {/* Danger Zone */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 mb-4">Danger Zone</h3>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      setShowResetConfirm(true);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-500 group-hover:scale-110 transition-transform">
                        <AlertTriangle size={18} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-red-700 dark:text-red-400">Reset All Data</h4>
                        <p className="text-xs text-red-500/70 dark:text-red-500/60">Permanently delete all progress</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Modal Overlay */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#1a1a1a] border border-red-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl shadow-red-500/10"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-6 mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Reset All Data?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
                This action cannot be undone. All your progress in Physics, Chemistry, Mathematics, English, and Physical Education will be permanently deleted.
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-[#333] transition-colors border border-gray-200 dark:border-gray-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReset}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold bg-red-50 dark:bg-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/50 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Yes, Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
