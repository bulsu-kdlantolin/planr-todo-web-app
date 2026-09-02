import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DailyOverviewView } from './DailyOverviewView';
import { useTaskStore } from '../store/useTaskStore';
import { useMetaStore } from '../store/useMetaStore';
import { getTodayDateString } from '../utils/date';

describe('DailyOverviewView Component', () => {
  beforeEach(() => {
    useTaskStore.getState().setTasks([]);
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
});
