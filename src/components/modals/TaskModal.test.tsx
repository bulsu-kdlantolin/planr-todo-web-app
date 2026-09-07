import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskModal } from './TaskModal';
import { useUIStore } from '../../store/useUIStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useReminderStore } from '../../store/useReminderStore';

describe('TaskModal Component', () => {
  beforeEach(() => {
    useTaskStore.setState({ tasks: [], tombstones: [] });
    useReminderStore.setState({ reminders: [] });
    useUIStore.setState({
      taskModalOpen: true,
      editingTask: null,
      initialTaskDueDate: '2026-09-10'
    });
  });

  it('renders all repeat options clearly', () => {
    render(<TaskModal />);

    expect(screen.getByRole('button', { name: 'Once' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Daily' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weekdays' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weekly' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Monthly' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
  });

  it('allows adding to reminders when creating a task', async () => {
    render(<TaskModal />);

    // Fill title
    const titleInput = screen.getByPlaceholderText('e.g. Write design documentation...');
    fireEvent.change(titleInput, { target: { value: 'Launch Product Page' } });

    // Toggle Add to Reminders
    const reminderToggle = screen.getByLabelText('Toggle add to reminders');
    fireEvent.click(reminderToggle);

    // Expect reminder time and sound options to appear
    expect(screen.getByLabelText(/Reminder Time/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Reminder Sound/i })).toBeInTheDocument();

    // Select different sound option via custom Select dropdown
    const soundCombobox = screen.getByRole('combobox', { name: /Reminder Sound/i });
    fireEvent.click(soundCombobox);
    const bellOption = screen.getByText(/Zen Bell/i);
    fireEvent.click(bellOption);

    // Submit form
    const submitBtn = screen.getByRole('button', { name: 'Create Task' });
    fireEvent.click(submitBtn);

    // Verify task and reminder were added asynchronously
    await vi.waitFor(() => {
      const tasks = useTaskStore.getState().tasks;
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Launch Product Page');

      const reminders = useReminderStore.getState().reminders;
      expect(reminders.length).toBe(1);
      expect(reminders[0].title).toBe('Launch Product Page');
      expect(reminders[0].soundOption).toBe('bell');
      expect(reminders[0].taskId).toBe(tasks[0].id);
    });
  });
});
