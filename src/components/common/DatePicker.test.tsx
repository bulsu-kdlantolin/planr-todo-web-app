import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePicker } from './DatePicker';
import { NumberStepper } from './NumberStepper';

describe('DatePicker Component', () => {
  it('renders placeholder when no date is selected', () => {
    render(<DatePicker value="" onChange={vi.fn()} placeholder="Choose due date..." />);
    expect(screen.getByText('Choose due date...')).toBeInTheDocument();
  });

  it('renders formatted date when value is provided and toggles calendar', () => {
    const handleChange = vi.fn();
    render(<DatePicker value="2026-08-30" onChange={handleChange} label="Due Date" />);

    expect(screen.getByText(/Aug 30, 2026/i)).toBeInTheDocument();

    const trigger = screen.getByRole('button', { name: /Aug 30, 2026/i });
    fireEvent.click(trigger);

    expect(screen.getByText('August 2026')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('respects minDate and disables past dates from being clicked', () => {
    const handleChange = vi.fn();
    render(
      <DatePicker
        value="2026-08-30"
        onChange={handleChange}
        minDate="2026-08-30"
        label="Due Date"
      />
    );

    const trigger = screen.getByRole('button', { name: /Aug 30, 2026/i });
    fireEvent.click(trigger);

    // Day 29 buttons (previous month padding and/or current month) are before minDate (2026-08-30)
    const day29Btns = screen.getAllByRole('button', { name: '29' });
    expect(day29Btns.length).toBeGreaterThan(0);
    day29Btns.forEach((btn) => {
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
    });

    expect(handleChange).not.toHaveBeenCalled();
  });
});

describe('NumberStepper Component', () => {
  it('renders value and handles increment/decrement', () => {
    const handleChange = vi.fn();
    render(<NumberStepper value={3} onChange={handleChange} min={1} max={10} unitLabel="blocks" />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('blocks')).toBeInTheDocument();

    const increaseBtn = screen.getByRole('button', { name: /Increase value/i });
    fireEvent.click(increaseBtn);
    expect(handleChange).toHaveBeenCalledWith(4);

    const decreaseBtn = screen.getByRole('button', { name: /Decrease value/i });
    fireEvent.click(decreaseBtn);
    expect(handleChange).toHaveBeenCalledWith(2);
  });
});
