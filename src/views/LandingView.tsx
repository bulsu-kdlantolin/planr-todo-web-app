import React, { useState, useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { Logo } from '../components/common/Logo';
import {
  ArrowRight,
  SunMedium,
  Timer,
  CheckCircle2,
  Circle,
  ShieldCheck,
  Headphones,
  Feather,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Plus,
  CloudRain,
  Trees,
  Waves,
  Clock,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Check,
  X
} from 'lucide-react';

type DemoTab = 'tasks' | 'timer' | 'schedule';

export const LandingView: React.FC = () => {
  const setActiveView = useUIStore((state) => state.setActiveView);

  const [activeTab, setActiveTab] = useState<DemoTab>('tasks');

  // 1. Interactive Tasks State
  const [demoTasks, setDemoTasks] = useState([
    { id: 1, title: 'Review quarterly goals & key priorities', category: 'Work', completed: true },
    { id: 2, title: 'Calibrate design tokens & accessibility checks', category: 'Design', completed: false },
    { id: 3, title: '15-minute mindful outdoor stroll', category: 'Mindful', completed: false }
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');

  const toggleDemoTask = (id: number) => {
    setDemoTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddDemoTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setDemoTasks((prev) => [
      ...prev,
      { id: Date.now(), title: newTaskInput.trim(), category: 'Work', completed: false }
    ]);
    setNewTaskInput('');
  };

  const completedCount = demoTasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / (demoTasks.length || 1)) * 100);

  // 2. Interactive Animated Focus Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeSound, setActiveSound] = useState<'rain' | 'forest' | 'waves' | null>('rain');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(25 * 60);
  };

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does device sync work?',
      a: 'When you sign in with Google or your email, all your tasks, focus sessions, and daily intentions sync automatically across your phone, tablet, and computer in real time.'
    },
    {
      q: 'How do the ambient sounds help me focus?',
      a: 'Planr includes soothing focus tones and natural soundscapes (rain, forest breeze, gentle ocean waves, pink noise) designed to mask distracting background noise and help you enter a deep flow state.'
    },
    {
      q: 'Can I export my notes and tasks?',
      a: 'Yes! You can export your completed daily schedule to clean Markdown checklists for your notes, or download full backups and spreadsheets anytime with a single click.'
    },
    {
      q: 'Does the timer work when I switch browser tabs?',
      a: 'Yes! The timer continues counting down accurately in the background, so you can work across different apps and tabs without losing track of your focus block.'
    }
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full">
      {/* Top Navigation */}
      <header className="sticky top-0 w-full bg-surface/90 backdrop-blur-md border-b border-outline-subtle z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Logo size="md" />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-secondary">
            <button
              type="button"
              onClick={() => scrollToSection('landing-features')}
              className="hover:text-on-surface transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('landing-comparison')}
              className="hover:text-on-surface transition-colors cursor-pointer"
            >
              Compare
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('landing-faq')}
              className="hover:text-on-surface transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveView('signin')}
              className="px-4 py-2 text-sm font-medium text-secondary hover:text-on-surface bg-surface-low hover:bg-surface-container rounded-md transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveView('signup')}
              className="px-5 py-2 text-sm font-medium bg-primary-container text-on-primary-container hover:bg-primary rounded-md shadow-sm transition-all active:scale-[0.98]"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-14 md:py-20 px-6 max-w-4xl mx-auto text-center flex flex-col items-center">
        <div className="mb-6 animate-fade-in">
          <Logo size="xl" showWordmark={false} />
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-on-surface leading-[1.15] mb-5 tracking-tight">
          The Zen Productivity Cockpit.
        </h1>

        <p className="text-lg md:text-xl text-on-secondary-container max-w-2xl mx-auto mb-8 leading-relaxed font-sans">
          100% Private. Built-in Focus Soundscapes. Zero Cloud Lock-in. Plan your day with clarity, calm, and zero distraction.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <button
            type="button"
            onClick={() => setActiveView('daily')}
            className="flex items-center gap-2 px-8 py-3.5 bg-primary-container text-on-primary-container hover:bg-primary rounded-xl text-base font-semibold shadow-md transition-all active:scale-[0.98]"
          >
            <span>Try Planr in Browser — No Sign-up Required</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setActiveView('signin')}
            className="px-6 py-3.5 bg-surface-low hover:bg-surface-container border border-outline-variant text-on-surface rounded-xl text-base font-semibold transition-all active:scale-[0.98]"
          >
            Sign In / Cloud Sync
          </button>
        </div>

        {/* 🌟 Animated Interactive Preview Card */}
        <div className="w-full max-w-2xl bg-surface-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-ambient text-left relative overflow-hidden transition-all">
          {/* Card Top Bar with Animated Live Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-subtle mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                  Live Preview
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-on-surface">
                {activeTab === 'tasks'
                  ? "Today's Tasks & Focus"
                  : activeTab === 'timer'
                  ? 'Focus Timer & Ambience'
                  : 'Daily Flow & Reminders'}
              </h2>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex p-1 rounded-xl bg-surface-low border border-outline-subtle text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'tasks'
                    ? 'bg-surface-lowest text-on-surface shadow-xs font-bold'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                Tasks
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('timer')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'timer'
                    ? 'bg-surface-lowest text-on-surface shadow-xs font-bold'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                Timer
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'schedule'
                    ? 'bg-surface-lowest text-on-surface shadow-xs font-bold'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                Schedule
              </button>
            </div>
          </div>

          {/* TAB 1: Animated Tasks View */}
          {activeTab === 'tasks' && (
            <div className="space-y-4 animate-fade-in">
              {/* Animated Progress Bar */}
              <div className="p-3.5 bg-surface-low rounded-xl border border-outline-subtle space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-secondary">Progress Today</span>
                  <span className="text-primary font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-container transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Task Items */}
              <div className="space-y-2.5">
                {demoTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleDemoTask(t.id)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-300 select-none ${
                      t.completed
                        ? 'bg-surface-low/50 border-outline-subtle opacity-70 scale-[0.99]'
                        : 'bg-surface border-outline-variant/60 hover:border-outline-variant shadow-xs hover:shadow-card hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={t.completed}
                        aria-label={`Toggle ${t.title}`}
                        className="text-secondary hover:text-tertiary focus:outline-none transition-transform active:scale-125"
                      >
                        {t.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-tertiary transition-transform animate-scale-in" aria-hidden="true" />
                        ) : (
                          <Circle className="w-5 h-5 hover:text-primary-container transition-colors" aria-hidden="true" />
                        )}
                      </button>
                      <span
                        className={`text-sm font-medium transition-all ${
                          t.completed ? 'line-through text-secondary' : 'text-on-surface'
                        }`}
                      >
                        {t.title}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-low text-secondary border border-outline-subtle">
                      {t.category}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Task Input */}
              <form onSubmit={handleAddDemoTask} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="Type a task and press enter..."
                  className="flex-1 px-4 py-2.5 bg-surface-low border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-secondary/60 focus:border-primary-container focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!newTaskInput.trim()}
                  className="px-4 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary text-xs font-semibold uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Animated Focus Timer View */}
          {activeTab === 'timer' && (
            <div className="py-2 space-y-6 animate-fade-in text-center">
              {/* Concentric Breathing Circle & Digital Clock */}
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full border-2 border-dashed border-primary-container/40 transition-all ${
                    isTimerRunning ? 'animate-spin-slow scale-105' : ''
                  }`}
                  style={{ animationDuration: '20s' }}
                />
                <div
                  className={`absolute inset-3 rounded-full bg-surface-low/80 border border-outline-variant flex items-center justify-center transition-all ${
                    isTimerRunning ? 'shadow-ambient ring-2 ring-primary-container/30 animate-pulse' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-mono text-4xl font-bold tracking-tight text-on-surface">
                      {formatTime(timerSeconds)}
                    </span>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-secondary">
                      {isTimerRunning ? 'Deep Focus Session' : 'Ready to Focus'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-container hover:bg-primary text-on-primary-container rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95"
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Focus</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetTimer}
                  className="p-2.5 bg-surface-low hover:bg-surface-container text-secondary hover:text-on-surface border border-outline-variant rounded-xl transition-all active:scale-95"
                  title="Reset Timer"
                  aria-label="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Ambient Soundscapes Selector with Animated Equalizer Bars */}
              <div className="p-3.5 bg-surface-low rounded-xl border border-outline-subtle flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
                  <Headphones className="w-4 h-4 text-tertiary" />
                  <span>Ambience:</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSound(activeSound === 'rain' ? null : 'rain')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      activeSound === 'rain'
                        ? 'bg-surface-lowest border-primary-container text-on-surface shadow-xs font-semibold'
                        : 'border-transparent text-secondary hover:text-on-surface'
                    }`}
                  >
                    <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                    <span>Rain</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSound(activeSound === 'forest' ? null : 'forest')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      activeSound === 'forest'
                        ? 'bg-surface-lowest border-primary-container text-on-surface shadow-xs font-semibold'
                        : 'border-transparent text-secondary hover:text-on-surface'
                    }`}
                  >
                    <Trees className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Forest</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSound(activeSound === 'waves' ? null : 'waves')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      activeSound === 'waves'
                        ? 'bg-surface-lowest border-primary-container text-on-surface shadow-xs font-semibold'
                        : 'border-transparent text-secondary hover:text-on-surface'
                    }`}
                  >
                    <Waves className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Waves</span>
                  </button>
                </div>

                {/* Animated Wave Equalizer Bars */}
                {activeSound && (
                  <div className="hidden sm:flex items-center gap-1 h-3">
                    <span className="w-1 bg-tertiary rounded-full animate-bounce" style={{ height: '60%', animationDelay: '0ms' }} />
                    <span className="w-1 bg-tertiary rounded-full animate-bounce" style={{ height: '100%', animationDelay: '150ms' }} />
                    <span className="w-1 bg-tertiary rounded-full animate-bounce" style={{ height: '40%', animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Animated Schedule View */}
          {activeTab === 'schedule' && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3.5 bg-surface-low rounded-xl border border-outline-subtle flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 animate-ping" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-on-surface">Morning Deep Focus Block</span>
                    <span className="font-mono text-secondary">09:00 AM</span>
                  </div>
                  <p className="text-xs text-secondary mt-0.5">2 hours uninterrupted design & deep work</p>
                </div>
              </div>

              <div className="p-3.5 bg-surface-low rounded-xl border border-outline-subtle flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-on-surface">Afternoon Review & Sync</span>
                    <span className="font-mono text-secondary">02:00 PM</span>
                  </div>
                  <p className="text-xs text-secondary mt-0.5">Quick alignment on deliverables</p>
                </div>
              </div>

              <div className="p-3.5 bg-surface-low rounded-xl border border-outline-subtle flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-on-surface">Evening Mindful Unwind</span>
                    <span className="font-mono text-secondary">06:00 PM</span>
                  </div>
                  <p className="text-xs text-secondary mt-0.5">Daily review & schedule tomorrow's key outcome</p>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-secondary mt-5 text-center italic font-serif">
            Click the buttons above to test the timer and task list live.
          </p>
        </div>
      </section>

      {/* 4 Feature Pillars */}
      <section id="landing-features" className="py-20 bg-surface-container-low border-y border-outline-subtle px-6 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest block mb-2 font-sans">
              How It Works
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface">
              A simpler way to run your day.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface-lowest border border-outline-variant/60 rounded-xl p-7 shadow-card space-y-4 hover:-translate-y-0.5 transition-transform">
              <div className="w-10 h-10 rounded-lg bg-surface-low flex items-center justify-center text-primary-container">
                <SunMedium className="w-5 h-5 text-tertiary" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-on-surface">
                One Goal, Three Priorities
              </h3>
              <p className="text-sm text-secondary leading-relaxed font-sans">
                Avoid the endless backlog trap. Set a single daily focus, pick your top 3 tasks, and finish the day with peace of mind.
              </p>
            </div>

            <div className="bg-surface-lowest border border-outline-variant/60 rounded-xl p-7 shadow-card space-y-4 hover:-translate-y-0.5 transition-transform">
              <div className="w-10 h-10 rounded-lg bg-surface-low flex items-center justify-center text-primary-container">
                <Headphones className="w-5 h-5 text-tertiary" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-on-surface">
                Built-in Background Sounds
              </h3>
              <p className="text-sm text-secondary leading-relaxed font-sans">
                Block out distractions with gentle sounds. Choose from soft rain, forest breeze, ocean waves, pink noise, or calming focus tones.
              </p>
            </div>

            <div className="bg-surface-lowest border border-outline-variant/60 rounded-xl p-7 shadow-card space-y-4 hover:-translate-y-0.5 transition-transform">
              <div className="w-10 h-10 rounded-lg bg-surface-low flex items-center justify-center text-primary-container">
                <Smartphone className="w-5 h-5 text-tertiary" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-on-surface">
                Device Sync & Clean Exports
              </h3>
              <p className="text-sm text-secondary leading-relaxed font-sans">
                Your tasks and focus history stay synced across your phone, tablet, and computer. Export your notes to Markdown or spreadsheets anytime.
              </p>
            </div>

            <div className="bg-surface-lowest border border-outline-variant/60 rounded-xl p-7 shadow-card space-y-4 hover:-translate-y-0.5 transition-transform">
              <div className="w-10 h-10 rounded-lg bg-surface-low flex items-center justify-center text-primary-container">
                <Clock className="w-5 h-5 text-tertiary" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-on-surface">
                Reliable Focus Timer
              </h3>
              <p className="text-sm text-secondary leading-relaxed font-sans">
                Stay in flow with customizable intervals, gentle chimes, and a countdown that keeps running accurately even when you switch tabs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section id="landing-comparison" className="py-20 px-6 max-w-5xl mx-auto scroll-mt-16">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold text-secondary uppercase tracking-widest block mb-2 font-sans">
            Why Choose Planr
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface">
            Cut the backlog noise. Keep what matters.
          </h2>
        </div>

        <div className="overflow-x-auto bg-surface-lowest border border-outline-variant rounded-2xl shadow-card">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-outline-subtle bg-surface-low/50">
                <th className="p-4 sm:p-5 font-semibold text-on-surface">Core Feature</th>
                <th className="p-4 sm:p-5 font-bold text-primary bg-primary-container/10">Planr</th>
                <th className="p-4 sm:p-5 font-medium text-secondary">Traditional Todo Apps</th>
                <th className="p-4 sm:p-5 font-medium text-secondary">Heavy Workspace Apps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-subtle">
              <tr>
                <td className="p-4 sm:p-5 font-medium text-on-surface">Time to Plan Your Day</td>
                <td className="p-4 sm:p-5 font-bold text-primary bg-primary-container/10">Under 60 seconds</td>
                <td className="p-4 sm:p-5 text-secondary">5–10 mins organizing tags</td>
                <td className="p-4 sm:p-5 text-secondary">15+ mins managing databases</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-on-surface">Device Sync</td>
                <td className="p-4 sm:p-5 font-bold text-primary bg-primary-container/10">Automatic & Instant</td>
                <td className="p-4 sm:p-5 text-secondary">Manual setups</td>
                <td className="p-4 sm:p-5 text-secondary">Slow & bloated sync</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-on-surface">Built-in Focus Audio</td>
                <td className="p-4 sm:p-5 font-bold text-primary bg-primary-container/10">Calming Tones & Nature Sounds</td>
                <td className="p-4 sm:p-5 text-secondary">Paid third-party add-ons</td>
                <td className="p-4 sm:p-5 text-secondary">None</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-on-surface">Note & File Export</td>
                <td className="p-4 sm:p-5 font-bold text-primary bg-primary-container/10">1-Click Clean Markdown & CSV</td>
                <td className="p-4 sm:p-5 text-secondary">Complex export formats</td>
                <td className="p-4 sm:p-5 text-secondary">Manual copy-pasting</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-on-surface">Background Timer</td>
                <td className="p-4 sm:p-5 font-bold text-primary bg-primary-container/10">Accurate & Uninterrupted</td>
                <td className="p-4 sm:p-5 text-secondary">Throttled when switching tabs</td>
                <td className="p-4 sm:p-5 text-secondary">None / Widget only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="landing-faq" className="py-20 bg-surface-container-low border-t border-outline-subtle px-6 scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest block mb-2 font-sans">
              Frequently Asked Questions
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface">
              Everything you need to know.
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-surface-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-serif text-base font-semibold text-on-surface"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-secondary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-secondary flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-secondary font-sans leading-relaxed border-t border-outline-subtle/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy & Final CTA */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center space-y-6">
        <Feather className="w-8 h-8 text-tertiary mx-auto" aria-hidden="true" />
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface">
          Clear your head. Focus on what matters.
        </h2>
        <p className="text-base text-secondary max-w-2xl mx-auto leading-relaxed font-sans">
          Most task managers slow you down with bloated menus and endless settings. Planr gives you a straightforward workspace to plan your day, stay focused, and get things done.
        </p>

        <div className="pt-6">
          <button
            type="button"
            onClick={() => setActiveView('signup')}
            className="px-8 py-3.5 bg-primary-container hover:bg-primary text-on-primary-container rounded-xl font-semibold text-base shadow-sm transition-all active:scale-[0.98]"
          >
            Get Started with Planr Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-subtle bg-surface-container-low py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
          <div className="flex items-center">
            <Logo size="sm" />
          </div>
          <p>© {new Date().getFullYear()} Planr. Simple, distraction-free productivity.</p>
        </div>
      </footer>
    </div>
  );
};
