import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskCard } from './TaskCard';
import { Task } from '../../types';

describe('TaskCard Component', () => {
  const mockTask: Task = {
    id: 'task-test-1',
    title: 'Test Design System Architecture',
    description: 'Detailed description of task',
    category: 'Design',
    priority: 'urgent',
    dueDate: '2026-09-01',
    completed: false,
    estimatedPomodoros: 3,
    completedPomodoros: 1,
    subtasks: [
      { id: 'sub-1', title: 'Subtask Alpha', completed: false },
      { id: 'sub-2', title: 'Subtask Beta', completed: true }
    ],
    createdAt: new Date().toISOString()
  };

  it('renders task title, category, priority badge, and subtasks counter', () => {
    const handleToggle = vi.fn();
    render(<TaskCard task={mockTask} onToggle={handleToggle} />);

    expect(screen.getByText('Test Design System Architecture')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText(/Subtasks \(1\/2\)/i)).toBeInTheDocument();
  });

  it('triggers onToggle when the accessible checkbox is clicked', () => {
    const handleToggle = vi.fn();
    render(<TaskCard task={mockTask} onToggle={handleToggle} />);

    const checkbox = screen.getByRole('checkbox', {
      name: /mark "test design system architecture" as completed/i
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(checkbox);
    expect(handleToggle).toHaveBeenCalledWith('task-test-1');
  });

  it('expands subtasks and toggles subtask checkboxes', () => {
    const handleToggle = vi.fn();
    const handleToggleSubtask = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        onToggle={handleToggle}
        onToggleSubtask={handleToggleSubtask}
      />
    );

    // Expand subtasks
    const expandBtn = screen.getByText(/Subtasks \(1\/2\)/i);
    fireEvent.click(expandBtn);

    expect(screen.getByText('Subtask Alpha')).toBeInTheDocument();
    expect(screen.getByText('Subtask Beta')).toBeInTheDocument();

    // Toggle subtask
    fireEvent.click(screen.getByText('Subtask Alpha'));
    expect(handleToggleSubtask).toHaveBeenCalledWith('task-test-1', 'sub-1');
  });
});
