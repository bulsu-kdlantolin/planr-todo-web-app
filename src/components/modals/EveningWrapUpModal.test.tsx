import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EveningWrapUpModal } from './EveningWrapUpModal';
import { useUIStore } from '../../store/useUIStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useTimerStore } from '../../store/useTimerStore';
import { getTodayDateString } from '../../utils/date';

describe('EveningWrapUpModal Component', () => {
  const todayStr = getTodayDateString();

  beforeEach(() => {
    useUIStore.setState({ eveningWrapUpModalOpen: true });
    useTaskStore.setState({
      tasks: [
        {
          id: 'task-1',
          title: 'Morning Project Sprint',
          category: 'Work',
          priority: 'urgent',
          dueDate: todayStr,
          completed: true,
          completedAt: `${todayStr}T10:00:00.000Z`,
          estimatedPomodoros: 2,
          completedPomodoros: 2,
          subtasks: [],
          createdAt: new Date().toISOString()
        },
        {
          id: 'task-2',
          title: 'Unfinished Client Deck',
          category: 'Work',
          priority: 'high',
          dueDate: todayStr,
          completed: false,
          estimatedPomodoros: 1,
          completedPomodoros: 0,
          subtasks: [],
          createdAt: new Date().toISOString()
        }
      ]
    });
    useTimerStore.setState({
      focusSessions: [
        {
          id: 'sess-1',
          taskTitle: 'Morning Sprint',
          durationMinutes: 45,
          completedAt: `${todayStr}T11:00:00.000Z`,
          type: 'focus'
        }
      ]
    });
  });

  it('renders summary of completed tasks and focus minutes', () => {
    render(<EveningWrapUpModal />);

    expect(screen.getByText("Evening Wrap-Up & Reflection")).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 completed task
    expect(screen.getByText('Tasks Completed')).toBeInTheDocument();
    expect(screen.getByText('45m')).toBeInTheDocument(); // 45m focus
    expect(screen.getByText('Focus Time Logged')).toBeInTheDocument();
    expect(screen.getByText('Unfinished Client Deck')).toBeInTheDocument();
  });

  it('migrates remaining tasks to tomorrow when requested', async () => {
    render(<EveningWrapUpModal />);

    const migrateBtn = screen.getByRole('button', { name: /Move all to Tomorrow/i });
    expect(migrateBtn).toBeInTheDocument();
    fireEvent.click(migrateBtn);

    const tasks = useTaskStore.getState().tasks;
    const task2 = tasks.find((t) => t.id === 'task-2');
    expect(task2?.dueDate).not.toBe(todayStr);
  });

  it('closes modal when finishing wrap-up', () => {
    render(<EveningWrapUpModal />);

    const closeBtn = screen.getByRole('button', { name: /Close the Day/i });
    fireEvent.click(closeBtn);

    expect(useUIStore.getState().eveningWrapUpModalOpen).toBe(false);
  });
});
