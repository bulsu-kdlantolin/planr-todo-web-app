import React, { useState } from 'react';
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
  Feather
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const setActiveView = useUIStore((state) => state.setActiveView);

  const [demoTasks, setDemoTasks] = useState([
    { id: 1, title: 'Review project goals and priority items', category: 'Work', completed: true },
    { id: 2, title: 'Write clean release documentation', category: 'Work', completed: false },
    { id: 3, title: '20-minute afternoon walk & coffee', category: 'Personal', completed: false }
  ]);

  const toggleDemoTask = (id: number) => {
    setDemoTasks(demoTasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
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
            <a href="#landing-features" className="hover:text-on-surface transition-colors">
              Features
            </a>
            <a href="#landing-philosophy" className="hover:text-on-surface transition-colors">
              About
            </a>
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
      <section className="py-16 md:py-24 px-6 max-w-4xl mx-auto text-center flex flex-col items-center">
        <div className="mb-6 animate-fade-in">
          <Logo size="xl" showWordmark={false} />
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-on-surface leading-[1.15] mb-5 tracking-tight">
          Productivity, simplified.
        </h1>

        <p className="text-lg md:text-xl text-on-secondary-container max-w-2xl mx-auto mb-8 leading-relaxed font-sans">
          A clean, focused todo app and timer designed to help you get things done with clarity and calm.
        </p>

        <div className="flex items-center justify-center mb-16">
          <button
            type="button"
            onClick={() => setActiveView('signup')}
            className="flex items-center gap-2 px-8 py-3.5 bg-primary-container text-on-primary-container hover:bg-primary rounded-md text-base font-semibold shadow-md transition-all active:scale-[0.98]"
          >
            <span>Get Started — Free</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Interactive Preview Card */}
        <div className="w-full max-w-2xl bg-surface-lowest border border-outline-variant rounded-xl p-6 sm:p-8 shadow-ambient text-left relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-outline-subtle mb-6">
            <div>
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-widest block font-sans">
                Interactive Preview
              </span>
              <h2 className="font-serif text-xl font-semibold text-on-surface">
                Today's Tasks
              </h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-surface-low text-tertiary font-semibold border border-outline-subtle">
              Live Demo
            </span>
          </div>

          <div className="space-y-3">
            {demoTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleDemoTask(t.id)}
                className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  t.completed
                    ? 'bg-surface-low/50 border-outline-subtle opacity-70'
                    : 'bg-surface border-outline-variant/60 hover:border-outline-variant shadow-sm hover:shadow-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={t.completed}
                    aria-label={`Toggle ${t.title}`}
                    className="text-secondary hover:text-tertiary focus:outline-none"
                  >
                    {t.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-tertiary" aria-hidden="true" />
                    ) : (
                      <Circle className="w-5 h-5 hover:text-primary-container" aria-hidden="true" />
                    )}
                  </button>
                  <span
                    className={`text-sm font-medium ${
                      t.completed ? 'line-through text-secondary' : 'text-on-surface'
                    }`}
                  >
                    {t.title}
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-surface-low text-secondary border border-outline-subtle">
                  {t.category}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-secondary mt-5 text-center italic font-serif">
            Click any task above to test checkbox interactions.
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section id="landing-features" className="py-20 bg-surface-container-low border-y border-outline-subtle px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest block mb-2 font-sans">
              Simple & Powerful
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface">
              Everything you need, nothing you don't.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface-lowest border border-outline-variant/60 rounded-xl p-7 shadow-card space-y-4 hover:-translate-y-0.5 transition-transform">
              <div className="w-10 h-10 rounded-lg bg-surface-low flex items-center justify-center text-primary-container">
                <SunMedium className="w-5 h-5 text-tertiary" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-on-surface">
                Daily Focus Goals
              </h3>
              <p className="text-sm text-secondary leading-relaxed font-sans">
                Set a clear focus goal for your day and keep top-priority tasks organized without clutter.
              </p>
            </div>

            <div className="bg-surface-lowest border border-outline-variant/60 rounded-xl p-7 shadow-card space-y-4 hover:-translate-y-0.5 transition-transform">
              <div className="w-10 h-10 rounded-lg bg-surface-low flex items-center justify-center text-primary-container">
                <Headphones className="w-5 h-5 text-tertiary" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-on-surface">
                Focus Timer & Sounds
              </h3>
              <p className="text-sm text-secondary leading-relaxed font-sans">
                Focus timer with relaxing ambient sounds (rain, forest breeze, pink noise, and calming tones).
              </p>
            </div>

            <div className="bg-surface-lowest border border-outline-variant/60 rounded-xl p-7 shadow-card space-y-4 hover:-translate-y-0.5 transition-transform">
              <div className="w-10 h-10 rounded-lg bg-surface-low flex items-center justify-center text-primary-container">
                <ShieldCheck className="w-5 h-5 text-tertiary" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-on-surface">
                100% Private & Local
              </h3>
              <p className="text-sm text-secondary leading-relaxed font-sans">
                Your data stays strictly on your device. Works completely offline with zero tracking and zero subscriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy / About Section */}
      <section id="landing-philosophy" className="py-20 px-6 max-w-4xl mx-auto text-center space-y-6">
        <Feather className="w-8 h-8 text-tertiary mx-auto" aria-hidden="true" />
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface">
          "Simplicity is the ultimate sophistication."
        </h2>
        <p className="text-base text-secondary max-w-2xl mx-auto leading-relaxed font-sans">
          Most task managers overwhelm you with complicated boards and notifications. Planr gives you a clean, simple space to organize your day and focus on what matters.
        </p>

        <div className="pt-6">
          <button
            type="button"
            onClick={() => setActiveView('daily')}
            className="px-6 py-3 bg-primary-container hover:bg-primary text-on-primary-container rounded-md font-medium text-sm shadow-sm transition-all active:scale-[0.98]"
          >
            Open Workspace
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-subtle bg-surface-container-low py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
          <div className="flex items-center">
            <Logo size="sm" />
          </div>
          <p>© {new Date().getFullYear()} Planr. Simple, private productivity.</p>
        </div>
      </footer>
    </div>
  );
};
