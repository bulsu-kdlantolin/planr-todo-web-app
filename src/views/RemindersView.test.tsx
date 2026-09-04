import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { RemindersView } from './RemindersView';
import { useReminderStore } from '../store/useReminderStore';
import { useUIStore } from '../store/useUIStore';
import { Reminder } from '../types';

describe('RemindersView Component', () => {
  const sampleReminders: Reminder[] = [
    {
      id: 'rem-test-1',
      title: 'Afternoon hydration and stretch',
      time: '14:30',
      period: 'Afternoon',
      repeat: 'Daily',
      active: true,
      completed: false,
      sound: true,
      description: 'Drink a tall glass of water',
      revision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    useReminderStore.getState().setReminders(sampleReminders);
    useReminderStore.getState().setFilter('active');
    useUIStore.setState({ toasts: [], reminderModalOpen: false, editingReminder: null });
  });

  it('renders reminder and Next Reminder card without text collision', async () => {
    render(<RemindersView />);

    expect(screen.getByRole('heading', { level: 1, name: /^reminders$/i })).toBeInTheDocument();
    expect(screen.getAllByText('Afternoon hydration and stretch').length).toBeGreaterThan(0);
    expect(screen.getByText('Next Reminder')).toBeInTheDocument();
  });

  it('opens edit modal with reminder when edit button is clicked', () => {
    render(<RemindersView />);

    const editBtn = screen.getByRole('button', { name: /edit reminder afternoon hydration/i });
    fireEvent.click(editBtn);

    expect(useUIStore.getState().reminderModalOpen).toBe(true);
    expect(useUIStore.getState().editingReminder?.id).toBe('rem-test-1');
  });

  it('opens confirmation modal and deletes reminder upon confirmation', async () => {
    render(<RemindersView />);

    const deleteBtn = screen.getByRole('button', { name: /delete reminder afternoon hydration/i });
    fireEvent.click(deleteBtn);

    // Confirm modal should appear
    expect(screen.getByText('Delete Reminder')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete "Afternoon hydration and stretch"\?/i)
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(useReminderStore.getState().reminders.length).toBe(0);
    });

    expect(useUIStore.getState().toasts.length).toBeGreaterThan(0);
    expect(useUIStore.getState().toasts[0].message).toContain('deleted');
  });
});
