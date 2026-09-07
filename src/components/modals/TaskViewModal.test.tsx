import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskViewModal } from './TaskViewModal';
import { useUIStore } from '../../store/useUIStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useReminderStore } from '../../store/useReminderStore';
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
    useReminderStore.setState({
      reminders: [
        {
          id: 'rem-view-1',
          taskId: 'task-view-1',
          title: 'Review Sprint Velocity',
          time: '10:00',
          period: 'Morning',
          repeat: 'Weekly',
          sound: true,
          soundOption: 'bell',
          active: true,
          completed: false
        }
      ],
      filter: 'all'
    });
    useUIStore.setState({
      taskViewModalOpen: true,
      viewingTask: mockRecurringTask
    });
  });

  it('renders all task details, expressive priority, recurrence, reminder, and subtasks progress in read-only presentation', () => {
    render(<TaskViewModal />);

    // Title and description
    expect(screen.getByText('Review Sprint Velocity')).toBeInTheDocument();
    expect(screen.getByText('Detailed analytics and sprint goals')).toBeInTheDocument();

    // Priority badge
    expect(screen.getByText('High Priority')).toBeInTheDocument();

    // Status badge
    expect(screen.getByText('In Progress')).toBeInTheDocument();

    // Recurrence cadence
    expect(screen.getByText(/Weekly on Mon, Wed/i)).toBeInTheDocument();

    // Attached reminder
    expect(screen.getByText(/10:00 AM \(Morning\)/i)).toBeInTheDocument();
    expect(screen.getByText(/bell/i)).toBeInTheDocument();

    // Subtasks summary and items
    expect(screen.getByText('Subtasks')).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 completed \(50%\)/i)).toBeInTheDocument();
    expect(screen.getByText('Check burn-down')).toBeInTheDocument();
    expect(screen.getByText('Analyze retro notes')).toBeInTheDocument();

    // Focus estimate
    expect(screen.getByText(/~50m \(2 sessions\)/i)).toBeInTheDocument();

    // Action buttons
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit task/i })).toBeInTheDocument();
  });

  it('navigates to edit mode when "Edit Task" button is clicked', () => {
    render(<TaskViewModal />);

    const editBtn = screen.getByRole('button', { name: /edit task/i });
    fireEvent.click(editBtn);

    expect(useUIStore.getState().taskViewModalOpen).toBe(false);
    expect(useUIStore.getState().taskModalOpen).toBe(true);
    expect(useUIStore.getState().editingTask?.id).toBe('task-view-1');
  });

  it('closes view modal when "Close" button is clicked', () => {
    render(<TaskViewModal />);

    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);

    expect(useUIStore.getState().taskViewModalOpen).toBe(false);
  });
});
