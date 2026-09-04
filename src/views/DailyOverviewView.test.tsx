import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DailyOverviewView } from './DailyOverviewView';
import { useTaskStore } from '../store/useTaskStore';
import { useMetaStore } from '../store/useMetaStore';
import { useUIStore } from '../store/useUIStore';
import { getTodayDateString } from '../utils/date';

describe('DailyOverviewView Component', () => {
  beforeEach(() => {
    useTaskStore.getState().setTasks([]);
    useUIStore.setState({ toasts: [] });
    useMetaStore.getState().setUser({
      name: 'Alex Morgan',
      email: 'alex@planr.app',
      title: 'Architect',
      tagline: 'Simple Focus',
      isLoggedIn: true
    });
  });

  it('renders daily greeting and intention card', () => {
    render(<DailyOverviewView />);
    expect(screen.getByText(/Alex/i)).toBeDefined();
    expect(screen.getByText(/Today's Main Focus/i)).toBeDefined();
    expect(screen.getAllByText(/Tasks Completed/i).length).toBeGreaterThan(0);
  });

  it('renders tasks scheduled for today', async () => {
    const today = getTodayDateString();
    await useTaskStore.getState().addTask({
      title: 'Write production specifications',
      category: 'Work',
      priority: 'urgent',
      estimatedPomodoros: 2,
      dueDate: today,
      subtasks: []
    });

    render(<DailyOverviewView />);
    expect(screen.getByText('Write production specifications')).toBeDefined();
  });

  it('confirms before deleting a task from daily overview', async () => {
    const today = getTodayDateString();
    await useTaskStore.getState().addTask({
      title: 'Review deployment checklist',
      category: 'Work',
      priority: 'high',
      estimatedPomodoros: 1,
      dueDate: today,
      subtasks: []
    });

    render(<DailyOverviewView />);

    const deleteBtn = screen.getByRole('button', { name: /delete task review deployment checklist/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByText('Delete Task')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "Review deployment checklist"\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(useTaskStore.getState().tasks.length).toBe(0);
    });
  });
});
