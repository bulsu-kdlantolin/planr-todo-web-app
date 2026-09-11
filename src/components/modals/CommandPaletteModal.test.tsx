import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { CommandPaletteModal } from './CommandPaletteModal';
import { useUIStore } from '../../store/useUIStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useReminderStore } from '../../store/useReminderStore';

describe('CommandPaletteModal Component', () => {
  beforeEach(() => {
    useUIStore.setState({
      commandPaletteOpen: true,
      activeView: 'daily'
    });
    useTaskStore.setState({
      tasks: [
        {
          id: 'task-abc',
          title: 'Design Wireframes',
          category: 'Design',
          priority: 'urgent',
          dueDate: '2026-09-12',
          completed: false,
          estimatedPomodoros: 2,
          completedPomodoros: 0,
          subtasks: [],
          createdAt: new Date().toISOString()
        }
      ]
    });
    useReminderStore.setState({
      reminders: [
        {
          id: 'rem-xyz',
          title: 'Take vitamins',
          time: '14:00',
          period: 'Afternoon',
          repeat: 'Daily',
          sound: true,
          soundOption: 'chime',
          active: true,
          completed: false,
          createdAt: new Date().toISOString()
        }
      ]
    });
  });

  it('renders command palette input and default commands', () => {
    render(<CommandPaletteModal />);

    const searchInput = screen.getByPlaceholderText(/Type a command or search tasks/i);
    expect(searchInput).toBeInTheDocument();
    expect(screen.getByText('Create New Task')).toBeInTheDocument();
    expect(screen.getByText('Go to Daily Overview')).toBeInTheDocument();
  });

  it('filters tasks and reminders dynamically as user types', () => {
    render(<CommandPaletteModal />);

    const searchInput = screen.getByPlaceholderText(/Type a command or search tasks/i);
    fireEvent.change(searchInput, { target: { value: 'wireframe' } });

    expect(screen.getByText('Design Wireframes')).toBeInTheDocument();
  });

  it('navigates when clicking a navigation command', () => {
    render(<CommandPaletteModal />);

    const tasksNavBtn = screen.getByText('Go to Tasks');
    fireEvent.click(tasksNavBtn);

    expect(useUIStore.getState().activeView).toBe('tasks');
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });
});
