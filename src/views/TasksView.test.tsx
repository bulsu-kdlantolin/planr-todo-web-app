import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { TasksView } from './TasksView';
import { useTaskStore } from '../store/useTaskStore';
import { useUIStore } from '../store/useUIStore';
import { Task } from '../types';

describe('TasksView Component', () => {
  const sampleTasks: Task[] = [
    {
      id: 'task-test-1',
      title: 'Write design system documentation',
      category: 'Work',
      priority: 'high',
      dueDate: '2026-08-30',
      completed: false,
      estimatedPomodoros: 2,
      completedPomodoros: 0,
      subtasks: [],
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    useTaskStore.getState().setTasks(sampleTasks);
    useTaskStore.getState().setFilter('all');
    useTaskStore.getState().setSearchQuery('');
  });

  it('renders filter tabs and allows switching active filters', async () => {
    render(<TasksView />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /^tasks$/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /all tasks/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /today/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /work/i })).toBeInTheDocument();

    const highPriorityTab = screen.getByRole('tab', { name: /high priority/i });
    fireEvent.click(highPriorityTab);
    expect(highPriorityTab).toHaveAttribute('aria-selected', 'true');
  });

  it('filters tasks based on search input', async () => {
    render(<TasksView />);

    const searchInput = screen.getByLabelText(/search tasks/i);
    fireEvent.change(searchInput, { target: { value: 'Write design' } });

    await waitFor(() => {
      expect(screen.getByText('Write design system documentation')).toBeInTheDocument();
    });
  });

  it('deletes a task and allows restoring it via undo', async () => {
    render(<TasksView />);

    const deleteBtn = screen.getByRole('button', { name: /delete task/i });
    fireEvent.click(deleteBtn);

    // Wait for async deletion and toast registration
    await waitFor(() => {
      expect(useUIStore.getState().toasts.length).toBeGreaterThan(0);
    });

    const undoToast = useUIStore.getState().toasts.find((t) => t.actionText === 'Undo');
    expect(undoToast).toBeDefined();

    // Trigger undo action
    undoToast?.onAction?.();

    await waitFor(() => {
      expect(screen.getByText('Write design system documentation')).toBeInTheDocument();
    });
  });
});
