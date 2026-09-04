import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskCalendarView } from './TaskCalendarView';
import { Task } from '../../types';
import { getTodayDateString } from '../../utils/date';

describe('TaskCalendarView Component', () => {
  const todayStr = getTodayDateString();

  const mockTasks: Task[] = [
    {
      id: 'task-cal-1',
      title: 'Design high-fidelity calendar',
      category: 'Design',
      priority: 'urgent',
      dueDate: todayStr,
      completed: false,
      estimatedPomodoros: 2,
      completedPomodoros: 0,
      subtasks: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-cal-2',
      title: 'Write automated unit tests',
      category: 'Work',
      priority: 'high',
      dueDate: todayStr,
      completed: true,
      estimatedPomodoros: 1,
      completedPomodoros: 1,
      subtasks: [],
      createdAt: new Date().toISOString()
    }
  ];

  it('renders calendar month navigation, weekday headers, and task chips', () => {
    render(
      <TaskCalendarView
        tasks={mockTasks}
        onToggleTask={vi.fn()}
        onEditTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onAddTaskForDate={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();

    // Both task chips should be present in the calendar grid
    expect(screen.getAllByText('Design high-fidelity calendar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Write automated unit tests').length).toBeGreaterThan(0);
  });

  it('navigates to next and previous month', () => {
    render(
      <TaskCalendarView
        tasks={mockTasks}
        onToggleTask={vi.fn()}
        onEditTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onAddTaskForDate={vi.fn()}
      />
    );

    const nextBtn = screen.getByRole('button', { name: /next month/i });
    fireEvent.click(nextBtn);

    const prevBtn = screen.getByRole('button', { name: /previous month/i });
    fireEvent.click(prevBtn);
  });

  it('interacts with tasks inside the selected day inspector', () => {
    const handleToggle = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    const handleAddTaskForDate = vi.fn();

    render(
      <TaskCalendarView
        tasks={mockTasks}
        onToggleTask={handleToggle}
        onEditTask={handleEdit}
        onDeleteTask={handleDelete}
        onAddTaskForDate={handleAddTaskForDate}
      />
    );

    // Toggle task checkbox in day inspector
    const toggleBtn = screen.getByRole('checkbox', { name: /mark "design high-fidelity calendar"/i });
    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledWith('task-cal-1');

    // Click edit button
    const editBtn = screen.getByRole('button', { name: /edit task design high-fidelity calendar/i });
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(mockTasks[0]);

    // Click delete button
    const deleteBtn = screen.getByRole('button', { name: /delete task design high-fidelity calendar/i });
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith('task-cal-1');

    // Click add task for this day
    const addBtn = screen.getByRole('button', { name: /add task for this day/i });
    fireEvent.click(addBtn);
    expect(handleAddTaskForDate).toHaveBeenCalledWith(todayStr);
  });

  it('disallows adding tasks on past dates and displays past date notice in inspector', () => {
    render(
      <TaskCalendarView
        tasks={mockTasks}
        onToggleTask={vi.fn()}
        onEditTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onAddTaskForDate={vi.fn()}
      />
    );

    // Click previous month to guarantee past dates
    const prevBtn = screen.getByRole('button', { name: /previous month/i });
    fireEvent.click(prevBtn);

    // Pick day 15 of previous month
    const pastDayBtn = screen.getAllByRole('button').find((el) =>
      el.getAttribute('aria-label')?.includes('tasks')
    );
    if (pastDayBtn) {
      fireEvent.click(pastDayBtn);
    }

    // Past date notice should be displayed in inspector
    expect(screen.getByText(/past date/i)).toBeInTheDocument();
    // Add task button should not be rendered
    expect(screen.queryByRole('button', { name: /add task for this day/i })).not.toBeInTheDocument();
  });
});
