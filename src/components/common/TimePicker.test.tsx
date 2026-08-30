import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimePicker } from './TimePicker';

describe('TimePicker Component', () => {
  it('renders with formatted initial time value', () => {
    const handleChange = vi.fn();
    render(
      <TimePicker
        value="14:30"
        onChange={handleChange}
        timeFormat="12h"
        label="Reminder Time"
      />
    );

    expect(screen.getByText('Reminder Time')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select time/i })).toHaveTextContent('2:30 PM');
  });

  it('opens popover on click and increments hour', () => {
    const handleChange = vi.fn();
    render(
      <TimePicker
        value="09:00"
        onChange={handleChange}
        timeFormat="12h"
      />
    );

    const trigger = screen.getByRole('button', { name: /select time/i });
    fireEvent.click(trigger);

    expect(screen.getByRole('button', { name: /increment hour/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /increment hour/i }));

    expect(handleChange).toHaveBeenCalledWith('10:00');
  });
});
