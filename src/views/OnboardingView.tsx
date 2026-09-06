import React, { useState } from 'react';
import { useMetaStore } from '../store/useMetaStore';
import { useTaskStore } from '../store/useTaskStore';
import { useReminderStore } from '../store/useReminderStore';
import { useUIStore } from '../store/useUIStore';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/common/Logo';
import { getTodayDateString } from '../utils/date';
import { User, Briefcase, Quote, Sparkles, ArrowRight, Clock, Layers, Loader2 } from 'lucide-react';

export const OnboardingView: React.FC = () => {
  const user = useMetaStore((state) => state.user);
  const intention = useMetaStore((state) => state.intention);
  const updateUser = useMetaStore((state) => state.updateUser);
  const updateIntention = useMetaStore((state) => state.updateIntention);
  const updateSettings = useMetaStore((state) => state.updateSettings);

  const addTask = useTaskStore((state) => state.addTask);
  const addReminder = useReminderStore((state) => state.addReminder);

  const setActiveView = useUIStore((state) => state.setActiveView);
  const showToast = useUIStore((state) => state.showToast);
  const openFirstSessionTour = useUIStore((state) => state.openFirstSessionTour);
  const { user: authUser } = useAuth();

  const [name, setName] = useState(user.name || '');
  const [title, setTitle] = useState(user.title || '');
  const [tagline, setTagline] = useState(user.tagline || '');
  const [goal, setGoal] = useState('');
  const [preferredDuration, setPreferredDuration] = useState<25 | 50>(25);
  const [seedSampleData, setSeedSampleData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const resolvedName = name.trim() || (authUser?.email?.split('@')[0] ? authUser.email.split('@')[0].charAt(0).toUpperCase() + authUser.email.split('@')[0].slice(1) : 'Friend');

    await updateUser({
      name: resolvedName,
      title: title.trim() || 'Writer & Builder',
      tagline: tagline.trim() || 'One day at a time',
      isLoggedIn: true
    });

    if (goal.trim()) {
      await updateIntention(goal.trim());
    }

    await updateSettings({
      focusDuration: preferredDuration
    });

    if (seedSampleData) {
      const todayStr = getTodayDateString();
      await addTask({
        title: 'Plan priorities for the day',
        category: 'Work',
        priority: 'urgent',
        estimatedPomodoros: 2,
        dueDate: todayStr,
        subtasks: [
          { id: 'sub-1', title: 'Review completed items', completed: true },
          { id: 'sub-2', title: 'Write down 3 primary targets for the day', completed: false }
        ]
      });
      await addTask({
        title: 'Review project layout and design',
        category: 'Design',
        priority: 'high',
        estimatedPomodoros: 1,
        dueDate: todayStr,
        subtasks: []
      });
      await addTask({
        title: 'Take a 15-minute walk outside',
        category: 'Mindful',
        priority: 'medium',
        estimatedPomodoros: 1,
        dueDate: todayStr,
        subtasks: []
      });
      await addReminder({
        title: 'Afternoon break & stretch',
        time: '14:30',
        period: 'Afternoon',
        repeat: 'Daily',
        sound: true
      });
    }

    setIsSaving(false);
    showToast(`Welcome to Planr, ${resolvedName.split(' ')[0]}! 🌿`, 'success');
    setActiveView('daily');
    openFirstSessionTour();
  };

  const handleSkip = async () => {
    await updateUser({
      isLoggedIn: true
    });
    showToast('Welcome to your workspace!', 'info');
    setActiveView('daily');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 sm:px-6 py-12 animate-fade-in">
      {/* Brand Header */}
      <div className="mb-8 text-center flex flex-col items-center">
        <button
          type="button"
          onClick={() => setActiveView('landing')}
          className="hover:opacity-80 transition-opacity"
          aria-label="Return to landing page"
        >
          <Logo size="lg" />
        </button>
      </div>

      {/* Main Onboarding Card */}
      <div className="w-full max-w-lg sm:max-w-xl bg-surface-lowest border border-outline-variant rounded-2xl p-8 sm:p-12 shadow-card space-y-7">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
            Set up your workspace
          </h1>
          <p className="text-sm text-secondary font-sans max-w-sm mx-auto">
            Set your name and default timer duration to get started.
          </p>
        </div>

        <form noValidate onSubmit={handleFinishOnboarding} className="space-y-5">
          {/* Display Name */}
          <div>
            <label htmlFor="onboarding-name" className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans">
              What should we call you?
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="onboarding-name"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full pl-11 pr-4 py-3 bg-surface-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Title or Role */}
          <div>
            <label htmlFor="onboarding-title" className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans">
              Your Role (e.g. Designer, Engineer, Student, Writer)
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="onboarding-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Designer, Engineer, Writer"
                className="w-full pl-11 pr-4 py-3 bg-surface-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Core Daily Intention */}
          <div>
            <label htmlFor="onboarding-goal" className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans">
              Today's Main Focus
            </label>
            <div className="relative">
              <Quote className="w-4 h-4 text-secondary absolute left-4 top-3.5" aria-hidden="true" />
              <textarea
                id="onboarding-goal"
                rows={2}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Finish the design review and send feedback"
                className="w-full pl-11 pr-4 py-2.5 bg-surface-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Preferred Focus Duration */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans">
              Default Focus Duration
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPreferredDuration(25)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  preferredDuration === 25
                    ? 'border-primary-container bg-surface-container/40 ring-1 ring-primary-container'
                    : 'border-outline-subtle bg-surface-low hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                  <Clock className="w-4 h-4 text-tertiary" />
                  <span>25 Minutes</span>
                </div>
                <p className="text-xs text-secondary mt-0.5 font-sans">Standard 25-minute block</p>
              </button>

              <button
                type="button"
                onClick={() => setPreferredDuration(50)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  preferredDuration === 50
                    ? 'border-primary-container bg-surface-container/40 ring-1 ring-primary-container'
                    : 'border-outline-subtle bg-surface-low hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                  <Clock className="w-4 h-4 text-tertiary" />
                  <span>50 Minutes</span>
                </div>
                <p className="text-xs text-secondary mt-0.5 font-sans">50-minute deep work block</p>
              </button>
            </div>
          </div>

          {/* Sample Data Seeding Checkbox */}
          <div className="p-3.5 rounded-xl bg-surface-low border border-outline-subtle flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-tertiary" />
              <div>
                <p className="text-xs font-semibold text-on-surface">Include starter tasks</p>
                <p className="text-[11px] text-secondary">Add 3 sample tasks and a reminder to get started</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={seedSampleData}
              onChange={(e) => setSeedSampleData(e.target.checked)}
              className="w-4 h-4 rounded text-tertiary focus:ring-primary-container cursor-pointer"
            />
          </div>

          <div className="pt-3 space-y-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 px-5 bg-primary-container hover:bg-primary text-on-primary-container text-sm font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span>Setting up workspace...</span>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                </span>
              ) : (
                <>
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-center text-xs font-medium text-secondary hover:text-on-surface transition-colors py-1.5"
            >
              Skip setup for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
