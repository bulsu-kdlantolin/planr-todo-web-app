import React, { Suspense, lazy } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore } from './store/useUIStore';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/Toast';
import { Logo } from './components/common/Logo';
import { TaskModal } from './components/modals/TaskModal';
import { ReminderModal } from './components/modals/ReminderModal';
import { AuthModal } from './components/modals/AuthModal';
import { IntentionModal } from './components/modals/IntentionModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';

// Code-split / lazy-loaded views for optimized initial chunk size
const LandingView = lazy(() => import('./views/LandingView').then((m) => ({ default: m.LandingView })));
const SignInView = lazy(() => import('./views/SignInView').then((m) => ({ default: m.SignInView })));
const SignUpView = lazy(() => import('./views/SignUpView').then((m) => ({ default: m.SignUpView })));
const OnboardingView = lazy(() => import('./views/OnboardingView').then((m) => ({ default: m.OnboardingView })));
const DailyOverviewView = lazy(() => import('./views/DailyOverviewView').then((m) => ({ default: m.DailyOverviewView })));
const TasksView = lazy(() => import('./views/TasksView').then((m) => ({ default: m.TasksView })));
const RemindersView = lazy(() => import('./views/RemindersView').then((m) => ({ default: m.RemindersView })));
const FocusView = lazy(() => import('./views/FocusView').then((m) => ({ default: m.FocusView })));
const SettingsView = lazy(() => import('./views/SettingsView').then((m) => ({ default: m.SettingsView })));

import { useHydration } from './hooks/useHydration';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useHashRouter } from './hooks/useHashRouter';
import { useDragDropRestore } from './hooks/useDragDropRestore';
import { useThemeSync } from './hooks/useThemeSync';
import { Upload } from 'lucide-react';

export const App: React.FC = () => {
  // 1. Theme synchronization hook
  useThemeSync();

  // 2. Database hydration hook
  const { isLoading } = useHydration();

  // 3. Hash routing hook with fallback
  const { activeView } = useHashRouter();

  // 4. Global keyboard shortcuts hook
  useKeyboardShortcuts();

  // 5. Drag-and-drop backup restoration hook
  const { isDraggingFile } = useDragDropRestore();

  // Grouped UI Store subscription with shallow diffing
  const {
    mobileSidebarOpen,
    setMobileSidebarOpen,
    fullScreenMode,
    intentionModalOpen,
    closeIntentionModal
  } = useUIStore(
    useShallow((state) => ({
      mobileSidebarOpen: state.mobileSidebarOpen,
      setMobileSidebarOpen: state.setMobileSidebarOpen,
      fullScreenMode: state.fullScreenMode,
      intentionModalOpen: state.intentionModalOpen,
      closeIntentionModal: state.closeIntentionModal
    }))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-surface text-on-surface">
        <Logo size="lg" showWordmark={false} className="animate-pulse mb-3" />
        <p className="font-serif text-base italic text-secondary">Loading Planr...</p>
      </div>
    );
  }

  const isFullPageView = ['landing', 'signin', 'signup', 'onboarding'].includes(activeView);
  const showSidebar = !isFullPageView && !fullScreenMode;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-surface text-on-surface font-sans antialiased transition-colors duration-200">
      {/* Skip to Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary-container text-on-primary-container rounded shadow-md text-xs font-semibold uppercase tracking-wider"
      >
        Skip to main content
      </a>

      {/* Global Drag-and-Drop Overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none p-6 text-center text-white animate-fade-in">
          <div className="p-6 rounded-2xl bg-surface-lowest/95 text-on-surface border-2 border-dashed border-primary shadow-2xl flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-primary animate-bounce" />
            <h3 className="font-serif text-2xl font-bold">Drop backup JSON to restore</h3>
            <p className="text-xs text-secondary max-w-xs">
              Release file anywhere to import tasks, reminders, and user settings.
            </p>
          </div>
        </div>
      )}

      <div className="flex h-screen overflow-hidden">
        {/* Left Desktop Sidebar Navigation */}
        {showSidebar && (
          <Sidebar
            mobileOpen={mobileSidebarOpen}
            setMobileOpen={setMobileSidebarOpen}
          />
        )}

        {/* Primary View Container with Suspense Fallback */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col pb-20 md:pb-0 focus:outline-none"
        >
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center p-12 text-secondary">
                <Logo size="md" showWordmark={false} className="animate-pulse opacity-60" />
              </div>
            }
          >
            {activeView === 'landing' && <LandingView />}
            {activeView === 'signin' && <SignInView />}
            {activeView === 'signup' && <SignUpView />}
            {activeView === 'onboarding' && <OnboardingView />}
            {activeView === 'daily' && <DailyOverviewView />}
            {activeView === 'tasks' && <TasksView />}
            {activeView === 'reminders' && <RemindersView />}
            {activeView === 'focus' && <FocusView />}
            {activeView === 'settings' && <SettingsView />}
          </Suspense>
        </main>
      </div>

      {/* Global Modals & Dialogs */}
      <TaskModal />
      <ReminderModal />
      <AuthModal />
      <IntentionModal
        isOpen={intentionModalOpen}
        onClose={closeIntentionModal}
      />
      <ShortcutsModal />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};
