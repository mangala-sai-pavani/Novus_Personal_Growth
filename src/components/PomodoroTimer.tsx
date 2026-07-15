import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, Check, AlertCircle, Coffee, Brain, Plus, Minus, Bell, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { RoutineTask } from '../types';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface PomodoroTimerProps {
  userId: string;
  routineTasks: RoutineTask[];
  onCompleteTask: (id: string) => void;
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export default function PomodoroTimer({ userId, routineTasks, onCompleteTask }: PomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>('work');
  const [workTime, setWorkTime] = useState(25); // in minutes
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  
  const [timeLeft, setTimeLeft] = useState(25 * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Keep track of completed sessions in local session state
  const [sessionsCount, setSessionsCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimeForMode = {
    work: workTime * 60,
    shortBreak: shortBreakTime * 60,
    longBreak: longBreakTime * 60,
  };

  // Reset timer when mode or custom times change (if not running)
  useEffect(() => {
    if (!isRunning) {
      if (mode === 'work') setTimeLeft(workTime * 60);
      else if (mode === 'shortBreak') setTimeLeft(shortBreakTime * 60);
      else if (mode === 'longBreak') setTimeLeft(longBreakTime * 60);
    }
  }, [mode, workTime, shortBreakTime, longBreakTime, isRunning]);

  // Main countdown logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  // Synthesize beautiful Web Audio chime
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(0.3, start + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(start);
        osc.stop(start + duration);
      };
      
      const now = audioCtx.currentTime;
      playTone(523.25, now, 0.6); // C5
      playTone(659.25, now + 0.15, 0.6); // E5
      playTone(783.99, now + 0.3, 1.0); // G5
    } catch (err) {
      console.error("Audio error:", err);
    }
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    playChime();

    const selectedTask = routineTasks.find(t => t.id === selectedTaskId);
    const sessionMinutes = mode === 'work' ? workTime : mode === 'shortBreak' ? shortBreakTime : longBreakTime;

    // Toast notification
    if (mode === 'work') {
      setSessionsCount((prev) => prev + 1);
      toast.success('Focus session complete!', {
        description: selectedTask 
          ? `You focused on "${selectedTask.title}" for ${sessionMinutes} minutes.` 
          : `Great work! You focused for ${sessionMinutes} minutes.`,
        action: selectedTask ? {
          label: 'Complete Task',
          onClick: () => onCompleteTask(selectedTask.id)
        } : undefined,
        duration: 8000
      });
    } else {
      toast.info('Break finished!', {
        description: 'Ready to get back to focus?',
        duration: 5000
      });
    }

    // Save focus session to Firestore
    try {
      await addDoc(collection(db, 'focusSessions'), {
        userId,
        taskId: selectedTaskId || null,
        taskTitle: selectedTask?.title || null,
        durationMinutes: sessionMinutes,
        mode,
        completedAt: Timestamp.now()
      });
    } catch (err) {
      console.error("Failed to save focus session:", err);
    }

    // Switch mode automatically
    if (mode === 'work') {
      setMode('shortBreak');
    } else {
      setMode('work');
    }
  };

  const toggleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'work') setTimeLeft(workTime * 60);
    else if (mode === 'shortBreak') setTimeLeft(shortBreakTime * 60);
    else if (mode === 'longBreak') setTimeLeft(longBreakTime * 60);
  };

  const adjustTime = (amount: number) => {
    if (isRunning) return;
    if (mode === 'work') {
      setWorkTime((prev) => Math.max(1, prev + amount));
    } else if (mode === 'shortBreak') {
      setShortBreakTime((prev) => Math.max(1, prev + amount));
    } else {
      setLongBreakTime((prev) => Math.max(1, prev + amount));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPercentage = () => {
    const total = mode === 'work' ? workTime * 60 : mode === 'shortBreak' ? shortBreakTime * 60 : longBreakTime * 60;
    return ((total - timeLeft) / total) * 100;
  };

  const activeTask = routineTasks.find(t => t.id === selectedTaskId);
  const uncompletedTasks = routineTasks.filter(t => !t.completed);

  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
      
      {/* Timer Display Circle */}
      <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="44"
            className="stroke-gray-100 fill-none"
            strokeWidth="5"
          />
          {/* Foreground progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            className={cn(
              "fill-none transition-colors duration-300",
              mode === 'work' ? "stroke-indigo-600" : mode === 'shortBreak' ? "stroke-emerald-500" : "stroke-teal-500"
            )}
            strokeWidth="5"
            strokeDasharray="276.46"
            strokeDashoffset={276.46 - (276.46 * getPercentage()) / 100}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Absolute labels inside circle */}
        <div className="absolute text-center flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1"
            >
              {mode === 'work' ? (
                <>
                  <Brain className="w-3 h-3 text-indigo-500" />
                  Focus
                </>
              ) : (
                <>
                  <Coffee className="w-3 h-3 text-emerald-500" />
                  Break
                </>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="text-3xl font-black text-gray-900 tracking-tighter my-0.5 font-mono">
            {formatTime(timeLeft)}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-indigo-600/70">
            {sessionsCount > 0 ? `${sessionsCount} session${sessionsCount > 1 ? 's' : ''}` : 'Stay focused'}
          </div>
        </div>
      </div>

      {/* Timer Controls & Task Linker */}
      <div className="flex-1 flex flex-col justify-between w-full h-full gap-4">
        <div>
          {/* Mode Switcher */}
          <div className="flex gap-1.5 bg-gray-50 p-1 rounded-2xl">
            <button
              onClick={() => { setMode('work'); setIsRunning(false); }}
              className={cn(
                "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                mode === 'work' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Focus
            </button>
            <button
              onClick={() => { setMode('shortBreak'); setIsRunning(false); }}
              className={cn(
                "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                mode === 'shortBreak' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Short Break
            </button>
            <button
              onClick={() => { setMode('longBreak'); setIsRunning(false); }}
              className={cn(
                "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                mode === 'longBreak' ? "bg-white text-teal-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Long Break
            </button>
          </div>

          {/* Time adjustments & sound settings */}
          <div className="flex justify-between items-center mt-3 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Duration:</span>
              <button 
                onClick={() => adjustTime(-1)} 
                disabled={isRunning}
                className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-gray-700 min-w-[24px] text-center font-mono">
                {mode === 'work' ? workTime : mode === 'shortBreak' ? shortBreakTime : longBreakTime}m
              </span>
              <button 
                onClick={() => adjustTime(1)} 
                disabled={isRunning}
                className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg bg-gray-50 transition-colors"
              title={soundEnabled ? "Mute Timer Sound" : "Unmute Timer Sound"}
            >
              {soundEnabled ? <Bell className="w-3.5 h-3.5 text-indigo-500" /> : <BellOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Task Linker Dropdown */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">
            Focus Task
          </label>
          <div className="flex gap-2">
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="flex-1 p-3 bg-gray-50 border-none rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- No Task Linked --</option>
              {uncompletedTasks.map(t => (
                <option key={t.id} value={t.id}>
                  [{t.time}] {t.title}
                </option>
              ))}
            </select>
            {activeTask && !activeTask.completed && (
              <button
                onClick={() => {
                  onCompleteTask(activeTask.id);
                  setSelectedTaskId('');
                  toast.success(`Task "${activeTask.title}" marked complete!`);
                }}
                className="px-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-2xl transition-all flex items-center gap-1.5 font-bold text-xs shadow-sm border border-emerald-100"
                title="Mark Linked Task Complete"
              >
                <Check className="w-4 h-4" />
                Done
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2.5 mt-1">
          <button
            onClick={toggleStartPause}
            className={cn(
              "flex-1 py-3.5 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-gray-100",
              isRunning 
                ? "bg-amber-500 hover:bg-amber-600" 
                : mode === 'work' 
                  ? "bg-indigo-600 hover:bg-indigo-700" 
                  : "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                Pause Timer
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Focus
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-3.5 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-2xl transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
