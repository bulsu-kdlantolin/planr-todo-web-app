import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskViewModal } from './TaskViewModal';
import { useUIStore } from '../../store/useUIStore';
import { useTaskStore } from '../../store/useTaskStore';
import { Task } from '../../types';

describe('TaskViewModal Component', () => {
  const mockRecurringTask: Task = {
    id: 'task-view-1',
    title: 'Review Sprint Velocity',
    description: 'Detailed analytics and sprint goals',
    category: 'Work',
    priority: 'high',
    dueDate: '2026-09-30',
    completed: false,
    estimatedPomodoros: 2,
    completedPomodoros: 0,
    repeat: 'Weekly',
    recurringSeriesId: 'series-sprint',
    recurrenceConfig: {
      frequency: 'Weekly',
      interval: 1,
      weekdays: [1, 3] // Mon, Wed
    },
    subtasks: [
      { id: 'sub-1', title: 'Check burn-down', completed: false },
      { id: 'sub-2', title: 'Analyze retro notes', completed: true }
    ],
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    useTaskStore.setState({
      tasks: [mockRecurringTask],
      tombstones: []
    });
    useUIStore.setState({
      taskViewModalOpen: true,
      viewingTask: mockRecurringTask
    });
  });

  it('renders task details, status, recurrence info, and subtasks progress', () => {
    render(<TaskViewModal />);

    expect(screen.getByText('Review Sprint Velocity')).toBeInTheDocument();
    expect(screen.getByText('Detailed analytics and sprint goals')).toBeInTheDocument();
    expect(screen.getByText(/Weekly on Mon, Wed/i)).toBeInTheDocument();
    expect(screen.getByText('Subtasks')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 completed')).toBeInTheDocument();
    expect(screen.getByText('Check burn-down')).toBeInTheDocument();
    expect(screen.getByText('Stop Repeating')).toBeInTheDocument();
  });

  it('allows toggling subtasks from within the view modal', () => {
    render(<TaskViewModal />);

    const subtask = screen.getByText('Check burn-down');
    fireEvent.click(subtask);

    const updatedTask = useTaskStore.getState().tasks.find((t) => t.id === 'task-view-1');
    expect(updatedTask?.subtasks[0].completed).toBe(true);
  });

  it('stops repeating when "Stop Repeating" button is clicked', async () => {
    render(<TaskViewModal />);

    const stopBtn = screen.getByText('Stop Repeating');
    fireEvent.click(stopBtn);

    const updatedTask = useTaskStore.getState().tasks.find((t) => t.id === 'task-view-1');
    expect(updatedTask?.repeat).toBe('Once');
  });

  it('opens delete confirmation and provides choice to delete entire series', () => {
    render(<TaskViewModal />);

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/is a repeating task\. would you like to delete only this occurrence/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete entire series/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete only this/i })).toBeInTheDocument();
  });
});
