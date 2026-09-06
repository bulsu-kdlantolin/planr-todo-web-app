import React, { useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useMetaStore } from '../../store/useMetaStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useTimerStore, AmbientType } from '../../store/useTimerStore';
import { Modal } from '../common/Modal';
import { Logo } from '../common/Logo';
import { Sparkles, CheckSquare, Timer, ArrowRight, Check, Headphones, CloudRain, Trees, Waves, Radio } from 'lucide-react';
import { getTodayDateString } from '../../utils/date';

export const FirstSessionTourModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.firstSessionTourOpen);
  const closeTour = useUIStore((state) => state.closeFirstSessionTour);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const showToast = useUIStore((state) => state.showToast);

  const intention = useMetaStore((state) => state.intention);
  const updateIntention = useMetaStore((state) => state.updateIntention);
  const addTask = useTaskStore((state) => state.addTask);
  const setCustomDuration = useTimerStore((state) => state.setCustomDuration);
  const setAmbientType = useTimerStore((state) => state.setAmbientType);
  const toggleTimer = useTimerStore((state) => state.toggleTimer);
  const setSelectedTaskId = useTimerStore((state) => state.setSelectedTaskId);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goalText, setGoalText] = useState(intention || 'Focus on what truly moves the needle today.');
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedAmbient, setSelectedAmbient] = useState<AmbientType>('rain');

  if (!isOpen) return null;

  const handleNextStep1 = async () => {
    if (goalText.trim()) {
      await updateIntention(goalText.trim());
    }
    setStep(2);
  };

  const handleNextStep2 = async () => {
    if (taskTitle.trim()) {
      const newTask = await addTask({
        title: taskTitle.trim(),
        category: 'Work',
        priority: 'high',
        dueDate: getTodayDateString(),
        estimatedPomodoros: 1,
        subtasks: []
      });
      setSelectedTaskId(newTask.id);
    }
    setStep(3);
  };

  const handleStartSession = () => {
    setAmbientType(selectedAmbient);
    setCustomDuration(5 * 60); // 5-minute kickoff block
    toggleTimer(); // Start
    closeTour();
    setActiveView('focus');
    showToast('Kickoff focus block started! Enjoy your flow state 🎧', 'success');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeTour}
      title="60-Second Kickoff Tour"
      titleId="first-session-tour-title"
      maxWidthClass="max-w-md"
      icon={<Logo size="sm" showWordmark={false} />}
    >
      <div className="space-y-5 my-2">
        {/* Progress Stepper */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-subtle text-xs font-semibold text-secondary">
          <span className="flex items-center gap-1.5 text-primary">
            <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] font-bold">
              {step}
            </span>
            <span>Step {step} of 3</span>
          </span>
          <span className="text-[11px] font-sans">
            {step === 1 ? 'Daily Intention' : step === 2 ? 'Your 1 Big Task' : 'Focus Soundscape'}
          </span>
        </div>

        {/* Step 1: Daily Focus Goal */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-start gap-3 p-3 bg-surface-low rounded-lg border border-outline-subtle">
              <Sparkles className="w-5 h-5 text-tertiary flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="block font-serif text-sm font-semibold text-on-surface mb-0.5">
                  Set Your Intention
                </strong>
                <p className="text-secondary leading-relaxed">
                  Mindful productivity starts with one anchoring thought. What is your primary objective today?
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="tour-goal-input" className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1 font-sans">
                Today's Focus Goal
              </label>
              <textarea
                id="tour-goal-input"
                rows={3}
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="e.g. Ship the product update with zero distractions..."
                className="w-full px-3.5 py-2.5 bg-surface-low border border-outline-variant rounded-md text-xs text-on-surface focus:border-primary-container focus:outline-none transition-colors shadow-card"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleNextStep1}
                className="flex items-center gap-2 px-5 py-2 bg-primary-container text-on-primary-container hover:bg-primary rounded-md text-xs font-semibold shadow-sm transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 1 Big Task */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-start gap-3 p-3 bg-surface-low rounded-lg border border-outline-subtle">
              <CheckSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="block font-serif text-sm font-semibold text-on-surface mb-0.5">
                  Identify Your 1 Big Task
                </strong>
                <p className="text-secondary leading-relaxed">
                  Avoid hoarding a 30-item backlog. Choose the single most important action item you will execute first.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="tour-task-input" className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1 font-sans">
                Primary Task Title
              </label>
              <input
                id="tour-task-input"
                type="text"
                autoFocus
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && taskTitle.trim()) {
                    e.preventDefault();
                    handleNextStep2();
                  }
                }}
                placeholder="e.g. Finalize proposal draft..."
                className="w-full px-3.5 py-2.5 bg-surface-low border border-outline-variant rounded-md text-xs text-on-surface focus:border-primary-container focus:outline-none transition-colors shadow-card"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-1.5 text-xs text-secondary hover:text-on-surface transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNextStep2}
                className="flex items-center gap-2 px-5 py-2 bg-primary-container text-on-primary-container hover:bg-primary rounded-md text-xs font-semibold shadow-sm transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Ambient Sound & Kickoff */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-start gap-3 p-3 bg-surface-low rounded-lg border border-outline-subtle">
              <Timer className="w-5 h-5 text-tertiary flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="block font-serif text-sm font-semibold text-on-surface mb-0.5">
                  Launch 5-Minute Flow Block
                </strong>
                <p className="text-secondary leading-relaxed">
                  Start with a 5-minute micro-focus block to conquer initial procrastination. Pick an ambient soundscape:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'rain', label: 'Heavy Rain', icon: CloudRain },
                { type: 'forest', label: 'Forest Breeze', icon: Trees },
                { type: 'ocean', label: 'Gentle Waves', icon: Waves },
                { type: 'noise', label: 'Pink Noise', icon: Radio }
              ].map((sound) => {
                const Icon = sound.icon;
                const isSelected = selectedAmbient === sound.type;
                return (
                  <button
                    key={sound.type}
                    type="button"
                    onClick={() => setSelectedAmbient(sound.type as AmbientType)}
                    className={`p-3 rounded-lg border flex items-center gap-2 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-container/20 text-on-surface font-semibold shadow-xs'
                        : 'border-outline-variant bg-surface-low hover:bg-surface-container text-secondary'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-secondary'}`} />
                    <span>{sound.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-3 py-1.5 text-xs text-secondary hover:text-on-surface transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleStartSession}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary rounded-md text-xs font-semibold shadow-md transition-all active:scale-95"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Start Kickoff Focus</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default FirstSessionTourModal;
